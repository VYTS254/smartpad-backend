const { validationResult } = require('express-validator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get all users with pagination
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { limit = 20, role, school } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (school) filters.school = school;

    const result = await User.findAll(parseInt(limit), null, filters);

    return successResponse(res, 200, 'Users retrieved successfully', {
      users: result.users,
      count: result.users.length
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    return errorResponse(res, 500, 'Failed to retrieve users', error.message);
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin or school manager
    if (req.user.uid !== id && !['admin', 'school_manager'].includes(req.user.role)) {
      return errorResponse(res, 403, 'You can only view your own profile');
    }

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user', error.message);
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.uid !== id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You can only update your own profile');
    }

    // Prevent users from updating their own role
    if (req.user.uid === id && updateData.role) {
      delete updateData.role;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.uid;
    delete updateData.createdAt;
    delete updateData.isVerified;

    const user = await User.update(id, updateData);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    logger.info(`User updated: ${id}`);

    return successResponse(res, 200, 'User updated successfully', { user });
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 500, 'Failed to update user', error.message);
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Delete from Firebase Auth
    await require('../config/firebase').auth.deleteUser(id);

    // Delete from Firestore
    await User.delete(id);

    logger.info(`User deleted: ${id}`);

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 500, 'Failed to delete user', error.message);
  }
};

/**
 * Get users by school
 */
exports.getUsersBySchool = async (req, res) => {
  try {
    const { school } = req.params;
    const { limit = 20, role } = req.query;

    const filters = { school };
    if (role) filters.role = role;

    const result = await User.findAll(parseInt(limit), null, filters);

    return successResponse(res, 200, 'Users retrieved successfully', {
      users: result.users,
      school,
      count: result.users.length
    });
  } catch (error) {
    logger.error('Get users by school error:', error);
    return errorResponse(res, 500, 'Failed to retrieve users', error.message);
  }
};
