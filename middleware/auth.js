const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  const jwtSecret =
    process.env.JWT_SECRET ||
    "rynott_super_secret_jwt_key_change_in_production_2024";

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, jwtSecret);

      console.log("🔍 JWT Decoded:", {
        id: decoded.id,
        iat: decoded.iat,
        exp: decoded.exp,
      });
      console.log("🔍 Looking for user with ID:", decoded.id);

      // Get user from the token
      const user = await User.findById(decoded.id).select("-password");
      console.log(
        "🔍 User found:",
        user ? `ID: ${user._id}, Role: ${user.role}` : "null"
      );

      if (!user) {
        console.error("❌ User not found in database");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("❌ JWT Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  console.log(
    "🔍 Admin check - req.user:",
    req.user ? `${req.user._id} (${req.user.role})` : "null"
  );

  if (req.user && req.user.role === "admin") {
    console.log("✅ Admin access granted");
    next();
  } else {
    console.log(
      "❌ Admin access denied - User:",
      req.user ? `Role: ${req.user.role}` : "No user"
    );
    res.status(403).json({
      success: false,
      message: "Not authorized as admin",
    });
  }
};

module.exports = { protect, adminOnly };
