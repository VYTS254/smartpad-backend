const { validationResult } = require('express-validator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const { getCollection, collections } = require('../config/db');
const Dispenser = require('../models/Dispenser');
const logger = require('../utils/logger');

/**
 * Helper function to calculate date range
 */
const getDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Helper function to aggregate transaction data
 */
const aggregateTransactions = (transactions) => {
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED').length;
  const failedTransactions = transactions.filter(t => t.status === 'FAILED').length;
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'PAID' || t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPadsDispensed = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.padsDispensed || 1), 0);

  return {
    totalTransactions,
    completedTransactions,
    failedTransactions,
    pendingTransactions,
    totalRevenue,
    totalPadsDispensed
  };
};

/**
 * Get daily report
 */
exports.getDailyReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate || new Date(), endDate || new Date());

    // Get transactions for the day
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('createdAt', '>=', start.toISOString())
      .where('createdAt', '<=', end.toISOString())
      .get();

    const transactions = snapshot.docs.map(doc => doc.data());
    const stats = aggregateTransactions(transactions);

    return successResponse(res, 200, 'Daily report generated successfully', {
      date: start.toISOString().split('T')[0],
      ...stats,
      transactions
    });
  } catch (error) {
    logger.error('Get daily report error:', error);
    return errorResponse(res, 500, 'Failed to generate daily report', error.message);
  }
};

/**
 * Get weekly report
 */
exports.getWeeklyReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const { start, end } = getDateRange(startDate, endDate);

    // Get transactions for the week
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('createdAt', '>=', start.toISOString())
      .where('createdAt', '<=', end.toISOString())
      .get();

    const transactions = snapshot.docs.map(doc => doc.data());
    const stats = aggregateTransactions(transactions);

    // Group by day
    const dailyBreakdown = {};
    transactions.forEach(t => {
      const day = t.createdAt.split('T')[0];
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = [];
      }
      dailyBreakdown[day].push(t);
    });

    const dailyStats = Object.keys(dailyBreakdown).map(day => ({
      date: day,
      ...aggregateTransactions(dailyBreakdown[day])
    }));

    return successResponse(res, 200, 'Weekly report generated successfully', {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      ...stats,
      dailyBreakdown: dailyStats
    });
  } catch (error) {
    logger.error('Get weekly report error:', error);
    return errorResponse(res, 500, 'Failed to generate weekly report', error.message);
  }
};

/**
 * Get monthly report
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(1); // First day of current month
    startDate.setHours(0, 0, 0, 0);

    const { start, end } = getDateRange(startDate, endDate);

    // Get transactions for the month
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('createdAt', '>=', start.toISOString())
      .where('createdAt', '<=', end.toISOString())
      .get();

    const transactions = snapshot.docs.map(doc => doc.data());
    const stats = aggregateTransactions(transactions);

    return successResponse(res, 200, 'Monthly report generated successfully', {
      month: start.toISOString().substring(0, 7),
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      ...stats
    });
  } catch (error) {
    logger.error('Get monthly report error:', error);
    return errorResponse(res, 500, 'Failed to generate monthly report', error.message);
  }
};

/**
 * Get school report
 */
exports.getSchoolReport = async (req, res) => {
  try {
    const { school } = req.params;
    const { startDate, endDate } = req.query;

    // Get all dispensers for the school
    const dispensers = await Dispenser.findAll({ school });
    const dispenserIds = dispensers.map(d => d.dispenserId);

    if (dispenserIds.length === 0) {
      return successResponse(res, 200, 'School report generated successfully', {
        school,
        totalDispensers: 0,
        totalTransactions: 0,
        totalRevenue: 0
      });
    }

    // Get transactions for all school dispensers
    let query = getCollection(collections.TRANSACTIONS);

    if (startDate && endDate) {
      const { start, end } = getDateRange(startDate, endDate);
      query = query
        .where('createdAt', '>=', start.toISOString())
        .where('createdAt', '<=', end.toISOString());
    }

    const snapshot = await query.get();
    const allTransactions = snapshot.docs.map(doc => doc.data());
    
    // Filter transactions for this school's dispensers
    const schoolTransactions = allTransactions.filter(t => 
      dispenserIds.includes(t.dispenserId)
    );

    const stats = aggregateTransactions(schoolTransactions);

    // Dispenser breakdown
    const dispenserBreakdown = dispensers.map(dispenser => {
      const dispenserTransactions = schoolTransactions.filter(
        t => t.dispenserId === dispenser.dispenserId
      );
      return {
        dispenserId: dispenser.dispenserId,
        location: dispenser.location,
        status: dispenser.status,
        ...aggregateTransactions(dispenserTransactions)
      };
    });

    return successResponse(res, 200, 'School report generated successfully', {
      school,
      totalDispensers: dispensers.length,
      ...stats,
      dispenserBreakdown
    });
  } catch (error) {
    logger.error('Get school report error:', error);
    return errorResponse(res, 500, 'Failed to generate school report', error.message);
  }
};

/**
 * Get dispenser report
 */
exports.getDispenserReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get dispenser details
    const dispenser = await Dispenser.findById(id);
    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    // Get transactions for this dispenser
    let query = getCollection(collections.TRANSACTIONS)
      .where('dispenserId', '==', id);

    if (startDate && endDate) {
      const { start, end } = getDateRange(startDate, endDate);
      query = query
        .where('createdAt', '>=', start.toISOString())
        .where('createdAt', '<=', end.toISOString());
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => doc.data());
    const stats = aggregateTransactions(transactions);

    return successResponse(res, 200, 'Dispenser report generated successfully', {
      dispenser,
      ...stats,
      recentTransactions: transactions.slice(0, 10)
    });
  } catch (error) {
    logger.error('Get dispenser report error:', error);
    return errorResponse(res, 500, 'Failed to generate dispenser report', error.message);
  }
};

/**
 * Get revenue report
 */
exports.getRevenueReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(
      startDate || new Date(new Date().setDate(1)),
      endDate || new Date()
    );

    // Get all paid transactions
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('createdAt', '>=', start.toISOString())
      .where('createdAt', '<=', end.toISOString())
      .where('status', 'in', ['PAID', 'COMPLETED'])
      .get();

    const transactions = snapshot.docs.map(doc => doc.data());

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;

    // Revenue by school
    const dispenserIds = [...new Set(transactions.map(t => t.dispenserId))];
    const dispensers = await Promise.all(
      dispenserIds.map(id => Dispenser.findById(id))
    );

    const revenueBySchool = {};
    transactions.forEach(t => {
      const dispenser = dispensers.find(d => d && d.dispenserId === t.dispenserId);
      if (dispenser) {
        const school = dispenser.school;
        if (!revenueBySchool[school]) {
          revenueBySchool[school] = { revenue: 0, transactions: 0 };
        }
        revenueBySchool[school].revenue += t.amount || 0;
        revenueBySchool[school].transactions += 1;
      }
    });

    return successResponse(res, 200, 'Revenue report generated successfully', {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalRevenue,
      totalTransactions,
      averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      revenueBySchool
    });
  } catch (error) {
    logger.error('Get revenue report error:', error);
    return errorResponse(res, 500, 'Failed to generate revenue report', error.message);
  }
};
