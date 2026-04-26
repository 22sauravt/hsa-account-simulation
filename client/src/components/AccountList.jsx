export default function AccountList({ accounts, selectedId, onSelect, onDelete }) {
  if (accounts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏦</div>
        <div className="empty-state-text">No accounts yet</div>
        <div className="empty-state-hint">Create your first HSA account above</div>
      </div>
    );
  }

  const handleDelete = async (e, account) => {
    e.stopPropagation();
    if (!confirm(`Delete ${account.first_name} ${account.last_name}'s account? This will remove all cards and transactions.`)) {
      return;
    }
    if (onDelete) onDelete(account.id);
  };

  return (
    <div>
      <div className="section-title">Your Accounts</div>
      {accounts.map((account) => (
        <div
          key={account.id}
          className={`account-item ${selectedId === account.id ? 'selected' : ''}`}
          onClick={() => onSelect(account)}
          id={`account-${account.id}`}
        >
          <div className="account-item-info">
            <div className="account-avatar">
              {account.first_name[0]}{account.last_name[0]}
            </div>
            <div>
              <div className="account-name">{account.first_name} {account.last_name}</div>
              <div className="account-email">{account.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="account-balance">
              ${account.balance.toFixed(2)}
            </div>
            <button
              className="btn-icon-delete"
              onClick={(e) => handleDelete(e, account)}
              title="Delete account"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
