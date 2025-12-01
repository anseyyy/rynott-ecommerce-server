const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email address",
    ],
  },
  phone: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    required: [true, "Please add a subject"],
    trim: true,
    maxlength: [200, "Subject cannot be more than 200 characters"],
  },
  message: {
    type: String,
    required: [true, "Please add a message"],
    maxlength: [5000, "Message cannot be more than 5000 characters"],
  },
  status: {
    type: String,
    enum: ["new", "read", "replied", "closed"],
    default: "new",
  },
  reply: {
    message: String,
    sentAt: Date,
    sentBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
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
ContactSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Contact", ContactSchema);
