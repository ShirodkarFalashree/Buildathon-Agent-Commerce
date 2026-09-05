const mongoose = require("mongoose");

const auditEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      required: true,
      enum: [
        "BUYER_AGENT",
        "SALES_AGENT",
        "GROWTH_AGENT",
        "SYSTEM_POLICY",
        "HUMAN_MERCHANT",
        "HUMAN_BUYER",
      ],
    },
    action: {
      type: String,
      required: true,
      enum: [
        "INTENT_DETECTED",
        "CATALOG_SEARCHED",
        "PRODUCTS_RANKED",
        "RECOMMENDATION_GENERATED",
        "CROSS_SELL_SUGGESTED",
        "CART_CREATED",
        "CART_UPDATED",
        "POLICY_CHECKED",
        "APPROVAL_REQUESTED",
        "APPROVAL_GRANTED",
        "APPROVAL_DENIED",
        "PAYMENT_INITIATED",
        "PAYMENT_VERIFIED",
        "PAYMENT_FAILED",
        "ORDER_CREATED",
        "CAMPAIGN_PROPOSED",
      ],
    },
    status: {
      type: String,
      enum: ["SUCCESS", "BLOCKED", "PENDING_APPROVAL", "FAILED", "INFO"],
      default: "SUCCESS",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      productIds: [String],
      amount: Number,
      policyLimit: Number,
      toolName: String,
      executionTimeMs: Number,
    },
  },
  {
    timestamps: true,
  }
);

auditEventSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditEvent", auditEventSchema);
