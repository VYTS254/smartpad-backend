const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

/**
 * Middleware to verify JWT access token
 */
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No token provided');
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify JWT token
    const decoded = verifyAccessToken(token);
    
    // Check token type
    if (decoded.type !== 'access') {
      return errorResponse(res, 401, 'Invalid token type', 'Please use an access token');
    }
    
    // Get user from database
    const user = await User.findById(decoded.uid);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Attach user to request
    req.user = user;
    req.uid = decoded.uid;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired', 'Please refresh your token');
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token', error.message);
    }
    return errorResponse(res, 401, 'Authentication failed', error.message);
  }
};

/**
 * Middleware to check if user has required role (for JWT)
 */
const authorizeJWT = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized');
    }
    
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: Insufficient permissions');
    }
    
    next();
  };
};

module.exports = {
  verifyJWT,
  authorizeJWT
};
