const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  logout,
  getAllUsers,
  checkAuth,
  getCurrentUser
} = require("../controllers/authController");
const protectRoute = require("../middleware/verifyToken"); // Changed to your actual file

// Public routes
router.post("/register", createUser);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/me", protectRoute, getCurrentUser);
router.get("/check-auth", protectRoute, checkAuth);

// Admin routes
router.get("/users", protectRoute, getAllUsers);

module.exports = router;