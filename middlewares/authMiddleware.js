const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware to authenticate users and restrict access based on roles.
 * @param {Array} roles - List of allowed roles (e.g., ["admin", "user"]).
 */
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.cookies?.jwt_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    try {
      // Verify and decode JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // If roles are defined, check user role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden - Access denied" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  };
};

module.exports = authMiddleware;
