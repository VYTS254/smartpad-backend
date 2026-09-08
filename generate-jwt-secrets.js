/**
 * Generate JWT Secrets
 * Run with: node generate-jwt-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 JWT Secrets Generator\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generate JWT_SECRET
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET (for access tokens):');
console.log(jwtSecret);
console.log('\n');

// Generate JWT_REFRESH_SECRET
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET (for refresh tokens):');
console.log(jwtRefreshSecret);
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 How to use these secrets:\n');
console.log('1. Copy the JWT_SECRET above');
console.log('2. Open your .env file');
console.log('3. Replace the JWT_SECRET value');
console.log('4. Copy the JWT_REFRESH_SECRET above');
console.log('5. Replace the JWT_REFRESH_SECRET value');
console.log('6. Save the .env file');
console.log('7. Restart your server\n');

console.log('⚠️  IMPORTANT:');
console.log('- Never commit these secrets to Git');
console.log('- Use different secrets for development and production');
console.log('- Keep these secrets secure and private\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ Secrets generated successfully!\n');
