const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');

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
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Helper function to process and resize images
const processImages = async (files, req) => {
  const processedImages = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Generate unique filename
    const filename = `product-${Date.now()}-${i + 1}.webp`;
    const filepath = path.join('uploads', 'products', filename);

    // Ensure directory exists
    const fs = require('fs');
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Process image with sharp
    await sharp(file.buffer)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    processedImages.push({
      url: `/uploads/products/${filename}`,
      alt: req.body.altText || file.originalname,
      isPrimary: i === 0
    });
  }

  return processedImages;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    res.status(200).json(res.advancedResults);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add user to req.body
    req.body.createdBy = req.user.id;

    const product = await Product.create(req.body);

    // Populate category information
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Populate category information
    await product.populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
const uploadProductImages = async (req, res, next) => {
  try {
    const uploadSingle = upload.array('images', 10);
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one image'
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Process and upload images
      const processedImages = await processImages(req.files, req);

      // Add new images to existing ones
      product.images.push(...processedImages);

      // Save product
      await product.save();

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: product.images
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
const deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find image index
    const imageIndex = product.images.findIndex(
      image => image._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check if it's the primary image
    const isPrimary = product.images[imageIndex].isPrimary;

    // Remove image from array
    product.images.splice(imageIndex, 1);

    // If primary image was deleted, make the first remaining image primary
    if (isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    // TODO: Delete physical file from server

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        images: product.images
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, brand, sort } = req.query;
    
    let query = {};

    // Text search
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Status filter
    query.status = 'active';

    // Sort
    let sortBy = {};
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sortBy[field.substring(1)] = -1;
        } else {
          sortBy[field] = 1;
        }
      });
    } else {
      sortBy = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortBy)
      .limit(50);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res, next) => {
  try {
    const products = await Product.find({ 
      category: req.params.categoryId,
      status: 'active'
    }).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ 
      featured: true,
      status: 'active'
    })
    .populate('category', 'name slug')
    .limit(8)
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product statistics
// @route   GET /api/products/admin/stats
// @access  Private/Admin
const getProductStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      }
    ]);

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ 
      stockQuantity: { $lt: 10 } 
    });

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalProducts,
        lowStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getProductStats
};