const { validationResult } = require('express-validator');
const axios = require('axios');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const mpesaConfig = require('../config/mpesa');
const Dispenser = require('../models/Dispenser');
const { getCollection, collections, generateId } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Initiate M-Pesa STK Push
 */
exports.initiateSTKPush = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array());
    }

    const { phone, amount, dispenserId } = req.body;

    // Check if dispenser exists and is available
    const dispenser = await Dispenser.findById(dispenserId);
    if (!dispenser) {
      return errorResponse(res, 404, 'Dispenser not found');
    }

    if (dispenser.status !== 'ONLINE') {
      return errorResponse(res, 400, 'Dispenser is not available');
    }

    if (dispenser.padsAvailable <= 0) {
      return errorResponse(res, 400, 'No pads available in this dispenser');
    }

    // Format phone number (remove + and ensure it starts with 254)
    let formattedPhone = phone.replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }

    // Get OAuth token
    const accessToken = await mpesaConfig.getOAuthToken();

    // Generate password and timestamp
    const { password, timestamp } = mpesaConfig.generatePassword();

    // Create transaction ID
    const transactionId = generateId();

    // Prepare STK push request
    const stkPushData = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: mpesaConfig.callbackURL,
      AccountReference: `SmartPad-${dispenserId}`,
      TransactionDesc: `Sanitary pad purchase from ${dispenser.location}`
    };

    // Send STK push
    const response = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Create transaction record
    await getCollection(collections.TRANSACTIONS).doc(transactionId).set({
      transactionId,
      userId: req.uid,
      dispenserId,
      phone: formattedPhone,
      amount: Math.ceil(amount),
      status: 'PENDING',
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      createdAt: new Date().toISOString()
    });

    logger.info(`STK Push initiated: ${transactionId} for user ${req.uid}`);

    return successResponse(res, 200, 'Payment request sent. Please check your phone', {
      transactionId,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID
    });
  } catch (error) {
    logger.error('STK Push error:', error.response?.data || error);
    return errorResponse(res, 500, 'Failed to initiate payment', error.response?.data?.errorMessage || error.message);
  }
};

/**
 * Handle M-Pesa callback
 */
exports.handleCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = Body.stkCallback;

    // Find transaction by checkout request ID
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('checkoutRequestId', '==', CheckoutRequestID)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    const transactionDoc = snapshot.docs[0];
    const transaction = transactionDoc.data();

    // Update transaction based on result code
    if (ResultCode === 0) {
      // Payment successful
      const metadata = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value;
        });
      }

      await transactionDoc.ref.update({
        status: 'PAID',
        mpesaReceiptNumber: metadata.MpesaReceiptNumber,
        transactionDate: metadata.TransactionDate,
        phoneNumber: metadata.PhoneNumber,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        paidAt: new Date().toISOString()
      });

      logger.info(`Payment successful: ${transaction.transactionId}`);

      // TODO: Send notification to ESP32 to dispense pad
      // TODO: Send FCM notification to user

    } else {
      // Payment failed or cancelled
      await transactionDoc.ref.update({
        status: 'FAILED',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        failedAt: new Date().toISOString()
      });

      logger.warn(`Payment failed: ${transaction.transactionId} - ${ResultDesc}`);
    }

    // Acknowledge callback
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    logger.error('Callback handling error:', error);
    return res.status(200).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
};

/**
 * Check payment status
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    // Find transaction
    const snapshot = await getCollection(collections.TRANSACTIONS)
      .where('checkoutRequestId', '==', checkoutRequestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    const transaction = snapshot.docs[0].data();

    // Check if user owns this transaction
    if (transaction.userId !== req.uid && !['admin', 'school_manager'].includes(req.user.role)) {
      return errorResponse(res, 403, 'You can only check your own transactions');
    }

    return successResponse(res, 200, 'Transaction status retrieved', { transaction });
  } catch (error) {
    logger.error('Check payment status error:', error);
    return errorResponse(res, 500, 'Failed to check payment status', error.message);
  }
};
