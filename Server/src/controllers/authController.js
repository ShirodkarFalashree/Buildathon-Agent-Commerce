const User = require("../models/User");

// Authenticate Merchant or Buyer
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-provision demo/new user if not in DB yet
    if (!user) {
      const isBuyer = cleanEmail.includes("buyer") || cleanEmail.includes("alex") || role === "BUYER";
      const targetRole = role || (isBuyer ? "BUYER" : "MERCHANT");

      user = await User.create({
        name: isBuyer ? "Alex Vance" : "Merchant Administrator",
        email: cleanEmail,
        password: password,
        role: targetRole,
        storeName: targetRole === "MERCHANT" ? "AgentRelay Flagship Store" : undefined,
      });
    } else if (user.password !== password) {
      // Update password for demo convenience if demo account
      if (cleanEmail.includes("buyer") || cleanEmail.includes("merchant") || cleanEmail.includes("alex")) {
        user.password = password;
        await user.save();
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    if (role && user.role !== role) {
      user.role = role;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        token: `token_${user._id}_${Date.now()}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Fetch current user details
exports.getMe = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};
