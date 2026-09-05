require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");
const Policy = require("./models/Policy");
const User = require("./models/User");

const initialProducts = [
  {
    title: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
    slug: "sony-wh-1000xm5",
    description:
      "Industry-leading noise canceling with two processors and 8 microphones. Specially engineered for long-haul international flights with 30-hour battery life and ultra-comfortable lightweight design.",
    category: "Headphones",
    brand: "Sony",
    price: 18999,
    compareAtPrice: 24990,
    stock: 45,
    sku: "SONY-XM5-BLK",
    rating: 4.9,
    reviewCount: 342,
    features: [
      "Auto NC Optimizer automatically optimizes noise canceling based on flight pressure",
      "Up to 30-hour battery life with quick charging (3 min charge = 3 hours playback)",
      "Ultra-comfortable lightweight design with soft fit leather",
      "Multipoint connection allows switching seamlessly between laptop and phone",
      "Speak-to-Chat technology automatically pauses music when you talk",
    ],
    tags: [
      "flight",
      "headphones",
      "travel",
      "noise-canceling",
      "anc",
      "over-ear",
      "12-hour flight",
      "wireless",
      "sony",
    ],
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "30 Hours",
      noiseCancellation: "Industry-Leading Dual Processor ANC",
      weight: "250g",
      connectivity: "Bluetooth 5.2",
      foldable: false,
      chargingType: "USB-C Fast Charging",
    },
  },
  {
    title: "Bose QuietComfort Ultra Wireless Headphones",
    slug: "bose-quietcomfort-ultra",
    description:
      "World-class noise cancellation, quieter than ever before. Breakthrough spatialized audio for immersive listening during travel. CustomTune technology customizes sound performance to your ears.",
    category: "Headphones",
    brand: "Bose",
    price: 24900,
    compareAtPrice: 35900,
    stock: 30,
    sku: "BOSE-QC-ULTRA",
    rating: 4.8,
    reviewCount: 215,
    features: [
      "Immersive Audio pushes the boundary of listening by placing sound in front of you",
      "World-class quiet, aware, and immersive listening modes",
      "Up to 24 hours of battery life per single charge",
      "Luxurious plush ear cushions engineered for zero pressure on long flights",
      "Includes premium travel carrying case and 3.5mm audio cable",
    ],
    tags: [
      "flight",
      "headphones",
      "travel",
      "noise-canceling",
      "anc",
      "spatial audio",
      "bose",
      "over-ear",
    ],
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "24 Hours",
      noiseCancellation: "CustomTune Active Noise Canceling",
      weight: "254g",
      connectivity: "Bluetooth 5.3",
      foldable: true,
      chargingType: "USB-C",
    },
  },
  {
    title: "Anker Soundcore Space Q45 Noise Cancelling Headphones",
    slug: "anker-soundcore-space-q45",
    description:
      "Adaptive noise cancelling reduces noise by up to 98%. Ultra-long 50-hour playtime in ANC mode makes it the ultimate budget-friendly travel companion under ₹10,000.",
    category: "Headphones",
    brand: "Anker",
    price: 8999,
    compareAtPrice: 12999,
    stock: 80,
    sku: "ANKER-Q45-BLK",
    rating: 4.6,
    reviewCount: 512,
    features: [
      "98% Noise Reduction system targets airplane engine noise",
      "Massive 50-Hour ANC battery life (65 hours in standard mode)",
      "5 levels of transparency and noise cancelling customization",
      "Ergonomic design with memory foam earcups for extended flight sessions",
      "Hi-Res Wireless sound with LDAC codec support",
    ],
    tags: [
      "flight",
      "headphones",
      "budget",
      "under 10000",
      "under 10k",
      "travel",
      "noise-canceling",
      "anker",
    ],
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "50 Hours (ANC On)",
      noiseCancellation: "Adaptive ANC 98%",
      weight: "292g",
      connectivity: "Bluetooth 5.3",
      foldable: true,
      chargingType: "USB-C",
    },
  },
  {
    title: "Sennheiser Momentum 4 Wireless Headphones",
    slug: "sennheiser-momentum-4",
    description:
      "60-hour battery life benchmarks audiophile sound quality with adaptive noise cancellation. Designed for frequent flyers who refuse to compromise on sound fidelity.",
    category: "Headphones",
    brand: "Sennheiser",
    price: 22990,
    compareAtPrice: 29990,
    stock: 25,
    sku: "SENN-M4-BLK",
    rating: 4.7,
    reviewCount: 188,
    features: [
      "Unrivaled 60-Hour battery life with fast charging",
      "Adaptive Noise Cancellation automatically adjusts to cabin noise",
      "42mm transducer system for exceptional audiophile clarity",
      "Lightweight padded headband and cushioned ear pads",
    ],
    tags: [
      "flight",
      "headphones",
      "sennheiser",
      "audiophile",
      "travel",
      "long battery",
      "anc",
    ],
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "60 Hours",
      noiseCancellation: "Adaptive ANC",
      weight: "293g",
      connectivity: "Bluetooth 5.2",
      foldable: false,
      chargingType: "USB-C",
    },
  },
  {
    title: "Universal Airplane Flight Dual-3.5mm Audio Adapter",
    slug: "universal-flight-adapter",
    description:
      "Convert standard 3.5mm headphone jacks into dual-prong airplane in-flight entertainment sockets. Golden-plated connectors for crystal clear audio signal without static during long flights.",
    category: "Accessories",
    brand: "AgentCommerce Travel",
    price: 799,
    compareAtPrice: 1299,
    stock: 150,
    sku: "ACC-FLIGHT-ADAPT",
    rating: 4.9,
    reviewCount: 840,
    features: [
      "Dual 3.5mm male to single 3.5mm female gold-plated jack",
      "Compatible with all major international airlines in-flight entertainment systems",
      "Compact aluminum shell built to withstand flight wear",
    ],
    tags: [
      "flight adapter",
      "airplane plug",
      "travel accessory",
      "cross-sell",
      "in-flight audio",
    ],
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "N/A",
      noiseCancellation: "N/A",
      weight: "15g",
      connectivity: "Dual 3.5mm Airplane Jack",
      foldable: false,
      chargingType: "N/A",
    },
  },
  {
    title: "Hard-Shell Universal Headphone Travel Case",
    slug: "hardshell-travel-case",
    description:
      "Waterproof EVA shockproof carrying case with plush velvet lining and cable mesh pocket. Fits Sony XM5, Bose QC Ultra, Sennheiser M4, and Anker Q45 perfectly.",
    category: "Accessories",
    brand: "AgentCommerce Travel",
    price: 1299,
    compareAtPrice: 1999,
    stock: 120,
    sku: "ACC-TRAVEL-CASE",
    rating: 4.8,
    reviewCount: 410,
    features: [
      "Impact-resistant EVA outer shell with soft interior velvet padding",
      "Built-in zipper mesh pocket for flight adapters, charging cables, and passports",
      "Includes heavy-duty carabiner for clipping onto travel backpacks",
    ],
    tags: [
      "travel case",
      "headphone case",
      "accessory",
      "protection",
      "cross-sell",
      "flight",
    ],
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
    isActive: true,
    specs: {
      batteryLife: "N/A",
      noiseCancellation: "N/A",
      weight: "180g",
      connectivity: "N/A",
      foldable: false,
      chargingType: "N/A",
    },
  },
];

const defaultPolicy = {
  merchantId: "default_merchant",
  storeName: "AgentCommerce Flagship Store",
  autonomousPurchaseLimit: 10000,
  dailySpendingLimit: 500000,
  currentDailySpend: 0,
  requireApprovalAbove: 10000,
  maxDiscountPercent: 10,
  maxPaymentRetries: 1,
  isAutoApprovalEnabled: true,
  requireCrossSellApproval: false,
};

const initialUsers = [
  {
    name: "Merchant Administrator",
    email: "merchant@agentcommerce.ai",
    password: "admin123",
    role: "MERCHANT",
    storeName: "AgentCommerce Flagship Store",
  },
  {
    name: "Alex Vance",
    email: "buyer@agentcommerce.ai",
    password: "buyer123",
    role: "BUYER",
  },
];

async function seed() {
  try {
    console.log("Connecting to database for seeding...");
    await connectDB();

    console.log("Seeding default merchant policy...");
    await Policy.findOneAndUpdate(
      { merchantId: defaultPolicy.merchantId },
      defaultPolicy,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log("✓ Default policy configured");

    console.log("Seeding demo user accounts...");
    for (const u of initialUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        u,
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
    }
    console.log("✓ Demo Merchant (merchant@agentcommerce.ai) & Buyer (buyer@agentcommerce.ai) created");

    console.log("Seeding products...");
    let processedCount = 0;
    for (const prod of initialProducts) {
      await Product.findOneAndUpdate(
        { sku: prod.sku },
        prod,
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      processedCount++;
    }

    console.log(`✓ Catalog seeded successfully (${processedCount} products).`);
    console.log("Seeding process completed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
