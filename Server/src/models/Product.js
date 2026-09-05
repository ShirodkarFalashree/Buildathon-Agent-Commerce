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
      enum: ["Audio", "Headphones", "Computing", "Mobile", "Smart", "Travel", "Cameras", "Home & Lifestyle", "Accessories", "Bundles"],
      default: "Audio",
    },
    brand: {
      type: String,
      required: true,
      default: "AgentCommerce Generic",
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
      processor: String,
      ram: String,
      storage: String,
      display: String,
      compatibility: String,
    },
    // AI Discovery & Inspection Metadata
    useCases: [
      {
        type: String,
      },
    ],
    targetAudience: {
      type: String,
      default: "General Consumer",
    },
    compatibleProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    aiMetadata: {
      discoverabilityScore: {
        type: Number,
        default: 95,
      },
      policyRiskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "LOW",
      },
      recommendedCrossSells: [String],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ tags: 1, category: 1, price: 1 });
productSchema.index({ title: "text", description: "text", features: "text" });

module.exports = mongoose.model("Product", productSchema);
