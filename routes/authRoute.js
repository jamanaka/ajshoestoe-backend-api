const { CreateUser, Login, Logout, GetUser, checkAuth, } = require("../controllers/authController");
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/verifyToken");

// Routes
router.get("/check-auth", verifyToken, checkAuth);
router.post("/create-user", CreateUser); // Create a new user
router.post("/login", Login); // Login user
router.post("/logout", Logout); // Logout user
router.get("/users", GetUser); // Get all users (for testing)

module.exports = router;