const { validationResult } = require('express-validator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const Dispenser = require('../models/Dispenser');
const Inventory = require('../models/Inventory');
const { getCollection, collections, generateId } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Update device status
 */
exports.updateStatus = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { esp32Id, status, batteryLevel, signalStrength, firmwareVersion } = req.body;

    // Find dispenser by ESP32 ID
    const dispenser = await Dispenser.findByEsp32Id(esp32Id);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Update dispenser status
    const updateData = { status };
    if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
    if (signalStrength !== undefined) updateData.signalStrength = signalStrength;
    if (firmwareVersion) updateData.firmwareVersion = firmwareVersion;

    await Dispenser.updateStatus(dispenser.dispenserId, status, updateData);

    logger.info(`Device status updated: ${esp32Id} - ${status}`);

    return successResponse(res, 200, 'Status updated successfully');
  } catch (error) {
    logger.error('Update status error:', error);
    return errorResponse(res, 500, 'Failed to update status', error.message);
  }
};

/**
 * Device heartbeat
 */
exports.heartbeat = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { esp32Id, padsAvailable, batteryLevel, signalStrength, temperature } = req.body;

    // Find dispenser
    const dispenser = await Dispenser.findByEsp32Id(esp32Id);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Update dispenser with heartbeat data
    await Dispenser.update(dispenser.dispenserId, {
      status: 'ONLINE',
      padsAvailable,
      batteryLevel,
      signalStrength,
      lastHeartbeat: new Date().toISOString()
    });

    // Update inventory if padsAvailable is different
    const inventory = await Inventory.findByDispenserId(dispenser.dispenserId);
    if (inventory && inventory.remainingPads !== padsAvailable) {
      await Inventory.update(inventory.inventoryId, {
        remainingPads: padsAvailable
      });
    }

    logger.info(`Heartbeat received from: ${esp32Id}`);

    return successResponse(res, 200, 'Heartbeat received');
  } catch (error) {
    logger.error('Heartbeat error:', error);
    return errorResponse(res, 500, 'Failed to process heartbeat', error.message);
  }
};

/**
 * Confirm pad dispensed
 */
exports.padDispensed = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { esp32Id, transactionId, padsDispensed = 1 } = req.body;

    // Find dispenser
    const dispenser = await Dispenser.findByEsp32Id(esp32Id);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Update inventory
    await Inventory.dispense(dispenser.dispenserId, padsDispensed);

    // Update transaction status
    const transactionRef = getCollection(collections.TRANSACTIONS).doc(transactionId);
    await transactionRef.update({
      status: 'COMPLETED',
      dispensedAt: new Date().toISOString(),
      padsDispensed
    });

    // Create dispensing log
    await getCollection(collections.DISPENSING_LOGS).doc(generateId()).set({
      transactionId,
      dispenserId: dispenser.dispenserId,
      esp32Id,
      padsDispensed,
      timestamp: new Date().toISOString()
    });

    logger.info(`Pad dispensed - Transaction: ${transactionId}, Dispenser: ${esp32Id}`);

    return successResponse(res, 200, 'Pad dispensing confirmed');
  } catch (error) {
    logger.error('Pad dispensed error:', error);
    return errorResponse(res, 500, 'Failed to confirm pad dispensing', error.message);
  }
};

/**
 * Report device error
 */
exports.reportError = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { esp32Id, errorCode, errorMessage, severity = 'ERROR' } = req.body;

    // Find dispenser
    const dispenser = await Dispenser.findByEsp32Id(esp32Id);

    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Update dispenser status to ERROR
    await Dispenser.updateStatus(dispenser.dispenserId, 'ERROR', {
      lastError: {
        code: errorCode,
        message: errorMessage,
        severity,
        timestamp: new Date().toISOString()
      }
    });

    // Create notification for maintenance
    await getCollection(collections.NOTIFICATIONS).doc(generateId()).set({
      type: 'DEVICE_ERROR',
      dispenserId: dispenser.dispenserId,
      esp32Id,
      errorCode,
      errorMessage,
      severity,
      school: dispenser.school,
      location: dispenser.location,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logger.error(`Device error reported: ${esp32Id} - ${errorCode}: ${errorMessage}`);

    return successResponse(res, 200, 'Error reported successfully');
  } catch (error) {
    logger.error('Report error error:', error);
    return errorResponse(res, 500, 'Failed to report error', error.message);
  }
};
