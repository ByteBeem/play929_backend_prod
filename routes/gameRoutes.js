const express = require("express");
const { Data, playFixTheBug , playWriteFunction , playOptimizeAlgorithm} = require("../controllers/gameController");

const router = express.Router();

router.get("/gamesInfo", Data);
router.get("/playFixTheBug" , playFixTheBug);
router.get("/playWriteFunction" , playWriteFunction);
router.get("/playOptimizeAlgorithm" , playOptimizeAlgorithm);


module.exports = router;
