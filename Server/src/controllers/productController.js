const Product = require("../models/Product");

// Get all products with optional filtering/search
exports.getProducts = async (req, res) => {
  try {
    const { category, tag, search, maxPrice, brand } = req.query;

    const query = { isActive: true };

    if (category) {
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
      ];
    }

    const products = await Product.find(query).sort({ rating: -1, createdAt: -1 });

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
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
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
