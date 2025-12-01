const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

const seedAdminUser = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: "admin@rynott.com" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      await mongoose.connection.close();
      return existingAdmin._id;
    }

    // Create default admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@rynott.com",
      password: "admin123",
      role: "admin",
      emailVerified: true,
    });

    await adminUser.save();
    console.log("Admin user created successfully");
    console.log("Email: admin@rynott.com");
    console.log("Password: admin123");

    await mongoose.connection.close();
    console.log("✅ Admin user seeded successfully!");

    return adminUser._id;
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};

// Only run if called directly
if (require.main === module) {
  seedAdminUser();
}

module.exports = seedAdminUser;
