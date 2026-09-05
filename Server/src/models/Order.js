const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: String,
  price: Number,
  quantity: Number,
  sku: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending_policy", "awaiting_approval", "pending_payment", "paid", "failed", "cancelled"],
      default: "pending_payment",
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalDetails: {
      approvedAt: Date,
      approvedBy: String, // e.g. "CUSTOMER" or "MERCHANT"
      channel: String, // e.g. "WEB_POPUP"
      reason: String,
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["created", "authorized", "captured", "failed"],
      default: "created",
    },
    aiAgentSession: {
      agentType: { type: String, default: "SALES_AGENT" },
      intentSummary: String,
      recommendationReason: String,
      decisionTrailId: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
