const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Get token from HTTP-only cookie only
  const token = req.cookies.authToken; // Changed to match our authToken cookie name

  if (!token) {
    return res.status(401).json({ 
      authenticated: false,
      error: "Not authenticated" 
    });
  }

  try {
    // Verify token and attach userId to request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Clear invalid token cookie
    res.clearCookie("authToken");
    return res.status(401).json({ 
      authenticated: false,
      error: "Invalid session" 
    });
  }
};

module.exports = { verifyToken };