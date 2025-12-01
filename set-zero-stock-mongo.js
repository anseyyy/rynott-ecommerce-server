const { MongoClient, ObjectId } = require("mongodb");

async function setZeroStock() {
  const uri =
    "mongodb+srv://ahamedansil43_db_user:ansil123@cluster0.upg9mza.mongodb.net/ecommerce?appName=Cluster0";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("ecommerce");
    const productsCollection = db.collection("products");

    // Find products with stock > 0
    const productsToUpdate = await productsCollection
      .find({
        stockQuantity: { $gt: 0 },
      })
      .limit(3)
      .toArray();

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

      // Update the product's stock to 0
      await productsCollection.updateOne(
        { _id: product._id },
        { $set: { stockQuantity: 0 } }
      );

      console.log(`  → Stock set to 0`);
    }

    console.log("\n✅ Successfully set stock to 0 for demonstration");

    // Show current zero stock count
    const zeroStockCount = await productsCollection.countDocuments({
      stockQuantity: 0,
    });
    console.log(`📦 Total products with zero stock: ${zeroStockCount}`);

    // Show sample zero stock products
    const zeroStockProducts = await productsCollection
      .find({ stockQuantity: 0 })
      .limit(5)
      .project({ name: 1, stockQuantity: 1, price: 1 })
      .toArray();

    if (zeroStockProducts.length > 0) {
      console.log("\n📋 Sample products with zero stock:");
      zeroStockProducts.forEach((p) => {
        console.log(
          `   • ${p.name} - Stock: ${p.stockQuantity}, Price: $${p.price}`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

setZeroStock();
