const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file at a time for avatar
  },
});

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    const uploadSingle = upload.single("avatar");

    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a file",
        });
      }

      // Ensure directory exists
      const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
      const filepath = path.join(uploadsDir, filename);

      // Process and resize image
      await sharp(req.file.buffer)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 90 })
        .toFile(filepath);

      // Return file URL
      const avatarUrl = `/uploads/avatars/${filename}`;

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          url: avatarUrl,
          filename,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload generic file
// @route   POST /api/upload/file
// @access  Private
const uploadGenericFile = async (req, res, next) => {
  try {
    const uploadSingle = upload.single("file");

    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a file",
        });
      }

      // Ensure directory exists
      const uploadsDir = path.join(process.cwd(), "uploads", "general");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `file-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Process image if it's an image file
      if (req.file.mimetype.startsWith("image/")) {
        await sharp(req.file.buffer)
          .resize(1200, 1200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toFile(filepath);
      } else {
        // Save non-image files as is
        fs.writeFileSync(filepath, req.file.buffer);
      }

      // Return file URL
      const fileUrl = `/uploads/general/${filename}`;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/upload/file/:filename
// @access  Private
const deleteFile = async (req, res, next) => {
  try {
    const filename = req.params.filename;

    // Check if file exists in avatars directory
    let filepath = path.join(process.cwd(), "uploads", "avatars", filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return res.status(200).json({
        success: true,
        message: "File deleted successfully from avatars",
      });
    }

    // Check if file exists in general directory
    filepath = path.join(process.cwd(), "uploads", "general", filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return res.status(200).json({
        success: true,
        message: "File deleted successfully from general",
      });
    }

    // File not found
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAvatar,
  uploadGenericFile,
  deleteFile,
};
