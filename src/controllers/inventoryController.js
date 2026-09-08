const { validationResult } = require('express-validator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const Inventory = require('../models/Inventory');
const Dispenser = require('../models/Dispenser');
const { messaging } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Get all inventory
 */
exports.getAllInventory = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filters = {};
    if (status) filters.status = status;

    const inventory = await Inventory.findAll(filters);

    return successResponse(res, 200, 'Inventory retrieved successfully', {
      inventory,
      count: inventory.length
    });
  } catch (error) {
    logger.error('Get all inventory error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inventory', error.message);
  }
};

/**
 * Refill inventory
 */
exports.refillInventory = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { dispenserId, padsAdded } = req.body;

    // Check if dispenser exists
    const dispenser = await Dispenser.findById(dispenserId);
    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Refill inventory
    const inventory = await Inventory.refill(dispenserId, padsAdded, req.uid);

    // Update dispenser pads available
    await Dispenser.update(dispenserId, {
      padsAvailable: inventory.remainingPads,
      status: 'ONLINE'
    });

    logger.info(`Inventory refilled: Dispenser ${dispenserId}, Pads added: ${padsAdded}`);

    return successResponse(res, 200, 'Inventory refilled successfully', { inventory });
  } catch (error) {
    logger.error('Refill inventory error:', error);
    return errorResponse(res, 500, 'Failed to refill inventory', error.message);
  }
};

/**
 * Update inventory settings
 */
exports.updateInventory = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { inventoryId, threshold } = req.body;

    const updateData = {};
    if (threshold !== undefined) updateData.threshold = threshold;

    const inventory = await Inventory.update(inventoryId, updateData);

    if (!inventory) {
      return errorResponse(res, 404, 'Inventory not found');
    }

    logger.info(`Inventory updated: ${inventoryId}`);

    return successResponse(res, 200, 'Inventory updated successfully', { inventory });
  } catch (error) {
    logger.error('Update inventory error:', error);
    return errorResponse(res, 500, 'Failed to update inventory', error.message);
  }
};

/**
 * Get low stock inventory
 */
exports.getLowStock = async (req, res) => {
  try {
    const lowStockInventory = await Inventory.findLowStock();

    // Get dispenser details for each low stock item
    const inventoryWithDetails = await Promise.all(
      lowStockInventory.map(async (inv) => {
        const dispenser = await Dispenser.findById(inv.dispenserId);
        return {
          ...inv,
          dispenser
        };
      })
    );

    return successResponse(res, 200, 'Low stock inventory retrieved successfully', {
      inventory: inventoryWithDetails,
      count: inventoryWithDetails.length
    });
  } catch (error) {
    logger.error('Get low stock error:', error);
    return errorResponse(res, 500, 'Failed to retrieve low stock inventory', error.message);
  }
};

/**
 * Get inventory by dispenser
 */
exports.getInventoryByDispenser = async (req, res) => {
  try {
    const { dispenserId } = req.params;

    // Check if dispenser exists
    const dispenser = await Dispenser.findById(dispenserId);
    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    const inventory = await Inventory.findByDispenserId(dispenserId);

    if (!inventory) {
      return errorResponse(res, 404, 'Inventory not found for this dispenser');
    }

    return successResponse(res, 200, 'Inventory retrieved successfully', {
      inventory,
      dispenser
    });
  } catch (error) {
    logger.error('Get inventory by dispenser error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inventory', error.message);
  }
};
