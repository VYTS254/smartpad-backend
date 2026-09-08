const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;
let firebaseInitialized = false;

// Try to load service account from file first
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Loading Firebase credentials from firebase-service-account.json');
  try {
    serviceAccount = require(serviceAccountPath);
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Error loading firebase-service-account.json:', error.message);
  }
} else {
  console.log('⚠️  firebase-service-account.json not found, checking environment variables...');
  
  // Check if environment variables are properly set
  const hasValidEnvVars = 
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_PROJECT_ID !== 'your-project-id' &&
    process.env.FIREBASE_PRIVATE_KEY && 
    process.env.FIREBASE_PRIVATE_KEY !== 'your-private-key' &&
    process.env.FIREBASE_CLIENT_EMAIL && 
    process.env.FIREBASE_CLIENT_EMAIL !== 'your-client-email';

  if (hasValidEnvVars) {
    console.log('✅ Loading Firebase credentials from environment variables');
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
    firebaseInitialized = true;
  } else {
    console.error('\n❌ Firebase Configuration Error!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Firebase credentials are not configured properly.');
    console.error('\nPlease choose ONE of the following options:\n');
    console.error('Option 1: Use Service Account JSON File (Recommended)');
    console.error('  1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('  2. Click "Generate New Private Key"');
    console.error('  3. Save the file as "firebase-service-account.json"');
    console.error('  4. Place it in the project root directory\n');
    console.error('Option 2: Use Environment Variables');
    console.error('  1. Update your .env file with actual Firebase credentials:');
    console.error('     FIREBASE_PROJECT_ID=your-actual-project-id');
    console.error('     FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com');
    console.error('     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour\\nKey\\nHere\\n-----END PRIVATE KEY-----\\n"');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Don't throw error, just log warning for now
    console.warn('⚠️  Running without Firebase - Some features will not work!\n');
  }
}

// Initialize Firebase Admin only if we have valid credentials
if (firebaseInitialized) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    console.log('✅ Firebase Admin initialized successfully\n');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    firebaseInitialized = false;
  }
}

// Export Firebase services (will be undefined if not initialized)
const db = firebaseInitialized ? admin.firestore() : null;
const auth = firebaseInitialized ? admin.auth() : null;
const storage = firebaseInitialized ? admin.storage() : null;
const messaging = firebaseInitialized ? admin.messaging() : null;

module.exports = {
  admin: firebaseInitialized ? admin : null,
  db,
  auth,
  storage,
  messaging,
  isInitialized: firebaseInitialized
};
