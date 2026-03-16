import React, { useState } from 'react';
import './RegisterForm.css';

function RegisterForm({ onRegister, loading, onBack }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [regData, setRegData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email) {
      setError('Please provide username and email');
      return;
    }

    try {
      const data = await onRegister(email, username);
      if (data && data.privateKey) {
        setRegData(data);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(regData.privateKey);
  };

  if (regData) {
    return (
      <div className="register-card">
        <div className="success-container">
          <div className="success-icon"></div>
          <h2>Registration Successful!</h2>
          <p>Your account has been created on the private ledger.</p>

          <div className="key-display">
            <p>Your Private Key (Save this!):</p>
            <div className="private-key">{regData.privateKey}</div>
          </div>

          <div className="warning-box">
            <strong>KEEP THIS KEY SECURE</strong>
            This key is required for all future logins. We do not store this key and cannot recover it if lost.
          </div>

          <div className="btn-group">
            <button onClick={copyToClipboard} className="secondary-btn">
              Copy Key
            </button>
            <button onClick={onBack} className="register-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-card">
      <h2>Create Account</h2>
      <span className="subtitle">Join the private Ethereum network</span>

      {error && <div className="error-alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
          <small className="help-text">We'll send your Private Key to this email</small>
        </div>

        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="form-footer">
        Already have an account? <span className="register-link" onClick={onBack}>Sign In</span>
      </div>
    </div>
  );
}

export default RegisterForm;
