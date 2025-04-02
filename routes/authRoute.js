const express = require("express");
const router = express.Router();
const { 
  CreateUser, 
  Login, 
  Logout, 
  GetUser, 
  checkAuth 
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/verifyToken");
const User = require("../models/userModel");

// Public routes (no authentication needed)
router.post("/create-user", CreateUser);
router.post("/login", Login);
router.post("/logout", Logout);

// Protected routes (require valid auth token)
router.get("/check-auth", verifyToken, checkAuth);
router.get("/users", verifyToken, GetUser); // Now protected
router.get("/check", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ 
        authenticated: false,
        error: "User not found" 
      });
    }
    res.json({ 
      authenticated: true,
      user 
    });
  } catch (error) {
    console.error("User fetch error:", error);
    res.status(500).json({ 
      authenticated: false,
      error: "Server error" 
    });
  }
});

module.exports = router;