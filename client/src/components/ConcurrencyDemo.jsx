import { useState } from 'react';

export default function ConcurrencyDemo({ account, cards, onComplete, toast }) {
  const [numTransactions, setNumTransactions] = useState(5);
  const [amountEach, setAmountEach] = useState(30);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const activeCard = (cards || []).find((c) => c.status === 'active');

  if (!account || !activeCard) {
    return null;
  }

  const handleSubmit = async () => {
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
        toast.info(`${approved} approved, ${declined} declined — insufficient funds`);
      } else {
        toast.success(`All ${approved} payments processed successfully`);
      }

      onComplete();
    } catch (err) {
      toast.error('Failed to process batch');
    } finally {
      setLoading(false);
    }
  };

  const totalRequested = numTransactions * amountEach;

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Batch Payments</div>
          <div className="glass-card-subtitle">
            Process multiple pharmacy transactions at once
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="numTx">Number of Payments</label>
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
        <div>Total: <strong style={{ color: 'var(--text-primary)' }}>{numTransactions} × ${amountEach.toFixed(2)} = ${totalRequested.toFixed(2)}</strong></div>
        <div>Available balance: <strong style={{ color: 'var(--accent-primary)' }}>${account.balance.toFixed(2)}</strong></div>
        {totalRequested > account.balance && (
          <div style={{ color: 'var(--warning)', marginTop: '4px', fontSize: '0.8rem' }}>
            Exceeds balance — some payments will be declined
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={loading}
        id="batch-payments-btn"
      >
        {loading ? <span className="spinner" /> : '🧾'}
        {loading ? 'Processing...' : `Submit ${numTransactions} Payments`}
      </button>

      {results && (
        <div className="concurrent-results fade-in">
          <div className="section-title mt-20">Payment Summary</div>
          {results.results.map((r, i) => (
            <div
              key={i}
              className={`concurrent-result-item ${r.success ? 'approved' : 'declined'}`}
            >
              <span>
                Pharmacy #{i + 1} — ${amountEach.toFixed(2)}
              </span>
              <span className={`badge ${r.success ? 'badge-success' : 'badge-danger'}`}>
                {r.success ? 'Paid' : 'Declined'}
              </span>
            </div>
          ))}

          <div className="concurrent-final-balance">
            <div className="balance-label">Remaining Balance</div>
            <div className="balance-display small">${results.finalBalance.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
