const express = require("express");
const { Data , enableMFA  , disableMFA, validateSecret , SecurityLogs} = require("../controllers/userController");

const router = express.Router();

router.get("/user", Data);
router.post("/enableMFA", enableMFA);
router.post("/disableMFA" , disableMFA);
router.post("/validate", validateSecret);
router.get("/Security-logs" , SecurityLogs);


module.exports = router;
