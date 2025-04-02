require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middleware Setup
app.use(cookieParser());
app.use(express.json());

// Enhanced CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://ajshoestore.vercel.app",
    "https://www.ajshoestore.com"  // Added canonical domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
  maxAge: 86400  // Preflight cache for 24 hours
}));

// Trust first proxy in production
app.set('trust proxy', process.env.NODE_ENV === 'production');

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  retryWrites: true,
  w: 'majority',
  tls: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Rate Limiting (Security)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Enhanced Error Handling
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'SERVER_ERROR'
  });
});

// Routes
const authRoute = require("./routes/authRoute");
app.use("/api/auth", authRoute);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AJ Shoe Store API",
    version: "1.0.0",
    documentation: "https://docs.ajshoestore.com"
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server and DB connections closed');
      process.exit(0);
    });
  });
});