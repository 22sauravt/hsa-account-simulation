import { useState } from 'react';

export default function ConcurrencyDemo({ account, cards, onComplete, toast }) {
  const [numTransactions, setNumTransactions] = useState(5);
  const [amountEach, setAmountEach] = useState(30);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const activeCard = (cards || []).find((c) => c.status === 'active');

  if (!account) {
    return (
      <div className="glass-card fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <div className="empty-state-text">Select an account first</div>
          <div className="empty-state-hint">Choose an account from the Accounts tab to test concurrency</div>
        </div>
      </div>
    );
  }

  if (!activeCard) {
    return (
      <div className="glass-card fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-text">No active card</div>
          <div className="empty-state-hint">Issue a card in the Cards tab first</div>
        </div>
      </div>
    );
  }

  const handleSimulate = async () => {
    setLoading(true);
    setResults(null);

    const transactions = Array.from({ length: numTransactions }, (_, i) => ({
      amount: amountEach,
      merchantName: `Pharmacy #${i + 1}`,
      merchantCategory: 'pharmacy',
    }));

    try {
      const res = await fetch('/api/test/concurrent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          cardId: activeCard.id,
          transactions,
        }),
      });
      const data = await res.json();
      setResults(data);

      const approved = data.results.filter((r) => r.success).length;
      const declined = data.results.filter((r) => !r.success).length;

      if (declined > 0) {
        toast.info(`${approved} approved, ${declined} declined — balance protected!`);
      } else {
        toast.success(`All ${approved} transactions approved`);
      }

      onComplete();
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const expectedMax = Math.floor(account.balance / amountEach);
  const totalRequested = numTransactions * amountEach;

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">⚡ Concurrency Simulation</div>
          <div className="glass-card-subtitle">
            Test that concurrent transactions never overdraw the account
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="balance-label">Current Balance</div>
        <div className="balance-display small">${account.balance.toFixed(2)}</div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="numTx">Number of Transactions</label>
          <input
            id="numTx"
            className="form-input"
            type="number"
            min="2"
            max="20"
            value={numTransactions}
            onChange={(e) => setNumTransactions(parseInt(e.target.value) || 2)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="amtEach">Amount Each ($)</label>
          <input
            id="amtEach"
            className="form-input"
            type="number"
            min="1"
            step="0.01"
            value={amountEach}
            onChange={(e) => setAmountEach(parseFloat(e.target.value) || 1)}
          />
        </div>
      </div>

      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
      }}>
        <div>📊 Total requested: <strong style={{ color: 'var(--text-primary)' }}>${totalRequested.toFixed(2)}</strong></div>
        <div>📊 Max affordable: <strong style={{ color: 'var(--accent-primary)' }}>{expectedMax} × ${amountEach.toFixed(2)} = ${(expectedMax * amountEach).toFixed(2)}</strong></div>
        {totalRequested > account.balance && (
          <div style={{ color: 'var(--warning)', marginTop: '4px' }}>
            ⚠️ Total exceeds balance — some transactions should be declined
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handleSimulate}
        disabled={loading}
        id="simulate-concurrent-btn"
      >
        {loading ? <span className="spinner" /> : '⚡'}
        {loading ? 'Simulating...' : `Fire ${numTransactions} Concurrent Transactions`}
      </button>

      {results && (
        <div className="concurrent-results fade-in">
          <div className="section-title mt-20">Results</div>
          {results.results.map((r, i) => (
            <div
              key={i}
              className={`concurrent-result-item ${r.success ? 'approved' : 'declined'}`}
            >
              <span>
                {r.success ? '✅' : '❌'} Transaction #{i + 1} — ${amountEach.toFixed(2)}
              </span>
              <span className={`badge ${r.success ? 'badge-success' : 'badge-danger'}`}>
                {r.success ? 'Approved' : 'Declined'}
              </span>
            </div>
          ))}

          <div className="concurrent-final-balance">
            <div className="balance-label">Final Balance</div>
            <div className="balance-display small">${results.finalBalance.toFixed(2)}</div>
            {results.finalBalance >= 0 ? (
              <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '8px' }}>
                ✅ Balance is non-negative — concurrency handling is correct!
              </div>
            ) : (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '8px' }}>
                ❌ Balance went negative — concurrency bug detected!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
