const PolicyService = require("../services/policyService");
const Policy = require("../models/Policy");

exports.getPolicy = async (req, res) => {
  try {
    const policy = await PolicyService.getPolicy("default_merchant");
    return res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch policy",
      error: error.message,
    });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const {
      autonomousPurchaseLimit,
      dailySpendingLimit,
      maxDiscountPercent,
      maxPaymentRetries,
      storeName,
    } = req.body;

    const policy = await Policy.findOneAndUpdate(
      { merchantId: "default_merchant" },
      {
        ...(autonomousPurchaseLimit !== undefined && { autonomousPurchaseLimit: Number(autonomousPurchaseLimit) }),
        ...(dailySpendingLimit !== undefined && { dailySpendingLimit: Number(dailySpendingLimit) }),
        ...(maxDiscountPercent !== undefined && { maxDiscountPercent: Number(maxDiscountPercent) }),
        ...(maxPaymentRetries !== undefined && { maxPaymentRetries: Number(maxPaymentRetries) }),
        ...(storeName && { storeName }),
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Merchant policy updated successfully",
      policy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update policy",
      error: error.message,
    });
  }
};
