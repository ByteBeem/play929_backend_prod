const User = require("../models/User");
const SecurityLogs = require("../models/securityLogs");
const { sendOTP } = require("../utils/emailService");
const authMiddleware = require("../middlewares/authMiddleware");
const { getClientIP, getBrowserName, Ratelimiter } = require("../utils/helpers");
const sequelize = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { isValidEmail, isValidFirstName, isValidLastName, isValidCountry } = require("../utils/helpers");
const { storeOTP, getOTP, removeOTP } = require("../utils/otpService");

const isProduction = process.env.NODE_ENV === "production";
const getBaseURL = () => isProduction ? process.env.REDIRECT_URL_AUTH || "https://auth.play929.com" : "http://localhost:3000";
const getDashboardURL = () => isProduction ? "https://dashboard.play929.com" : "http://localhost:3001";

/**
 * Send OTP for login
 */
const sendLoginOTP = async (email) => {
    try {
        const otp = crypto.randomInt(100000, 999999).toString();
         storeOTP(email, otp);
        await sendOTP(email, otp);
        return { message: "OTP sent to email" };
    } catch (err) {
        console.error("Error sending OTP:", err);
        throw new Error("Failed to send OTP.");
    }
};

/**
 * Generate a unique account number
 */
const GenerateUniqueAccountNumberAsync = async () => {
    const prefix = "PLY";
    for (let i = 0; i < 10; i++) {
        const accountNumber = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        const existingUser = await User.findOne({ where: { accountNumber } });
        if (!existingUser) return accountNumber;
    }
    throw new Error("Failed to generate a unique account number.");
};

/**
 * Generate unique wallet address
 */
const GenerateWalletAddressAsync = async () => {
    const addressPrefix = "WALLET-";
    for (let i = 0; i < 10; i++) {
        const randomBytes = crypto.randomBytes(8);
        const walletAddress = addressPrefix + randomBytes.toString("hex").substring(0, 16);
        const existingUser = await User.findOne({ where: { walletAddress } });
        if (!existingUser) return walletAddress;
    }
    throw new Error("Failed to generate a unique wallet address.");
};

/**
 * User login
 */
exports.login = [Ratelimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email address." });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "Account does not exist" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "3m" }
        );

        await sendLoginOTP(email);

        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 180000,
            sameSite: 'Strict',
            domain: isProduction ? '.play929.com' : 'localhost',
        });

        const redirectURL = `${getBaseURL()}/SignInCode?secure=true&user=${encodeURIComponent(user.email)}`;
        res.json({ message: "Sign-in Code sent to your email.", link: redirectURL });
    } catch (err) {
        
        res.status(500).json({ error: "Something went wrong , try again later." });
    }
}];

/**
 * Create new account
 */
exports.createAccount = [Ratelimiter, async (req, res) => {
    try {
        const { email, firstname, lastname, country } = req.body;

        if (!email || !firstname || !lastname || !country) {
            return res.status(400).json({ error: "Missing fields." });
        }

        if (!isValidEmail(email) || !isValidFirstName(firstname) || !isValidLastName(lastname) || !isValidCountry(country)) {
            return res.status(400).json({ error: "Invalid input data." });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        const accountNumber = await GenerateUniqueAccountNumberAsync();
        const walletAddress = await GenerateWalletAddressAsync();

        const newUser = await User.create({
            email,
            firstName: firstname,
            lastName: lastname,
            country,
            accountNumber,
            walletAddress,
        });

       
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "3m" }
        );

        await sendLoginOTP(email);

        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 180000,
            sameSite: 'Strict',
            domain: isProduction ? '.play929.com' : 'localhost',
        });

        const redirectURL = `${getBaseURL()}/SignInCode?secure=true&user=${encodeURIComponent(newUser.email)}`;
        res.json({ message: "Account created successfully!", link: redirectURL });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
}];

/**
 * Verify Code
 */
exports.verifyCode = [Ratelimiter, async (req, res) => {
    try {
        authMiddleware(['user'])(req, res, async () => {
            const { code, email } = req.body;
            if (!code || !email) return res.status(400).json({ error: "Missing Fields." });

            const ip = getClientIP(req);
            const browser = getBrowserName(req);

            const storedCode = await getOTP(email);
            if (!storedCode || storedCode !== code) return res.status(401).json({ error: "Incorrect or Expired Code." });
             
            removeOTP(email);

            const existingUser = await User.findOne({ where: { email } });
            if (!existingUser) return res.status(400).json({ error: "Account not Found." });

            const mfa_token = jwt.sign(
                { id: existingUser.id, email: existingUser.email, role: existingUser.role },
                process.env.JWT_SECRET,
                { algorithm: 'HS512', expiresIn: '15m' }
            );

            if (existingUser.isTwoFactorEnabled) {
                return res.status(200).json({
                    message: "Enter the code from your authenticator app.",
                    link: `${getBaseURL()}/mfa?sid=${mfa_token}&user=${encodeURIComponent(email)}`,
                });
            }

            const t = await sequelize.transaction();
            try {
                existingUser.lastLogin = Date.now();
                await existingUser.save({ transaction: t });

                await SecurityLogs.create({
                    email_address: existingUser.email,
                    action: "Login",
                    browser,
                    ip_address: ip
                }, { transaction: t });

                await t.commit();
            } catch (error) {
                await t.rollback();
                console.error("Logging error:", error);
                return res.status(500).json({ error: "Error saving logs. Try again later." });
            }

            const token = jwt.sign(
                { id: existingUser.id, email: existingUser.email, role: existingUser.role },
                process.env.JWT_SECRET,
                { algorithm: 'HS512', expiresIn: '7d' }
            );

            res.cookie('jwt_token', token, {
                httpOnly: true,
                secure: isProduction,
                maxAge: 604800000,
                sameSite: 'Strict',
                domain: isProduction ? '.play929.com' : 'localhost',
            });

            const redirectURL = `${getDashboardURL()}/dashboard`;
            res.json({ message: `Welcome back, ${existingUser.firstName}!`, link: redirectURL });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
}];

/**
 * Resend OTP
 */
exports.resendOTP = [Ratelimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is Required." });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (!existingUser) return res.status(400).json({ error: "Account not Found." });

        await sendLoginOTP(email);

        const token = jwt.sign(
            { id: existingUser.id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "3m" }
        );

        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 180000,
            sameSite: 'Strict',
            domain: isProduction ? '.play929.com' : 'localhost',
        });

        res.json({ message: "New Sign-in code sent to your email." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error. Please try again later." });
    }
}];
