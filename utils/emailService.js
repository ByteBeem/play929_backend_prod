const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendOTP = async (email, otp) => {
    await transporter.sendMail({
        from: `"Play929-No Reply" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Login OTP",
        text: `Use this OTP to login: ${otp}. It expires in 3 minutes.`,
    });
};
