const { initializeGames } = require("../utils/helpers");
const crypto = require('crypto');
const db = require('../models');
const { User, Wallet, GamePlayed , Transaction } = db;
const authMiddleware = require("../middlewares/authMiddleware");
const sequelize = require("../config/db");
require("dotenv").config();

const { handlePythonAlgoRequest } = require('../PythonAlgo/route');
const { handleJavaScriptAlgoRequest } = require('../JavascriptAlgo/route');

const SecretKey = process.env.SECRET;
const isProduction = process.env.NODE_ENV === "production";
const server_url = "https://api.play929.com";

const getBaseURL = () => isProduction ? process.env.REDIRECT_URL_AUTH || "https://auth.play929.com" : "http://localhost:3000";
const getDashboardURL = () => isProduction ? "https://dashboard.play929.com" : "http://localhost:3001";

// Utility functions
function GenerateSecureGameId(GameType, userId, transactionRef) {
    if (!GameType || !userId || !transactionRef) {
        throw new Error("GameType, userId, and transactionRef are required.");
    }

    const randomBytes = crypto.randomBytes(8).toString('hex');
    const data = `${GameType}|${userId}|${transactionRef}|${randomBytes}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash.substring(0, 32);
}

function generateHmacSignature(input) {
    if (!input || input.trim().length === 0) {
        throw new Error("Input cannot be null or whitespace.");
    }

    const hmac = crypto.createHmac('sha256', SecretKey);
    hmac.update(input.trim(), 'utf8');
    const hashBytes = hmac.digest();
    return base64UrlEncode(hashBytes);
}

function base64UrlEncode(input) {
    return input.toString('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(input) {
    let paddedInput = input.replace(/-/g, '+').replace(/_/g, '/');
    switch (paddedInput.length % 4) {
        case 2: paddedInput += "=="; break;
        case 3: paddedInput += "="; break;
    }
    return Buffer.from(paddedInput, 'base64');
}

// Controller functions
exports.Data = async (req, res) => {
    try {
        const gameInfo = initializeGames(server_url);
        res.json({ gameInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
};

async function validateUserAndWallet(req) {
    const user = await User.findOne({
        where: { email: req.user.email },
        include: [{
            model: Wallet,
            as: 'wallet',
        }]
    });

    if (!user) throw new Error("User not found.");
    if (!user.wallet) throw new Error("Wallet not found.");

    return user;
}

async function handleGameInitialization(req, res, gameType, handlerType) {
    const { language: encodedLanguage, amount, difficulty: encodedDifficulty } = req.query;

    // Configuration constants
    const MIN_FEES = { ZAR: 20.0, INTL: 5.0 };
    const PAYOUT_MULTIPLIERS = { easy: 1.5, medium: 2, hard: 3 };
    const MAX_BET_AMOUNT = 10000;

    // Validate inputs
    if (!encodedLanguage || !encodedDifficulty) {
        return res.status(400).json({ error: "Language and difficulty are required." });
    }

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > MAX_BET_AMOUNT) {
        return res.status(400).json({ error: `Invalid amount. Must be between 0 and ${MAX_BET_AMOUNT}` });
    }

    const language = decodeURIComponent(encodedLanguage).toLowerCase();
    const difficulty = decodeURIComponent(encodedDifficulty).toLowerCase();

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty level." });
    }

    if (!['python', 'javascript'].includes(language)) {
        return res.status(400).json({ error: "Unsupported language." });
    }

    try {
        const user = await validateUserAndWallet(req);
        const wallet = user.wallet;
        const currency = user.country === "South Africa" ? 'ZAR' : 'INTL';
        const minFee = MIN_FEES[currency];
        const currencySymbol = currency === 'ZAR' ? 'R' : '$';

        if (betAmount < minFee) {
            return res.status(400).json({ error: `Minimum bet amount is ${currencySymbol}${minFee}` });
        }

        if (wallet.status !== "active") {
            return res.status(403).json({ error: `Wallet is ${wallet.status}. Game plays are not allowed.` });
        }

        if (parseFloat(wallet.balance) < betAmount) {
            return res.status(400).json({ error: "Insufficient funds in your wallet." });
        }

        // Start transaction
        const transaction = await sequelize.transaction();
        try {
            wallet.balance = (parseFloat(wallet.balance) - betAmount).toFixed(2);
            await wallet.save({ transaction });

            const transactionRef = `bet-${wallet.id}-${Date.now()}`;
            const gameId = GenerateSecureGameId(gameType, user.id, transactionRef);

            let challenge;
            try {
                const handler = language === 'javascript' ? handleJavaScriptAlgoRequest : handlePythonAlgoRequest;
                challenge = await handler(handlerType, difficulty, {});

                if (!challenge) {
                    throw new Error("Failed to generate challenge.");
                }
                console.log("Challenge generated successfully:", challenge);
            } catch (err) {
                await transaction.rollback();
                console.error("Challenge generation error:", err);
                return res.status(500).json({ error: "Failed to generate challenge. Please try again." });
            }

            await Transaction.create({
                wallet_id: wallet.id,
                transaction_type: "bet",
                amount: betAmount,
                transaction_ref: transactionRef,
                status: "completed",
                wallet_address: wallet.wallet_address,
            }, { transaction });

            await GamePlayed.create({
                gameId,
                userId: user.id,
                transactionRef,
                status: "in_progress",
                snippetID: `${gameType}|${challenge.id}|${language}|${difficulty}`,
                expectedWinAmount: betAmount * PAYOUT_MULTIPLIERS[difficulty],
                duration: "30",
            }, { transaction });

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: `${gameType} game initialized`,
                question: handlerType === "buggycode" ?  `Fix the bug in the following ${language} code` : challenge.description,
                language,
                stub: challenge.stub ||  challenge.buggy,
                gameSessionID: gameId,
            });

        } catch (err) {
            await transaction.rollback();
            console.error("Game initialization error:", err);
            return res.status(500).json({ error: "Game initialization failed. Please try again." });
        }
    } catch (err) {
        console.error("Validation error:", err);
        return res.status(500).json({ error: err.message || "Internal server error." });
    }
}

exports.playFixTheBug = async (req, res) => {
    await authMiddleware(["user"])(req, res, async () => {
        await handleGameInitialization(req, res, "buggyCode", "buggycode");
    });
};

exports.playWriteFunction = async (req, res) => {
    await authMiddleware(["user"])(req, res, async () => {
        await handleGameInitialization(req, res, "writeFunction", "write");
    });
};


exports.playOptimizeAlgorithm = async (req, res) => {
    await authMiddleware(["user"])(req, res, async () => {
        await handleGameInitialization(req, res, "optimizeAlgorithm", "optimize");
    });
};
