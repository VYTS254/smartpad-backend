const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dispenserRoutes = require('./routes/dispensers');
const esp32Routes = require('./routes/esp32');
const inventoryRoutes = require('./routes/inventory');
const paymentRoutes = require('./routes/payment');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const { isInitialized } = require('./config/db');
  res.status(200).json({
    success: true,
    message: 'SmartPad Backend is running',
    timestamp: new Date().toISOString(),
    firebaseConfigured: isInitialized
  });
});

// API status endpoint (no auth required)
app.get('/api/v1/status', (req, res) => {
  const { isInitialized } = require('./config/db');
  res.status(200).json({
    success: true,
    message: 'SmartPad API Status',
    version: '1.0.0',
    firebaseConfigured: isInitialized,
    endpoints: {
      total: 44,
      categories: [
        'Authentication (6)',
        'Users (5)',
        'Dispensers (7)',
        'ESP32 (4)',
        'Inventory (5)',
        'Payments (3)',
        'Transactions (4)',
        'Reports (6)',
        'Health (1)',
        'Status (1)'
      ]
    },
    documentation: {
      apiGuide: '/API_GUIDE.md',
      quickStart: '/QUICK_START.md',
      firebaseSetup: '/FIREBASE_SETUP.md'
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dispensers', dispenserRoutes);
app.use('/api/v1/esp32', esp32Routes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
