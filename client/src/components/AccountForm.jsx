import { useState } from 'react';

export default function AccountForm({ onCreated, toast }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create account');
      } else {
        toast.success(`Account created for ${data.first_name} ${data.last_name}`);
        setFirstName('');
        setLastName('');
        setEmail('');
        onCreated(data);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in">
      <div className="glass-card-header">
        <div>
          <div className="glass-card-title">Create HSA Account</div>
          <div className="glass-card-subtitle">Open a new Health Savings Account</div>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="form-input"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="form-input"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            className="form-input"
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="create-account-btn">
          {loading ? <span className="spinner" /> : '🏦'}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
