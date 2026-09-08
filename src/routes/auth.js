const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('school').notEmpty().withMessage('School is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required')
];

const verifyPhoneValidation = [
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-phone', verifyToken, verifyPhoneValidation, authController.verifyPhone);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
