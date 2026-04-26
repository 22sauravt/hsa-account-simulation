const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');

// POST /api/accounts — Create a new HSA account
router.post('/', (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const account = accountService.createAccount({ firstName, lastName, email });
    res.status(201).json(account);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accounts — List all accounts
router.get('/', (req, res) => {
  try {
    const accounts = accountService.getAllAccounts();
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accounts/:id — Get account details
router.get('/:id', (req, res) => {
  try {
    const account = accountService.getAccountById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/accounts/:id/deposit — Deposit funds
router.post('/:id/deposit', (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'A numeric amount is required' });
    }

    const result = accountService.deposit(req.params.id, amount);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.account);
  } catch (err) {
    console.error('Error depositing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
