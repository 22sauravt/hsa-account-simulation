# HSA Account Simulation

A full-stack Health Savings Account (HSA) platform that allows users to create accounts, deposit funds, issue virtual debit cards, and process transactions with qualified medical expense validation and concurrent transaction safety.

## Quick Start

```bash
# Prerequisites: Node.js 20+ (via nvm)
nvm use v20 # or v24

# Install all dependencies
npm run install:all

# Start the app (backend + frontend)
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Features

- **Create HSA Accounts** — Set up accounts with name and email
- **Deposit Funds** — Add funds with quick-amount buttons ($50–$1000)
- **Virtual Debit Cards** — Issue, freeze, cancel, and unfreeze cards with a visual card UI
- **Process Transactions** — Simulated purchases against categorized merchants
  - ✅ Qualified medical expenses (pharmacy, hospital, dentist, etc.) → Approved
  - ❌ Non-qualified (restaurant, electronics, etc.) → Declined
- **Concurrency Demo** — Fire multiple simultaneous transactions to prove the balance never goes negative

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