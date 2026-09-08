const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Validation rules
const stkPushValidation = [
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('dispenserId').notEmpty().withMessage('Dispenser ID is required')
];

// STK Push requires authentication
router.post('/stkpush', verifyToken, stkPushValidation, paymentController.initiateSTKPush);

// Callback doesn't require authentication (comes from M-Pesa)
router.post('/callback', paymentController.handleCallback);

// Status check requires authentication
router.get('/status/:checkoutRequestId', verifyToken, paymentController.checkPaymentStatus);

module.exports = router;
