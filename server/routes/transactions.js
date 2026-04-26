const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');
const { ALL_CATEGORIES } = require('../utils/merchantCategories');

// POST /api/transactions — Process a purchase transaction
router.post('/', (req, res) => {
  try {
    const { accountId, cardId, amount, merchantName, merchantCategory } = req.body;

    if (!accountId || !cardId || !amount || !merchantName || !merchantCategory) {
      return res.status(400).json({
        error: 'accountId, cardId, amount, merchantName, and merchantCategory are required',
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const result = transactionService.processTransaction({
      accountId,
      cardId,
      amount,
      merchantName,
      merchantCategory,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('Error processing transaction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accounts/:accountId/transactions — Get transaction history
router.get('/accounts/:accountId/transactions', (req, res) => {
  try {
    const transactions = transactionService.getTransactionsByAccount(req.params.accountId);
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/test/concurrent — Simulate concurrent transactions
router.post('/test/concurrent', (req, res) => {
  try {
    const { accountId, cardId, transactions } = req.body;

    if (!accountId || !cardId || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'accountId, cardId, and transactions array are required',
      });
    }

    const result = transactionService.simulateConcurrent({ accountId, cardId, transactions });
    res.json(result);
  } catch (err) {
    console.error('Error simulating concurrent transactions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories — Get all merchant categories (for UI dropdown)
router.get('/categories', (req, res) => {
  res.json(ALL_CATEGORIES);
});

module.exports = router;
