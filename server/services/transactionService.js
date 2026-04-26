const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { classifyMerchant } = require('../utils/merchantCategories');

/**
 * Process a purchase transaction using optimistic locking.
 *
 * Validates:
 * 1. Account exists
 * 2. Card exists and is active
 * 3. Card belongs to the account
 * 4. Merchant category is a qualified medical expense
 * 5. Sufficient balance (with optimistic lock)
 *
 * @param {{ accountId: string, cardId: string, amount: number, merchantName: string, merchantCategory: string }} data
 * @param {number} [maxRetries=3]
 * @returns {{ success: boolean, transaction?: object, error?: string }}
 */
function processTransaction({ accountId, cardId, amount, merchantName, merchantCategory }, maxRetries = 3) {
  const db = getDb();
  const now = new Date().toISOString();

  // --- Validation (before touching balance) ---

  if (!amount || amount <= 0) {
    return declineTransaction(db, {
      accountId, cardId, amount: amount || 0, merchantName, merchantCategory,
      reason: 'Transaction amount must be positive', now,
    });
  }

  // Verify account exists
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  // Verify card exists and belongs to account
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  if (!card) {
    return declineTransaction(db, {
      accountId, cardId: null, amount, merchantName, merchantCategory,
      reason: 'Card not found', now,
    });
  }
  if (card.account_id !== accountId) {
    return declineTransaction(db, {
      accountId, cardId, amount, merchantName, merchantCategory,
      reason: 'Card does not belong to this account', now,
    });
  }
  if (card.status !== 'active') {
    return declineTransaction(db, {
      accountId, cardId, amount, merchantName, merchantCategory,
      reason: `Card is ${card.status}`, now,
    });
  }

  // Classify merchant category
  const classification = classifyMerchant(merchantCategory);
  if (!classification.qualified) {
    return declineTransaction(db, {
      accountId, cardId, amount, merchantName, merchantCategory,
      reason: classification.reason, now,
    });
  }

  // --- Balance check + debit with optimistic locking ---
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Re-read account for fresh balance and version
    const freshAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);

    if (freshAccount.balance < amount) {
      return declineTransaction(db, {
        accountId, cardId, amount, merchantName, merchantCategory,
        reason: `Insufficient funds (balance: $${freshAccount.balance.toFixed(2)}, requested: $${amount.toFixed(2)})`,
        now,
      });
    }

    const newBalance = freshAccount.balance - amount;
    const updateNow = new Date().toISOString();

    const result = db.prepare(`
      UPDATE accounts
      SET balance = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND version = ?
    `).run(newBalance, updateNow, accountId, freshAccount.version);

    if (result.changes === 1) {
      // Success — record approved transaction
      const txId = uuidv4();
      db.prepare(`
        INSERT INTO transactions (id, account_id, card_id, type, amount, merchant_name, merchant_category, status, decline_reason, created_at)
        VALUES (?, ?, ?, 'purchase', ?, ?, ?, 'approved', NULL, ?)
      `).run(txId, accountId, cardId, amount, merchantName, merchantCategory, updateNow);

      const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
      return { success: true, transaction };
    }

    // Version mismatch — retry with fresh data
  }

  // All retries exhausted
  return declineTransaction(db, {
    accountId, cardId, amount, merchantName, merchantCategory,
    reason: 'Transaction failed due to concurrent conflict — please retry', now,
  });
}

/**
 * Record a declined transaction.
 */
function declineTransaction(db, { accountId, cardId, amount, merchantName, merchantCategory, reason, now }) {
  const txId = uuidv4();
  db.prepare(`
    INSERT INTO transactions (id, account_id, card_id, type, amount, merchant_name, merchant_category, status, decline_reason, created_at)
    VALUES (?, ?, ?, 'purchase', ?, ?, ?, 'declined', ?, ?)
  `).run(txId, accountId, cardId, amount, merchantName || null, merchantCategory || null, reason, now);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  return { success: false, transaction, error: reason };
}

/**
 * Get transactions for an account.
 * @param {string} accountId
 * @returns {object[]}
 */
function getTransactionsByAccount(accountId) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC'
  ).all(accountId);
}

/**
 * Simulate concurrent transactions for demo purposes.
 * Fires multiple transactions simultaneously against the same account.
 *
 * @param {{ accountId: string, cardId: string, transactions: Array<{ amount: number, merchantName: string, merchantCategory: string }> }} data
 * @returns {{ results: object[], finalBalance: number }}
 */
function simulateConcurrent({ accountId, cardId, transactions }) {
  // Process all transactions sequentially but with the same optimistic locking
  // Each one reads fresh state — simulates concurrent behavior where
  // only operations with valid version succeed
  const results = transactions.map((tx) =>
    processTransaction({
      accountId,
      cardId,
      amount: tx.amount,
      merchantName: tx.merchantName,
      merchantCategory: tx.merchantCategory,
    })
  );

  const db = getDb();
  const finalAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);

  return {
    results,
    finalBalance: finalAccount ? finalAccount.balance : 0,
  };
}

module.exports = {
  processTransaction,
  getTransactionsByAccount,
  simulateConcurrent,
};
