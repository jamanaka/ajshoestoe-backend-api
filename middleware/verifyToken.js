const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

const protectRoute = async (req, res, next) => {
    // 1. Get token from cookies
    const token = req.cookies["jwt-joblink"];
    
    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Unauthorized access - No authentication token provided" 
        });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Find user and check if exists
        const user = await User.findById(decoded.userId).select("-password -__v");
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User account not found" 
            });
        }

        // 5. Check if user is active (optional enhancement)
        if (!user.isActive) {
            return res.status(403).json({ 
                success: false,
                message: "Account deactivated" 
            });
        }

        // 6. Attach user to request
        req.user = user;
        next();

    } catch (error) {
        // 7. Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                success: false,
                message: "Session expired - Please login again" 
            });
        }
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ 
                success: false,
                message: "Invalid authentication token" 
            });
        }

        // 8. Handle other errors
        console.error("[AUTH ERROR]", error);
        res.status(500).json({ 
            success: false,
            message: "Authentication server error" 
        });
    }
};

module.exports = protectRoute;
