const express = require('express');
const router = express.Router();
const cardService = require('../services/cardService');

// POST /api/accounts/:accountId/cards — Issue a new card
router.post('/accounts/:accountId/cards', (req, res) => {
  try {
    const result = cardService.issueCard(req.params.accountId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.card);
  } catch (err) {
    console.error('Error issuing card:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accounts/:accountId/cards — Get cards for an account
router.get('/accounts/:accountId/cards', (req, res) => {
  try {
    const cards = cardService.getCardsByAccount(req.params.accountId);
    res.json(cards);
  } catch (err) {
    console.error('Error fetching cards:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/cards/:id — Update card status
router.patch('/cards/:id', (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const result = cardService.updateCardStatus(req.params.id, status);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.card);
  } catch (err) {
    console.error('Error updating card:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
