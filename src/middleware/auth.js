const { auth } = require('../config/firebase');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

/**
 * Middleware to verify Firebase ID token or development token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No token provided');
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Development mode: Allow simple UID-based tokens for testing
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev_uid_')) {
      const uid = token.replace('dev_uid_', '');
      const user = await User.findById(uid);
      
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }
      
      req.user = user;
      req.uid = uid;
      return next();
    }
    
    // Production mode: Verify Firebase ID token
    if (!auth) {
      return errorResponse(res, 500, 'Firebase authentication is not configured');
    }
    
    try {
      // Verify Firebase token
      const decodedToken = await auth.verifyIdToken(token);
      
      // Get user from database
      const user = await User.findById(decodedToken.uid);
      
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }
      
      // Attach user to request
      req.user = user;
      req.uid = decodedToken.uid;
      
      next();
    } catch (tokenError) {
      // If it's a custom token error, provide helpful message
      if (tokenError.code === 'auth/argument-error' && tokenError.message.includes('custom token')) {
        return errorResponse(res, 401, 
          'Custom tokens cannot be used directly. Please use the ID token from Firebase Authentication.',
          'For testing in development, you can use: Bearer dev_uid_<your-user-id>'
        );
      }
      throw tokenError;
    }
    
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired token', error.message);
  }
};

/**
 * Middleware to check if user has required role
 */
const authorize = (...roles) => {
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

/**
 * Middleware to verify ESP32 device token
 */
const verifyDeviceToken = (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    
    if (!deviceToken) {
      return errorResponse(res, 401, 'Device token required');
    }
    
    // Verify device token matches environment variable
    if (deviceToken !== process.env.ESP32_DEVICE_TOKEN) {
      return errorResponse(res, 401, 'Invalid device token');
    }
    
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Device authentication failed', error.message);
  }
};

module.exports = {
  verifyToken,
  authorize,
  verifyDeviceToken
};
