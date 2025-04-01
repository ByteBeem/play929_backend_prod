const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware to authenticate users for HTTP and WebSocket requests.
 * @param {Array} roles - Allowed user roles (e.g., ["admin", "user"]).
 */
const authMiddleware = (roles = []) => {
  return (reqOrWs, resOrNext, next) => {
    let token;

    // 🛑 Check if this is an HTTP request (Express)
    if (resOrNext && typeof next === "function") {
      token = reqOrWs.cookies?.jwt_token;

      if (!token) {
        return resOrNext.status(401).json({ error: "Unauthorized - No token provided" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        reqOrWs.user = decoded;

        if (roles.length && !roles.includes(decoded.role)) {
          return resOrNext.status(403).json({ error: "Forbidden - Access denied" });
        }

        return next();
      } catch (err) {
        return resOrNext.status(403).json({ error: "Invalid or expired token" });
      }
    }

    // 🛑 Otherwise, it's a WebSocket request
    else {
      const req = resOrNext; // In WebSocket, the second argument is `req`
      token = extractTokenFromCookies(req.headers.cookie);

      if (!token) {
        reqOrWs.send(JSON.stringify({ type: "error", message: "Unauthorized - No token provided" }));
        reqOrWs.close();
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        reqOrWs.user = decoded;

        if (roles.length && !roles.includes(decoded.role)) {
          reqOrWs.send(JSON.stringify({ type: "error", message: "Forbidden - Access denied" }));
          reqOrWs.close();
        }
      } catch (err) {
        reqOrWs.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
        reqOrWs.close();
      }
    }
  };
};

/**
 * Extract JWT token from cookies.
 * @param {string} cookieHeader - The `cookie` string from request headers.
 * @returns {string|null} - Extracted token or null.
 */
const extractTokenFromCookies = (cookieHeader) => {
  if (!cookieHeader) return null;
  return cookieHeader
    .split("; ")
    .find((c) => c.startsWith("jwt_token="))
    ?.split("=")[1] || null;
};

module.exports = authMiddleware;
