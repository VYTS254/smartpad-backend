const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const reportController = require('../controllers/reportController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication and appropriate roles
router.use(verifyToken);
router.use(authorize('admin', 'school_manager'));

// Validation rules
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date')
];

// Routes
router.get('/daily', dateRangeValidation, reportController.getDailyReport);
router.get('/weekly', dateRangeValidation, reportController.getWeeklyReport);
router.get('/monthly', dateRangeValidation, reportController.getMonthlyReport);
router.get('/school/:school', reportController.getSchoolReport);
router.get('/dispenser/:id', reportController.getDispenserReport);
router.get('/revenue', dateRangeValidation, reportController.getRevenueReport);

module.exports = router;
