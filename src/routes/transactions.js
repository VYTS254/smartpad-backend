const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', authorize('admin', 'school_manager'), transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);
router.get('/user/:uid', transactionController.getUserTransactions);
router.get('/dispenser/:dispenserId', authorize('admin', 'school_manager'), transactionController.getDispenserTransactions);

module.exports = router;
