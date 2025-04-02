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

// In your backend routes
router.get('/check', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

module.exports = router;