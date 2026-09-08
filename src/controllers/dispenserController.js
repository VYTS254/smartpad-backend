const { validationResult } = require('express-validator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const Dispenser = require('../models/Dispenser');
const Inventory = require('../models/Inventory');
const logger = require('../utils/logger');

/**
 * Get all dispensers
 */
exports.getAllDispensers = async (req, res) => {
  try {
    const { school, status } = req.query;
    
    const filters = {};
    if (school) filters.school = school;
    if (status) filters.status = status;

    const dispensers = await Dispenser.findAll(filters);

    return successResponse(res, 200, 'Dispensers retrieved successfully', {
      dispensers,
      count: dispensers.length
    });
  } catch (error) {
    logger.error('Get all dispensers error:', error);
    return errorResponse(res, 500, 'Failed to retrieve dispensers', error.message);
  }
};

/**
 * Get dispenser by ID
 */
exports.getDispenserById = async (req, res) => {
  try {
    const { id } = req.params;

    const dispenser = await Dispenser.findById(id);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Get inventory for this dispenser
    const inventory = await Inventory.findByDispenserId(id);

    return successResponse(res, 200, 'Dispenser retrieved successfully', {
      dispenser,
      inventory
    });
  } catch (error) {
    logger.error('Get dispenser by ID error:', error);
    return errorResponse(res, 500, 'Failed to retrieve dispenser', error.message);
  }
};

/**
 * Create new dispenser
 */
exports.createDispenser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const dispenserData = req.body;

    // Check if ESP32 ID already exists
    const existingDispenser = await Dispenser.findByEsp32Id(dispenserData.esp32Id);
    if (existingDispenser) {
      return errorResponse(res, 400, 'Dispenser with this ESP32 ID already exists');
    }

    // Create dispenser
    const dispenser = await Dispenser.create(dispenserData);

    // Create initial inventory for this dispenser
    await Inventory.create({
      dispenserId: dispenser.dispenserId,
      totalPads: dispenserData.initialPads || 0,
      remainingPads: dispenserData.initialPads || 0
    });

    logger.info(`New dispenser created: ${dispenser.dispenserId}`);

    return successResponse(res, 201, 'Dispenser created successfully', { dispenser });
  } catch (error) {
    logger.error('Create dispenser error:', error);
    return errorResponse(res, 500, 'Failed to create dispenser', error.message);
  }
};

/**
 * Update dispenser
 */
exports.updateDispenser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.dispenserId;
    delete updateData.createdAt;
    delete updateData.esp32Id; // ESP32 ID shouldn't be changed after creation

    const dispenser = await Dispenser.update(id, updateData);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    logger.info(`Dispenser updated: ${id}`);

    return successResponse(res, 200, 'Dispenser updated successfully', { dispenser });
  } catch (error) {
    logger.error('Update dispenser error:', error);
    return errorResponse(res, 500, 'Failed to update dispenser', error.message);
  }
};

/**
 * Delete dispenser
 */
exports.deleteDispenser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if dispenser exists
    const dispenser = await Dispenser.findById(id);
    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Delete associated inventory
    const inventory = await Inventory.findByDispenserId(id);
    if (inventory) {
      await require('../config/db').getCollection(require('../config/db').collections.INVENTORY)
        .doc(inventory.inventoryId).delete();
    }

    // Delete dispenser
    await Dispenser.delete(id);

    logger.info(`Dispenser deleted: ${id}`);

    return successResponse(res, 200, 'Dispenser deleted successfully');
  } catch (error) {
    logger.error('Delete dispenser error:', error);
    return errorResponse(res, 500, 'Failed to delete dispenser', error.message);
  }
};

/**
 * Get dispensers by school
 */
exports.getDispensersBySchool = async (req, res) => {
  try {
    const { school } = req.params;

    const dispensers = await Dispenser.findAll({ school });

    return successResponse(res, 200, 'Dispensers retrieved successfully', {
      dispensers,
      school,
      count: dispensers.length
    });
  } catch (error) {
    logger.error('Get dispensers by school error:', error);
    return errorResponse(res, 500, 'Failed to retrieve dispensers', error.message);
  }
};

/**
 * Get online dispensers
 */
exports.getOnlineDispensers = async (req, res) => {
  try {
    const dispensers = await Dispenser.findOnline();

    return successResponse(res, 200, 'Online dispensers retrieved successfully', {
      dispensers,
      count: dispensers.length
    });
  } catch (error) {
    logger.error('Get online dispensers error:', error);
    return errorResponse(res, 500, 'Failed to retrieve online dispensers', error.message);
  }
};
