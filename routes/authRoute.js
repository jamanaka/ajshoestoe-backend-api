const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  logout,
  checkAuth,
} = require("../controllers/authController");
const isAuthenticated = require("../middleware/authMiddleware");

// 🔓 Public routes
router.post("/register", createUser);
router.post("/login", login);
router.post("/logout", logout);
router.get('/check-auth', checkAuth);

// 🔒 Protected route example
router.get("/shop", isAuthenticated, (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).send("Not authenticated");
  }

  res.status(200).json({
    message: "Welcome to the shop!",
    userId: req.session.userId,
  });
});


module.exports = router;
