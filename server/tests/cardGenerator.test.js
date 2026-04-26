/**
 * Unit Tests — Card Generator Utilities
 *
 * Tests card number generation, masking, expiry date,
 * and CVV generation.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  generateCardNumber,
  getLastFour,
  maskCardNumber,
  generateExpiryDate,
  generateCVV,
} = require('../utils/cardGenerator');

describe('Card Generator', () => {

  describe('generateCardNumber()', () => {

    it('should return a 16-digit string', () => {
      const num = generateCardNumber();
      assert.equal(num.length, 16);
      assert.match(num, /^\d{16}$/);
    });

    it('should start with 4 (Visa-style)', () => {
      const num = generateCardNumber();
      assert.equal(num[0], '4');
    });

    it('should generate unique numbers on successive calls', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateCardNumber());
      }
      // With 15 random digits, collision in 100 is astronomically unlikely
      assert.equal(numbers.size, 100, 'Expected 100 unique card numbers');
    });
  });

  describe('getLastFour()', () => {

    it('should return the last 4 characters', () => {
      assert.equal(getLastFour('4111222233334444'), '4444');
      assert.equal(getLastFour('1234567890123456'), '3456');
    });
  });

  describe('maskCardNumber()', () => {

    it('should mask all but the last 4 digits', () => {
      const masked = maskCardNumber('4111222233334444');
      assert.equal(masked, '**** **** **** 4444');
    });

    it('should preserve the last 4 digits correctly', () => {
      const num = generateCardNumber();
      const masked = maskCardNumber(num);
      const lastFour = num.slice(-4);
      assert.ok(masked.endsWith(lastFour));
      assert.ok(masked.startsWith('**** **** **** '));
    });
  });

  describe('generateExpiryDate()', () => {

    it('should return MM/YY format', () => {
      const expiry = generateExpiryDate();
      assert.match(expiry, /^\d{2}\/\d{2}$/);
    });

    it('should have a valid month (01-12)', () => {
      const expiry = generateExpiryDate();
      const month = parseInt(expiry.split('/')[0], 10);
      assert.ok(month >= 1 && month <= 12, `Month ${month} is out of range`);
    });

    it('should be 3 years from now', () => {
      const expiry = generateExpiryDate();
      const year = parseInt(expiry.split('/')[1], 10);
      const expectedYear = (new Date().getFullYear() + 3) % 100;
      assert.equal(year, expectedYear);
    });
  });

  describe('generateCVV()', () => {

    it('should return a 3-digit string', () => {
      const cvv = generateCVV();
      assert.equal(cvv.length, 3);
      assert.match(cvv, /^\d{3}$/);
    });

    it('should be >= 100 (no leading zeros below 100)', () => {
      for (let i = 0; i < 50; i++) {
        const cvv = parseInt(generateCVV(), 10);
        assert.ok(cvv >= 100 && cvv <= 999, `CVV ${cvv} is out of range`);
      }
    });
  });
});
