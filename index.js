// 1️⃣ Import Dependencies
require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 2️⃣ Initialize Express App
const app = express();

// 3️⃣ Middleware
app.use(express.json()); // Allows parsing of JSON requests
app.use(cors({
  origin: ["http://localhost:3000", "https://ajshoestore.vercel.app"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));

// 4️⃣ Connect to MongoDB
const MongoDB = process.env.MONGO_URI;
mongoose.connect(MongoDB)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 5️⃣ Import Routes
const authRoute = require("./routes/authRoute");

// 6️⃣ Define Routes
app.get("/", (req, res) => {
  res.send("Hello, AJ Shoe Store Express.js Backend!");
});
app.use("/api/auth", authRoute);

// 7️⃣ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
