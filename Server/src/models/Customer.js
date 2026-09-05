const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: "Alex Vance",
    },
    email: {
      type: String,
      default: "alex@agentcommerce.ai",
    },
    phone: {
      type: String,
      default: "+91 9876543210",
    },
    savedPaymentMethod: {
      cardHolder: {
        type: String,
        default: "Alex Vance",
      },
      cardNumberMasked: {
        type: String,
        default: "**** **** **** 4912",
      },
      last4: {
        type: String,
        default: "4912",
      },
      brand: {
        type: String,
        enum: ["Visa", "Mastercard", "Amex", "Rupay"],
        default: "Visa",
      },
      expiry: {
        type: String,
        default: "12/28",
      },
      isPreAuthorizedForAgent: {
        type: Boolean,
        default: true,
      },
      maxAutonomousLimit: {
        type: Number,
        default: 10000,
      },
      token: {
        type: String,
        default: "tok_visa_alex_4912",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
