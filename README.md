# HSA Account Simulation

A full-stack Health Savings Account (HSA) platform that allows users to create accounts, deposit funds, issue virtual debit cards, and process transactions with qualified medical expense validation and concurrent transaction safety.

## Quick Start

```bash
# Prerequisites: Node.js 20+
node --version   # Verify ≥ 20.0.0

# Install all dependencies
npm install              # Root deps (concurrently)
npm run install:all      # Server + client deps

# Start the app (backend + frontend)
npm run dev
```

Then open **http://localhost:5173** in your browser.

> **First time?** See [installation.md](./installation.md) for detailed setup instructions and troubleshooting.

## Features

- **Create HSA Accounts** — Set up accounts with name and email (with email validation and Quick Fill for testing)
- **Deposit Funds** — Add funds with quick-amount buttons ($50–$1000)
- **Virtual Debit Cards** — Issue, freeze, unfreeze, and cancel cards with a visual card UI
- **Process Transactions** — Purchases validated against merchant categories
  - ✅ Qualified medical expenses (pharmacy, hospital, dentist, etc.) → Approved
  - ❌ Non-qualified (restaurant, electronics, etc.) → Declined
- **Batch Payments** — Process multiple transactions simultaneously to demonstrate concurrency safety
- **Spending Breakdown** — Donut chart showing spending by medical category
- **Account Management** — Delete accounts with cascading cleanup of cards and transactions

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3, WAL mode) |
| Concurrency | Optimistic locking (version column) |

## Project Structure

```
├── server/             # Express API backend
│   ├── index.js        # Entry point
│   ├── db.js           # SQLite setup + schema
│   ├── routes/         # Express routers
│   ├── services/       # Business logic
│   └── utils/          # Merchant categories, card generator
├── client/             # React + Vite frontend
│   └── src/
│       ├── App.jsx     # Main app with tab navigation
│       ├── components/ # UI components
│       └── hooks/      # Custom React hooks
├── architecture.md     # System design documentation
└── ai-usage.md         # AI tool usage documentation
```

## Documentation

- [**architecture.md**](./architecture.md) — System architecture, request flow, data model, concurrency handling, design tradeoffs
- [**ai-usage.md**](./ai-usage.md) — AI tools used, representative prompts, verification approach