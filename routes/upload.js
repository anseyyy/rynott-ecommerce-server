const express = require("express");
const {
  uploadAvatar,
  uploadGenericFile,
  deleteFile,
} = require("../controllers/upload");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// File upload routes
router.post("/avatar", uploadAvatar);
router.post("/file", uploadGenericFile);
router.delete("/file/:filename", deleteFile);

module.exports = router;
