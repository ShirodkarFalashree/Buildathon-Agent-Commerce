const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Fetch active cart by session ID
exports.getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let cart = await Cart.findOne({ sessionId, status: "active" }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// Add or update item in cart
exports.addToCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, quantity = 1, isCrossSell = false, addedByAgent = false } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ sessionId, status: "active" });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: Number(quantity),
        isCrossSell,
        addedByAgent,
      });
    }

    cart.recalculateTotals();
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    const cart = await Cart.findOne({ sessionId, status: "active" });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    cart.recalculateTotals();
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const cart = await Cart.findOne({ sessionId, status: "active" });

    if (cart) {
      cart.items = [];
      cart.recalculateTotals();
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};
