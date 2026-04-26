import { useState, useEffect } from 'react';
import VirtualCard from './VirtualCard';

export default function CardManager({ account, onCardIssued, toast }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (account) {
      fetchCards();
    } else {
      setCards([]);
    }
  }, [account]);

  const fetchCards = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/cards`);
      const data = await res.json();
      setCards(data);
    } catch (err) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCard = async () => {
    setIssuing(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to issue card');
      } else {
        toast.success('Virtual debit card issued!');
        fetchCards();
        if (onCardIssued) onCardIssued(data);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIssuing(false);
    }
  };

  const handleStatusChange = async (cardId, newStatus) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update card');
      } else {
        toast.success(`Card ${newStatus}`);
        fetchCards();
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  if (!account) {
    return (
      <div className="glass-card fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-text">Select an account first</div>
          <div className="empty-state-hint">Choose an account from the Accounts tab to manage cards</div>
        </div>
      </div>
    );
  }

  const activeCard = cards.find((c) => c.status === 'active');

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Virtual Debit Card</div>
          <div className="glass-card-subtitle">
            {account.first_name} {account.last_name}'s HSA card
          </div>
        </div>
        {!activeCard && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleIssueCard}
            disabled={issuing}
            id="issue-card-btn"
          >
            {issuing ? <span className="spinner" /> : '💳'}
            {issuing ? 'Issuing...' : 'Issue Card'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-20">
          <span className="spinner" />
        </div>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-text">No cards issued</div>
          <div className="empty-state-hint">Issue a virtual debit card to make purchases</div>
        </div>
      ) : (
        <div>
          {cards.map((card) => (
            <div key={card.id} className="mb-16">
              <VirtualCard card={card} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center', maxWidth: '380px' }}>
                {card.status === 'active' && (
                  <>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleStatusChange(card.id, 'frozen')}
                    >
                      🧊 Freeze
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusChange(card.id, 'cancelled')}
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
                {card.status === 'frozen' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusChange(card.id, 'active')}
                    >
                      ✓ Unfreeze
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusChange(card.id, 'cancelled')}
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
                {card.status === 'cancelled' && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    This card has been cancelled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
