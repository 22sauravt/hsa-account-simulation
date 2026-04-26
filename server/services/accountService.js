const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

/**
 * Create a new HSA account.
 * @param {{ firstName: string, lastName: string, email: string }} data
 * @returns {object} The created account
 */
function createAccount({ firstName, lastName, email }) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO accounts (id, first_name, last_name, email, balance, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, 1, ?, ?)
  `);

  stmt.run(id, firstName, lastName, email, now, now);

  return getAccountById(id);
}

/**
 * Get all accounts.
 * @returns {object[]}
 */
function getAllAccounts() {
  const db = getDb();
  return db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
}

/**
 * Get a single account by ID.
 * @param {string} id
 * @returns {object|null}
 */
function getAccountById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) || null;
}

/**
 * Deposit funds into an account using optimistic locking.
 * @param {string} accountId
 * @param {number} amount
 * @param {number} [maxRetries=3]
 * @returns {{ success: boolean, account?: object, error?: string }}
 */
function deposit(accountId, amount, maxRetries = 3) {
  if (amount <= 0) {
    return { success: false, error: 'Deposit amount must be positive' };
  }

  const db = getDb();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const account = getAccountById(accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const now = new Date().toISOString();
    const newBalance = account.balance + amount;

    const result = db.prepare(`
      UPDATE accounts
      SET balance = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND version = ?
    `).run(newBalance, now, accountId, account.version);

    if (result.changes === 1) {
      // Record the deposit transaction
      const txId = uuidv4();
      db.prepare(`
        INSERT INTO transactions (id, account_id, card_id, type, amount, merchant_name, merchant_category, status, decline_reason, created_at)
        VALUES (?, ?, NULL, 'deposit', ?, NULL, NULL, 'approved', NULL, ?)
      `).run(txId, accountId, amount, now);

      return { success: true, account: getAccountById(accountId) };
    }

    // Version mismatch — retry
  }

  return { success: false, error: 'Concurrent conflict — please retry' };
}

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  deposit,
};
