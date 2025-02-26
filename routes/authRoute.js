const { CreateUser, Login, Logout, GetUser } = require("../controllers/authController");
const express = require("express");
const router = express.Router();

// Routes
router.post("/create-user", CreateUser); // Create a new user
router.post("/login", Login); // Login user
router.post("/logout", Logout); // Logout user
router.get("/users", GetUser); // Get all users (for testing)

module.exports = router;