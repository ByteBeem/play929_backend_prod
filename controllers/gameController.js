const { initializeGames } = require("../utils/helpers");
const crypto = require('crypto');
const Wallet = require("../models/wallet");
const User = require("../models/User");
const BuggyCodeCpp = require("../models/buggyCodeCpp");
const BuggyCodeJava = require("../models/BuggyCodeJava");
const gamesPlayed = require("../models/gamesPlayed");
const BuggyCodeCsharp = require("../models/BuggyCodeCsharp");
const BuggyCodeJavascript = require("../models/BuggyCodeJavascript");
const Transaction = require("../models/transactions");
const authMiddleware = require("../middlewares/authMiddleware");
const sequelize = require("../config/db");
require("dotenv").config();


const SecretKey = process.env.SECRET;

const isProduction = process.env.NODE_ENV === "production";
const getBaseURL = () => isProduction ? process.env.REDIRECT_URL_AUTH || "https://auth.play929.com" : "http://localhost:3000";
const getDashboardURL = () => isProduction ? "https://dashboard.play929.com" : "http://localhost:3001";
const server_url = "https://api.play929.com";



function GenerateSecureGameId(GameType, userId, transactionRef) {
    if (!GameType || !userId || !transactionRef) {
        throw new Error("type, userId, and transactionRef are required.");
    }

    
    const randomBytes = crypto.randomBytes(8).toString('hex');

    // Combine type, userId, transactionRef, and random data
    const data = `${GameType}|${userId}|${transactionRef}|${randomBytes}`;

    // Generate a secure hash
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    // Return a 32-character unique ID
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
        const gameInfo =  initializeGames(server_url); 

        res.json({ gameInfo });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};exports.playFixTheBug = async (req, res) => {
    try {
        await authMiddleware(["user"])(req, res, async () => {
            const { language: encodedLanguage, amount, difficulty: encodedDifficulty } = req.query;

            const ZARMinFee = 20.00;
            const InternationalMinFee = 5.00;

            const payoutMultipliers = {
                Easy: 1.5,
                Medium: 2,
                Hard: 3,
            };

            // Validate required fields
            if (!encodedLanguage || !encodedDifficulty) {
                return res.status(400).json({ error: "Coding language and difficulty level are required." });
            }

            // Parse and validate the amount
            const Amount = parseFloat(amount);
            if (isNaN(Amount) || Amount <= 0) {
                return res.status(400).json({ error: "Invalid amount format." });
            }

            // Decode language and difficulty
            const language = decodeURIComponent(encodedLanguage);
            const difficulty = decodeURIComponent(encodedDifficulty);

            // Find the user
            const user = await User.findOne({ where: { email: req.user.email } });
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            // Determine the currency
            const currency = user.country === "South Africa" ? 'R' : '$';
            const minFee = currency === 'R' ? ZARMinFee : InternationalMinFee;

            // Check minimum bet amount
            if (Amount < minFee) {
                return res.status(400).json({ error: `Minimum bet amount is ${currency}${minFee}` });
            }

            // Find the user's wallet
            const wallet = await Wallet.findOne({ where: { user_id: user.id, wallet_address: user.walletAddress } });
            if (!wallet) {
                return res.status(401).json({ error: "Invalid wallet or session expired. Please log in." });
            }

            // Ensure wallet is active
            if (wallet.status !== "active") {
                return res.status(403).json({ error: `Wallet is ${wallet.status}. Game plays are not allowed.` });
            }

            // Check for sufficient funds
            if (parseFloat(wallet.balance) < Amount) {
                return res.status(400).json({ error: "Insufficient funds in your wallet." });
            }

            // Begin transaction
            const t = await sequelize.transaction();

            try {
                // Deduct amount from wallet
                wallet.balance -= Amount;
                await wallet.save({ transaction: t });

                // Generate transaction reference
                const transaction_ref = `bet-${wallet.id}-${Date.now()}`;

                // Generate buggy code
                const Code = await generateBuggyCode(language, difficulty);
                if (!Code || !Code.buggy_code) {
                    throw new Error("Failed to generate buggy code.");
                }

                const buggyCode = Code.buggy_code;
                const expectedWinAmount = Amount * payoutMultipliers[difficulty];

                // Generate game session ID
                const gameSessionID = GenerateSecureGameId("buggyCode", user.id, transaction_ref);
                const snippetID = `BuggyCode|${Code.id}|${language}|${difficulty}`;

                // Create transaction record
                await Transaction.create({
                    wallet_id: wallet.id,
                    transaction_type: "bet",
                    amount: Amount,
                    transaction_ref,
                    status: "pending",
                    wallet_address: wallet.wallet_address || "N/A",
                }, { transaction: t });

                // Create game record
                await gamesPlayed.create({
                    gameId: gameSessionID,
                    userId: user.id,
                    transactionRef: transaction_ref,
                    status: "in_progress",
                    snippetID,
                    expectedWinAmount,
                    duration: "30",
                }, { transaction: t });

                // Commit transaction
                await t.commit();

                // Return response with game details
                return res.status(200).json({
                    question: `Fix the bug in the following ${language} code:`,
                    buggyCode,
                    language,
                    gameSessionID
                });

            } catch (error) {
                await t.rollback();
                console.error("Transaction Error:", error);
                return res.status(500).json({ error: "Transaction failed. Please try again later." });
            }
        });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
};

const generateBuggyCode = async (language, difficulty) => {
    try {
        if (!language) {
            throw new Error("Language is required.");
        }

        if (!difficulty) {
            throw new Error("Difficulty is required.");
        }

        let model;

        switch (language.toLowerCase()) {
            case "c++":
                model = BuggyCodeCpp;
                break;
            case "java":
                model = BuggyCodeJava;
                break;
            case "c#":
                model = BuggyCodeCsharp;
                break;
            case "javascript":
                model = BuggyCodeJavascript;
                break;
            default:
                throw new Error("Invalid language. Supported: c++, java, c#, javascript.");
        }

        const buggyCodes = await model.findAll({
            where: { difficulty: difficulty },
            limit: 15,
        });

        if (buggyCodes.length === 0) {
            throw new Error(`No buggy code found for ${language} at ${difficulty} difficulty.`);
        }

        // Randomly select one from the fetched results
        const randomBuggyCode = buggyCodes[Math.floor(Math.random() * buggyCodes.length)];

        return randomBuggyCode;

    } catch (error) {
        console.error(error.message);
        return { error: error.message };
    }
};
