import { useState } from 'react';

export default function DepositForm({ account, onDeposited, toast }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!account) {
    return (
      <div className="glass-card fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">Select an account first</div>
          <div className="empty-state-hint">Choose an account from the Accounts tab to deposit funds</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid deposit amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Deposit failed');
      } else {
        toast.success(`Deposited $${numAmount.toFixed(2)} successfully`);
        setAmount('');
        onDeposited(data);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Deposit Funds</div>
          <div className="glass-card-subtitle">
            Into {account.first_name} {account.last_name}'s account
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="balance-label">Current Balance</div>
        <div className="balance-display">${account.balance.toFixed(2)}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="depositAmount">Deposit Amount</label>
          <input
            id="depositAmount"
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setAmount(qa.toString())}
            >
              ${qa}
            </button>
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="deposit-btn">
          {loading ? <span className="spinner" /> : '💵'}
          {loading ? 'Processing...' : `Deposit${amount ? ` $${parseFloat(amount || 0).toFixed(2)}` : ''}`}
        </button>
      </form>
    </div>
  );
}
