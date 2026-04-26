/**
 * Unit Tests — Merchant Category Classification
 *
 * Tests the core logic that determines whether a merchant
 * category qualifies as a medical expense for HSA purposes.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyMerchant,
  QUALIFIED_CATEGORIES,
  NON_QUALIFIED_CATEGORIES,
  ALL_CATEGORIES,
} = require('../utils/merchantCategories');

describe('Merchant Category Classification', () => {

  describe('classifyMerchant()', () => {

    it('should approve all qualified medical categories', () => {
      const qualifiedList = [
        'pharmacy', 'hospital', 'clinic', 'dentist', 'dental',
        'optometrist', 'vision', 'eyecare', 'medical_supply',
        'mental_health', 'therapist', 'chiropractor', 'urgent_care',
        'laboratory', 'ambulance', 'doctor', 'physician',
        'prescription', 'rehabilitation',
      ];

      for (const category of qualifiedList) {
        const result = classifyMerchant(category);
        assert.equal(result.qualified, true, `Expected "${category}" to be qualified`);
        assert.equal(result.reason, 'Qualified medical expense');
      }
    });

    it('should decline all non-qualified categories', () => {
      const nonQualifiedList = [
        'restaurant', 'electronics', 'grocery', 'gas_station',
        'clothing', 'entertainment', 'travel', 'hotel',
        'sporting_goods', 'home_improvement',
      ];

      for (const category of nonQualifiedList) {
        const result = classifyMerchant(category);
        assert.equal(result.qualified, false, `Expected "${category}" to be non-qualified`);
        assert.ok(result.reason.includes('Non-qualified expense'));
      }
    });

    it('should decline unknown categories', () => {
      const result = classifyMerchant('bitcoin_exchange');
      assert.equal(result.qualified, false);
      assert.ok(result.reason.includes('Unknown merchant category'));
    });

    it('should handle empty string', () => {
      const result = classifyMerchant('');
      assert.equal(result.qualified, false);
    });

    it('should handle null/undefined', () => {
      const result = classifyMerchant(null);
      assert.equal(result.qualified, false);

      const result2 = classifyMerchant(undefined);
      assert.equal(result2.qualified, false);
    });

    it('should be case-insensitive', () => {
      assert.equal(classifyMerchant('PHARMACY').qualified, true);
      assert.equal(classifyMerchant('Pharmacy').qualified, true);
      assert.equal(classifyMerchant('RESTAURANT').qualified, false);
    });

    it('should trim whitespace', () => {
      assert.equal(classifyMerchant('  pharmacy  ').qualified, true);
      assert.equal(classifyMerchant(' restaurant ').qualified, false);
    });
  });

  describe('Category sets', () => {

    it('should have qualified and non-qualified sets with no overlap', () => {
      for (const cat of QUALIFIED_CATEGORIES) {
        assert.equal(NON_QUALIFIED_CATEGORIES.has(cat), false,
          `"${cat}" appears in both qualified and non-qualified`);
      }
    });

    it('ALL_CATEGORIES should include entries from both sets', () => {
      const qualifiedInAll = ALL_CATEGORIES.filter(c => c.qualified);
      const nonQualifiedInAll = ALL_CATEGORIES.filter(c => !c.qualified);

      assert.ok(qualifiedInAll.length > 0, 'Should have qualified entries');
      assert.ok(nonQualifiedInAll.length > 0, 'Should have non-qualified entries');
    });

    it('ALL_CATEGORIES entries should have value, label, and qualified fields', () => {
      for (const cat of ALL_CATEGORIES) {
        assert.ok(cat.value, `Category missing value: ${JSON.stringify(cat)}`);
        assert.ok(cat.label, `Category missing label: ${JSON.stringify(cat)}`);
        assert.equal(typeof cat.qualified, 'boolean', `Category "${cat.value}" missing boolean qualified field`);
      }
    });
  });
});
