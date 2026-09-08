const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateAccessToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { 
      uid: userId,
      role: role,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'smartpad-backend',
      audience: 'smartpad-app'
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  return jwt.sign(
    { 
      uid: userId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
      issuer: 'smartpad-backend',
      audience: 'smartpad-app'
    }
  );
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'smartpad-backend',
      audience: 'smartpad-app'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'smartpad-backend',
      audience: 'smartpad-app'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {object} Object with accessToken and refreshToken
 */
const generateTokenPair = (userId, role) => {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId),
    expiresIn: process.env.JWT_EXPIRE || '7d',
    tokenType: 'Bearer'
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair
};
