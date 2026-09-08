const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorize } = require('../middleware/auth');

// Validation rules
const refillValidation = [
  body('dispenserId').notEmpty().withMessage('Dispenser ID is required'),
  body('padsAdded').isInt({ min: 1 }).withMessage('Pads added must be a positive integer')
];

const updateInventoryValidation = [
  body('inventoryId').notEmpty().withMessage('Inventory ID is required'),
  body('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a positive integer')
];

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', authorize('admin', 'school_manager', 'inventory_manager'), inventoryController.getAllInventory);
router.post('/refill', authorize('admin', 'school_manager', 'inventory_manager'), refillValidation, inventoryController.refillInventory);
router.put('/update', authorize('admin', 'inventory_manager'), updateInventoryValidation, inventoryController.updateInventory);
router.get('/low-stock', authorize('admin', 'school_manager', 'inventory_manager'), inventoryController.getLowStock);
router.get('/dispenser/:dispenserId', inventoryController.getInventoryByDispenser);

module.exports = router;
