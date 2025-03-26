const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// Create a new user
const CreateUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } =
      req.body;

    // Validate inputs
    // if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
    //   return res.status(400).json({ message: "All fields are required" });
    // }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // // Validate phone number format
    // if (!validator.isMobilePhone(phoneNumber, "any")) {
    //   return res.status(400).json({ message: "Invalid phone number format" });
    // }
    const existingPhoneNumber = await User.findOne({
      phoneNumber: req.body.phoneNumber,
    });

    if (existingPhoneNumber) {
      return res.status(400).json({ error: "Phone number already in use" });
    }

    // Check password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Check if passwords match
    // if (password !== confirmPassword) {
    //   return res.status(400).json({ message: "Passwords do not match" });
    // }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    await newUser.save();

    // Respond with success message (exclude password in response)
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in CreateUser:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Login user
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set session data
    req.session.user = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    };

    // Respond with success message
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in Login:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Logout user
const Logout = async (req, res) => {
  try {
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Logout failed", error: err.message });
      }

      // Clear session cookie
      res.clearCookie("connect.sid");

      res.status(200).json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Error in Logout:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users (for testing purposes)
const GetUser = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords from response
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in GetUser:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  CreateUser,
  Login,
  Logout,
  GetUser,
};
