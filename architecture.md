# Architecture — HSA Account Simulation

## System Architecture

The HSA Account Simulation is a full-stack web application built with a two-tier architecture:

```
┌──────────────────────────────┐
│         Browser (UI)         │
│   React + Vite (port 5173)   │
└────────────┬─────────────────┘
             │ HTTP / JSON (proxied via Vite)
             ▼
┌──────────────────────────────┐
│    Express API Server        │
│    Node.js (port 3001)       │
├──────────────────────────────┤
│   Routes → Services → DB    │
└────────────┬─────────────────┘
             │ Synchronous (better-sqlite3)
             ▼
┌──────────────────────────────┐
│     SQLite Database          │
│     WAL mode enabled         │
│     (server/data/hsa.db)     │
└──────────────────────────────┘
```

### Technology Choices

| Component | Technology | Why |
|:----------|:-----------|:----|
| Frontend | React + Vite | Component-based UI with fast hot reload. Vite's proxy eliminates CORS hassles. |
| Backend | Express (Node.js) | Lightweight REST API. Synchronous `better-sqlite3` simplifies transaction logic. |
| Database | SQLite + WAL | Zero-config file-based persistence. WAL mode supports concurrent readers with a single writer. |
| Concurrency | Optimistic Locking | Version column on accounts prevents balance overdraw without serializing all writes. |

---

## Request Flow

### Example: Processing a Purchase Transaction

```
1. User fills transaction form → clicks "Process Transaction"
2. Frontend POST /api/transactions { accountId, cardId, amount, merchantName, merchantCategory }
3. Express routes to transactionService.processTransaction()
4. Service runs validation pipeline:
   a. Validate positive amount
   b. Verify account exists
   c. Verify card exists, belongs to account, and is active
   d. Classify merchant category (pharmacy → qualified, restaurant → non-qualified)
   e. If non-qualified → DECLINE immediately
5. Optimistic lock loop (up to 3 retries):
   a. Read account.balance and account.version
   b. Check balance >= amount → if not, DECLINE (insufficient funds)
   c. UPDATE accounts SET balance = balance - amount, version = version + 1
      WHERE id = ? AND version = ?
   d. If rows affected = 1 → SUCCESS, record approved transaction
   e. If rows affected = 0 → version mismatch, RETRY from step 5a
6. If all retries exhausted → DECLINE (concurrent conflict)
7. Response returned to frontend with transaction details
8. UI shows toast notification and updates balance display
```

---

## Data Model

### accounts
| Column | Type | Description |
|:-------|:-----|:------------|
| id | TEXT (UUID) | Primary key |
| first_name | TEXT | Account holder's first name |
| last_name | TEXT | Account holder's last name |
| email | TEXT (UNIQUE) | Email address |
| balance | REAL | Current balance in dollars |
| version | INTEGER | Optimistic lock version counter |
| created_at | TEXT | ISO-8601 creation timestamp |
| updated_at | TEXT | ISO-8601 last-modified timestamp |

### cards
| Column | Type | Description |
|:-------|:-----|:------------|
| id | TEXT (UUID) | Primary key |
| account_id | TEXT (FK) | References accounts.id |
| card_number | TEXT | Masked card number (**** **** **** 1234) |
| card_last_four | TEXT | Last 4 digits for display |
| cardholder_name | TEXT | Name on card (uppercase) |
| expiry_date | TEXT | MM/YY format |
| cvv | TEXT | 3-digit security code |
| status | TEXT | 'active', 'frozen', or 'cancelled' |
| created_at | TEXT | ISO-8601 timestamp |

### transactions
| Column | Type | Description |
|:-------|:-----|:------------|
| id | TEXT (UUID) | Primary key |
| account_id | TEXT (FK) | References accounts.id |
| card_id | TEXT (FK, nullable) | References cards.id (null for deposits) |
| type | TEXT | 'deposit' or 'purchase' |
| amount | REAL | Transaction amount |
| merchant_name | TEXT (nullable) | Name of merchant |
| merchant_category | TEXT (nullable) | Category code (e.g. 'pharmacy') |
| status | TEXT | 'approved' or 'declined' |
| decline_reason | TEXT (nullable) | Why the transaction was declined |
| created_at | TEXT | ISO-8601 timestamp |

### Key Relationships
- Each account can have multiple cards (but only one active at a time)
- Each account has a transaction history (deposits + purchases)
- Each purchase transaction references the card used
- Deposits have no card_id (they're direct account funding)

---

## Concurrency Handling

### The Problem
When two transactions arrive simultaneously for the same account, both might read the same balance and both approve — resulting in a negative balance.

**Example:**
- Balance: $100
- Transaction A: $80 (reads balance $100 → approves)
- Transaction B: $50 (reads balance $100 → approves)
- Result: Balance = -$30 ❌

### The Solution: Optimistic Locking

Every account row has a `version` integer. When updating a balance:

```sql
UPDATE accounts
SET balance = ?, version = version + 1, updated_at = ?
WHERE id = ? AND version = ?
```

If another transaction has already modified the account (incrementing the version), this UPDATE affects 0 rows. The service detects this and retries with fresh data.

**Same example with optimistic locking:**
- Balance: $100, version: 1
- Transaction A: reads (balance=100, version=1) → UPDATE WHERE version=1 → 1 row affected ✅
- Transaction B: reads (balance=100, version=1) → UPDATE WHERE version=1 → 0 rows affected (version is now 2) → retry
- Transaction B retry: reads (balance=20, version=2) → $50 > $20 → DECLINED (insufficient funds) ✅
- Final balance: $20 ✅

### Why Not Pessimistic Locking?
Pessimistic locking (`BEGIN EXCLUSIVE`) serializes ALL write transactions, even to different accounts. Optimistic locking only conflicts when two transactions hit the same account simultaneously — much better throughput for a system with many accounts.

### Database Configuration
```javascript
db.pragma('journal_mode = WAL');    // Write-Ahead Logging: concurrent reads
db.pragma('busy_timeout = 5000');   // Wait up to 5s for locks instead of failing
db.pragma('foreign_keys = ON');     // Enforce referential integrity
```

---

## Qualified Medical Expense Classification

The system classifies merchant categories using a simple lookup set based on IRS Publication 502 guidelines:

**Qualified:** pharmacy, hospital, clinic, dentist, optometrist, vision, medical_supply, mental_health, chiropractor, urgent_care, laboratory, doctor, prescription, rehabilitation

**Non-qualified:** restaurant, electronics, grocery, gas_station, clothing, entertainment, travel, hotel, sporting_goods, home_improvement

This approach was chosen over more complex alternatives (ML classification, merchant code databases) because:
1. It's deterministic and auditable
2. It covers the assignment's test cases perfectly
3. It's trivially extensible — add new categories to the Set
4. In production, this would be replaced by MCC (Merchant Category Code) lookup from card networks

---

## Design Tradeoffs

### SQLite vs PostgreSQL
**Chose SQLite** because:
- Zero configuration (no database server to install)
- File-based — reviewer can `git clone && npm install && npm run dev`
- `better-sqlite3` provides synchronous API, making transaction logic clearer
- WAL mode provides adequate concurrency for a single-server app

**Tradeoff:** SQLite doesn't support true multi-process concurrent writes. For a production HSA platform, PostgreSQL with `SELECT ... FOR UPDATE` would be more appropriate.

### Optimistic vs Pessimistic Locking
**Chose optimistic** because it maximizes concurrency. In a system where most transactions hit different accounts, pessimistic locking would be unnecessarily restrictive. The retry logic adds complexity but provides better throughput.

### Server-Side vs Client-Side Validation
**Both.** The client provides immediate UX feedback (e.g., "❌ Non-qualified — will be declined" hint before submission), but all authorization decisions are server-side. The client is untrusted — a malicious request would still be rejected.

### Single Active Card Per Account
**Chose one active card at a time** because HSA providers (Optum, Fidelity, HealthEquity) typically issue a single debit card per account. This also reduces fraud surface area — with one active card, unauthorized transactions are easier to detect and the account holder can freeze or cancel immediately without ambiguity about which card was compromised. A new card can be issued after cancelling the previous one.

### Monorepo Structure
**Chose a single repo** with `server/` and `client/` directories. For a take-home assignment, this is simpler to review. A root `package.json` with `concurrently` starts both with `npm run dev`. In production, these would likely be separate deployments.

---

## Future Improvements

- **Dependent cards** — Allow account holders to issue additional debit cards for dependents (spouse, children). This is common with real HSA providers but was intentionally omitted since the assignment specifies each account "may have a virtual debit card" (singular). The data model already supports multiple cards per account, so this would primarily be a UI and business logic change.
- **Annual contribution limits** — Enforce IRS annual contribution caps ($4,150 individual / $8,300 family for 2024). Currently deposits are unlimited.
- **Receipt uploads** — Allow users to attach receipts or EOBs to transactions for tax documentation and audit trails.
- **MCC-based classification** — Replace the category dropdown with real Merchant Category Code (MCC) lookup from card networks for more accurate qualified expense determination.
- **PostgreSQL migration** — For production multi-server deployments, migrate from SQLite to PostgreSQL with `SELECT ... FOR UPDATE` row-level locking for true concurrent write support.
- **Authentication** — Add user login with session management. Currently the app has no auth since it's a simulation.
- **Email verification** — Send a confirmation email on account creation and require the user to verify before the account becomes active. Currently the system validates email format but does not verify ownership.
