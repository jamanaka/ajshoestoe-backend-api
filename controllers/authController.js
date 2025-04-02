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
const CreateUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, address } = req.body;

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Check for existing phone number
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(409).json({ error: "Phone number already in use" });
      }
    }

    // Create and save new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address
    });

    // Generate token for immediate login after registration
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
    res.cookie("authToken", token, cookieOptions);

    // Return user data without password
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      success: true,
      user: userResponse 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// Login user
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate and set token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.cookie("authToken", token, cookieOptions);

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      success: true,
      user: userResponse 
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

// Logout user
const Logout = (req, res) => {
  res.clearCookie("authToken");
  res.json({ success: true, message: "Logged out successfully" });
};

// Check authentication status
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      user 
    });

  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ authenticated: false });
  }
};

// Get all users (for admin purposes)
const GetUser = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Server error fetching users" });
  }
};

module.exports = {
  CreateUser,
  Login,
  Logout,
  GetUser,
  checkAuth
};