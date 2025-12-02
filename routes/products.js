const express = require("express");
const { body } = require("express-validator");
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

// Validation middleware
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('sku').optional().isAlphanumeric('en-US', { ignore: '-_' }).withMessage('SKU must contain only letters, numbers, hyphens, and underscores'),
  body('status').optional().isIn(['active', 'inactive', 'out_of_stock', 'discontinued']).withMessage('Invalid status'),
];

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
router.post("/", protect, adminOnly, productValidation, createProduct);
router.put("/:id", protect, adminOnly, productValidation, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.get("/admin/stats", protect, adminOnly, getProductStats);

// Image upload routes
router.post("/:id/images", protect, adminOnly, uploadProductImages);
router.delete("/:id/images/:imageId", protect, adminOnly, deleteProductImage);

module.exports = router;
