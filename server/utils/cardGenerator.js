/**
 * Virtual Debit Card Generator
 * 
 * Generates realistic-looking card numbers, expiry dates, and CVVs
 * for HSA virtual debit cards.
 */

/**
 * Generate a random 16-digit card number.
 * Starts with 4 (Visa-style) for realism.
 * @returns {string} 16-digit card number
 */
function generateCardNumber() {
  let number = '4';
  for (let i = 1; i < 16; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

/**
 * Get the last 4 digits of a card number.
 * @param {string} cardNumber
 * @returns {string}
 */
function getLastFour(cardNumber) {
  return cardNumber.slice(-4);
}

/**
 * Mask a card number, showing only the last 4 digits.
 * @param {string} cardNumber
 * @returns {string} e.g., "**** **** **** 1234"
 */
function maskCardNumber(cardNumber) {
  const lastFour = getLastFour(cardNumber);
  return `**** **** **** ${lastFour}`;
}

/**
 * Generate an expiry date 3 years from now.
 * @returns {string} MM/YY format
 */
function generateExpiryDate() {
  const now = new Date();
  const expiryYear = (now.getFullYear() + 3) % 100;
  const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
  return `${expiryMonth}/${String(expiryYear).padStart(2, '0')}`;
}

/**
 * Generate a random 3-digit CVV.
 * @returns {string}
 */
function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

module.exports = {
  generateCardNumber,
  getLastFour,
  maskCardNumber,
  generateExpiryDate,
  generateCVV,
};
