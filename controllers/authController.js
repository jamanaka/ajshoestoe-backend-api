const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// Create a new user
const createUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, address } = req.body;

    // Validation
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Password must be at least 8 characters",
        });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, error: "Email already in use" });
    }

    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res
          .status(409)
          .json({ success: false, error: "Phone number already in use" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address,
    });

    res.status(201).json({ message: "Registration Successfull" });

    await newUser.save();
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during registration" });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    req.session.isAuthenticated = true;
    res.json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during login" });
  }
};

//logout 
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, error: "Logout failed" });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
};

module.exports = {
  createUser,
  login,
  logout,
};
