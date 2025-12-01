const mongoose = require("mongoose");
const slugify = require("slugify");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a category name"],
    trim: true,
    maxlength: [50, "Category name cannot be more than 50 characters"],
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  image: {
    url: String,
    alt: String,
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  path: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
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

// Create slug from the name
CategorySchema.pre("save", async function (next) {
  this.slug = slugify(this.name, { lower: true });

  // If this category has a parent, update the path and level
  if (this.parent) {
    const parentCategory = await this.constructor.findById(this.parent);
    if (parentCategory) {
      this.level = parentCategory.level + 1;
      this.path = parentCategory.path
        ? `${parentCategory.path}/${this.slug}`
        : this.slug;
    }
  } else {
    this.path = this.slug;
  }

  next();
});

// Update the updatedAt field before saving
CategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get categories in tree structure
CategorySchema.statics.getTree = async function () {
  const categories = await this.find({ isActive: true })
    .populate("parent", "name slug")
    .sort("sortOrder name");

  // Build tree structure
  const categoryMap = {};
  const tree = [];

  // First pass: create map
  categories.forEach((category) => {
    categoryMap[category._id] = {
      ...category.toObject(),
      children: [],
    };
  });

  // Second pass: build tree
  categories.forEach((category) => {
    if (category.parent) {
      if (categoryMap[category.parent]) {
        categoryMap[category.parent].children.push(categoryMap[category._id]);
      }
    } else {
      tree.push(categoryMap[category._id]);
    }
  });

  return tree;
};

module.exports = mongoose.model("Category", CategorySchema);
