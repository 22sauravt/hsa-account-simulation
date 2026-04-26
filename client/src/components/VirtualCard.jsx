export default function VirtualCard({ card }) {
  if (!card) return null;

  const statusColors = {
    active: 'var(--success)',
    frozen: 'var(--warning)',
    cancelled: 'var(--danger)',
  };

  return (
    <div className="virtual-card" id={`card-${card.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="virtual-card-chip" />
        <div className="virtual-card-brand">HSA DEBIT</div>
      </div>

      <div className="virtual-card-number">
        {card.card_number}
      </div>

      <div className="virtual-card-footer">
        <div>
          <div className="virtual-card-name">{card.cardholder_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="virtual-card-expiry-label">Valid Thru</div>
          <div className="virtual-card-expiry">{card.expiry_date}</div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
      }}>
        <span className={`badge badge-${card.status === 'active' ? 'success' : card.status === 'frozen' ? 'warning' : 'danger'}`}>
          {card.status}
        </span>
      </div>
    </div>
  );
}
