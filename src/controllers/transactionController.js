const { successResponse, errorResponse } = require('../utils/response');
const { getCollection, collections } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Get all transactions
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 50, status, school } = req.query;

    let query = getCollection(collections.TRANSACTIONS)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => doc.data());

    // Filter by school if school manager
    let filteredTransactions = transactions;
    if (req.user.role === 'school_manager' && school) {
      // Get dispensers for the school
      const Dispenser = require('../models/Dispenser');
      const schoolDispensers = await Dispenser.findAll({ school });
      const dispenserIds = schoolDispensers.map(d => d.dispenserId);
      
      filteredTransactions = transactions.filter(t => 
        dispenserIds.includes(t.dispenserId)
      );
    }

    return successResponse(res, 200, 'Transactions retrieved successfully', {
      transactions: filteredTransactions,
      count: filteredTransactions.length
    });
  } catch (error) {
    logger.error('Get all transactions error:', error);
    return errorResponse(res, 500, 'Failed to retrieve transactions', error.message);
  }
};

/**
 * Get transaction by ID
 */
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await getCollection(collections.TRANSACTIONS).doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    const transaction = doc.data();

    // Check if user owns this transaction or has appropriate role
    if (transaction.userId !== req.uid && !['admin', 'school_manager'].includes(req.user.role)) {
      return errorResponse(res, 403, 'You can only view your own transactions');
    }

    return successResponse(res, 200, 'Transaction retrieved successfully', { transaction });
  } catch (error) {
    logger.error('Get transaction by ID error:', error);
    return errorResponse(res, 500, 'Failed to retrieve transaction', error.message);
  }
};

/**
 * Get user transactions
 */
exports.getUserTransactions = async (req, res) => {
  try {
    const { uid } = req.params;
    const { limit = 20, status } = req.query;

    // Users can only view their own transactions unless they're admin
    if (req.uid !== uid && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You can only view your own transactions');
    }

    let query = getCollection(collections.TRANSACTIONS)
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => doc.data());

    return successResponse(res, 200, 'User transactions retrieved successfully', {
      transactions,
      userId: uid,
      count: transactions.length
    });
  } catch (error) {
    logger.error('Get user transactions error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user transactions', error.message);
  }
};

/**
 * Get dispenser transactions
 */
exports.getDispenserTransactions = async (req, res) => {
  try {
    const { dispenserId } = req.params;
    const { limit = 50, status } = req.query;

    let query = getCollection(collections.TRANSACTIONS)
      .where('dispenserId', '==', dispenserId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => doc.data());

    return successResponse(res, 200, 'Dispenser transactions retrieved successfully', {
      transactions,
      dispenserId,
      count: transactions.length
    });
  } catch (error) {
    logger.error('Get dispenser transactions error:', error);
    return errorResponse(res, 500, 'Failed to retrieve dispenser transactions', error.message);
  }
};
