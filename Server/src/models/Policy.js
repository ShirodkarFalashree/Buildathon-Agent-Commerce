const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      default: "default_merchant",
      unique: true,
    },
    storeName: {
      type: String,
      default: "AgentRelay Flagship",
    },
    autonomousPurchaseLimit: {
      type: Number,
      required: true,
      default: 10000, // ₹10,000 INR
    },
    dailySpendingLimit: {
      type: Number,
      required: true,
      default: 50000, // ₹50,000 INR
    },
    currentDailySpend: {
      type: Number,
      default: 0,
    },
    requireApprovalAbove: {
      type: Number,
      required: true,
      default: 10000,
    },
    maxDiscountPercent: {
      type: Number,
      required: true,
      default: 10, // 10%
    },
    maxPaymentRetries: {
      type: Number,
      required: true,
      default: 1,
    },
    isAutoApprovalEnabled: {
      type: Boolean,
      default: true,
    },
    requireCrossSellApproval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Policy", policySchema);
