const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/profile/:sessionId", customerController.getProfile);
router.put("/profile/:sessionId", customerController.updateProfile);

module.exports = router;
