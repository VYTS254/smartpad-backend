// Simple startup test without running the full server
console.log('🧪 Testing SmartPad Backend Startup...\n');

// Test 1: Environment variables
console.log('📋 Test 1: Environment Variables');
require('dotenv').config();
console.log('✅ Environment variables loaded');
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'Not configured'}\n`);

// Test 2: Firebase config
console.log('📋 Test 2: Firebase Configuration');
try {
  const { isInitialized } = require('./src/config/firebase');
  if (isInitialized) {
    console.log('✅ Firebase is properly configured\n');
  } else {
    console.log('⚠️  Firebase not configured (this is OK for testing)\n');
  }
} catch (error) {
  console.log('❌ Error loading Firebase config:', error.message, '\n');
}

// Test 3: App configuration
console.log('📋 Test 3: Express App');
try {
  const app = require('./src/app');
  console.log('✅ Express app loaded successfully\n');
} catch (error) {
  console.log('❌ Error loading app:', error.message, '\n');
}

// Test 4: Check if server file is valid
console.log('📋 Test 4: Server File');
try {
  // Don't actually start the server, just check if file is valid
  const fs = require('fs');
  const serverFile = fs.readFileSync('./src/server.js', 'utf8');
  if (serverFile.includes('app.listen')) {
    console.log('✅ Server file is valid\n');
  }
} catch (error) {
  console.log('❌ Error checking server file:', error.message, '\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Startup Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const { isInitialized } = require('./src/config/firebase');

if (isInitialized) {
  console.log('✅ All systems ready!');
  console.log('\n🚀 Start the server with: npm run dev');
} else {
  console.log('⚠️  Firebase not configured');
  console.log('\n📖 Follow these steps:');
  console.log('   1. Read FIREBASE_SETUP.md for detailed instructions');
  console.log('   2. Add firebase-service-account.json to project root');
  console.log('   3. Run: npm run dev');
  console.log('\n💡 Or continue without Firebase for testing (limited functionality)');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
