import { useState, useEffect, useCallback } from 'react';
import AccountForm from './components/AccountForm';
import AccountList from './components/AccountList';
import DepositForm from './components/DepositForm';
import CardManager from './components/CardManager';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import ConcurrencyDemo from './components/ConcurrencyDemo';
import { ToastContainer, useToast } from './components/Toast';

const TABS = [
  { id: 'accounts', label: 'Accounts', icon: '🏦' },
  { id: 'deposit', label: 'Deposit', icon: '💰' },
  { id: 'cards', label: 'Cards', icon: '💳' },
  { id: 'transactions', label: 'Transactions', icon: '🛒' },
  { id: 'concurrency', label: 'Concurrency', icon: '⚡' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [cards, setCards] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  // Fetch all accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch cards when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchCards(selectedAccount.id);
    } else {
      setCards([]);
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchCards = async (accountId) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/cards`);
      const data = await res.json();
      setCards(data);
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    }
  };

  const refreshSelected = useCallback(async () => {
    if (selectedAccount) {
      try {
        const res = await fetch(`/api/accounts/${selectedAccount.id}`);
        const data = await res.json();
        setSelectedAccount(data);
        // Also refresh account list
        fetchAccounts();
        setRefreshKey((k) => k + 1);
      } catch (err) {
        console.error('Failed to refresh account:', err);
      }
    }
  }, [selectedAccount]);

  const handleAccountCreated = (account) => {
    fetchAccounts();
    setSelectedAccount(account);
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  const handleDeposited = (updatedAccount) => {
    setSelectedAccount(updatedAccount);
    fetchAccounts();
    setRefreshKey((k) => k + 1);
  };

  const handleCardIssued = () => {
    if (selectedAccount) {
      fetchCards(selectedAccount.id);
    }
  };

  const handleTransacted = () => {
    refreshSelected();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="content-grid">
            <div>
              <AccountForm onCreated={handleAccountCreated} toast={toast} />
            </div>
            <div>
              <AccountList
                accounts={accounts}
                selectedId={selectedAccount?.id}
                onSelect={handleAccountSelect}
              />
              {selectedAccount && (
                <div className="glass-card mt-24 fade-in">
                  <div className="glass-card-header">
                    <div>
                      <div className="glass-card-title">Account Details</div>
                      <div className="glass-card-subtitle">{selectedAccount.email}</div>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <div className="balance-label">Balance</div>
                  <div className="balance-display">${selectedAccount.balance.toFixed(2)}</div>
                  <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Account ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{selectedAccount.id}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'deposit':
        return (
          <div className="content-grid">
            <div>
              <AccountList
                accounts={accounts}
                selectedId={selectedAccount?.id}
                onSelect={handleAccountSelect}
              />
            </div>
            <div>
              <DepositForm
                account={selectedAccount}
                onDeposited={handleDeposited}
                toast={toast}
              />
              <div className="mt-24">
                <TransactionHistory
                  account={selectedAccount}
                  refreshKey={refreshKey}
                />
              </div>
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="content-grid">
            <div>
              <AccountList
                accounts={accounts}
                selectedId={selectedAccount?.id}
                onSelect={handleAccountSelect}
              />
            </div>
            <div>
              <CardManager
                account={selectedAccount}
                onCardIssued={handleCardIssued}
                toast={toast}
              />
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="content-grid">
            <div>
              <AccountList
                accounts={accounts}
                selectedId={selectedAccount?.id}
                onSelect={handleAccountSelect}
              />
            </div>
            <div>
              <TransactionForm
                account={selectedAccount}
                cards={cards}
                onTransacted={handleTransacted}
                toast={toast}
              />
              <div className="mt-24">
                <TransactionHistory
                  account={selectedAccount}
                  refreshKey={refreshKey}
                />
              </div>
            </div>
          </div>
        );

      case 'concurrency':
        return (
          <div className="content-grid">
            <div>
              <AccountList
                accounts={accounts}
                selectedId={selectedAccount?.id}
                onSelect={handleAccountSelect}
              />
            </div>
            <div>
              <ConcurrencyDemo
                account={selectedAccount}
                cards={cards}
                onComplete={refreshSelected}
                toast={toast}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <ToastContainer toasts={toast.toasts} />

      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">H</div>
          <div>
            <h1>HSA Platform</h1>
            <div className="app-logo-subtitle">Health Savings Account Simulation</div>
          </div>
        </div>
        {selectedAccount && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Selected Account</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {selectedAccount.first_name} {selectedAccount.last_name}
            </div>
          </div>
        )}
      </header>

      <nav className="tab-nav" id="main-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="fade-in" key={activeTab}>
        {renderTabContent()}
      </main>
    </div>
  );
}
