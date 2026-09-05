const Product = require("../models/Product");
const Policy = require("../models/Policy");

// Get all products with optional filtering/search
exports.getProducts = async (req, res) => {
  try {
    const { category, tag, search, maxPrice, brand, includeInactive } = req.query;

    const query = includeInactive === "true" ? {} : { isActive: true };

    if (category && category !== "All") {
      query.category = category;
    }

    if (brand) {
      query.brand = new RegExp(brand, "i");
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (maxPrice) {
      query.price = { $lte: Number(maxPrice) };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("compatibleProducts", "title sku price imageUrl category")
      .sort({ rating: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get product details by ID or slug
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate("compatibleProducts", "title sku price imageUrl category");
    } else {
      product = await Product.findOne({ slug: id }).populate("compatibleProducts", "title sku price imageUrl category");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
};

// Create a new product (Merchant Admin)
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      brand,
      price,
      stock,
      sku,
      imageUrl,
      features,
      tags,
      specs,
      useCases,
      targetAudience,
      compatibleProducts,
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, price, and category are required",
      });
    }

    const slug = req.body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const generatedSku = sku || `SKU-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const product = await Product.create({
      title,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: description || "No detailed description provided.",
      category: category || "Audio",
      brand: brand || "AgentRelay Store",
      price: Number(price),
      stock: Number(stock !== undefined ? stock : 50),
      sku: generatedSku,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800",
      features: Array.isArray(features) ? features : (features ? features.split(",").map(s => s.trim()) : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(s => s.trim()) : []),
      specs: specs || {},
      useCases: Array.isArray(useCases) ? useCases : (useCases ? useCases.split(",").map(s => s.trim()) : ["Travel", "General Use"]),
      targetAudience: targetAudience || "General Consumer",
      compatibleProducts: Array.isArray(compatibleProducts) ? compatibleProducts : [],
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// Update an existing product (Merchant Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = { ...req.body };

    if (updateFields.features && typeof updateFields.features === "string") {
      updateFields.features = updateFields.features.split(",").map(s => s.trim());
    }
    if (updateFields.tags && typeof updateFields.tags === "string") {
      updateFields.tags = updateFields.tags.split(",").map(s => s.trim());
    }
    if (updateFields.useCases && typeof updateFields.useCases === "string") {
      updateFields.useCases = updateFields.useCases.split(",").map(s => s.trim());
    }

    const product = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    }).populate("compatibleProducts", "title sku price imageUrl category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// Soft-delete or archive product (Merchant Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product archived successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to archive product",
      error: error.message,
    });
  }
};

// AI Product Inspector view endpoint
exports.getAiInspector = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate("compatibleProducts", "title sku price imageUrl category");
    } else {
      product = await Product.findOne({ $or: [{ slug: id }, { sku: id }] }).populate("compatibleProducts", "title sku price imageUrl category");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found for AI inspection",
      });
    }

    // Fetch active merchant policy to evaluate policy suitability
    const policy = await Policy.findOne({ merchantId: "default_merchant" });
    const autoLimit = policy ? policy.autonomousPurchaseLimit : 10000;
    const requiresApproval = product.price > autoLimit;

    // Dynamically find suggested compatible products if none linked explicitly
    let suggestedCompatible = product.compatibleProducts || [];
    if (suggestedCompatible.length === 0) {
      suggestedCompatible = await Product.find({
        _id: { $ne: product._id },
        category: { $in: ["Travel", "Accessories"] },
        isActive: true,
      }).limit(2).select("title sku price imageUrl category");
    }

    // Structured AI inspection report based on real database attributes
    const aiReport = {
      product: {
        id: product._id,
        title: product.title,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        category: product.category,
        brand: product.brand,
        imageUrl: product.imageUrl,
      },
      aiCategoryHierarchy: [`Storefront`, product.category, product.brand],
      useCases: product.useCases && product.useCases.length > 0 
        ? product.useCases 
        : ["Long flights", "Travel", "Remote work", "Everyday Use"],
      keyAttributes: [
        ...(product.specs?.noiseCancellation ? [`Noise Cancellation: ${product.specs.noiseCancellation}`] : []),
        ...(product.specs?.batteryLife ? [`Battery Life: ${product.specs.batteryLife}`] : []),
        ...(product.specs?.weight ? [`Weight: ${product.specs.weight}`] : []),
        ...(product.specs?.processor ? [`Processor: ${product.specs.processor}`] : []),
        ...(product.specs?.ram ? [`RAM: ${product.specs.ram}`] : []),
        ...(product.specs?.connectivity ? [`Connectivity: ${product.specs.connectivity}`] : []),
        `Stock Available: ${product.stock} units`,
        `Rating: ${product.rating || 4.8}★`,
      ],
      compatibleProducts: suggestedCompatible,
      policyAssessment: {
        autonomousPurchaseLimit: autoLimit,
        price: product.price,
        requiresApproval,
        status: requiresApproval ? "AWAITING_HUMAN_APPROVAL" : "AUTONOMOUS_PAYMENT_ALLOWED",
        reason: requiresApproval
          ? `Product price (₹${product.price.toLocaleString()}) exceeds spending limit (₹${autoLimit.toLocaleString()}).`
          : `Product price (₹${product.price.toLocaleString()}) is within limit (₹${autoLimit.toLocaleString()}).`,
      },
      aiDiscoverability: {
        score: product.aiMetadata?.discoverabilityScore || 95,
        targetAudience: product.targetAudience || "Travelers & Tech Enthusiasts",
        tags: product.tags || [],
      },
    };

    return res.status(200).json({
      success: true,
      aiReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI inspection report",
      error: error.message,
    });
  }
};
