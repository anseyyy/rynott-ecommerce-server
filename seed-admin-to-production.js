const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

const seedAdminToProduction = async () => {
  try {
    console.log("Connecting to production database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to MongoDB");

    // Check if admin user exists
    console.log(" Checking for existing admin user...");
    let adminUser = await User.findOne({ email: "admin@rynott.com" });

    if (adminUser) {
      console.log(" Admin user exists");
      console.log(" Current admin user details:");
      console.log("  - ID:", adminUser._id);
      console.log("  - Email:", adminUser.email);
      console.log("  - Role:", adminUser.role);
      console.log("  - Active:", adminUser.isActive);

      // Ensure admin user has admin role
      if (adminUser.role !== "admin") {
        console.log("🔧 Updating user role to admin...");
        adminUser.role = "admin";
        await adminUser.save();
        console.log("✅ User role updated to admin");
      }
    } else {
      console.log("🆕 Creating new admin user...");

      // Create admin user
      adminUser = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@rynott.com",
        password: "admin123",
        role: "admin",
        emailVerified: true,
        isActive: true,
      });

      await adminUser.save();
      console.log(" Admin user created successfully");
    }

    console.log(" Final admin user details:");
    console.log("  - ID:", adminUser._id);
    console.log("  - Email:", adminUser.email);
    console.log("  - Role:", adminUser.role);
    console.log("  - Active:", adminUser.isActive);
    console.log("  - Email Verified:", adminUser.emailVerified);

    // Test JWT token generation
    console.log("\n Testing JWT token generation...");
    try {
      const token = adminUser.getSignedJwtToken();
      console.log(" JWT token generated successfully");
      console.log(" Token length:", token.length);
      console.log(" Token (first 50 chars):", token.substring(0, 50) + "...");
    } catch (jwtError) {
      console.error(" JWT token generation failed:", jwtError.message);
    }

    await mongoose.connection.close();
    console.log("\n Production admin user setup complete!");
    console.log(" Use these credentials to login:");
    console.log("   Email: admin@rynott.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("Error seeding admin user to production:", error);
    process.exit(1);
  }
};

// Only run if called directly
if (require.main === module) {
  seedAdminToProduction();
}

module.exports = seedAdminToProduction;
