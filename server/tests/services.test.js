/**
 * Integration Tests — Services (Account, Card, Transaction)
 *
 * These tests use a real SQLite database (in-memory style via temp file)
 * to verify the full business logic including concurrency handling.
 *
 * Each test suite gets a fresh database to avoid cross-test contamination.
 */
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// --- Test database helper ---
// We override the db module to use a temp file for each test run
const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hsa_test.db');

function setupTestDb() {
  // Remove old test db if it exists
  try { fs.unlinkSync(TEST_DB_PATH); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-shm'); } catch {}

  // We'll use the real db module but point it to a test file
  // First, delete cached modules so we get fresh state
  delete require.cache[require.resolve('../db')];
  delete require.cache[require.resolve('../services/accountService')];
  delete require.cache[require.resolve('../services/cardService')];
  delete require.cache[require.resolve('../services/transactionService')];

  // Override the DB_PATH by patching the environment
  // Actually, let's just use the db module directly and init it fresh
  const dbModule = require('../db');
  const db = dbModule.getDb();

  return { db, dbModule };
}

function teardownTestDb(dbModule) {
  dbModule.closeDb();
  try { fs.unlinkSync(TEST_DB_PATH); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-shm'); } catch {}
}

// ============================================================
// Account Service Tests
// ============================================================
describe('Account Service', () => {
  let dbModule;

  before(() => {
    // Point the db module to our test database
    // We need to set the DB path before importing
    process.env.HSA_DB_PATH = TEST_DB_PATH;
    const setup = setupTestDb();
    dbModule = setup.dbModule;
  });

  after(() => {
    teardownTestDb(dbModule);
    delete process.env.HSA_DB_PATH;
  });

  const accountService = require('../services/accountService');

  it('should create an account with $0 balance', () => {
    const account = accountService.createAccount({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
    });

    assert.ok(account.id, 'Account should have an ID');
    assert.equal(account.first_name, 'Alice');
    assert.equal(account.last_name, 'Smith');
    assert.equal(account.email, 'alice@test.com');
    assert.equal(account.balance, 0);
    assert.equal(account.version, 1);
  });

  it('should reject duplicate emails', () => {
    assert.throws(() => {
      accountService.createAccount({
        firstName: 'Alice',
        lastName: 'Duplicate',
        email: 'alice@test.com',
      });
    }, /UNIQUE constraint/);
  });

  it('should list all accounts', () => {
    accountService.createAccount({
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob@test.com',
    });

    const accounts = accountService.getAllAccounts();
    assert.ok(accounts.length >= 2, 'Should have at least 2 accounts');
  });

  it('should get account by ID', () => {
    const created = accountService.createAccount({
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@test.com',
    });

    const found = accountService.getAccountById(created.id);
    assert.deepEqual(found.id, created.id);
    assert.equal(found.first_name, 'Charlie');
  });

  it('should return null for non-existent account', () => {
    const found = accountService.getAccountById('non-existent-id');
    assert.equal(found, null);
  });

  describe('deposit()', () => {

    it('should deposit funds and increase balance', () => {
      const account = accountService.createAccount({
        firstName: 'DepositTest',
        lastName: 'User',
        email: 'deposit@test.com',
      });

      const result = accountService.deposit(account.id, 500);
      assert.equal(result.success, true);
      assert.equal(result.account.balance, 500);
    });

    it('should accumulate multiple deposits', () => {
      const account = accountService.createAccount({
        firstName: 'MultiDeposit',
        lastName: 'User',
        email: 'multi-deposit@test.com',
      });

      accountService.deposit(account.id, 100);
      accountService.deposit(account.id, 250);
      const result = accountService.deposit(account.id, 50);

      assert.equal(result.success, true);
      assert.equal(result.account.balance, 400);
    });

    it('should increment version on each deposit', () => {
      const account = accountService.createAccount({
        firstName: 'VersionTest',
        lastName: 'User',
        email: 'version@test.com',
      });
      assert.equal(account.version, 1);

      const r1 = accountService.deposit(account.id, 100);
      assert.equal(r1.account.version, 2);

      const r2 = accountService.deposit(account.id, 100);
      assert.equal(r2.account.version, 3);
    });

    it('should reject zero deposit', () => {
      const account = accountService.createAccount({
        firstName: 'ZeroDeposit',
        lastName: 'User',
        email: 'zero@test.com',
      });

      const result = accountService.deposit(account.id, 0);
      assert.equal(result.success, false);
      assert.ok(result.error.includes('positive'));
    });

    it('should reject negative deposit', () => {
      const account = accountService.createAccount({
        firstName: 'NegDeposit',
        lastName: 'User',
        email: 'neg@test.com',
      });

      const result = accountService.deposit(account.id, -50);
      assert.equal(result.success, false);
    });

    it('should reject deposit to non-existent account', () => {
      const result = accountService.deposit('fake-id', 100);
      assert.equal(result.success, false);
      assert.ok(result.error.includes('not found'));
    });
  });
});

// ============================================================
// Card Service Tests
// ============================================================
describe('Card Service', () => {
  let dbModule;

  before(() => {
    process.env.HSA_DB_PATH = TEST_DB_PATH;
    const setup = setupTestDb();
    dbModule = setup.dbModule;
  });

  after(() => {
    teardownTestDb(dbModule);
    delete process.env.HSA_DB_PATH;
  });

  const accountService = require('../services/accountService');
  const cardService = require('../services/cardService');

  it('should issue a card for an account', () => {
    const account = accountService.createAccount({
      firstName: 'CardUser',
      lastName: 'Test',
      email: 'card@test.com',
    });

    const result = cardService.issueCard(account.id);
    assert.equal(result.success, true);
    assert.ok(result.card.id);
    assert.equal(result.card.account_id, account.id);
    assert.equal(result.card.status, 'active');
    assert.ok(result.card.card_number.startsWith('****'));
    assert.equal(result.card.card_last_four.length, 4);
    assert.match(result.card.expiry_date, /^\d{2}\/\d{2}$/);
    assert.equal(result.card.cardholder_name, 'CARDUSER TEST');
  });

  it('should reject issuing a second active card', () => {
    const account = accountService.createAccount({
      firstName: 'TwoCards',
      lastName: 'User',
      email: 'twocards@test.com',
    });

    cardService.issueCard(account.id);
    const result = cardService.issueCard(account.id);

    assert.equal(result.success, false);
    assert.ok(result.error.includes('already has an active card'));
  });

  it('should reject issuing card for non-existent account', () => {
    const result = cardService.issueCard('fake-account-id');
    assert.equal(result.success, false);
    assert.ok(result.error.includes('not found'));
  });

  it('should freeze an active card', () => {
    const account = accountService.createAccount({
      firstName: 'Freeze',
      lastName: 'Card',
      email: 'freeze@test.com',
    });

    const { card } = cardService.issueCard(account.id);
    const result = cardService.updateCardStatus(card.id, 'frozen');

    assert.equal(result.success, true);
    assert.equal(result.card.status, 'frozen');
  });

  it('should unfreeze a frozen card', () => {
    const account = accountService.createAccount({
      firstName: 'Unfreeze',
      lastName: 'Card',
      email: 'unfreeze@test.com',
    });

    const { card } = cardService.issueCard(account.id);
    cardService.updateCardStatus(card.id, 'frozen');
    const result = cardService.updateCardStatus(card.id, 'active');

    assert.equal(result.success, true);
    assert.equal(result.card.status, 'active');
  });

  it('should cancel a card', () => {
    const account = accountService.createAccount({
      firstName: 'Cancel',
      lastName: 'Card',
      email: 'cancel@test.com',
    });

    const { card } = cardService.issueCard(account.id);
    const result = cardService.updateCardStatus(card.id, 'cancelled');

    assert.equal(result.success, true);
    assert.equal(result.card.status, 'cancelled');
  });

  it('should reject updating a cancelled card', () => {
    const account = accountService.createAccount({
      firstName: 'CancelledUpdate',
      lastName: 'Card',
      email: 'cancelled-update@test.com',
    });

    const { card } = cardService.issueCard(account.id);
    cardService.updateCardStatus(card.id, 'cancelled');
    const result = cardService.updateCardStatus(card.id, 'active');

    assert.equal(result.success, false);
    assert.ok(result.error.includes('cancelled'));
  });

  it('should allow issuing a new card after cancelling the old one', () => {
    const account = accountService.createAccount({
      firstName: 'Reissue',
      lastName: 'Card',
      email: 'reissue@test.com',
    });

    const { card: card1 } = cardService.issueCard(account.id);
    cardService.updateCardStatus(card1.id, 'cancelled');

    const result = cardService.issueCard(account.id);
    assert.equal(result.success, true);
    assert.notEqual(result.card.id, card1.id);
  });

  it('should list cards for an account', () => {
    const account = accountService.createAccount({
      firstName: 'ListCards',
      lastName: 'User',
      email: 'listcards@test.com',
    });

    cardService.issueCard(account.id);
    const cards = cardService.getCardsByAccount(account.id);

    assert.ok(cards.length >= 1);
    assert.equal(cards[0].account_id, account.id);
  });

  it('should reject invalid status', () => {
    const account = accountService.createAccount({
      firstName: 'BadStatus',
      lastName: 'User',
      email: 'badstatus@test.com',
    });

    const { card } = cardService.issueCard(account.id);
    const result = cardService.updateCardStatus(card.id, 'destroyed');

    assert.equal(result.success, false);
    assert.ok(result.error.includes('Invalid status'));
  });
});

// ============================================================
// Transaction Service Tests
// ============================================================
describe('Transaction Service', () => {
  let dbModule;

  before(() => {
    process.env.HSA_DB_PATH = TEST_DB_PATH;
    const setup = setupTestDb();
    dbModule = setup.dbModule;
  });

  after(() => {
    teardownTestDb(dbModule);
    delete process.env.HSA_DB_PATH;
  });

  const accountService = require('../services/accountService');
  const cardService = require('../services/cardService');
  const transactionService = require('../services/transactionService');

  // Helper to set up a funded account with a card
  function createFundedAccount(email, balance = 500) {
    const account = accountService.createAccount({
      firstName: 'Test',
      lastName: 'User',
      email,
    });
    accountService.deposit(account.id, balance);
    const { card } = cardService.issueCard(account.id);
    const freshAccount = accountService.getAccountById(account.id);
    return { account: freshAccount, card };
  }

  describe('Valid transactions', () => {

    it('should approve a qualified medical purchase', () => {
      const { account, card } = createFundedAccount('valid-tx@test.com');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 50,
        merchantName: 'CVS Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, true);
      assert.equal(result.transaction.status, 'approved');
      assert.equal(result.transaction.type, 'purchase');
      assert.equal(result.transaction.amount, 50);
      assert.equal(result.transaction.merchant_category, 'pharmacy');

      // Verify balance was deducted
      const updated = accountService.getAccountById(account.id);
      assert.equal(updated.balance, 450);
    });

    it('should deduct the correct amount from balance', () => {
      const { account, card } = createFundedAccount('deduct@test.com', 200);

      transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 75.50,
        merchantName: 'Hospital',
        merchantCategory: 'hospital',
      });

      const updated = accountService.getAccountById(account.id);
      assert.equal(updated.balance, 124.50);
    });
  });

  describe('Transaction declines', () => {

    it('should decline a non-qualified purchase (restaurant)', () => {
      const { account, card } = createFundedAccount('restaurant@test.com');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 25,
        merchantName: 'McDonalds',
        merchantCategory: 'restaurant',
      });

      assert.equal(result.success, false);
      assert.equal(result.transaction.status, 'declined');
      assert.ok(result.error.includes('Non-qualified'));

      // Balance should be unchanged
      const updated = accountService.getAccountById(account.id);
      assert.equal(updated.balance, 500);
    });

    it('should decline a non-qualified purchase (electronics)', () => {
      const { account, card } = createFundedAccount('electronics@test.com');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 999,
        merchantName: 'Best Buy',
        merchantCategory: 'electronics',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.includes('Non-qualified'));
    });

    it('should decline when insufficient funds', () => {
      const { account, card } = createFundedAccount('insufficient@test.com', 50);

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 100,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.includes('Insufficient funds'));
    });

    it('should decline when card is frozen', () => {
      const { account, card } = createFundedAccount('frozen-card@test.com');
      cardService.updateCardStatus(card.id, 'frozen');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 10,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.includes('frozen'));
    });

    it('should decline when card is cancelled', () => {
      const { account, card } = createFundedAccount('cancelled-card@test.com');
      cardService.updateCardStatus(card.id, 'cancelled');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 10,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.includes('cancelled'));
    });

    it('should decline when card does not belong to account', () => {
      const { account: acc1 } = createFundedAccount('cross-card-1@test.com');
      const { card: card2 } = createFundedAccount('cross-card-2@test.com');

      const result = transactionService.processTransaction({
        accountId: acc1.id,
        cardId: card2.id,
        amount: 10,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.includes('does not belong'));
    });

    it('should decline zero amount', () => {
      const { account, card } = createFundedAccount('zero-amount@test.com');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 0,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
    });

    it('should decline negative amount', () => {
      const { account, card } = createFundedAccount('neg-amount@test.com');

      const result = transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: -50,
        merchantName: 'Pharmacy',
        merchantCategory: 'pharmacy',
      });

      assert.equal(result.success, false);
    });
  });

  describe('Transaction history', () => {

    it('should record approved transactions in history', () => {
      const { account, card } = createFundedAccount('history-approved@test.com');

      transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 30,
        merchantName: 'Clinic',
        merchantCategory: 'clinic',
      });

      const history = transactionService.getTransactionsByAccount(account.id);
      // Should include deposit + purchase
      assert.ok(history.length >= 2);

      const purchase = history.find(t => t.type === 'purchase');
      assert.equal(purchase.status, 'approved');
      assert.equal(purchase.merchant_name, 'Clinic');
    });

    it('should record declined transactions in history', () => {
      const { account, card } = createFundedAccount('history-declined@test.com');

      transactionService.processTransaction({
        accountId: account.id,
        cardId: card.id,
        amount: 30,
        merchantName: 'Restaurant',
        merchantCategory: 'restaurant',
      });

      const history = transactionService.getTransactionsByAccount(account.id);
      const declined = history.find(t => t.status === 'declined');
      assert.ok(declined);
      assert.ok(declined.decline_reason.includes('Non-qualified'));
    });
  });

  describe('Concurrency handling', () => {

    it('should never allow balance to go negative with concurrent transactions', () => {
      const { account, card } = createFundedAccount('concurrent@test.com', 100);

      // Simulate concurrent: two $80 transactions against $100 balance
      const result = transactionService.simulateConcurrent({
        accountId: account.id,
        cardId: card.id,
        transactions: [
          { amount: 80, merchantName: 'Pharmacy A', merchantCategory: 'pharmacy' },
          { amount: 80, merchantName: 'Pharmacy B', merchantCategory: 'pharmacy' },
        ],
      });

      const approved = result.results.filter(r => r.success);
      const declined = result.results.filter(r => !r.success);

      assert.equal(approved.length, 1, 'Exactly 1 transaction should be approved');
      assert.equal(declined.length, 1, 'Exactly 1 transaction should be declined');
      assert.equal(result.finalBalance, 20, 'Final balance should be $20');
      assert.ok(result.finalBalance >= 0, 'Balance must never be negative');
    });

    it('should handle many concurrent transactions correctly', () => {
      const { account, card } = createFundedAccount('many-concurrent@test.com', 500);

      // 10 x $80 against $500 → should approve exactly 6 ($480), decline 4
      const txs = Array.from({ length: 10 }, (_, i) => ({
        amount: 80,
        merchantName: `Pharmacy ${i + 1}`,
        merchantCategory: 'pharmacy',
      }));

      const result = transactionService.simulateConcurrent({
        accountId: account.id,
        cardId: card.id,
        transactions: txs,
      });

      const approved = result.results.filter(r => r.success).length;
      const maxAffordable = Math.floor(500 / 80); // = 6

      assert.equal(approved, maxAffordable,
        `Expected ${maxAffordable} approved, got ${approved}`);
      assert.equal(result.finalBalance, 500 - (maxAffordable * 80),
        `Expected final balance ${500 - (maxAffordable * 80)}, got ${result.finalBalance}`);
      assert.ok(result.finalBalance >= 0, 'Balance must never be negative');
    });

    it('should approve all when total is within balance', () => {
      const { account, card } = createFundedAccount('all-approved@test.com', 500);

      const result = transactionService.simulateConcurrent({
        accountId: account.id,
        cardId: card.id,
        transactions: [
          { amount: 100, merchantName: 'Pharmacy 1', merchantCategory: 'pharmacy' },
          { amount: 100, merchantName: 'Pharmacy 2', merchantCategory: 'pharmacy' },
          { amount: 100, merchantName: 'Pharmacy 3', merchantCategory: 'pharmacy' },
        ],
      });

      const approved = result.results.filter(r => r.success).length;
      assert.equal(approved, 3, 'All 3 should be approved');
      assert.equal(result.finalBalance, 200);
    });

    it('should decline all non-qualified concurrent transactions', () => {
      const { account, card } = createFundedAccount('all-declined-cat@test.com', 1000);

      const result = transactionService.simulateConcurrent({
        accountId: account.id,
        cardId: card.id,
        transactions: [
          { amount: 50, merchantName: 'Restaurant A', merchantCategory: 'restaurant' },
          { amount: 50, merchantName: 'Restaurant B', merchantCategory: 'restaurant' },
        ],
      });

      const approved = result.results.filter(r => r.success).length;
      assert.equal(approved, 0, 'No restaurant transactions should be approved');
      assert.equal(result.finalBalance, 1000, 'Balance should be unchanged');
    });

    it('should handle exact balance exhaustion', () => {
      const { account, card } = createFundedAccount('exact@test.com', 100);

      const result = transactionService.simulateConcurrent({
        accountId: account.id,
        cardId: card.id,
        transactions: [
          { amount: 50, merchantName: 'Pharmacy 1', merchantCategory: 'pharmacy' },
          { amount: 50, merchantName: 'Pharmacy 2', merchantCategory: 'pharmacy' },
        ],
      });

      const approved = result.results.filter(r => r.success).length;
      assert.equal(approved, 2, 'Both should be approved (exactly $100)');
      assert.equal(result.finalBalance, 0, 'Balance should be exactly $0');
    });
  });
});
