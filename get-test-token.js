/**
 * Quick script to get a test Firebase token
 * Run with: node get-test-token.js
 */

require('dotenv').config();
const { auth } = require('./src/config/firebase');

async function getTestToken() {
  try {
    console.log('🔐 Getting test Firebase token...\n');

    // Check if Firebase is initialized
    if (!auth) {
      console.error('❌ Firebase is not initialized!');
      console.error('Please configure Firebase first (see FIREBASE_SETUP.md)\n');
      process.exit(1);
    }

    // Create a test user if needed
    const testEmail = 'test@smartpad.com';
    const testPassword = 'Test@123456';

    console.log('Creating/fetching test user...');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);

    let user;
    try {
      // Try to get existing user
      user = await auth.getUserByEmail(testEmail);
      console.log('✅ Test user already exists');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        console.log('Creating new test user...');
        user = await auth.createUser({
          email: testEmail,
          password: testPassword,
          displayName: 'Test User'
        });
        console.log('✅ Test user created');
      } else {
        throw error;
      }
    }

    // Generate custom token
    const customToken = await auth.createCustomToken(user.uid);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Here is your test token:\n');
    console.log(customToken);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 How to use this token in Postman:');
    console.log('1. Copy the token above');
    console.log('2. In Postman, go to your request');
    console.log('3. Go to "Authorization" tab');
    console.log('4. Type: Bearer Token');
    console.log('5. Token: Paste the token');
    console.log('6. Send your request\n');

    console.log('💡 Or save to environment variable:');
    console.log('   - Environment: SmartPad Local');
    console.log('   - Variable: token');
    console.log('   - Value: (paste token)');
    console.log('   - Then use: Bearer {{token}}\n');

    console.log('🔑 Test User Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   UID: ${user.uid}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure Firebase is properly configured.');
    console.error('See FIREBASE_SETUP.md for instructions.\n');
    process.exit(1);
  }
}

// Run the function
getTestToken();
