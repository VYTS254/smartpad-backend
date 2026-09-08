const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/auth');

// Validation rules
const updateUserValidation = [
  param('id').notEmpty().withMessage('User ID is required'),
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('school').optional().notEmpty().withMessage('School cannot be empty')
];

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', authorize('admin', 'school_manager'), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.get('/school/:school', authorize('admin', 'school_manager'), userController.getUsersBySchool);

module.exports = router;
