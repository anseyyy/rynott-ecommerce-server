const express = require("express");
const { body } = require("express-validator");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getAllCarts,
} = require("../controllers/cart");

const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("quantity")
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100"),
];

const updateCartItemValidation = [
  body("quantity")
    .isInt({ min: 0, max: 100 })
    .withMessage("Quantity must be between 0 and 100"),
];

// Public routes (for logged-in users only)
router.get("/", protect, getCart);
router.post("/", protect, addToCartValidation, addToCart);
router.put("/:productId", protect, updateCartItemValidation, updateCartItem);
router.delete("/:productId", protect, removeFromCart);
router.delete("/", protect, clearCart);

// Admin routes
router.get("/all", protect, adminOnly, getAllCarts);

module.exports = router;
