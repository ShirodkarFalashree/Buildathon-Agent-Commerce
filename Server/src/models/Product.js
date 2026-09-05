const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Headphones", "Accessories", "Audio", "Bundles"],
      default: "Headphones",
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 50,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      default: 120,
    },
    features: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    imageUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    specs: {
      batteryLife: String,
      noiseCancellation: String,
      weight: String,
      connectivity: String,
      foldable: Boolean,
      chargingType: String,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ tags: 1, category: 1, price: 1 });
productSchema.index({ title: "text", description: "text", features: "text" });

module.exports = mongoose.model("Product", productSchema);
