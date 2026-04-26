import { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: 'pharmacy', label: '💊 Pharmacy', qualified: true },
  { value: 'hospital', label: '🏥 Hospital', qualified: true },
  { value: 'clinic', label: '🏥 Clinic', qualified: true },
  { value: 'dentist', label: '🦷 Dentist', qualified: true },
  { value: 'optometrist', label: '👁 Optometrist', qualified: true },
  { value: 'vision', label: '👓 Vision Center', qualified: true },
  { value: 'medical_supply', label: '🩺 Medical Supply', qualified: true },
  { value: 'mental_health', label: '🧠 Mental Health', qualified: true },
  { value: 'chiropractor', label: '🦴 Chiropractor', qualified: true },
  { value: 'urgent_care', label: '🚑 Urgent Care', qualified: true },
  { value: 'laboratory', label: '🔬 Laboratory', qualified: true },
  { value: 'doctor', label: '👨‍⚕️ Doctor / Physician', qualified: true },
  { value: 'prescription', label: '📋 Prescription Services', qualified: true },
  { value: 'rehabilitation', label: '♿ Rehabilitation', qualified: true },
  { value: 'restaurant', label: '🍔 Restaurant', qualified: false },
  { value: 'electronics', label: '📱 Electronics', qualified: false },
  { value: 'grocery', label: '🛒 Grocery Store', qualified: false },
  { value: 'gas_station', label: '⛽ Gas Station', qualified: false },
  { value: 'clothing', label: '👕 Clothing Store', qualified: false },
  { value: 'entertainment', label: '🎬 Entertainment', qualified: false },
  { value: 'travel', label: '✈️ Travel', qualified: false },
  { value: 'hotel', label: '🏨 Hotel', qualified: false },
  { value: 'sporting_goods', label: '⚽ Sporting Goods', qualified: false },
  { value: 'home_improvement', label: '🔨 Home Improvement', qualified: false },
];

export default function TransactionForm({ account, cards, onTransacted, toast }) {
  const [merchantName, setMerchantName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState('');
  const [loading, setLoading] = useState(false);

  const activeCards = (cards || []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (activeCards.length === 1 && !cardId) {
      setCardId(activeCards[0].id);
    }
  }, [activeCards, cardId]);

  if (!account) {
    return (
      <div className="glass-card fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">Select an account first</div>
          <div className="empty-state-hint">Choose an account from the Accounts tab to process transactions</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!merchantName || !merchantCategory || !numAmount || !cardId) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          cardId,
          amount: numAmount,
          merchantName,
          merchantCategory,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Transaction approved: $${numAmount.toFixed(2)} at ${merchantName}`);
      } else {
        toast.error(data.error || 'Transaction declined');
      }

      setMerchantName('');
      setMerchantCategory('');
      setAmount('');
      onTransacted();
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find((c) => c.value === merchantCategory);

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Process Transaction</div>
          <div className="glass-card-subtitle">
            Simulate a purchase for {account.first_name} {account.last_name}
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="balance-label">Available Balance</div>
        <div className="balance-display small">${account.balance.toFixed(2)}</div>
      </div>

      {activeCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-text">No active card</div>
          <div className="empty-state-hint">Issue or unfreeze a card in the Cards tab first</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {activeCards.length > 1 && (
            <div className="form-group">
              <label className="form-label" htmlFor="selectCard">Card</label>
              <select
                id="selectCard"
                className="form-select"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
              >
                <option value="">Select card...</option>
                {activeCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    •••• {c.card_last_four} ({c.expiry_date})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="merchantName">Merchant Name</label>
            <input
              id="merchantName"
              className="form-input"
              type="text"
              placeholder="e.g. CVS Pharmacy"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="merchantCategory">Merchant Category</label>
            <select
              id="merchantCategory"
              className="form-select"
              value={merchantCategory}
              onChange={(e) => setMerchantCategory(e.target.value)}
              required
            >
              <option value="">Select category...</option>
              <optgroup label="✅ Qualified Medical Expenses">
                {CATEGORIES.filter((c) => c.qualified).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
              <optgroup label="❌ Non-Qualified Expenses">
                {CATEGORIES.filter((c) => !c.qualified).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
            </select>
            {selectedCategory && (
              <div className="form-hint" style={{ color: selectedCategory.qualified ? 'var(--success)' : 'var(--danger)' }}>
                {selectedCategory.qualified ? '✅ Qualified medical expense' : '❌ Non-qualified — will be declined'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txAmount">Amount</label>
            <input
              id="txAmount"
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

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="process-tx-btn">
            {loading ? <span className="spinner" /> : '🛒'}
            {loading ? 'Processing...' : 'Process Transaction'}
          </button>
        </form>
      )}
    </div>
  );
}
