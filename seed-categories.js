const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config();
const Category = require("./models/Category");

const seedCategories = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("Cleared existing categories");

    // Define categories based on dummy products
    const categories = [
      {
        name: "Smartphones",
        description: "Latest smartphones and mobile devices",
        image: {
          url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
          alt: "Smartphones category",
        },
        sortOrder: 1,
      },
      {
        name: "Gaming Laptops",
        description: "High-performance laptops for gaming and content creation",
        image: {
          url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500",
          alt: "Gaming Laptops category",
        },
        sortOrder: 2,
      },
      {
        name: "Business Laptops",
        description: "Professional laptops for business and productivity",
        image: {
          url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
          alt: "Business Laptops category",
        },
        sortOrder: 3,
      },
      {
        name: "Wireless Headphones",
        description: "Premium wireless headphones and audio devices",
        image: {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
          alt: "Wireless Headphones category",
        },
        sortOrder: 4,
      },
      {
        name: "Gaming Headphones",
        description: "Gaming headsets and audio equipment for esports",
        image: {
          url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
          alt: "Gaming Headphones category",
        },
        sortOrder: 5,
      },
      {
        name: "Footwear",
        description: "Shoes and footwear for all occasions",
        image: {
          url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
          alt: "Footwear category",
        },
        sortOrder: 6,
      },
      {
        name: "Books",
        description: "Books, novels, and educational materials",
        image: {
          url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
          alt: "Books category",
        },
        sortOrder: 7,
      },
      {
        name: "Furniture",
        description: "Office furniture, chairs, and home decor",
        image: {
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
          alt: "Furniture category",
        },
        sortOrder: 8,
      },
      {
        name: "Kitchen & Dining",
        description: "Kitchen appliances, cookware, and dining essentials",
        image: {
          url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500",
          alt: "Kitchen & Dining category",
        },
        sortOrder: 9,
      },
    ];

    // Transform categories to match model and create slugs
    const categoriesToInsert = categories.map((category) => ({
      ...category,
      slug: slugify(category.name, { lower: true }),
    }));

    // Insert categories into database
    const insertedCategories = await Category.insertMany(categoriesToInsert);
    console.log(
      `Successfully inserted ${insertedCategories.length} categories`
    );

    // Display categories summary
    console.log("\n📂 Categories Summary:");
    console.log(`Total Categories: ${insertedCategories.length}`);

    console.log("\n🗂️ All Categories:");
    insertedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.slug})`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Categories seeded successfully!");
    console.log(
      "You can now run 'npm run seed' to add products to these categories"
    );
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
