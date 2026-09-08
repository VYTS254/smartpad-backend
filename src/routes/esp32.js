const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const esp32Controller = require('../controllers/esp32Controller');
const { verifyDeviceToken } = require('../middleware/auth');

// Validation rules
const statusUpdateValidation = [
  body('esp32Id').notEmpty().withMessage('ESP32 ID is required'),
  body('status').isIn(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']).withMessage('Invalid status')
];

const heartbeatValidation = [
  body('esp32Id').notEmpty().withMessage('ESP32 ID is required'),
  body('padsAvailable').isInt({ min: 0 }).withMessage('Pads available must be a positive integer'),
  body('batteryLevel').isInt({ min: 0, max: 100 }).withMessage('Battery level must be between 0 and 100')
];

const padDispensedValidation = [
  body('esp32Id').notEmpty().withMessage('ESP32 ID is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
];

const errorReportValidation = [
  body('esp32Id').notEmpty().withMessage('ESP32 ID is required'),
  body('errorCode').notEmpty().withMessage('Error code is required'),
  body('errorMessage').notEmpty().withMessage('Error message is required')
];

// All routes require device token authentication
router.use(verifyDeviceToken);

// Routes
router.post('/status', statusUpdateValidation, esp32Controller.updateStatus);
router.post('/heartbeat', heartbeatValidation, esp32Controller.heartbeat);
router.post('/pad-dispensed', padDispensedValidation, esp32Controller.padDispensed);
router.post('/error', errorReportValidation, esp32Controller.reportError);

module.exports = router;
