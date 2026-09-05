const express = require("express");
const router = express.Router();
const merchantController = require("../controllers/merchantController");

router.get("/overview", merchantController.getMerchantOverview);

module.exports = router;
