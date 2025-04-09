/**
 * @file auth.js
 * Authentication middleware for protecting routes
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'uncle-jerry-secret-key';

/**
 * Middleware to authenticate and authorize users
 * @param {string[]} roles - Allowed roles (optional)
 * @returns {Function} Express middleware function
 */
exports.auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required. Please login.' 
        });
      }

      // Extract token
      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or session expired' 
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is not active. Please contact support.' 
        });
      }

      // If roles are specified, check if user has required role
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      // Add user info to request object
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      }
      
      console.error('Authentication error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication failed',
        error: error.message
      });
    }
  };
};

/**
 * Middleware for contractor role
 */
exports.contractor = exports.auth(['contractor', 'admin']);

/**
 * Middleware for admin role
 */
exports.admin = exports.auth(['admin']);