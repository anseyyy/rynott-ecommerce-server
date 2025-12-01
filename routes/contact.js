const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// Import controllers
const {
  submitContactForm,
  subscribeNewsletter,
  getContactSubmissions,
  getContactSubmission,
  updateContactStatus,
  replyToContact,
  deleteContactSubmission,
} = require("../controllers/contact");

// Import middleware
const { protect, adminOnly } = require("../middleware/auth");

// Public routes
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("phone")
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Please provide a valid phone number"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Message must be at least 10 characters long"),
  ],
  submitContactForm
);

// Newsletter subscription route
router.post(
  "/newsletter",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long if provided"),
  ],
  subscribeNewsletter
);

// Admin routes
router.get("/admin/submissions", protect, adminOnly, getContactSubmissions);
router.get("/admin/submissions/:id", protect, adminOnly, getContactSubmission);
router.patch(
  "/admin/submissions/:id/status",
  protect,
  adminOnly,
  updateContactStatus
);
router.post("/admin/submissions/:id/reply", protect, adminOnly, replyToContact);
router.delete(
  "/admin/submissions/:id",
  protect,
  adminOnly,
  deleteContactSubmission
);

module.exports = router;
