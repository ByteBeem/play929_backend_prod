const express = require("express");
const { depositMethods , withdrawalMethods , withdrawal , InternetDeposit, paypalDeposit, capture_paypal_payment, payfastDeposit, payfastNotify, Transactions} = require("../controllers/walletController");


const router = express.Router();

router.get("/methods", depositMethods);
router.get("/withdrawalMethods" ,withdrawalMethods );
router.post("/withdrawal" ,withdrawal);
router.post("/internetDeposit", InternetDeposit);
router.post("/paypalDeposit", paypalDeposit);
router.get("/capture_paypal_payment" , capture_paypal_payment);
router.post("/payfastDeposit" , payfastDeposit);
router.post("/payfastNotify", payfastNotify);
router.get("/transactions" , Transactions);


module.exports = router;
