const Methods = require("../paymentData/methods.json");
const WMethods = require("../paymentData/withdrawalMethods.json");
const User = require("../models/User");
const SecurityLogs = require("../models/securityLogs");
const Wallet = require("../models/wallet");
const Refund = require("../models/Refund");
const {getClientIP, getBrowserName  , Ratelimiter} =  require("../utils/helpers");
const sequelize = require("../config/db");
const crypto = require("crypto");
const paypal = require('@paypal/checkout-server-sdk');
const environment = new paypal.core.SandboxEnvironment('AWW7pqYFrV3GxU8H00pDKAj-r3AoSO_41xTXug6xPBrc6NYhL8YCU6sdP450xvYyGgoxmpBogfbIHBnK', 'EEZbYZoMlXQJPbMK6pl9DDSPZn0k93lonpsAVeNxW-YZ49vp2p5tqsHsibwIGQldd6MSBlsfN02Cg543');
const client = new paypal.core.PayPalHttpClient(environment);
const Transaction = require("../models/transactions");
const authMiddleware = require("../middlewares/authMiddleware");
const axios  =  require("axios");
require("dotenv").config();

// Signature generation
 const generateAPISignature = (data, passPhrase) => {
    // Arrange the array by key alphabetically for API calls
    let ordered_data = {};
    Object.keys(data).sort().forEach(key => {
        ordered_data[key] = data[key];
    });
    data = ordered_data;

    // Create the get string
    let getString = '';
    for (let key in data) {
        getString += key + '=' + encodeURIComponent(data[key]).replace(/%20/g,'+') + '&';
    }

    // Remove the last '&'
    getString = getString.substring(0, getString.length - 1);
    if (passPhrase !== null) {getString +=`&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;}

    // Hash the data and create the signature
    return crypto.createHash("md5").update(getString).digest("hex");
};

exports.depositMethods = async(req , res)=>{
    try{
        authMiddleware(['user'])(req, res, async () => {

        const depositMethods = Methods.methods;

        res.json({depositMethods});

        });


    }catch(err){
        console.error(err);
        return res.status(500).json({error: "Server error. Please try again later."})
    }
};

exports.withdrawalMethods = async(req ,res)=>{
    try{
        authMiddleware(['user'])(req, res, async () => {

        const withdrawalMethodsData = WMethods.methods;

        res.json({withdrawalMethodsData});
        
        });


    }catch(err){
        console.error(err);
        return res.status(500).json({error: "Server error. Please try again later."})
    }
};

/**
 * 
 * South African Internet banking withdrawal
 */

exports.withdrawal = async (req, res) => {
    try {
        authMiddleware(['user'])(req, res, async () => {
        const { fullName, surname, amount, bankName, accountNumber } = req.body;

        if (!fullName || !surname  || !amount || !bankName || !accountNumber) {
            return res.status(400).json({ error: "Missing fields." });
        }

        if (amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ error: "Invalid amount format." });
        }

        if(parseFloat(amount) < parseFloat(200) || parseFloat(amount) > parseFloat(200000)){
            return res.status(400).json({error : "Minimum amount is R200 and Maximum is R200 000"});

        }

        const user = await User.findOne({ where: { email: req.user.email } });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        let wallet = await Wallet.findOne({ where: { user_id: user.id } });

        if (!wallet) {
            return res.status(401).json({ error: "Session expired, please log in." });
        }

        
        if (wallet.status !== 'active') {
            return res.status(403).json({ error: `Wallet is ${wallet.status}. Withdrawals are not allowed.` });
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            return res.status(400).json({ error: "Insufficient funds in your wallet." });
        }

       

       
        const t = await sequelize.transaction();

        try {

            wallet.balance = parseFloat(wallet.balance - amount);
            await wallet.save({ transaction: t });

           
            await Transaction.create(
                {
                    wallet_id: wallet.id,
                    transaction_type: 'withdrawal',
                    amount: amount,
                    transaction_ref: `withdrawal-${wallet.id}-${Date.now()}`,
                    status: 'pending',
                    wallet_address: wallet.wallet_address || "N/A",
                },
                { transaction: t }
            );

          
            await t.commit();

            return res.status(200).json({ message: "Withdrawal successful." });
        } catch (error) {
           
            await t.rollback();
            console.error(error);
            return res.status(500).json({ error: "Transaction failed. Please try again later." });
        }
    });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};

exports.InternetDeposit = async (req, res) => {
    try {
        authMiddleware(['user'])(req, res, async () => {

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        const { fullName, surname, email, walletAddress, amount } = req.body;

        if (!fullName || !surname || !email || !walletAddress || !amount) {
            return res.status(400).json({ error: "Missing fields." });
        }

       
        const depositAmount = parseFloat(amount);
        if (depositAmount <= 0 || isNaN(depositAmount)) {
            return res.status(400).json({ error: "Invalid amount format." });
        }

        if (email !== req.user.email) {
            return res.status(401).json({ error: "Security alert, please log in again." });
        }

        const user = await User.findOne({ where: { email: req.user.email } });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        let wallet = await Wallet.findOne({ where: { user_id: user.id, wallet_address: walletAddress } });

        if (!wallet) {
            return res.status(401).json({ error: "Invalid wallet address or session expired, please log in." });
        }

        if (wallet.status !== "active") {
            return res.status(403).json({ error: `Wallet is ${wallet.status}. Deposits are not allowed.` });
        }
        

        // Start transaction
        const t = await sequelize.transaction();
        try {
            wallet.balance += depositAmount;
            await wallet.save({ transaction: t });

            await Transaction.create(
                {
                    wallet_id: wallet.id,
                    transaction_type: "deposit",
                    amount: depositAmount,
                    transaction_ref: `Deposit-${wallet.id}-${Date.now()}`,
                    status: "completed",
                    wallet_address: wallet.wallet_address || "N/A",
                },
                { transaction: t }
            );

            await t.commit();

            return res.status(200).json({ message: "Deposit successful." });
        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({ error: "Transaction failed. Please try again later." });
        }
    });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};


// Create PayPal Order
exports.paypalDeposit = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate input amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided.' });
    }

    // Authenticate user
    authMiddleware(['user'])(req, res, async () => {
      // Find the user
      const user = await User.findOne({ where: { email: req.user.email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Find wallet associated with the user
      let wallet = await Wallet.findOne({
        where: { user_id: user.id, wallet_address: user.walletAddress }
      });

      if (!wallet) {
        return res.status(401).json({ error: 'Invalid wallet address or session expired, please log in.' });
      }

      // Check wallet status
      if (wallet.status !== 'active') {
        return res.status(403).json({ error: `Wallet is ${wallet.status}. Deposits are not allowed.` });
      }

     // Adjust amount based on currency
    let newAmount = amount;
    if (wallet.currency === 'R') {
    newAmount = parseFloat((amount / 18).toFixed(2)); 
    }

      // Create PayPal order request
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
        reference_id: user.id,
          amount: {
            currency_code: 'USD',
            value: newAmount.toString()
          }
        }],
        application_context: {
          return_url: 'https://api.play929.com/api/wallet/capture_paypal_payment',  
          cancel_url: 'https://api.play929.com/paypal-cancel',  
        }
      });

      // Execute the PayPal order creation request
      const order = await client.execute(request);

      // Find the approval URL from the response
      const approveUrl = order.result.links.find(link => link.rel === 'approve').href;

      // Return the approval URL to the client
      res.status(200).json({ approveUrl });
    });
  } catch (err) {
    console.error('Error creating PayPal order:', err);
    res.status(500).send('Error creating PayPal order');
  }
};

exports.capture_paypal_payment = async (req, res) => {
    const { token, PayerID } = req.query;
    const ip = getClientIP(req);
    const browser = getBrowserName(req);
  
    if (!token || !PayerID) {
      return res.status(400).json({ error: "Missing token or PayerID in the request." });
    }
  
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({ payer_id: PayerID });
  
    try {
      const capture = await client.execute(request);
      const captureResult = capture.result;
  
      if (captureResult.status !== "COMPLETED") {
        return res.status(400).json({ error: "Payment not completed." });
      }
  
      const userId = captureResult.purchase_units?.[0]?.reference_id;
      if (!userId) {
        return res.status(400).json({ error: "User reference not found in payment." });
      }
  
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      const wallet = await Wallet.findOne({
        where: {
          user_id: user.id,
          wallet_address: user.walletAddress,
        },
      });
  
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found for user." });
      }
  
      const depositAmountStr = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
      if (!depositAmountStr) {
        return res.status(400).json({ error: "Could not determine deposit amount." });
      }
  
      const depositAmount = parseFloat(depositAmountStr);
      const finalAmount = wallet.currency === 'R'
        ? parseFloat((depositAmount * 18).toFixed(2))
        : parseFloat(depositAmount.toFixed(2));
  
      const t = await sequelize.transaction();
      try {
        wallet.balance = parseFloat(wallet.balance) + finalAmount;
        await wallet.save({ transaction: t });
  
        await Transaction.create({
          wallet_id: wallet.id,
          transaction_type: "deposit",
          amount: finalAmount,
          transaction_ref: `Deposit-${wallet.id}-${Date.now()}`,
          status: "completed",
          wallet_address: wallet.wallet_address || "N/A",
        }, { transaction: t });
  
        await t.commit();
  
        res.status(200).json({
          message: "Payment captured and wallet updated.",
          transactionID: captureResult.id,
          status: captureResult.status,
          amount: finalAmount,
          currency: wallet.currency,
        });
  
        // Proceed to logging (after response)
        try {
          const logT = await sequelize.transaction();
  
          user.lastLogin = new Date();
          await user.save({ transaction: logT });
  
          await SecurityLogs.create({
            email_address: user.email,
            action: "Deposit",
            browser,
            ip_address: ip,
          }, { transaction: logT });
  
          await logT.commit();
        } catch (logError) {
          console.error("Logging error:", logError);
          // Logging failure does not affect the main flow
        }
  
      } catch (txError) {
        await t.rollback();
        console.error("Transaction error during capture:", txError);
        return res.status(500).json({ error: "Error processing payment. Please try again." });
      }
  
    } catch (err) {
      if (err.statusCode === 422 && err.message.includes("ORDER_ALREADY_CAPTURED")) {
        return res.status(400).json({
          error: "This PayPal order has already been captured.",
          debug_id: err.response?.data?.debug_id || null,
        });
      }
  
      console.error("PayPal capture error:", err);
      return res.status(500).json({ error: "Unexpected error capturing PayPal payment." });
    }
  };
  

  

/**
 * PayFast Deposit method
 */
exports.payfastDeposit = async (req, res) => {
    try {
        authMiddleware(["user"])(req, res, async () => {
            const { amount, email, walletAddress } = req.body;

            if (!amount || !email) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            if (email !== req.user.email) {
                return res.status(401).json({ error: "Security alert, please log in again." });
            }

            const depositAmount = parseFloat(amount);
            if (depositAmount <= 0 || isNaN(depositAmount)) {
                return res.status(400).json({ error: "Invalid amount format." });
            }
    

            const user = await User.findOne({ where: { email: req.user.email } });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        let wallet = await Wallet.findOne({ where: { user_id: user.id, wallet_address: walletAddress } });

        if (!wallet) {
            return res.status(401).json({ error: "Invalid wallet address or session expired, please log in." });
        }

        if (wallet.status !== "active") {
            return res.status(403).json({ error: `Wallet is ${wallet.status}. Deposits are not allowed.` });
        }

        const paymentData = {
            merchant_id: process.env.PAYFAST_MERCHANT_ID,
            merchant_key: process.env.PAYFAST_MERCHANT_KEY,
            amount,
            item_name: "deposit",
            return_url: process.env.RETURN_URL,
            cancel_url: process.env.CANCEL_URL,
            notify_url: process.env.NOTIFY_URL,
            email_address: email,
        };

        

             // Generate the signature
             const signature = generateAPISignature(paymentData, process.env.PASSPHRASE);

             // Send the payment request to PayFast
             const formData = new URLSearchParams(paymentData).toString();
 
             const response = await axios.post(process.env.PAYFAST_URL, formData, {
                 headers: {
                     "Content-Type": "application/x-www-form-urlencoded",
                     "signature": signature,
                 },
                 maxRedirects: 0,
                 validateStatus: (status) => status >= 200 && status < 400,
             });
 
             const redirectUrl = response.headers.location || "https://dashboard.play929.com";
             res.status(200).json({ redirectUrl });


        });
    } catch (error) {
        console.error("Error creating payment request:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
};

exports.payfastNotify = async (req, res) => {
    try {
        const receivedData = req.body;
       

        const { pf_payment_id, amount_gross, payment_status, email_address } = receivedData;

        if (payment_status !== "COMPLETE") {
           
            return res.status(400).json({ error: "Payment not completed" });
        }

        const isValidIPN = await verifyPayFastIPN(receivedData);
       

        if (!isValidIPN) {
            return res.status(400).json({ error: "Invalid IPN data" });
        }

        const user = await User.findOne({ where: { email: email_address } });
       

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        let wallet = await Wallet.findOne({ where: { user_id: user.id } });
       

        if (!wallet) {
            return processRefund(pf_payment_id, amount_gross, email_address, "Wallet not found.");
        }

        if (wallet.status !== "active") {
            
            return processRefund(pf_payment_id, amount_gross, email_address, `Wallet is ${wallet.status}`);
        }

        const t = await sequelize.transaction();
        try {
          
            const newBalance = parseFloat(wallet.balance) + parseFloat(amount_gross);
           

            await wallet.update({ balance: newBalance }, { transaction: t });

            await Transaction.create(
                {
                    wallet_id: wallet.id,
                    transaction_type: "deposit",
                    amount: parseFloat(amount_gross),
                    transaction_ref: `Deposit-${wallet.id}-${Date.now()}`,
                    status: "completed",
                    wallet_address: wallet.wallet_address || "N/A",
                },
                { transaction: t }
            );

            await t.commit();
          

            return res.status(200).json({ message: "Deposit successful." });
        } catch (error) {
            await t.rollback();
           
            return processRefund(pf_payment_id, amount_gross, email_address, "Transaction failed.");
        }
    } catch (error) {
      
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};

/**
 * Verify PayFast IPN request
 */
const verifyPayFastIPN = async (data) => {
    try {
        const pfUrl = process.env.PAYFAST_VALIDATE_IPN;
        const formData = new URLSearchParams(data).toString();

        const response = await axios.post(pfUrl, formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        return response.data === "VALID";
    } catch (err) {
      
        return false;
    }
};

/**
 * Process Refund if Something Goes Wrong
 */
const processRefund = async (pf_payment_id, amount, email, reason) => {
    try {
        await Refund.create({
            payment_id: pf_payment_id,
            amount: parseFloat(amount),
            email_address: email,
            reason: reason,
            status: "pending", 
        });

        

        return res.status(400).json({ error: `Refund initiated due to: ${reason}` });
    } catch (error) {
       
        return res.status(500).json({ error: "Critical error. Contact support." });
    }
};

exports.Transactions = async (req, res) => {
    try {
      authMiddleware(["user"])(req, res, async () => {
  
        const user = await User.findOne({ where: { email: req.user.email } });
  
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }
  
        const { walletAddress } = req.query; 
  
        const wallet = await Wallet.findOne({
          where: { user_id: user.id, wallet_address: walletAddress },
        });
  
        if (!wallet) {
          return res.status(401).json({ error: "Invalid wallet address or session expired, please log in." });
        }
  
        const transactions = await Transaction.findAll({
          where: { wallet_id: wallet.id },
          order: [['created_at', 'DESC']], 
          limit: 10, 
        });
  
        if (transactions.length === 0) {
          return res.status(404).json({ message: "No transactions found for this wallet." });
        }
  
        // Extract only the necessary fields from each transaction
        const formattedTransactions = transactions.map(transaction => ({
          id : transaction.id,
          transaction_type: transaction.transaction_type,
          amount: transaction.amount,
          status: transaction.status,
          created_at: transaction.created_at
        }));
  
        return res.status(200).json({ transactions: formattedTransactions });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error. Please try again later." });
    }
  };
  