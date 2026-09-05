const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  isCrossSell: {
    type: Boolean,
    default: false,
  },
  addedByAgent: {
    type: Boolean,
    default: false,
  },
});

const cartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    appliedDiscountCode: {
      type: String,
      default: "",
    },
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "checkout", "converted", "abandoned"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.index({ sessionId: 1, status: 1 });

// Helper method to compute totals safely on backend
cartSchema.methods.recalculateTotals = function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  this.total = Math.max(0, this.subtotal - (this.discountAmount || 0));
  return this.total;
};

module.exports = mongoose.model("Cart", cartSchema);
