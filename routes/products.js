const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getProductStats,
  uploadProductImages,
  deleteProductImage,
} = require("../controllers/products");

const { protect, adminOnly } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Product = require("../models/Product");

const router = express.Router();

// Public routes
router.get(
  "/",
  advancedResults(Product, {
    path: "category",
    select: "name slug",
  }),
  getProducts
);

router.get("/search", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProduct);

// Admin routes
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.get("/admin/stats", protect, adminOnly, getProductStats);

// Image upload routes
router.post("/:id/images", protect, adminOnly, uploadProductImages);
router.delete("/:id/images/:imageId", protect, adminOnly, deleteProductImage);

module.exports = router;
