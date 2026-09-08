const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const dispenserController = require('../controllers/dispenserController');
const { verifyToken, authorize } = require('../middleware/auth');

// Validation rules
const createDispenserValidation = [
  body('school').notEmpty().withMessage('School is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('esp32Id').notEmpty().withMessage('ESP32 ID is required')
];

const updateDispenserValidation = [
  param('id').notEmpty().withMessage('Dispenser ID is required'),
  body('school').optional().notEmpty().withMessage('School cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty')
];

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', dispenserController.getAllDispensers);
router.get('/:id', dispenserController.getDispenserById);
router.post('/', authorize('admin', 'school_manager'), createDispenserValidation, dispenserController.createDispenser);
router.put('/:id', authorize('admin', 'school_manager'), updateDispenserValidation, dispenserController.updateDispenser);
router.delete('/:id', authorize('admin'), dispenserController.deleteDispenser);
router.get('/school/:school', dispenserController.getDispensersBySchool);
router.get('/status/online', dispenserController.getOnlineDispensers);

module.exports = router;
