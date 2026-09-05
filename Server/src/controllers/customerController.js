const Customer = require("../models/Customer");

// Get customer profile by sessionId
exports.getProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;
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

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile",
      error: error.message,
    });
  }
};

// Update customer profile & payment vault settings
exports.updateProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, email, phone, savedPaymentMethod } = req.body;

    let customer = await Customer.findOne({ sessionId });
    if (!customer) {
      customer = new Customer({ sessionId });
    }

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;

    if (savedPaymentMethod) {
      const existing = customer.savedPaymentMethod || {};
      const cardNumberRaw = savedPaymentMethod.cardNumber || "";
      const last4Digits = cardNumberRaw ? cardNumberRaw.replace(/\s+/g, "").slice(-4) : (existing.last4 || "4912");
      const masked = cardNumberRaw ? `**** **** **** ${last4Digits}` : (existing.cardNumberMasked || "**** **** **** 4912");

      customer.savedPaymentMethod = {
        cardHolder: savedPaymentMethod.cardHolder || existing.cardHolder || customer.name,
        cardNumberMasked: masked,
        last4: last4Digits,
        brand: savedPaymentMethod.brand || existing.brand || "Visa",
        expiry: savedPaymentMethod.expiry || existing.expiry || "12/28",
        isPreAuthorizedForAgent: savedPaymentMethod.isPreAuthorizedForAgent !== undefined 
          ? Boolean(savedPaymentMethod.isPreAuthorizedForAgent) 
          : existing.isPreAuthorizedForAgent,
        maxAutonomousLimit: savedPaymentMethod.maxAutonomousLimit !== undefined 
          ? Number(savedPaymentMethod.maxAutonomousLimit) 
          : (existing.maxAutonomousLimit || 10000),
        token: `tok_${(savedPaymentMethod.brand || "card").toLowerCase()}_${last4Digits}`,
      };
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update customer profile",
      error: error.message,
    });
  }
};
