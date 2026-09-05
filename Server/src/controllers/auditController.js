const AuditEvent = require("../models/AuditEvent");

// Fetch audit events across merchant store
exports.getAuditEvents = async (req, res) => {
  try {
    const { sessionId, actor, action, limit = 50 } = req.query;

    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (actor) query.actor = actor;
    if (action) query.action = action;

    const events = await AuditEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit events",
      error: error.message,
    });
  }
};

// Fetch decision trail specifically for a session
exports.getSessionAuditTrail = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await AuditEvent.find({ sessionId }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      sessionId,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session audit trail",
      error: error.message,
    });
  }
};
