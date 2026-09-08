const { db, isInitialized } = require('./firebase');

// Collection references
const collections = {
  USERS: 'users',
  DISPENSERS: 'dispensers',
  INVENTORY: 'inventory',
  TRANSACTIONS: 'transactions',
  DISPENSING_LOGS: 'dispensing_logs',
  NOTIFICATIONS: 'notifications'
};

// Helper function to get collection reference
const getCollection = (collectionName) => {
  if (!isInitialized || !db) {
    throw new Error('Firebase is not initialized. Please configure Firebase credentials.');
  }
  return db.collection(collectionName);
};

// Helper function to generate unique ID
const generateId = () => {
  if (!isInitialized || !db) {
    // Fallback: generate a simple unique ID if Firebase is not available
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return db.collection('_temp').doc().id;
};

module.exports = {
  db,
  collections,
  getCollection,
  generateId,
  isInitialized
};
