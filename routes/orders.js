const express = require("express");
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orders");

const { protect, adminOnly } = require("../middleware/auth");
const Order = require("../models/Order");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.use(protect);

// Public routes (users can only see their own orders)
router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);

// Admin routes
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
