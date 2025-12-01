const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
require("dotenv").config();
const Product = require("./models/Product");
const Category = require("./models/Category");
const User = require("./models/User");

const seedDummyProducts = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Read dummy products from JSON file
    const dummyDataPath = path.join(__dirname, "dummy-products.json");
    const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, "utf8"));
    console.log(`Loaded ${dummyData.products.length} dummy products`);

    // Get categories for mapping
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    console.log("Available categories:", Object.keys(categoryMap));

    // Get or create admin user for createdBy field
    let adminUser = await User.findOne({ email: "admin@rynott.com" });
    if (!adminUser) {
      adminUser = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@rynott.com",
        password: "admin123",
        role: "admin",
        emailVerified: true,
      });
      await adminUser.save();
      console.log("Created admin user for product creation");
    }

    // Transform dummy data to match our Product model
    const productsToInsert = dummyData.products.map((product, index) => {
      // Map category slug to ObjectId (handle kitchen-dining vs kitchen-and-dining)
      let categorySlug = product.category;
      if (categorySlug === "kitchen-dining") {
        categorySlug = "kitchen-and-dining";
      }
      const categoryId = categoryMap[categorySlug];
      if (!categoryId) {
        console.warn(
          `Category not found for product ${product.name}: ${product.category} (tried: ${categorySlug})`
        );
      }

      // Generate unique slug
      const baseSlug = slugify(product.name, { lower: true, strict: true });
      const uniqueSlug = `${baseSlug}-${index + 1}`;

      return {
        name: product.name,
        slug: uniqueSlug,
        description: product.description,
        shortDescription:
          product.shortDescription || product.description.substring(0, 100),
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        category: categoryId,
        brand: product.brand,
        status: product.status,
        featured: product.featured,
        images: product.images || [],
        tags: product.tags || [],
        specifications: product.specifications || {},
        variants: product.variants || [],
        rating: {
          average: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3-5
          count: Math.floor(Math.random() * 100) + 1,
        },
        createdBy: adminUser._id,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
      };
    });

    // Insert products into database with ordered: false to skip duplicates
    const insertedProducts = await Product.insertMany(productsToInsert, {
      ordered: false,
    });
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    // Display product summary
    console.log("\n📦 Products Summary:");
    console.log(`Total Products: ${insertedProducts.length}`);
    console.log(
      `Total Value: $${insertedProducts
        .reduce((sum, p) => sum + p.price * p.stockQuantity, 0)
        .toFixed(2)}`
    );
    console.log(
      `Average Price: $${(
        insertedProducts.reduce((sum, p) => sum + p.price, 0) /
        insertedProducts.length
      ).toFixed(2)}`
    );

    // Group by category
    const categoryStats = {};
    insertedProducts.forEach((product) => {
      const categoryName = product.category?.name || "Unknown";
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { count: 0, totalValue: 0 };
      }
      categoryStats[categoryName].count++;
      categoryStats[categoryName].totalValue +=
        product.price * product.stockQuantity;
    });

    console.log("\n📊 Products by Category:");
    Object.entries(categoryStats).forEach(([category, stats]) => {
      console.log(
        `${category}: ${stats.count} products ($${stats.totalValue.toFixed(2)})`
      );
    });

    // Show sample products
    console.log("\n🛍️ Sample Products:");
    insertedProducts.slice(0, 5).forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name} - $${product.price} (${
          product.stockQuantity
        } in stock)`
      );
    });

    await mongoose.connection.close();
    console.log("\n✅ Database seeded successfully!");
    console.log(
      "You can now view these products in the admin panel at /admin/products"
    );
  } catch (error) {
    console.error("Error seeding dummy products:", error);
    process.exit(1);
  }
};

seedDummyProducts();
