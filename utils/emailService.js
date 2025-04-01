const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a One-Time Password (OTP) to the user's email.
 * @param {string} email - Recipient email address.
 * @param {string} otp - The OTP code.
 */
exports.sendOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"Play929 - No Reply" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔐 Your Secure Login OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                    <h2 style="color: #2c3e50; text-align: center;">🔐 Secure Login OTP</h2>
                    <p>Hello,</p>
                    <p>Use the OTP below to securely log in to your account. This code is valid for <b>3 minutes</b>:</p>
                    <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 10px; background: #2c3e50; color: #fff; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p>If you did not request this, please ignore this email.</p>
                    <p style="color: #7f8c8d;">Best regards, <br> <b>Play929 Team</b></p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent successfully to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send OTP to ${email}:`, error.message);
        throw new Error("Failed to send OTP. Please try again later.");
    }
};
