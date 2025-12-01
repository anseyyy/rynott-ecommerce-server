const mongoose = require("mongoose");
const Product = require("./models/Product");
require("./models/Category");

async function setZeroStock() {
  try {
    // Connect to MongoDB (using the same connection as the app)
    await mongoose.connect(
      "mongodb+srv://ahamedansil43_db_user:ansil123@cluster0.upg9mza.mongodb.net/ecommerce?appName=Cluster0"
    );
    console.log("Connected to MongoDB");

    // Find some products and set their stock to 0
    const productsToUpdate = await Product.find({
      stockQuantity: { $gt: 0 },
    }).limit(3);

    if (productsToUpdate.length === 0) {
      console.log("No products found to update");
      return;
    }

    console.log(
      `Found ${productsToUpdate.length} products to set to zero stock:`
    );

    for (const product of productsToUpdate) {
      console.log(
        `- ${product.name} (current stock: ${product.stockQuantity})`
      );
      product.stockQuantity = 0;
      await product.save();
      console.log(`  → Stock set to 0`);
    }

    console.log("\n✅ Successfully set stock to 0 for demonstration");

    // Show current zero stock count
    const zeroStockCount = await Product.countDocuments({ stockQuantity: 0 });
    console.log(`📦 Total products with zero stock: ${zeroStockCount}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

setZeroStock();
