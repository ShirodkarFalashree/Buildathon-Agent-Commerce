const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Customer = require("../models/Customer");
const AuditEvent = require("../models/AuditEvent");
const PolicyService = require("./policyService");
const PaymentService = require("./paymentService");

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
    console.error("Failed to write audit event in AgentService:", err.message);
  }
}

class AgentService {
  /**
   * Main entry point executing the 8-Step Inter-Agent Protocol:
   * 1. Buyer -> Buyer Agent ("Find headphones for my flight under ₹20k")
   * 2. Buyer Agent -> Merchant Agent ("Find products matching these requirements")
   * 3. Merchant Agent: Searches catalog, checks inventory, applies merchant selling policies, creates proposal
   * 4. Merchant Agent -> Buyer Agent: Returns Product + price + availability + recommendation pitch
   * 5. Buyer Agent: Evaluates proposal against BUYER'S private policy
   * 6. If authorized (Total <= ₹10k): Delegates execution to Payment Service
   * 7. If not authorized (Total > ₹10k): Requests Buyer Human Approval
   * 8. Payment Service: Handles Razorpay, verifies payment, confirms MongoDB Order, audits everything
   */
  static async processShoppingRequest(sessionId, userPrompt, options = {}) {
    const startTime = Date.now();
    const a2aProtocolSteps = [];

    // Fetch customer profile & payment vault details
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
    const buyerAutoLimit = savedCard.maxAutonomousLimit || 10000;

    // STEP 1: Buyer -> Buyer Agent
    const intentAnalysis = this.analyzeIntent(userPrompt);
    a2aProtocolSteps.push({
      stepNumber: 1,
      sender: "BUYER_HUMAN",
      receiver: "BUYER_AGENT",
      title: "1. Buyer → Buyer Agent Prompt Dispatch",
      message: `"${userPrompt}"`,
      detail: `Parsed intent: ${intentAnalysis.summary}`,
    });

    await createAuditEvent(
      sessionId,
      "BUYER_AGENT",
      "INTENT_RECEIVED",
      "Step 1: Buyer Prompt Received",
      `Buyer Agent received prompt: "${userPrompt}"`,
      { intentAnalysis, buyerAutoLimit }
    );

    // STEP 2: Buyer Agent -> Merchant Agent
    a2aProtocolSteps.push({
      stepNumber: 2,
      sender: "BUYER_AGENT",
      receiver: "MERCHANT_AGENT",
      title: "2. Buyer Agent → Merchant Agent Inter-Agent Query",
      message: `"Merchant Agent, find catalog products matching intent: ${intentAnalysis.summary}."`,
      detail: `Requesting recommendations under budget ₹${intentAnalysis.maxPrice.toLocaleString()}`,
    });

    await createAuditEvent(
      sessionId,
      "BUYER_AGENT",
      "INTER_AGENT_QUERY",
      "Step 2: Buyer Agent Querying Merchant Agent",
      `Transmitted requirements to Merchant Agent for catalog lookup.`,
      { category: intentAnalysis.category, maxPrice: intentAnalysis.maxPrice }
    );

    // STEP 3: Merchant Agent: Search catalog, check inventory & apply merchant selling policies
    const searchResults = await this.searchProductsForIntent(intentAnalysis);
    const primaryProduct = searchResults.primaryRecommendation;
    const crossSellProduct = searchResults.crossSellRecommendation;

    if (!primaryProduct) {
      return {
        success: false,
        message: "No suitable products found matching your request.",
        intentSummary: intentAnalysis.summary,
        a2aProtocolSteps,
      };
    }

    // Apply Merchant Selling Policies (Stock check & Discount validation)
    const isStockAvailable = primaryProduct.stock > 0;
    const merchantSellPolicyPassed = isStockAvailable && primaryProduct.isActive;

    a2aProtocolSteps.push({
      stepNumber: 3,
      sender: "MERCHANT_AGENT",
      receiver: "INTERNAL_MERCHANT_POLICY",
      title: "3. Merchant Agent Internal Evaluation & Policy Check",
      message: `Searching catalog & validating merchant selling policies for ${primaryProduct.title}.`,
      detail: `Stock check: ${primaryProduct.stock} units available. Merchant Sell Policy: ${merchantSellPolicyPassed ? "PASSED (Approved to Sell)" : "FAILED"}`,
    });

    await createAuditEvent(
      sessionId,
      "MERCHANT_AGENT",
      "MERCHANT_POLICY_EVALUATED",
      "Step 3: Merchant Agent Catalog & Sell Policy Validation",
      `Found ${primaryProduct.title} (Stock: ${primaryProduct.stock}). Merchant Sell Policy: ${merchantSellPolicyPassed ? "APPROVED" : "REJECTED"}`,
      { productId: primaryProduct._id, title: primaryProduct.title, stock: primaryProduct.stock, merchantSellPolicyPassed }
    );

    // STEP 4: Merchant Agent -> Buyer Agent: Proposal
    const proposalSubtotal = primaryProduct.price + (crossSellProduct ? crossSellProduct.price : 0);
    const proposalPitch = searchResults.recommendationReason;

    a2aProtocolSteps.push({
      stepNumber: 4,
      sender: "MERCHANT_AGENT",
      receiver: "BUYER_AGENT",
      title: "4. Merchant Agent → Buyer Agent Proposal Dispatch",
      message: `"Proposal: ${primaryProduct.title} (₹${primaryProduct.price.toLocaleString()}) ${crossSellProduct ? `+ ${crossSellProduct.title} (₹${crossSellProduct.price})` : ""}. Total: ₹${proposalSubtotal.toLocaleString()}. Availability: In Stock."`,
      detail: `Pitch: "${proposalPitch}"`,
    });

    await createAuditEvent(
      sessionId,
      "MERCHANT_AGENT",
      "PROPOSAL_DISPATCHED",
      "Step 4: Merchant Proposal Transmitted to Buyer Agent",
      `Proposed ${primaryProduct.title} at ₹${proposalSubtotal.toLocaleString()}`,
      { primaryProduct: primaryProduct.title, price: primaryProduct.price, crossSell: crossSellProduct?.title, subtotal: proposalSubtotal }
    );

    // STEP 5: Buyer Agent: Evaluate proposal against BUYER'S private policy
    let cart = await Cart.findOne({ sessionId, status: "active" });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

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

    // Policy Engine Evaluation (Backend Policy Service)
    const policyResult = await PolicyService.evaluatePurchase(cart.total);

    a2aProtocolSteps.push({
      stepNumber: 5,
      sender: "BUYER_AGENT",
      receiver: "POLICY_ENGINE",
      title: "5. Buyer Agent → Policy Engine Private Policy Evaluation",
      message: `Evaluating proposal ₹${cart.total.toLocaleString()} against Buyer Private Policy (Auto Limit: ₹${buyerAutoLimit.toLocaleString()}).`,
      detail: policyResult.requiresApproval
        ? `PAUSED: Total ₹${cart.total.toLocaleString()} exceeds ₹${buyerAutoLimit.toLocaleString()} auto limit.`
        : `AUTHORIZED: Total ₹${cart.total.toLocaleString()} is within ₹${buyerAutoLimit.toLocaleString()} auto limit.`,
    });

    await createAuditEvent(
      sessionId,
      "POLICY_ENGINE",
      "BUYER_POLICY_EVALUATED",
      "Step 5: Buyer Private Policy Evaluated",
      policyResult.reasons.join(" "),
      { cartTotal: cart.total, buyerAutoLimit, requiresApproval: policyResult.requiresApproval }
    );

    let autoPaidOrder = null;

    // STEP 6: If authorized (Total <= buyerAutoLimit & Pre-Authorized)
    const isAuthorizedForAutonomousPay = !policyResult.requiresApproval && policyResult.allowed && isCustomerPreAuthorized;

    if (isAuthorizedForAutonomousPay) {
      a2aProtocolSteps.push({
        stepNumber: 6,
        sender: "BUYER_AGENT",
        receiver: "PAYMENT_SERVICE",
        title: "6. Buyer Agent → Payment Service Execution Authorization",
        message: `"Autonomous Limit Check Passed (₹${cart.total.toLocaleString()} <= ₹${buyerAutoLimit.toLocaleString()}). Delegating financial execution to Payment Service."`,
        detail: `Pre-authorized card vault: ${savedCard.brand || "Visa"} **** ${savedCard.last4 || "4912"}`,
      });

      // Delegate Razorpay financial execution strictly to PaymentService
      autoPaidOrder = await PaymentService.executeAutonomousVaultPayment(
        customer,
        cart,
        policyResult,
        intentAnalysis.summary,
        searchResults.recommendationReason
      );

      a2aProtocolSteps.push({
        stepNumber: 8,
        sender: "PAYMENT_SERVICE",
        receiver: "RAZORPAY_GATEWAY",
        title: "8. Payment Service → Razorpay Verification & Order Creation",
        message: `Razorpay Order ${autoPaidOrder.razorpayOrderId} created & captured. Order #${autoPaidOrder.orderNumber} confirmed in MongoDB.`,
        detail: `Razorpay Payment ID: ${autoPaidOrder.razorpayPaymentId}. Signature verified server-side.`,
      });
    } else if (policyResult.requiresApproval) {
      // STEP 7: If not authorized (Total > buyerAutoLimit) -> Human Approval Request
      a2aProtocolSteps.push({
        stepNumber: 7,
        sender: "BUYER_AGENT",
        receiver: "BUYER_HUMAN",
        title: "7. Buyer Agent → Buyer Human Approval Trigger",
        message: `"Proposal ₹${cart.total.toLocaleString()} exceeds your ₹${buyerAutoLimit.toLocaleString()} auto-spend limit. Requesting human authorization."`,
        detail: `Awaiting buyer authorization to invoke Payment Service and Razorpay checkout.`,
      });

      await createAuditEvent(
        sessionId,
        "POLICY_ENGINE",
        "APPROVAL_REQUESTED",
        "Step 7: Paused for Buyer Human Authorization",
        `Proposal amount ₹${cart.total.toLocaleString()} exceeds autonomous threshold ₹${buyerAutoLimit.toLocaleString()}`,
        { requestedAmount: cart.total, limit: buyerAutoLimit }
      );
    }

    const executionTimeMs = Date.now() - startTime;

    const toolCallsList = [
      { name: "1_analyze_intent", status: "completed", result: intentAnalysis.summary },
      { name: "2_query_merchant_agent", status: "completed", result: `Requested recommendations under ₹${intentAnalysis.maxPrice}` },
      { name: "3_evaluate_merchant_policy", status: "completed", result: merchantSellPolicyPassed ? "Merchant Approved to Sell" : "Stock Unavailable" },
      { name: "4_receive_merchant_proposal", status: "completed", result: `${primaryProduct.title} (₹${proposalSubtotal})` },
      { name: "5_evaluate_buyer_policy", status: "completed", result: policyResult.requiresApproval ? "Requires Human Buyer Approval" : "Authorized Autonomous" },
    ];

    if (autoPaidOrder) {
      toolCallsList.push({
        name: "8_payment_service_razorpay",
        status: "completed",
        result: `Razorpay Payment Captured (${autoPaidOrder.razorpayPaymentId})`,
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
        maxAutonomousLimit: buyerAutoLimit,
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
      a2aProtocolSteps,
    };
  }

  /**
   * Internal Intent Parser for any product request in merchant catalog
   */
  static analyzeIntent(userPrompt) {
    const promptLower = userPrompt.toLowerCase();

    let maxPrice = 1000000;
    const priceMatch = promptLower.match(/under\s*₹?\s*(\d+[\d,]*)/i) || promptLower.match(/budget\s*of\s*₹?\s*(\d+[\d,]*)/i) || promptLower.match(/below\s*₹?\s*(\d+[\d,]*)/i) || promptLower.match(/under\s*₹?\s*(\d+k)/i);
    
    if (priceMatch && priceMatch[1]) {
      const raw = priceMatch[1].toLowerCase();
      if (raw.endsWith("k")) {
        maxPrice = parseInt(raw.replace("k", ""), 10) * 1000;
      } else {
        maxPrice = parseInt(raw.replace(/,/g, ""), 10);
      }
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
   * Product matching and relevance ranking logic across all catalog items
   */
  static async searchProductsForIntent(intent) {
    const promptLower = intent.userPrompt.toLowerCase();
    const promptWords = promptLower
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ""))
      .filter((w) => w.length > 2 && !["for", "with", "the", "and", "under", "budget", "price", "need"].includes(w));

    // Fetch active products within price limit (or all active products if none under limit)
    let candidates = await Product.find({ isActive: true, price: { $lte: intent.maxPrice } });

    if (candidates.length === 0) {
      candidates = await Product.find({ isActive: true }).sort({ price: 1 });
    }

    // Score candidates based on keyword matches in title, tags, description, and category
    const scoredCandidates = candidates.map((product) => {
      let score = 0;
      const titleLower = product.title.toLowerCase();
      const descLower = product.description.toLowerCase();
      const tagsLower = (product.tags || []).map((t) => t.toLowerCase()).join(" ");

      promptWords.forEach((word) => {
        if (titleLower.includes(word)) score += 15;
        if (tagsLower.includes(word)) score += 10;
        if (descLower.includes(word)) score += 4;
      });

      // Bonus for exact category match
      if (intent.category !== "All" && product.category === intent.category) {
        score += 5;
      }

      return { product, score };
    });

    // Sort by relevance score descending, then rating descending
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.product.rating || 0) - (a.product.rating || 0);
    });

    const primaryRecommendation = scoredCandidates[0]?.product || candidates[0] || null;

    // Smart Cross-sell lookup based on primary recommendation
    let crossSellRecommendation = null;
    if (primaryRecommendation) {
      const isBackpack = primaryRecommendation.category === "Travel" || primaryRecommendation.title.toLowerCase().includes("backpack");
      const isHeadphone = primaryRecommendation.category === "Headphones" || primaryRecommendation.tags?.includes("headphones");

      let crossSellQuery = {
        _id: { $ne: primaryRecommendation._id },
        isActive: true,
        price: { $lte: 5000 },
      };

      if (isBackpack) {
        // Recommend Power Bank or Travel Organizer for Travel Backpacks
        crossSellQuery.$or = [{ category: "Mobile" }, { sku: "ANKER-PB-10K" }, { tags: { $in: ["power bank", "usb charger"] } }];
      } else if (isHeadphone) {
        // Recommend Flight Adapter or Headphone Travel Case for Headphones
        crossSellQuery.$or = [{ sku: "ACC-FLIGHT-ADAPT" }, { sku: "ACC-TRAVEL-CASE" }, { category: "Accessories" }];
      }

      crossSellRecommendation = await Product.findOne(crossSellQuery).sort({ rating: -1 });
    }

    let recommendationReason = "Top-rated product matching your query.";
    if (primaryRecommendation) {
      recommendationReason = `Selected ${primaryRecommendation.title} (₹${primaryRecommendation.price.toLocaleString()}) because it perfectly matches your request for "${intent.userPrompt}" with high customer satisfaction (${primaryRecommendation.rating || 4.8}★).`;
    }

    return {
      matchedProducts: scoredCandidates.map((c) => c.product),
      primaryRecommendation,
      crossSellRecommendation,
      recommendationReason,
      queryUsed: { category: intent.category, maxPrice: intent.maxPrice },
    };
  }
}

module.exports = AgentService;
