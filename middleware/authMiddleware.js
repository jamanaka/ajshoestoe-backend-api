// middleware/authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
      return next();  // Allow access if authenticated
    } else {
      return res.status(401).json({ error: "Unauthorized access" });
    }
  };
  
  module.exports = isAuthenticated;
  