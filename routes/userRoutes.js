const express = require("express");
const { Data , enableMFA  , validateSecret} = require("../controllers/userController");

const router = express.Router();

router.get("/user", Data);
router.post("/enableMFA", enableMFA);
router.post("/validate", validateSecret);


module.exports = router;
