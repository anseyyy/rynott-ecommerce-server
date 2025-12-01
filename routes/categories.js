const express = require("express");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} = require("../controllers/categories");

const { protect, adminOnly } = require("../middleware/auth");
const Category = require("../models/Category");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/tree", getCategoryTree);
router.get("/:id", getCategory);

// Admin routes
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
