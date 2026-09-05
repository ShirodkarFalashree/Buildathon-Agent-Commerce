const express = require("express");
const router = express.Router();
const AgentService = require("../services/agentService");

// Process AI Shopping Agent request
router.post("/chat", async (req, res) => {
  try {
    const { sessionId, message, autoPay = true } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message prompt is required",
      });
    }

    const activeSessionId = sessionId || `session_${Date.now()}`;
    const result = await AgentService.processShoppingRequest(activeSessionId, message, { autoPay });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Agent chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Agent processing failed",
      error: error.message,
    });
  }
});

module.exports = router;
