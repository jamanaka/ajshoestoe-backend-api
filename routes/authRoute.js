const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  logout,
} = require("../controllers/authController");
const isAuthenticated = require("../middleware/isAuthenticated");

// Public routes
router.post("/register", createUser);
router.post("/login", login);
router.post("/logout", logout);

router.get("/shop", isAuthenticated, async (req, res) => {
  try {
    // You can fetch data or perform any other operations here
    res.status(200).json({ message: "Dashboard loaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;