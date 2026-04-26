# Installation Guide

This guide walks you through setting up and running the HSA Account Simulation from scratch.

> **See also:** [requirements.txt](./requirements.txt) for the full list of dependencies and versions.

---

## Prerequisites

| Requirement | Version | Check |
|:------------|:--------|:------|
| **Node.js** | ≥ 20.0.0 | `node --version` |
| **npm** | ≥ 9.0.0 (included with Node) | `npm --version` |
| **C++ compiler** | Any (for `better-sqlite3` native build) | See below |

### Installing Node.js

**Option A — nvm (recommended):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart your terminal, then:
nvm install 20
nvm use 20
```

**Option B — Direct download:**

Download from [https://nodejs.org](https://nodejs.org) (LTS version).

### C++ Compiler (for better-sqlite3)

`better-sqlite3` compiles native C++ bindings during `npm install`. Most systems already have a compiler:

- **macOS:** Run `xcode-select --install` if you haven't already.
- **Ubuntu/Debian:** `sudo apt-get install build-essential python3`
- **Windows:** Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or run `npm install -g windows-build-tools`

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd hsa-account-simulation
```

### 2. Install all dependencies

This single command installs root, server, and client dependencies:

```bash
npm install              # Installs root deps (concurrently)
npm run install:all      # Installs server + client deps
```

**What this does:**
- Root: installs `concurrently` (runs both servers in parallel)
- `server/`: installs Express, better-sqlite3, cors, uuid
- `client/`: installs React, Vite, and related dev tools

### 3. Verify installation

```bash
# Check Node version
node --version    # Should be >= 20.0.0

# Check deps installed correctly
ls server/node_modules/.package-lock.json && echo "✅ Server deps OK"
ls client/node_modules/.package-lock.json && echo "✅ Client deps OK"
```

---

## Running the Application

### Start both servers (recommended)

```bash
npm run dev
```

This starts:
- **Backend API** at `http://localhost:3001`
- **Frontend UI** at `http://localhost:5173`

Open **http://localhost:5173** in your browser.

### Start servers individually

```bash
# Terminal 1 — Backend
npm run dev:server     # Express on port 3001

# Terminal 2 — Frontend
npm run dev:client     # Vite on port 5173
```

---

## Running Tests

```bash
npm test
```

This runs 59 unit and integration tests covering:
- Merchant category classification
- Card generation utilities
- Account, card, and transaction service logic
- Concurrency correctness (balance never goes negative)

---

## Project Structure

```
hsa-account-simulation/
├── package.json          ← Root scripts (dev, test, install:all)
├── requirements.txt      ← Dependency list
├── installation.md       ← This file
├── architecture.md       ← System design docs
├── ai-usage.md           ← AI tool documentation
├── README.md             ← Project overview
│
├── server/               ← Express API backend
│   ├── package.json
│   ├── index.js          ← Server entry point
│   ├── db.js             ← SQLite setup (WAL mode, schema)
│   ├── routes/           ← Express route handlers
│   ├── services/         ← Business logic layer
│   ├── utils/            ← Merchant categories, card generator
│   ├── tests/            ← Unit + integration tests
│   └── data/             ← SQLite database file (auto-created)
│
└── client/               ← React + Vite frontend
    ├── package.json
    ├── vite.config.js    ← Proxy config (→ backend on :3001)
    ├── index.html
    └── src/
        ├── App.jsx       ← Main app with tab navigation
        ├── index.css     ← Design system
        ├── components/   ← UI components
        └── hooks/        ← Custom React hooks
```

---

## Troubleshooting

### `better-sqlite3` fails to install
This usually means a C++ compiler is missing. See the [Prerequisites](#prerequisites) section.

### Port already in use
If port 3001 or 5173 is taken:
```bash
# Kill existing processes
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or use custom ports
PORT=3002 npm run dev:server
```
If you change the backend port, also update `client/vite.config.js` proxy target.

### Database issues
The SQLite database is auto-created at `server/data/hsa.db` on first run. To reset:
```bash
rm -f server/data/hsa.db server/data/hsa.db-wal server/data/hsa.db-shm
```
The schema will be recreated automatically on next server start.

### nvm: command not found
If using nvm, make sure to source it in your shell:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
Add this to your `~/.zshrc` or `~/.bashrc` for persistence.
