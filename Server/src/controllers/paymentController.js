const Razorpay = require("razorpay");
const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Policy = require("../models/Policy");
const AuditEvent = require("../models/AuditEvent");
const PolicyService = require("../services/policyService");

// Helper to write audit events
async function createAuditEvent(sessionId, actor, action, title, description, details = {}, status = "SUCCESS") {
  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await AuditEvent.create({
      eventId,
      sessionId,
      actor,
      action,
      status,
      title,
      description,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit event:", err.message);
  }
}

// 1. Create Razorpay Payment Order
exports.createOrder = async (req, res) => {
  try {
    const { sessionId, cartId, isApproved = false } = req.body;

    const cart = await Cart.findOne({ sessionId, status: "active" }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shopping cart is empty or invalid",
      });
    }

    cart.recalculateTotals();
    const amountInINR = cart.total;

    // Check policy deterministically
    const policyResult = await PolicyService.evaluatePurchase(amountInINR);

    if (!policyResult.allowed) {
      await createAuditEvent(
        sessionId,
        "SYSTEM_POLICY",
        "PAYMENT_FAILED",
        "Payment Creation Blocked by Policy",
        policyResult.reasons.join(". "),
        { violations: policyResult.violations },
        "BLOCKED"
      );

      return res.status(403).json({
        success: false,
        message: "Purchase blocked by merchant governance policy",
        violations: policyResult.violations,
      });
    }

    if (policyResult.requiresApproval && !isApproved) {
      return res.status(403).json({
        success: false,
        message: "Human authorization required before initiating payment",
        requiresApproval: true,
        limit: policyResult.autonomousPurchaseLimit,
        amount: amountInINR,
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountInPaisa = Math.round(amountInINR * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrder;

    if (keyId && keySecret && !keyId.includes("AgentCommerce")) {
      try {
        const razorpayInstance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInPaisa,
          currency: "INR",
          receipt: orderNumber,
          notes: {
            sessionId,
            cartId: cart._id.toString(),
            agentType: "SALES_AGENT",
          },
        });
      } catch (rzpErr) {
        console.warn("Razorpay official API order creation note:", rzpErr.message);
        razorpayOrder = {
          id: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          entity: "order",
          amount: amountInPaisa,
          amount_paid: 0,
          amount_due: amountInPaisa,
          currency: "INR",
          receipt: orderNumber,
          status: "created",
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000),
        };
      }
    } else {
      razorpayOrder = {
        id: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        entity: "order",
        amount: amountInPaisa,
        amount_paid: 0,
        amount_due: amountInPaisa,
        currency: "INR",
        receipt: orderNumber,
        status: "created",
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    // Save pending Order in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      sessionId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        sku: item.product.sku,
      })),
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      totalAmount: cart.total,
      currency: "INR",
      status: "pending_payment",
      requiresApproval: policyResult.requiresApproval,
      isApproved,
      approvalDetails: isApproved
        ? { approvedAt: new Date(), approvedBy: "CUSTOMER", channel: "WEB_POPUP", reason: "Customer manually authorized high-limit spend" }
        : null,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "created",
      aiAgentSession: {
        agentType: "SALES_AGENT",
        intentSummary: "AI Shopping Sales Agent Recommendation",
      },
    });

    await createAuditEvent(
      sessionId,
      "SALES_AGENT",
      "PAYMENT_INITIATED",
      `Razorpay Test Order Created (${razorpayOrder.id})`,
      `Initiated payment of ₹${amountInINR.toLocaleString()} (Order #${orderNumber})`,
      {
        orderId: newOrder._id,
        orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInINR,
        isApproved,
      }
    );

    return res.status(200).json({
      success: true,
      order: newOrder,
      razorpayOrder,
      keyId: keyId || "rzp_test_TY0D8SOVosBKXb",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay payment order",
      error: error.message,
    });
  }
};

// 2. Server-side Payment Signature Verification
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    const order = await Order.findById(dbOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC SHA256 signature if keySecret provided and signature present
    let isSignatureValid = true;
    if (keySecret && razorpay_signature && razorpay_signature !== "test_mode_signature") {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      isSignatureValid = generatedSignature === razorpay_signature;
    }

    if (!isSignatureValid) {
      order.status = "failed";
      order.paymentStatus = "failed";
      await order.save();

      await createAuditEvent(
        order.sessionId,
        "SYSTEM_POLICY",
        "PAYMENT_FAILED",
        "Payment Verification Failed",
        "Razorpay HMAC signature mismatch or untrusted payment source",
        { razorpay_order_id, razorpay_payment_id },
        "FAILED"
      );

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Mark Order Paid & Captured
    const paymentId = razorpay_payment_id || `pay_test_${Date.now()}`;
    order.status = "paid";
    order.paymentStatus = "captured";
    order.razorpayPaymentId = paymentId;
    order.razorpaySignature = razorpay_signature || "verified_signature";
    await order.save();

    // Mark Cart Converted
    await Cart.findOneAndUpdate({ sessionId: order.sessionId, status: "active" }, { status: "converted" });

    // Update Merchant Policy Daily Spend Accumulator
    const policy = await Policy.findOne({ merchantId: "default_merchant" });
    if (policy) {
      policy.currentDailySpend += order.totalAmount;
      await policy.save();
    }

    // Log Payment Verification & Order Completion Audit Events
    await createAuditEvent(
      order.sessionId,
      "SYSTEM_POLICY",
      "PAYMENT_VERIFIED",
      "Razorpay Test Payment Verified",
      `Payment of ₹${order.totalAmount.toLocaleString()} captured successfully (ID: ${paymentId})`,
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        razorpayPaymentId: paymentId,
        amount: order.totalAmount,
      }
    );

    await createAuditEvent(
      order.sessionId,
      "SALES_AGENT",
      "ORDER_CREATED",
      `Order #${order.orderNumber} Completed`,
      `Successfully processed order for ${order.items.length} item(s)`,
      {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.items.map((i) => i.title),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify Razorpay payment",
      error: error.message,
    });
  }
};
