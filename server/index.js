const express = require('express');
const cors = require('cors');
const { getDb, closeDb } = require('./db');

const accountRoutes = require('./routes/accounts');
const cardRoutes = require('./routes/cards');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
getDb();
console.log('✅ Database initialized');

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api', cardRoutes);           // /api/accounts/:id/cards + /api/cards/:id
app.use('/api/transactions', transactionRoutes);  // /api/transactions + /api/test/concurrent
app.use('/api', transactionRoutes);     // /api/accounts/:id/transactions + /api/categories

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 HSA Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  closeDb();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  closeDb();
  server.close(() => process.exit(0));
});
