const { generateTokenPair } = require('../utils/jwt');
const { validationResult } = require('express-validator');
const { auth } = require('../config/firebase');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const User = require('../models/User');
const logger = require('../utils/logger');


/**
 * Register new user
 */
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { email, password, fullName, phone, school, department, registrationNumber, gender, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // Create Firebase user
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone.startsWith('+') ? phone : `+254${phone.substring(1)}`
    });

    // Create user in Firestore
    const userData = {
      uid: firebaseUser.uid,
      fullName,
      phone,
      email,
      role: role || 'student',
      school,
      department,
      registrationNumber,
      gender,
      isVerified: false
    };

    const user = await User.create(userData);

    // Generate custom token for client-side authentication
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    logger.info(`New user registered: ${email}`);

    return successResponse(res, 201, 'User registered successfully', {
      user,
      customToken,
      // For development testing with Postman
      devToken: process.env.NODE_ENV === 'development' ? `dev_uid_${firebaseUser.uid}` : undefined,
      message: process.env.NODE_ENV === 'development' 
        ? 'For testing in Postman, use the devToken in Authorization: Bearer <devToken>'
        : 'Use customToken to authenticate with Firebase client SDK'
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, 500, 'Registration failed', error.message);
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Note: Firebase Auth handles password verification on the client side
    // Generate custom token for the user
    const customToken = await auth.createCustomToken(user.uid);

    logger.info(`User logged in: ${email}`);

    return successResponse(res, 200, 'Login successful', {
      user,
      customToken,
      // For development testing with Postman
      devToken: process.env.NODE_ENV === 'development' ? `dev_uid_${user.uid}` : undefined,
      message: process.env.NODE_ENV === 'development'
        ? 'For testing in Postman, use the devToken in Authorization: Bearer <devToken>'
        : 'Use customToken to authenticate with Firebase client SDK'
    });
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 500, 'Login failed', error.message);
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    // Revoke refresh tokens for the user
    await auth.revokeRefreshTokens(req.uid);

    logger.info(`User logged out: ${req.uid}`);

    return successResponse(res, 200, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 500, 'Logout failed', error.message);
  }
};

/**
 * Forgot password - Send password reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return successResponse(res, 200, 'If the email exists, a password reset link has been sent');
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // TODO: Send email with reset link using nodemailer
    // For now, return the link (in production, this should be emailed)

    logger.info(`Password reset requested for: ${email}`);

    return successResponse(res, 200, 'Password reset link sent', {
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return errorResponse(res, 500, 'Failed to process password reset', error.message);
  }
};

/**
 * Verify phone number
 */
exports.verifyPhone = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { phone, verificationCode } = req.body;

    // TODO: Implement actual phone verification logic
    // This is a placeholder - you would integrate with SMS service

    // For now, accept any 6-digit code
    if (verificationCode.length === 6) {
      await User.verify(req.uid);

      logger.info(`Phone verified for user: ${req.uid}`);

      return successResponse(res, 200, 'Phone number verified successfully');
    } else {
      return errorResponse(res, 400, 'Invalid verification code');
    }
  } catch (error) {
    logger.error('Phone verification error:', error);
    return errorResponse(res, 500, 'Phone verification failed', error.message);
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token is required');
    }

    // Verify the refresh token and get user
    const decodedToken = await auth.verifyIdToken(refreshToken, true);
    
    // Generate new custom token
    const newToken = await auth.createCustomToken(decodedToken.uid);

    logger.info(`Token refreshed for user: ${decodedToken.uid}`);

    return successResponse(res, 200, 'Token refreshed successfully', {
      token: newToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return errorResponse(res, 401, 'Invalid refresh token', error.message);
  }
};
