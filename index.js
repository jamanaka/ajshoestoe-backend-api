require("dotenv").config();
const express = require("express");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const cors = require("cors");
const MongoStore = require('connect-mongo');

const app = express();

app.use(cookieParser());
app.use(express.json());
const allowedOrigins = ["http://localhost:3000", "https://ajshoestore.vercel.app"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));

app.set('trust proxy', 1); // Trust the first proxy
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // True in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    sameSite: 'none' // Add SameSite attribute for CSRF protection
  }
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

mongoose.connect(process.env.MONGO_URI, {
  retryWrites: true, // Enable retryable writes
  w: 'majority', // Write concern for majority of replicas
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });
const authRoute = require("./routes/authRoute");

app.get("/", (req, res) => {
  res.send("Hello, AJ Shoe Store Express.js Backend!");
});
app.use("/api/auth", authRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
