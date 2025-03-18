const express = require("express");
const { Data, playFixTheBug} = require("../controllers/gameController");

const router = express.Router();

router.get("/gamesInfo", Data);
router.get("/playFixTheBug" , playFixTheBug);


module.exports = router;
