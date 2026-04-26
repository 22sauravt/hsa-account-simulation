/**
 * Merchant Category Classification for HSA Qualified Medical Expenses
 * 
 * Based on IRS Publication 502 guidelines for medical and dental expenses.
 */

const QUALIFIED_CATEGORIES = new Set([
  'pharmacy',
  'hospital',
  'clinic',
  'dentist',
  'dental',
  'optometrist',
  'vision',
  'eyecare',
  'medical_supply',
  'mental_health',
  'therapist',
  'chiropractor',
  'urgent_care',
  'laboratory',
  'ambulance',
  'doctor',
  'physician',
  'prescription',
  'rehabilitation',
]);

const NON_QUALIFIED_CATEGORIES = new Set([
  'restaurant',
  'electronics',
  'grocery',
  'gas_station',
  'clothing',
  'entertainment',
  'travel',
  'hotel',
  'sporting_goods',
  'home_improvement',
]);

/**
 * All known categories for the UI dropdown.
 */
const ALL_CATEGORIES = [
  // Qualified
  { value: 'pharmacy', label: 'Pharmacy', qualified: true },
  { value: 'hospital', label: 'Hospital', qualified: true },
  { value: 'clinic', label: 'Clinic', qualified: true },
  { value: 'dentist', label: 'Dentist', qualified: true },
  { value: 'optometrist', label: 'Optometrist', qualified: true },
  { value: 'vision', label: 'Vision Center', qualified: true },
  { value: 'medical_supply', label: 'Medical Supply', qualified: true },
  { value: 'mental_health', label: 'Mental Health', qualified: true },
  { value: 'chiropractor', label: 'Chiropractor', qualified: true },
  { value: 'urgent_care', label: 'Urgent Care', qualified: true },
  { value: 'laboratory', label: 'Laboratory', qualified: true },
  { value: 'doctor', label: 'Doctor / Physician', qualified: true },
  { value: 'prescription', label: 'Prescription Services', qualified: true },
  { value: 'rehabilitation', label: 'Rehabilitation', qualified: true },
  // Non-qualified
  { value: 'restaurant', label: 'Restaurant', qualified: false },
  { value: 'electronics', label: 'Electronics', qualified: false },
  { value: 'grocery', label: 'Grocery Store', qualified: false },
  { value: 'gas_station', label: 'Gas Station', qualified: false },
  { value: 'clothing', label: 'Clothing Store', qualified: false },
  { value: 'entertainment', label: 'Entertainment', qualified: false },
  { value: 'travel', label: 'Travel', qualified: false },
  { value: 'hotel', label: 'Hotel', qualified: false },
  { value: 'sporting_goods', label: 'Sporting Goods', qualified: false },
  { value: 'home_improvement', label: 'Home Improvement', qualified: false },
];

/**
 * Determine if a merchant category is a qualified medical expense.
 * @param {string} category - The merchant category code
 * @returns {{ qualified: boolean, reason: string }}
 */
function classifyMerchant(category) {
  const normalized = (category || '').toLowerCase().trim();

  if (QUALIFIED_CATEGORIES.has(normalized)) {
    return { qualified: true, reason: 'Qualified medical expense' };
  }

  if (NON_QUALIFIED_CATEGORIES.has(normalized)) {
    return { qualified: false, reason: `Non-qualified expense: ${normalized} is not a medical expense` };
  }

  // Unknown category — default to non-qualified for safety
  return { qualified: false, reason: `Unknown merchant category: ${normalized}` };
}

module.exports = {
  QUALIFIED_CATEGORIES,
  NON_QUALIFIED_CATEGORIES,
  ALL_CATEGORIES,
  classifyMerchant,
};
