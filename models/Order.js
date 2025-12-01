const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
      },
      price: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"],
      },
      image: {
        type: String,
        required: true,
      },
    },
  ],
  shippingAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
  },
  billingAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["card", "paypal", "bank_transfer", "cash_on_delivery"],
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: [500, "Notes cannot be more than 500 characters"],
  },
  trackingNumber: {
    type: String,
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
OrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total price before saving
OrderSchema.pre("save", function (next) {
  if (
    this.isModified("orderItems") ||
    this.isModified("taxPrice") ||
    this.isModified("shippingPrice")
  ) {
    const itemsTotal = this.orderItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    this.totalPrice = itemsTotal + this.taxPrice + this.shippingPrice;
  }
  next();
});

// Populate user and order items
OrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstName lastName email phone",
  }).populate({
    path: "orderItems.product",
    select: "name price images",
  });
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
