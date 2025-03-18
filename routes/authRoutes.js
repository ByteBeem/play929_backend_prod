const express = require("express");
const { login, createAccount , verifyCode , resendOTP} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register" , createAccount);
router.post("/VerifyCode", verifyCode);
router.post("/resend" , resendOTP);



module.exports = router;
