import { useState } from 'react';

const TEST_NAMES = [
  { first: 'Sarah', last: 'Johnson' },
  { first: 'Michael', last: 'Chen' },
  { first: 'Emily', last: 'Rodriguez' },
  { first: 'David', last: 'Patel' },
  { first: 'Jessica', last: 'Kim' },
  { first: 'James', last: 'Williams' },
  { first: 'Olivia', last: 'Martinez' },
  { first: 'Daniel', last: 'Thompson' },
];

function generateTestData() {
  const name = TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)];
  const suffix = Math.floor(Math.random() * 900) + 100;
  return {
    firstName: name.first,
    lastName: name.last,
    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${suffix}@example.com`,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AccountForm({ onCreated, toast }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !isValidEmail(val)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleQuickFill = () => {
    const data = generateTestData();
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setEmail(data.email);
    setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;
    if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }

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
        setEmailError('');
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
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleQuickFill}
          title="Auto-fill with sample data"
          id="quick-fill-btn"
        >
          🎲 Quick Fill
        </button>
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
            className={`form-input ${emailError ? 'form-input-error' : ''}`}
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={handleEmailChange}
            required
          />
          {emailError && (
            <div className="form-error">{emailError}</div>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading || !!emailError} id="create-account-btn">
          {loading ? <span className="spinner" /> : '🏦'}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
