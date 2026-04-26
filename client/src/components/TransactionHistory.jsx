import { useState, useEffect } from 'react';

export default function TransactionHistory({ account, refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [account, refreshKey]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/transactions`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getIcon = (tx) => {
    if (tx.type === 'deposit') return '💰';
    if (tx.status === 'declined') return '❌';
    return '🛒';
  };

  const getIconClass = (tx) => {
    if (tx.type === 'deposit') return 'deposit';
    if (tx.status === 'declined') return 'declined';
    return 'purchase';
  };

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Transaction History</div>
          <div className="glass-card-subtitle">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-20">
          <span className="spinner" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No transactions yet</div>
        </div>
      ) : (
        <div>
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-info">
                <div className={`transaction-icon ${getIconClass(tx)}`}>
                  {getIcon(tx)}
                </div>
                <div>
                  <div className="transaction-merchant">
                    {tx.type === 'deposit' ? 'Deposit' : tx.merchant_name || 'Unknown'}
                  </div>
                  <div className="transaction-category">
                    {tx.type === 'deposit' ? 'Account funding' : tx.merchant_category || ''}
                    {tx.status === 'declined' && tx.decline_reason && (
                      <span style={{ color: 'var(--danger)', marginLeft: '6px' }}>
                        — {tx.decline_reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`transaction-amount ${
                  tx.type === 'deposit' ? 'positive' :
                  tx.status === 'declined' ? 'declined' : 'negative'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </div>
                <div className="transaction-time">{formatTime(tx.created_at)}</div>
                <span className={`badge ${tx.status === 'approved' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '4px' }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
