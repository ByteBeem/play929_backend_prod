const Wallet = require("../models/wallet");
const SecurityLogs = require("../models/securityLogs");
const User = require("../models/User");
const Transaction = require("../models/transactions");
const authMiddleware = require("../middlewares/authMiddleware");
const Authentication = require("../models/2FAuthentication");
const sequelize = require("../config/db");
const validator = require('validator');
const { authenticator } = require('otplib');
const {getClientIP, getBrowserName  , Ratelimiter} =  require("../utils/helpers");
const qrcode = require('qrcode');



const user2FASecrets = new Map();

// Expiration time in milliseconds (3 minutes)
const SECRET_EXPIRATION_TIME = 3 * 60 * 1000;


const storeSecret = (email, secret) => {
    const expirationTime = Date.now() + SECRET_EXPIRATION_TIME;
    
   
    if (user2FASecrets.has(email)) {
        
      user2FASecrets.delete(email);
    }

    user2FASecrets.set(email, { secret, expirationTime });
};


const getSecret = (email) => {
    const secret = user2FASecrets.get(email);

    if (!secret) {
       
        return null;
    }

    if (Date.now() > secret.expirationTime) {
      
      user2FASecrets.delete(email);
        return null;
    }

    return secret.secret;
};


const removeSecret = (email) => {
    if (user2FASecrets.has(email)) {
        
      user2FASecrets.delete(email);
    } else {
        return null;
    }
};




exports.Data = async (req, res) => {
  try {
    authMiddleware(["user"])(req, res, async () => {
      
      const user = await User.findOne({ where: { email: req.user.email } });

       

      if (!user) {
        return res.status(404).json({ error: "User Not Found." });
      }

     
      let wallet = await Wallet.findOne({ where: { user_id: user.id } });

      if (!wallet) {
        
        const initialBalance = user.country === 'South Africa' ? 20 : 5; 

       
        const t = await sequelize.transaction();

        try {
          
          wallet = await Wallet.create(
            {
              user_id: user.id,
              wallet_address: user.walletAddress, 
              balance: 0,
              currency : user.country === 'South Africa' ? 'R' : '$',
            },
            { transaction: t }
          );

          // Create the initial deposit (bonus) transaction
          const transaction = await Transaction.create(
            {
              wallet_id: wallet.id,
              transaction_type: 'bonus', 
              amount: initialBalance,
              transaction_ref: `bonus-${wallet.id}-${Date.now()}`, 
              status: 'completed',
              wallet_address: wallet.wallet_address,
            },
            { transaction: t }
          );

          // Update wallet balance with the bonus
          wallet.balance = initialBalance;
          await wallet.save({ transaction: t });

        

          // Commit the transaction
          await t.commit();

         
          const userData = {
            accountNumber: user.accountNumber,
            fullName: user.firstName,
            surname: user.lastName,
            defaultProfilePictureUrl: user.profileImageUrl,
            MFAEnabled: user.isTwoFactorEnabled,
            wallet_address :user.walletAddress,
            email :user.email,
              balance: wallet.balance,
              currency: wallet.currency,
            
          };

        
          res.json({ userData });

        } catch (err) {
          
          await t.rollback();
          console.error(err);
          return res.status(500).json({ error: "Server error. Please try again later." });
        }
      } else {

     
       
        const userData = {
          accountNumber: user.accountNumber,
          fullName: user.firstName,
          surname: user.lastName,
          defaultProfilePictureUrl: user.profileImageUrl,
          MFAEnabled: user.isTwoFactorEnabled,
          balance: wallet.balance,
          currency: wallet.currency,
          wallet_address :user.walletAddress,
          email :user.email,
          
        };

        res.json({ userData });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};

exports.enableMFA = async (req, res) => {
  try {
    authMiddleware(["user"])(req, res, async () => {
      try {
       
        const secret = authenticator.generateSecret();

        
        const otpauthUrl = authenticator.keyuri(req.user.email, 'Play929.com', secret);

      
        qrcode.toDataURL(otpauthUrl, (err, imageUrl) => {
          if (err) {
            console.error('Error generating QR code', err);
            return res.status(500).json({ error: "Failed to generate QR code." });
          }

        
          storeSecret(req.user.email, secret);

        
          res.json({ imageUrl });
        });
      } catch (error) {
        console.error('Error enabling MFA:', error);
        return res.status(500).json({ error: "Server error. Please try again later." });
      }
    });
  } catch (err) {
    console.error('Error in MFA enable process:', err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};
exports.disableMFA = [Ratelimiter, async (req, res) => {
  try {
    // User authentication middleware
    authMiddleware(["user"])(req, res, async () => {
      try {
        // Get additional details for logging
        const ip = getClientIP(req);
        const browser = getBrowserName(req);

        // Find the user by email
        const user = await User.findOne({ where: { email: req.user.email } });
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        // Check if 2FA is already disabled
        if (!user.isTwoFactorEnabled) {
          return res.status(400).json({ error: "2FA is not enabled." });
        }

        // Begin a transaction to disable 2FA
        const t = await sequelize.transaction();
        try {
          // Set 2FA as disabled
          user.isTwoFactorEnabled = false;
          await user.save({ transaction: t });

          // Remove the Authentication entry associated with the user
          await Authentication.destroy({
            where: { user_id: user.id },
            transaction: t
          });

          // Commit the changes
          await t.commit();

          // Send success response
          res.status(200).json({ message: "2FA disabled successfully." });

        } catch (error) {
          // Rollback transaction in case of failure
          await t.rollback();
          console.error("Error disabling 2FA:", error);
          return res.status(500).json({ error: "Failed to disable 2FA. Please try again later." });
        }

        // Log the action in a separate transaction after the 2FA disable process completes
        const logT = await sequelize.transaction();
        try {
          // Update last login time
          user.lastLogin = Date.now();
          await user.save({ transaction: logT });

          // Log the action of disabling 2FA
          await SecurityLogs.create(
            {
              email_address: user.email,
              action: "2FA Disabled",
              browser,
              ip_address: ip,
            },
            { transaction: logT }
          );

          // Commit logging transaction
          await logT.commit();
        } catch (logError) {
          // Rollback the logging transaction if error occurs
          await logT.rollback();
          console.error("Logging error:", logError);
          // Continue with 2FA disable success even if logging fails
        }

      } catch (error) {
        console.error('Error in MFA disable process:', error);
        return res.status(500).json({ error: "Server error. Please try again later." });
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
}];


exports.validateSecret = [
  Ratelimiter,
  authMiddleware(["user"]),
  async (req, res) => {
    // Get extra info for logs
    const ip = getClientIP(req);
    const browser = getBrowserName(req);

    try {
      // Validate the input code.
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Code is required." });
      }

      const trimmedCode = code.trim();
      if (!validator.isNumeric(trimmedCode) || trimmedCode.length !== 6) {
        return res.status(400).json({ error: "Invalid code format. It should be a 6-digit number." });
      }

      // Retrieve the user's secret.
      const userSecret = await getSecret(req.user.email);
      if (!userSecret) {
        return res.status(404).json({ error: "No secret found for the user." });
      }

      // Verify the OTP token.
      const isValid = authenticator.verify({ token: trimmedCode, secret: userSecret });
      if (!isValid) {
        return res.status(400).json({ error: "Incorrect code. Please try again." });
      }

      // Find the user by email.
      const user = await User.findOne({ where: { email: req.user.email } });
      if (!user) {
        return res.status(404).json({ error: "User Not Found." });
      }

      // Check if 2FA is already enabled.
      if (user.isTwoFactorEnabled) {
        return res.status(400).json({ error: "2FA is already enabled." });
      }

      // Begin transaction for 2FA update.
      const t = await sequelize.transaction();
      try {
        user.isTwoFactorEnabled = true;
        await user.save({ transaction: t });

        await Authentication.create(
          {
            user_id: user.id,
            secret: userSecret,
          },
          { transaction: t }
        );

        // Commit the 2FA enablement transaction.
        await t.commit();
      } catch (error) {
        await t.rollback();
        console.error("Error enabling 2FA:", error);
        return res.status(500).json({ error: "Failed to enable 2FA. Please try again later." });
      }

      // Optionally log this action in a separate transaction.
      try {
        const logT = await sequelize.transaction();
        try {
          // Optionally update user last login or similar info.
          user.lastLogin = Date.now();
          await user.save({ transaction: logT });

          await SecurityLogs.create(
            {
              email_address: user.email,
              action: "2FA Enabled",
              browser,
              ip_address: ip,
            },
            { transaction: logT }
          );
          await logT.commit();
        } catch (logError) {
          await logT.rollback();
          console.error("Logging error:", logError);
          // Logging failures won't prevent success, so we just log the error.
        }
      } catch (logTxnError) {
        console.error("Failed to start logging transaction:", logTxnError);
      }

      return res.status(200).json({ message: "2FA enabled successfully." });
    } catch (error) {
      console.error("Server error in validateSecret:", error);
      return res.status(500).json({ error: "Server error. Please try again later." });
    } finally {
      // Always remove the secret (if stored) regardless of outcome.
      removeSecret(req.user.email);
    }
  }
];



exports.SecurityLogs = async(req , res)=>{
  try{

    authMiddleware(['user'])(req , res , async()=>{

      const securitylogs = await SecurityLogs.findAll({
        where: { email_address: req.user.email },
        order: [['created_at', 'DESC']], 
        limit: 5, 
      });

      if (securitylogs.length === 0) {
        return res.status(404).json({ message: "No logs found." });
      }

      res.status(200).json({securitylogs});
    
    });

  }catch(error){
    console.error(error);
    return res.status(500).json({error:"Server error. Please try again later."});
  }
};