const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const {
  generateCardNumber,
  getLastFour,
  maskCardNumber,
  generateExpiryDate,
  generateCVV,
} = require('../utils/cardGenerator');

/**
 * Issue a new virtual debit card for an account.
 * @param {string} accountId
 * @returns {{ success: boolean, card?: object, error?: string }}
 */
function issueCard(accountId) {
  const db = getDb();

  // Verify account exists
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  // Check if account already has an active card
  const existingActive = db.prepare(
    "SELECT * FROM cards WHERE account_id = ? AND status = 'active'"
  ).get(accountId);

  if (existingActive) {
    return { success: false, error: 'Account already has an active card. Freeze or cancel it first.' };
  }

  const id = uuidv4();
  const cardNumber = generateCardNumber();
  const cardLastFour = getLastFour(cardNumber);
  const cardholderName = `${account.first_name} ${account.last_name}`.toUpperCase();
  const expiryDate = generateExpiryDate();
  const cvv = generateCVV();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO cards (id, account_id, card_number, card_last_four, cardholder_name, expiry_date, cvv, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(id, accountId, maskCardNumber(cardNumber), cardLastFour, cardholderName, expiryDate, cvv, now);

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  return { success: true, card };
}

/**
 * Get all cards for an account.
 * @param {string} accountId
 * @returns {object[]}
 */
function getCardsByAccount(accountId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE account_id = ? ORDER BY created_at DESC').all(accountId);
}

/**
 * Get a card by ID.
 * @param {string} cardId
 * @returns {object|null}
 */
function getCardById(cardId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) || null;
}

/**
 * Update card status (freeze or cancel).
 * @param {string} cardId
 * @param {string} status - 'active' | 'frozen' | 'cancelled'
 * @returns {{ success: boolean, card?: object, error?: string }}
 */
function updateCardStatus(cardId, status) {
  const validStatuses = ['active', 'frozen', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  const db = getDb();
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);

  if (!card) {
    return { success: false, error: 'Card not found' };
  }

  if (card.status === 'cancelled') {
    return { success: false, error: 'Cannot update a cancelled card' };
  }

  db.prepare('UPDATE cards SET status = ? WHERE id = ?').run(status, cardId);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  return { success: true, card: updated };
}

module.exports = {
  issueCard,
  getCardsByAccount,
  getCardById,
  updateCardStatus,
};
