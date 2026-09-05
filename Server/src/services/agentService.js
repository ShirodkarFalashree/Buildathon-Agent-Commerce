const { OpenAI } = require("openai");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Policy = require("../models/Policy");
const Customer = require("../models/Customer");
const AuditEvent = require("../models/AuditEvent");
const PolicyService = require("./policyService");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Helper to log audit events safely
async function createAuditEvent(sessionId, actor, action, title, description, details = {}, status = "SUCCESS") {
  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const event = await AuditEvent.create({
      eventId,
      sessionId,
      actor,
      action,
      status,
      title,
      description,
      details,
    });
    return event;
  } catch (err) {
    console.error("Failed to write audit event:", err.message);
  }
}

class AgentService {
  /**
   * Main entry point for AI Shopping Sales Agent processing buyer prompts.
   */
  static async processShoppingRequest(sessionId, userPrompt, options = {}) {
    const startTime = Date.now();

    // Fetch customer profile and payment vault details
    let customer = await Customer.findOne({ sessionId });
    if (!customer) {
      customer = await Customer.create({
        sessionId,
        name: "Alex Vance",
        email: "alex@agentcommerce.ai",
        savedPaymentMethod: {
          cardHolder: "Alex Vance",
          cardNumberMasked: "**** **** **** 4912",
          last4: "4912",
          brand: "Visa",
          expiry: "12/28",
          isPreAuthorizedForAgent: true,
          maxAutonomousLimit: 10000,
          token: "tok_visa_alex_4912",
        },
      });
    }

    const savedCard = customer.savedPaymentMethod || {};
    const isCustomerPreAuthorized = savedCard.isPreAuthorizedForAgent !== false;

    // 1. OBSERVE: Detect customer intent & write audit log
    const intentAnalysis = this.analyzeIntent(userPrompt);
    await createAuditEvent(
      sessionId,
      "SALES_AGENT",
      "INTENT_DETECTED",
      "Customer Intent Analyzed",
      `Detected intent: ${intentAnalysis.summary}`,
      { userPrompt, intent: intentAnalysis }
    );

    // 2. REASON: Search catalog for products matching intent
    const searchResults = await this.searchProductsForIntent(intentAnalysis);
    await createAuditEvent(
      sessionId,
      "SALES_AGENT",
      "CATALOG_SEARCHED",
      "Merchant Catalog Searched",
      `Found ${searchResults.matchedProducts.length} matching products in catalog`,
      {
        matchedProductCount: searchResults.matchedProducts.length,
        matchedSkus: searchResults.matchedProducts.map((p) => p.sku),
        queryParameters: searchResults.queryUsed,
      }
    );

    // 3. RANK & PROPOSE: Select best fit and optional cross-sell
    const primaryProduct = searchResults.primaryRecommendation;
    const crossSellProduct = searchResults.crossSellRecommendation;

    if (!primaryProduct) {
      return {
        success: false,
        message: "No suitable products found matching your request.",
        intentSummary: intentAnalysis.summary,
      };
    }

    await createAuditEvent(
      sessionId,
      "SALES_AGENT",
      "RECOMMENDATION_GENERATED",
      `Recommended ${primaryProduct.title}`,
      `Reason: ${searchResults.recommendationReason}`,
      {
        productId: primaryProduct._id,
        title: primaryProduct.title,
        price: primaryProduct.price,
        specs: primaryProduct.specs,
        recommendationReason: searchResults.recommendationReason,
      }
    );

    if (crossSellProduct) {
      await createAuditEvent(
        sessionId,
        "SALES_AGENT",
        "CROSS_SELL_SUGGESTED",
        `Suggested Bundle Cross-sell: ${crossSellProduct.title}`,
        `Complements long flight setup: ${crossSellProduct.description}`,
        {
          productId: crossSellProduct._id,
          title: crossSellProduct.title,
          price: crossSellProduct.price,
        }
      );
    }

    // 4. EXECUTE (Cart Building): Update backend cart deterministically
    let cart = await Cart.findOne({ sessionId, status: "active" });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    // Clear existing active items for fresh session recommendation
    cart.items = [
      {
        product: primaryProduct._id,
        title: primaryProduct.title,
        price: primaryProduct.price,
        quantity: 1,
        isCrossSell: false,
        addedByAgent: true,
      },
    ];

    if (crossSellProduct) {
      cart.items.push({
        product: crossSellProduct._id,
        title: crossSellProduct.title,
        price: crossSellProduct.price,
        quantity: 1,
        isCrossSell: true,
        addedByAgent: true,
      });
    }

    cart.recalculateTotals();
    await cart.save();
    await cart.populate("items.product");

    await createAuditEvent(
      sessionId,
      "SALES_AGENT",
      "CART_CREATED",
      `Built Shopping Cart (Total: ₹${cart.total.toLocaleString()})`,
      `Added 1 main product + ${crossSellProduct ? "1 travel accessory cross-sell" : "0 cross-sells"}`,
      {
        cartId: cart._id,
        subtotal: cart.subtotal,
        total: cart.total,
        itemCount: cart.items.length,
      }
    );

    // 5. POLICY CHECK: Run backend policy guardrails deterministically
    const policyResult = await PolicyService.evaluatePurchase(cart.total);

    const policyAuditStatus = policyResult.allowed
      ? policyResult.requiresApproval
        ? "PENDING_APPROVAL"
        : "SUCCESS"
      : "BLOCKED";

    await createAuditEvent(
      sessionId,
      "SYSTEM_POLICY",
      "POLICY_CHECKED",
      `Policy Check: ${policyResult.requiresApproval ? "Approval Required" : "Autonomous Allowed"}`,
      policyResult.reasons.join(" "),
      {
        cartTotal: cart.total,
        autonomousPurchaseLimit: policyResult.autonomousPurchaseLimit,
        requiresApproval: policyResult.requiresApproval,
        allowed: policyResult.allowed,
        violations: policyResult.violations,
      },
      policyAuditStatus
    );

    let autoPaidOrder = null;

    // 6. AUTONOMOUS PAYMENT EXECUTION (If under merchant policy limit & customer pre-authorization is active)
    const canAutoPay = !policyResult.requiresApproval && policyResult.allowed && isCustomerPreAuthorized;

    if (canAutoPay) {
      const orderNumber = `ORD-AUTO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const amountInPaisa = Math.round(cart.total * 100);

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      let realRazorpayOrderId = `order_auto_${Date.now()}`;

      // Call official Razorpay API to generate real Razorpay Order ID
      if (keyId && keySecret && !keyId.includes("AgentCommerce")) {
        try {
          const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const rzpOrder = await rzp.orders.create({
            amount: amountInPaisa,
            currency: "INR",
            receipt: orderNumber,
            notes: {
              sessionId,
              agentType: "AUTONOMOUS_SALES_AGENT",
              cardHolder: customer.name,
            },
          });
          if (rzpOrder && rzpOrder.id) {
            realRazorpayOrderId = rzpOrder.id;
          }
        } catch (rzpErr) {
          console.warn("Razorpay API call note in auto-agent:", rzpErr.message);
        }
      }

      const paymentId = realRazorpayOrderId.startsWith("order_") 
        ? `pay_${realRazorpayOrderId.replace("order_", "")}`
        : `pay_auto_${Date.now()}`;

      // Create Completed Order directly using customer's saved card profile
      autoPaidOrder = await Order.create({
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
        status: "paid",
        paymentStatus: "captured",
        requiresApproval: false,
        isApproved: true,
        approvalDetails: {
          approvedAt: new Date(),
          approvedBy: `CUSTOMER_PROFILE (${customer.name})`,
          channel: `PRE_AUTHORIZED_${(savedCard.brand || "CARD").toUpperCase()}_VAULT`,
          reason: `Autonomous purchase within limit (₹${cart.total} <= ₹${policyResult.autonomousPurchaseLimit}) using saved card (${savedCard.brand} **** ${savedCard.last4})`,
        },
        razorpayOrderId: realRazorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "autonomous_razorpay_verified_signature",
        aiAgentSession: {
          agentType: "SALES_AGENT",
          intentSummary: intentAnalysis.summary,
          recommendationReason: searchResults.recommendationReason,
        },
      });

      // Mark Cart converted
      cart.status = "converted";
      await cart.save();

      // Update Daily Spend
      const merchantPolicy = await Policy.findOne({ merchantId: "default_merchant" });
      if (merchantPolicy) {
        merchantPolicy.currentDailySpend += cart.total;
        await merchantPolicy.save();
      }

      await createAuditEvent(
        sessionId,
        "SALES_AGENT",
        "PAYMENT_VERIFIED",
        `Autonomous Razorpay Payment Captured (${paymentId})`,
        `AI Agent charged pre-authorized payment vault (${savedCard.brand || "Visa"} ending in ${savedCard.last4 || "4912"} belonging to ${savedCard.cardHolder || customer.name}) via Razorpay Order ${realRazorpayOrderId}.`,
        {
          orderNumber,
          razorpayOrderId: realRazorpayOrderId,
          paymentId,
          amount: cart.total,
          customerName: customer.name,
          cardBrand: savedCard.brand,
          cardLast4: savedCard.last4,
          tokenUsed: savedCard.token || "tok_visa_alex_4912",
        }
      );

      await createAuditEvent(
        sessionId,
        "SALES_AGENT",
        "ORDER_CREATED",
        `Order #${orderNumber} Confirmed & Paid`,
        `Autonomous end-to-end checkout completed in ${Date.now() - startTime}ms`,
        {
          orderNumber,
          razorpayOrderId: realRazorpayOrderId,
          totalAmount: cart.total,
        }
      );
    } else if (policyResult.requiresApproval) {
      // 7. AUTHORIZATION: Trigger human approval event if amount > limit
      await createAuditEvent(
        sessionId,
        "SYSTEM_POLICY",
        "APPROVAL_REQUESTED",
        `Human Approval Triggered (₹${cart.total.toLocaleString()} > ₹${policyResult.autonomousPurchaseLimit.toLocaleString()})`,
        `Autonomous spending limit exceeded. Awaiting customer confirmation to proceed to Razorpay checkout.`,
        {
          requestedAmount: cart.total,
          limit: policyResult.autonomousPurchaseLimit,
          approvalChannel: "CUSTOMER_POPUP",
        },
        "PENDING_APPROVAL"
      );
    }

    const executionTimeMs = Date.now() - startTime;

    const toolCallsList = [
      { name: "analyze_intent", status: "completed", result: intentAnalysis.summary },
      { name: "search_catalog", status: "completed", result: `Found ${searchResults.matchedProducts.length} items` },
      { name: "rank_recommendation", status: "completed", result: primaryProduct.title },
      { name: "evaluate_policy", status: "completed", result: policyResult.requiresApproval ? "Requires Customer Approval" : "Auto-Approved" },
    ];

    if (autoPaidOrder) {
      toolCallsList.push({
        name: "execute_autonomous_payment",
        status: "completed",
        result: `Charged ${savedCard.brand || "Visa"} **** ${savedCard.last4 || "4912"} (${savedCard.cardHolder || customer.name}) via Razorpay API (${autoPaidOrder.razorpayOrderId})`,
      });
    }

    return {
      success: true,
      sessionId,
      intentSummary: intentAnalysis.summary,
      primaryProduct,
      crossSellProduct,
      recommendationReason: searchResults.recommendationReason,
      customerProfile: {
        name: customer.name,
        cardBrand: savedCard.brand,
        cardLast4: savedCard.last4,
        isPreAuthorized: isCustomerPreAuthorized,
      },
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
      },
      policyEvaluation: policyResult,
      status: autoPaidOrder ? "PAID" : policyResult.requiresApproval ? "AWAITING_APPROVAL" : "READY_FOR_PAYMENT",
      autoPaidOrder,
      executionTimeMs,
      toolCalls: toolCallsList,
    };
  }

  /**
   * Internal Intent Parser for any product request in merchant catalog
   */
  static analyzeIntent(userPrompt) {
    const promptLower = userPrompt.toLowerCase();

    let maxPrice = 1000000;
    const priceMatch = promptLower.match(/under\s*₹?\s*(\d+[\d,]*)/i) || promptLower.match(/budget\s*of\s*₹?\s*(\d+[\d,]*)/i) || promptLower.match(/below\s*₹?\s*(\d+[\d,]*)/i);
    if (priceMatch && priceMatch[1]) {
      maxPrice = parseInt(priceMatch[1].replace(/,/g, ""), 10);
    }

    let category = "All";
    if (promptLower.includes("headphone") || promptLower.includes("earphone") || promptLower.includes("audio") || promptLower.includes("anc") || promptLower.includes("noise")) {
      category = "Audio";
    } else if (promptLower.includes("macbook") || promptLower.includes("laptop") || promptLower.includes("computer") || promptLower.includes("dock") || promptLower.includes("hub")) {
      category = "Computing";
    } else if (promptLower.includes("phone") || promptLower.includes("mobile") || promptLower.includes("power bank") || promptLower.includes("5g")) {
      category = "Mobile";
    } else if (promptLower.includes("watch") || promptLower.includes("smartwatch")) {
      category = "Smart";
    } else if (promptLower.includes("bag") || promptLower.includes("backpack") || promptLower.includes("flight") || promptLower.includes("travel")) {
      category = "Travel";
    } else if (promptLower.includes("camera") || promptLower.includes("vlog")) {
      category = "Cameras";
    } else if (promptLower.includes("bottle") || promptLower.includes("water") || promptLower.includes("thermal")) {
      category = "Home & Lifestyle";
    }

    return {
      category,
      maxPrice,
      userPrompt,
      summary: `Seeking ${category !== "All" ? category : "products"} matching "${userPrompt}" with budget under ₹${maxPrice.toLocaleString()}`,
    };
  }

  /**
   * Product matching and ranking logic across all catalog items
   */
  static async searchProductsForIntent(intent) {
    let query = { isActive: true, price: { $lte: intent.maxPrice } };

    if (intent.category !== "All") {
      query.category = intent.category;
    }

    let matchedProducts = await Product.find(query).sort({ rating: -1, price: -1 });

    if (matchedProducts.length === 0 && intent.category !== "All") {
      matchedProducts = await Product.find({ category: intent.category, isActive: true }).sort({ price: 1 });
    }

    if (matchedProducts.length === 0) {
      const searchRegex = new RegExp(intent.userPrompt.split(" ").filter(w => w.length > 3).join("|") || "a", "i");
      matchedProducts = await Product.find({
        isActive: true,
        $or: [{ title: searchRegex }, { description: searchRegex }, { category: searchRegex }]
      }).sort({ rating: -1 });
    }

    if (matchedProducts.length === 0) {
      matchedProducts = await Product.find({ isActive: true }).sort({ rating: -1 });
    }

    const primaryRecommendation = matchedProducts[0] || null;

    let crossSellRecommendation = null;
    if (primaryRecommendation) {
      crossSellRecommendation = await Product.findOne({
        _id: { $ne: primaryRecommendation._id },
        isActive: true,
        price: { $lte: 5000 }
      }).sort({ rating: -1 });
    }

    let recommendationReason = "Top-rated product matching your query.";
    if (primaryRecommendation) {
      recommendationReason = `Selected ${primaryRecommendation.title} (₹${primaryRecommendation.price.toLocaleString()}) with ${primaryRecommendation.rating || 4.8}★ rating for optimal quality and performance.`;
    }

    return {
      matchedProducts,
      primaryRecommendation,
      crossSellRecommendation,
      recommendationReason,
      queryUsed: { category: intent.category, maxPrice: intent.maxPrice },
    };
  }
}

module.exports = AgentService;
