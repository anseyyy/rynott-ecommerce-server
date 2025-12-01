const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Validate critical environment variables
const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ ERROR: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  console.error("Please set these variables in your Render dashboard.");
  // Don't exit, but warn - this allows the app to start with fallbacks
}

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const uploadRoutes = require("./routes/upload");
const contactRoutes = require("./routes/contact");
const cartRoutes = require("./routes/cart");

const app = express();

// Trust proxy for Render/production environments
app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS Configuration - Allow frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rynott-ecommerce.vercel.app",
  "https://rynott-ecommerce-server.onrender.com",
];

// Add FRONTEND_URL from env if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`CORS request blocked from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
  keyGenerator: (req, res) => {
    // Use X-Forwarded-For for production, fallback to IP
    return req.headers["x-forwarded-for"] || req.ip;
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(morgan("combined"));

// Static files for uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/cart", cartRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = Number(process.env.PORT) || 5000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 API Health: http://localhost:${port}/api/health`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use.`);
      const nextPort = port + 1;
      console.log(`Trying to start on port ${nextPort}...`);
      // Attempt to start on the next port (only one fallback attempt)
      startServer(nextPort);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}

startServer(PORT);

module.exports = app;
