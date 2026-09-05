const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/", auditController.getAuditEvents);
router.get("/:sessionId", auditController.getSessionAuditTrail);

module.exports = router;
