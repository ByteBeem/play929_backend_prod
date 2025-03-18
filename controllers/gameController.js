const { initializeGames } = require("../utils/helpers");
const crypto = require('crypto');
const Wallet = require("../models/wallet");
const User = require("../models/User");
const Transaction = require("../models/transactions");
const authMiddleware = require("../middlewares/authMiddleware");
const sequelize = require("../config/db");
require("dotenv").config();


const SecretKey = process.env.SECRET;


function GenerateSecureGameId() {
  
    const timestamp = Date.now().toString();

    const randomBytes = crypto.randomBytes(16).toString('hex'); 
    const data = `${timestamp}-${randomBytes}`;

 
    const hash = crypto.createHash('sha256').update(data).digest('hex');

   
    return hash.substring(0, 32);
}


// Generate a secure HMAC signature
function generateHmacSignature(input) {
    if (!input || input.trim().length === 0) {
        throw new Error("Input cannot be null or whitespace.");
    }

    const hmac = crypto.createHmac('sha256', SecretKey);
    hmac.update(input.trim(), 'utf8');
    const hashBytes = hmac.digest();
    return base64UrlEncode(hashBytes);
}

// URL-safe Base64 encoding
function base64UrlEncode(input) {
    return input.toString('base64')
        .replace(/=+$/, '')  
        .replace(/\+/g, '-') 
        .replace(/\//g, '_'); 
}

// URL-safe Base64 decoding
function base64UrlDecode(input) {
    let paddedInput = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    switch (paddedInput.length % 4) {
        case 2: paddedInput += "=="; break;
        case 3: paddedInput += "="; break;
    }
    
    return Buffer.from(paddedInput, 'base64');
}



exports.Data = async (req, res) => {
    try {
        const gameInfo =  initializeGames("http://localhost:5000"); 

        res.json({ gameInfo });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};
exports.playFixTheBug = async (req, res) => {
    try {
        authMiddleware(["user"])(req, res, async () => {
            const encodedLanguage = req.query.language;
            const amount = req.query.amount;
            const ZARMinFee = 20.00;
            const InternationalMinFee = 5.00;
            const TimeLimitInMinutes = 30;

            // Check if language is provided
            if (!encodedLanguage) {
                return res.status(400).json({ error: "You must select a coding language." });
            }

            // Parse and validate the amount
            const Amount = parseFloat(amount);
            if (Amount <= 0 || isNaN(Amount)) {
                return res.status(400).json({ error: "Invalid amount format." });
            }

            // Decode the language
            const language = decodeURIComponent(encodedLanguage);

            // Find the user
            const user = await User.findOne({ where: { email: req.user.email } });
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            // Find the user's wallet
            let wallet = await Wallet.findOne({ where: { user_id: user.id, wallet_address: user.walletAddress } });
            if (!wallet) {
                return res.status(401).json({ error: "Invalid wallet address or session expired, please log in." });
            }

            // Check if the wallet is active
            if (wallet.status !== "active") {
                return res.status(403).json({ error: `Wallet is ${wallet.status}. Game plays are not allowed.` });
            }

            // Check if the user has sufficient funds
            if (parseFloat(wallet.balance) < Amount) {
                return res.status(400).json({ error: "Insufficient funds in your wallet." });
            }

            // Start transaction
            const t = await sequelize.transaction();
            try {
                // Deduct the amount from wallet balance
                wallet.balance -= Amount;
                await wallet.save({ transaction: t });

                // Create a transaction record for the bet
                await Transaction.create({
                    wallet_id: wallet.id,
                    transaction_type: "bet",
                    amount: Amount,
                    transaction_ref: `bet-${wallet.id}-${Date.now()}`,
                    status: "pending",
                    wallet_address: wallet.wallet_address || "N/A",
                }, { transaction: t });

                await t.commit();

                // Generate game session ID and buggy code
                const gameSessionID = GenerateSecureGameId();
                const buggyCode = `function addNumbers(a, b) {
                    console.log("Adding numbers:", a, b);
                    let result = a + b;
                
                    // Bug: An accidental incorrect variable assignment
                    result = "The result is: " + result; 
                
                    return result; // Expected output: 30 
                    
                } `;

                // Create question and signature payload with the fee included
                const question = `Fix the bug in the following ${language} code:`;
                const signaturePayload = `${gameSessionID}|${user.id}|${new Date().toISOString()}|${question}|${language}|${gameSessionID}`;
                const signature = generateHmacSignature(signaturePayload);

                // Return response with game details
                return res.status(200).json({
                    question,
                    buggyCode,
                    language,
                    signature,
                    signaturePayload,
                    gameSessionID,
                });
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
