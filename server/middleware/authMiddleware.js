const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. Protect Middleware
exports.protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch fresh user data from DB
        req.user = await User.findById(decoded.id).select("-password");
        
        if (!req.user) {
            return res.status(404).json({ message: "User not found" });
        }

        next();
    } catch (error) {
        console.error("Auth Error:", error.message);
        return res.status(401).json({ message: "Token failed, please login again" });
    }
};

// 2. Authorize Middleware: FIXED for Case-Sensitivity
exports.authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Forbidden: No role found" });
        }

        // Normalize both the user's role and the allowed roles to lowercase
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(role => role.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            console.log(`Access Denied: Role [${req.user.role}] is not in authorized list [${roles}]`);
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }
        
        next();
    };
};
