const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
CartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate totals before saving
CartSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.totalItems = this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    // For totalPrice calculation, we'll handle this in the controller
    // after proper population to avoid async issues in pre-save hook
    // For now, just set a basic calculation if product is already populated
    if (
      this.items.length > 0 &&
      this.items[0].product &&
      this.items[0].product.price
    ) {
      this.totalPrice = this.items.reduce((total, item) => {
        const itemTotal =
          item.product && item.product.price
            ? item.product.price * item.quantity
            : 0;
        return total + itemTotal;
      }, 0);
    } else {
      this.totalPrice = 0;
    }
  }
  next();
});

// Populate product details only when explicitly requested
CartSchema.pre(/^find/, function (next) {
  // Only populate if not already populated and if populate is explicitly requested
  if (!this._populatedItems) {
    this.populate({
      path: "items.product",
      select: "name price images slug stockQuantity",
    });
  }
  next();
});

// Method to add item to cart
CartSchema.methods.addItem = async function (productId, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Item already exists, update quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      addedAt: new Date(),
    });
  }

  return this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = async function (productId) {
  const productIdStr = productId.toString();

  this.items = this.items.filter((item) => {
    // Handle both populated and non-populated product references
    let itemProductId;
    if (item.product && typeof item.product === "object" && item.product._id) {
      // Product is populated (object with _id)
      itemProductId = item.product._id.toString();
    } else {
      // Product is an ObjectId
      itemProductId = item.product.toString();
    }
    return itemProductId !== productIdStr;
  });

  return this.save();
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  if (quantity <= 0) {
    return this.removeItem(productId);
  }

  const itemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    this.items[itemIndex].quantity = quantity;
    return this.save();
  }

  throw new Error("Item not found in cart");
};

// Method to clear cart
CartSchema.methods.clearCart = async function () {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model("Cart", CartSchema);
