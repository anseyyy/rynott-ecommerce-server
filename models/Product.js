const mongoose = require("mongoose");
const slugify = require("slugify");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a product name"],
    trim: true,
    maxlength: [100, "Product name cannot be more than 100 characters"],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [2000, "Description cannot be more than 2000 characters"],
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: [0, "Price cannot be negative"],
  },
  compareAtPrice: {
    type: Number,
    min: [0, "Compare at price cannot be negative"],
  },
  costPrice: {
    type: Number,
    min: [0, "Cost price cannot be negative"],
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  stockQuantity: {
    type: Number,
    required: [true, "Please add stock quantity"],
    min: [0, "Stock quantity cannot be negative"],
    default: 0,
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: "",
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
  ],
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    required: true,
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, "Brand name cannot be more than 50 characters"],
  },
  weight: {
    value: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["kg", "g", "lb", "oz"],
      default: "kg",
    },
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: {
      type: String,
      enum: ["cm", "in", "mm"],
      default: "cm",
    },
  },
  colors: [
    {
      name: String,
      hexCode: String,
    },
  ],
  sizes: [String],
  tags: [String],
  status: {
    type: String,
    enum: ["active", "inactive", "out_of_stock", "discontinued"],
    default: "active",
  },
  featured: {
    type: Boolean,
    default: false,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
        maxlength: 500,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create product slug from the name
ProductSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });

  // Set first image as primary if not set
  if (this.images && this.images.length > 0 && !this.images[0].isPrimary) {
    this.images[0].isPrimary = true;
  }

  next();
});

// Update the updatedAt field before saving
ProductSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Populate category and createdBy fields
ProductSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name slug",
  })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    })
    .populate({
      path: "reviews.user",
      select: "firstName lastName avatar",
    });
  next();
});

// Calculate average rating
ProductSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  this.rating.average =
    Math.round((totalRating / this.reviews.length) * 10) / 10;
  this.rating.count = this.reviews.length;
};

module.exports = mongoose.model("Product", ProductSchema);
