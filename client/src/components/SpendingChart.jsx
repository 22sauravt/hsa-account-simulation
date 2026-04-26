import { useState, useEffect } from 'react';

const CATEGORY_COLORS = {
  pharmacy: '#00d4aa',
  hospital: '#00b4d8',
  clinic: '#6366f1',
  dentist: '#8b5cf6',
  dental: '#8b5cf6',
  optometrist: '#f59e0b',
  vision: '#f59e0b',
  eyecare: '#f59e0b',
  medical_supply: '#ec4899',
  mental_health: '#14b8a6',
  therapist: '#14b8a6',
  chiropractor: '#f97316',
  urgent_care: '#ef4444',
  laboratory: '#3b82f6',
  doctor: '#22c55e',
  physician: '#22c55e',
  prescription: '#a855f7',
  rehabilitation: '#06b6d4',
};

const DEFAULT_COLOR = '#64748b';

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

function formatCategoryLabel(category) {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SpendingChart({ account }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (account) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [account]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/accounts/${account.id}/transactions`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  // Only approved purchases
  const purchases = transactions.filter(
    (t) => t.type === 'purchase' && t.status === 'approved'
  );

  if (purchases.length === 0) {
    return null;
  }

  // Group by category
  const categoryTotals = {};
  let totalSpent = 0;
  for (const tx of purchases) {
    const cat = tx.merchant_category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    totalSpent += tx.amount;
  }

  // Sort by amount descending
  const categories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpent) * 100,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Build conic gradient for donut chart
  let gradientParts = [];
  let cumulativePercent = 0;
  for (const cat of categories) {
    const start = cumulativePercent;
    cumulativePercent += cat.percentage;
    gradientParts.push(`${cat.color} ${start}% ${cumulativePercent}%`);
  }
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Spending Breakdown</div>
          <div className="glass-card-subtitle">
            ${totalSpent.toFixed(2)} across {purchases.length} transaction{purchases.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="spending-chart-container">
        <div className="spending-donut" style={{ background: conicGradient }}>
          <div className="spending-donut-inner">
            <div className="spending-donut-total">${totalSpent.toFixed(0)}</div>
            <div className="spending-donut-label">Total Spent</div>
          </div>
        </div>

        <div className="spending-legend">
          {categories.map((cat) => (
            <div key={cat.category} className="spending-legend-item">
              <div className="spending-legend-row">
                <div
                  className="spending-legend-dot"
                  style={{ background: cat.color }}
                />
                <span className="spending-legend-name">
                  {formatCategoryLabel(cat.category)}
                </span>
                <span className="spending-legend-amount">
                  ${cat.amount.toFixed(2)}
                </span>
              </div>
              <div className="spending-bar-track">
                <div
                  className="spending-bar-fill"
                  style={{
                    width: `${cat.percentage}%`,
                    background: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
