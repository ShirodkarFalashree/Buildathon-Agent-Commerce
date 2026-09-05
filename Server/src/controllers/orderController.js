const Order = require("../models/Order");

// Fetch order history for a buyer session or all orders
exports.getOrders = async (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;
    const query = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("items.product");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
      error: error.message,
    });
  }
};

// Fetch order history for a specific buyer session
exports.getSessionOrders = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const orders = await Order.find({ sessionId })
      .sort({ createdAt: -1 })
      .populate("items.product");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session order history",
      error: error.message,
    });
  }
};

// Fetch single order details
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId).populate("items.product");
    } else {
      order = await Order.findOne({ orderNumber: orderId }).populate("items.product");
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};
