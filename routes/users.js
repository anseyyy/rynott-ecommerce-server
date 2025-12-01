const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
} = require("../controllers/users");

const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.use(protect);

// Admin routes
router.get("/", adminOnly, advancedResults(User), getUsers);
router.post("/", adminOnly, createUser);
router.get("/:id", adminOnly, getUser);
router.put("/:id", adminOnly, updateUser);
router.delete("/:id", adminOnly, deleteUser);

module.exports = router;
