const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, address } = req.body;

    // Validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }

    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(409).json({ success: false, error: "Phone number already in use" });
      }
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address
    });

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.cookie("jwt-joblink", token, cookieOptions);

    // Return response without password
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      success: true,
      user: userResponse 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Server error during registration" });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt-joblink", token, cookieOptions);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      success: true,
      token,
      user: userResponse,
      message: "Logged in successfully" 
    });
    console.log("token", token);
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Server error during login" });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie("jwt-joblink", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Check authentication status
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies["jwt-joblink"];
    
    if (!token) {
      return res.json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      user 
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: "Server error fetching users" });
  }
};

module.exports = {
  createUser,
  login,
  logout,
  getCurrentUser,
  checkAuth,
  getAllUsers
};