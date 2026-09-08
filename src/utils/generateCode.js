/**
 * Generate random alphanumeric code
 * @param {number} length - Length of code to generate
 * @returns {string} Generated code
 */
const generateCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

/**
 * Generate transaction ID
 * @returns {string} Transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `TX${timestamp}${random}`.toUpperCase();
};

/**
 * Generate dispenser ID
 * @returns {string} Dispenser ID
 */
const generateDispenserId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `DSP${timestamp}${random}`.toUpperCase();
};

/**
 * Generate verification code
 * @returns {string} 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate QR code data for dispenser
 * @param {string} dispenserId - Dispenser ID
 * @returns {string} QR code data string
 */
const generateQRCodeData = (dispenserId) => {
  return JSON.stringify({
    type: 'SMARTPAD_DISPENSER',
    dispenserId,
    timestamp: Date.now()
  });
};

module.exports = {
  generateCode,
  generateTransactionId,
  generateDispenserId,
  generateVerificationCode,
  generateQRCodeData
};
