const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price images slug stockQuantity"
    );

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    } else if (cart.items && cart.items.length > 0) {
      // Ensure totals are calculated correctly
      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      cart.totalPrice = cart.items.reduce((total, item) => {
        const price =
          item.product && item.product.price ? item.product.price : 0;
        return total + price * item.quantity;
      }, 0);
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: {
        cart: {
          id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { productId, quantity } = req.body;

    // Check if product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    }

    // Add item to cart using the model method
    await cart.addItem(productId, quantity);

    // Reload cart to get updated data
    cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price images slug stockQuantity"
    );

    // Recalculate total price if items exist
    if (cart && cart.items && cart.items.length > 0) {
      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      cart.totalPrice = cart.items.reduce((total, item) => {
        const price =
          item.product && item.product.price ? item.product.price : 0;
        return total + price * item.quantity;
      }, 0);
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        cart: {
          id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Check product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (quantity > 0 && product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    // Update item quantity using the model method
    await cart.updateItemQuantity(productId, quantity);

    // Reload cart to get updated data
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price images slug stockQuantity"
    );

    // Recalculate totals
    if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalPrice = updatedCart.items.reduce((total, item) => {
        const price =
          item.product && item.product.price ? item.product.price : 0;
        return total + price * item.quantity;
      }, 0);
      await updatedCart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: {
        cart: {
          id: updatedCart._id,
          items: updatedCart.items,
          totalItems: updatedCart.totalItems,
          totalPrice: updatedCart.totalPrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove item from cart using the model method
    await cart.removeItem(productId);

    // Reload cart to get updated data
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price images slug stockQuantity"
    );

    // Recalculate totals
    if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalPrice = updatedCart.items.reduce((total, item) => {
        const price =
          item.product && item.product.price ? item.product.price : 0;
        return total + price * item.quantity;
      }, 0);
      await updatedCart.save();
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: {
        cart: {
          id: updatedCart._id,
          items: updatedCart.items,
          totalItems: updatedCart.totalItems,
          totalPrice: updatedCart.totalPrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Clear cart using the model method
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        cart: {
          id: cart._id,
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users' carts (Admin only)
// @route   GET /api/cart/all
// @access  Private/Admin
const getAllCarts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const carts = await Cart.find()
      .populate("user", "firstName lastName email role")
      .populate("items.product", "name price images slug")
      .limit(limit * 1)
      .skip(startIndex)
      .sort({ createdAt: -1 });

    const total = await Cart.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        carts,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getAllCarts,
};
