# SmartPad Backend - Project Structure

## Created Files Overview

### Core Application Files

#### 1. **src/app.js**
Main Express application configuration with:
- Security middleware (Helmet, CORS)
- Rate limiting
- Body parsing
- Logging with Morgan
- Route mounting
- Error handling
- Health check endpoint

#### 2. **src/server.js** (Updated)
Server entry point with graceful shutdown handling

---

### Middleware

#### 3. **src/middleware/auth.js**
Authentication and authorization middleware:
- `verifyToken()` - Verifies Firebase ID tokens
- `authorize(...roles)` - Role-based access control
- `verifyDeviceToken()` - ESP32 device authentication

---

### Routes (8 Files)

#### 4. **src/routes/auth.js**
Authentication routes:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/verify-phone
- POST /auth/refresh-token

#### 5. **src/routes/users.js**
User management routes:
- GET /users
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id
- GET /users/school/:school

#### 6. **src/routes/dispensers.js**
Dispenser management routes:
- GET /dispensers
- GET /dispensers/:id
- POST /dispensers
- PUT /dispensers/:id
- DELETE /dispensers/:id
- GET /dispensers/school/:school
- GET /dispensers/status/online

#### 7. **src/routes/esp32.js**
ESP32 device communication routes:
- POST /esp32/status
- POST /esp32/heartbeat
- POST /esp32/pad-dispensed
- POST /esp32/error

#### 8. **src/routes/inventory.js**
Inventory management routes:
- GET /inventory
- POST /inventory/refill
- PUT /inventory/update
- GET /inventory/low-stock
- GET /inventory/dispenser/:dispenserId

#### 9. **src/routes/payment.js**
M-Pesa payment routes:
- POST /payment/stkpush
- POST /payment/callback
- GET /payment/status/:checkoutRequestId

#### 10. **src/routes/transactions.js**
Transaction management routes:
- GET /transactions
- GET /transactions/:id
- GET /transactions/user/:uid
- GET /transactions/dispenser/:dispenserId

#### 11. **src/routes/reports.js**
Reporting and analytics routes:
- GET /reports/daily
- GET /reports/weekly
- GET /reports/monthly
- GET /reports/school/:school
- GET /reports/dispenser/:id
- GET /reports/revenue

---

### Controllers (8 Files)

#### 12. **src/controllers/authController.js**
Handles authentication logic:
- User registration with Firebase Auth
- User login and token generation
- Logout and token revocation
- Password reset
- Phone verification
- Token refresh

#### 13. **src/controllers/userController.js**
User management operations:
- Get all users with filters
- Get user by ID
- Update user profile
- Delete user
- Get users by school

#### 14. **src/controllers/dispenserController.js**
Dispenser management:
- CRUD operations for dispensers
- Get dispensers by school
- Get online dispensers
- Inventory integration

#### 15. **src/controllers/esp32Controller.js**
ESP32 device communication:
- Status updates
- Heartbeat monitoring
- Pad dispensing confirmation
- Error reporting and notifications

#### 16. **src/controllers/inventoryController.js**
Inventory management:
- Get all inventory
- Refill inventory
- Update inventory settings
- Low stock alerts
- Get inventory by dispenser

#### 17. **src/controllers/paymentController.js**
M-Pesa payment processing:
- Initiate STK Push
- Handle M-Pesa callbacks
- Payment status checking
- Transaction creation and updates

#### 18. **src/controllers/transactionController.js**
Transaction management:
- Get all transactions with filters
- Get transaction by ID
- Get user transactions
- Get dispenser transactions

#### 19. **src/controllers/reportController.js**
Analytics and reporting:
- Daily, weekly, monthly reports
- School reports with dispenser breakdown
- Individual dispenser reports
- Revenue reports with school breakdown
- Transaction aggregation and statistics

---

### Configuration Updates

#### 20. **.env.example** (Updated)
Added:
- `ALLOWED_ORIGINS` for CORS configuration
- `ESP32_DEVICE_TOKEN` for device authentication

---

### Documentation

#### 21. **API_GUIDE.md**
Comprehensive API documentation with:
- All endpoints documented
- Request/response examples
- Authentication requirements
- Query parameters
- Error responses
- Testing examples with cURL

#### 22. **PROJECT_STRUCTURE.md** (This file)
Project overview and file structure

---

## Project Architecture

```
smartpad-backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   │
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   │
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   ├── users.js           # User routes
│   │   ├── dispensers.js      # Dispenser routes
│   │   ├── esp32.js           # ESP32 routes
│   │   ├── inventory.js       # Inventory routes
│   │   ├── payment.js         # Payment routes
│   │   ├── transactions.js    # Transaction routes
│   │   └── reports.js         # Report routes
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── dispenserController.js
│   │   ├── esp32Controller.js
│   │   ├── inventoryController.js
│   │   ├── paymentController.js
│   │   ├── transactionController.js
│   │   └── reportController.js
│   │
│   ├── models/
│   │   ├── User.js            # User model (existing)
│   │   ├── Dispenser.js       # Dispenser model (existing)
│   │   └── Inventory.js       # Inventory model (existing)
│   │
│   ├── config/
│   │   ├── db.js              # Database config (existing)
│   │   ├── firebase.js        # Firebase config (existing)
│   │   ├── mpesa.js           # M-Pesa config (existing)
│   │   └── mail.js            # Email config (existing)
│   │
│   └── utils/
│       ├── response.js        # Response helpers (existing)
│       ├── logger.js          # Logger (existing)
│       └── generateCode.js    # Code generator (existing)
│
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── README.md                  # Project README (existing)
├── API_GUIDE.md              # API documentation
└── PROJECT_STRUCTURE.md      # This file
```

---

## API Statistics

### Total Endpoints: 44

**By Category:**
- Authentication: 6 endpoints
- Users: 5 endpoints
- Dispensers: 7 endpoints
- ESP32: 4 endpoints
- Inventory: 5 endpoints
- Payments: 3 endpoints
- Transactions: 4 endpoints
- Reports: 6 endpoints
- Health: 1 endpoint
- 404 Handler: 1 endpoint

---

## Key Features Implemented

### Security
✅ Firebase authentication
✅ JWT token verification
✅ Role-based access control
✅ Device token authentication for ESP32
✅ Rate limiting
✅ Helmet security headers
✅ CORS configuration

### Payment Processing
✅ M-Pesa STK Push integration
✅ Callback handling
✅ Payment status tracking
✅ Transaction management

### IoT Integration
✅ ESP32 status updates
✅ Heartbeat monitoring
✅ Pad dispensing confirmation
✅ Error reporting and notifications

### Inventory Management
✅ Real-time inventory tracking
✅ Low stock alerts
✅ Refill operations
✅ Multi-dispenser support

### Reporting & Analytics
✅ Daily/Weekly/Monthly reports
✅ School-wise analytics
✅ Dispenser performance reports
✅ Revenue tracking
✅ Transaction aggregation

### User Management
✅ User registration and authentication
✅ Role-based permissions
✅ Profile management
✅ Multi-school support

---

## Database Collections

The system uses Firebase Firestore with these collections:

1. **users** - User profiles and authentication
2. **dispensers** - Dispenser devices and status
3. **inventory** - Stock levels and tracking
4. **transactions** - Payment and dispensing transactions
5. **dispensing_logs** - Detailed dispensing history
6. **notifications** - System notifications and alerts

---

## Next Steps

### Recommended Enhancements:

1. **Email Integration**
   - Implement nodemailer in forgot-password endpoint
   - Send notifications for low stock
   - Transaction receipts

2. **Firebase Cloud Messaging**
   - Push notifications for users
   - Device alerts for ESP32

3. **Testing**
   - Unit tests for controllers
   - Integration tests for APIs
   - End-to-end testing

4. **API Documentation UI**
   - Swagger/OpenAPI documentation
   - Interactive API explorer

5. **Monitoring**
   - Application performance monitoring
   - Error tracking (e.g., Sentry)
   - Analytics dashboard

6. **Caching**
   - Redis for frequently accessed data
   - Session management

7. **Background Jobs**
   - Scheduled inventory checks
   - Automated low stock notifications
   - Report generation

---

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Add Firebase service account:**
   - Download from Firebase Console
   - Save as `firebase-service-account.json`

4. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   ```

---

## Support & Maintenance

### Logs
Application logs are managed by Winston logger. Check console output or configure file logging in `src/utils/logger.js`.

### Error Handling
Global error handler in `src/app.js` catches all unhandled errors and returns standardized responses.

### Security Considerations
- Keep `.env` file secure and never commit it
- Rotate API keys and tokens regularly
- Monitor rate limit violations
- Review Firebase security rules
- Use HTTPS in production

---

## License

MIT License - See LICENSE file for details
