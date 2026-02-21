import React, { useState } from 'react';
import './RegisterForm.css';

function RegisterForm({ onRegister, loading, onBack }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const [registeredKey, setRegisteredKey] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email) {
      setError('Please provide username and email');
      return;
    }

    try {
      if (onRegister) {
        // App.jsx now returns the data object including privateKey
        const data = await onRegister(email, username);
        if (data && data.privateKey) {
          setRegisteredKey(data.privateKey);
        }
      }
    } catch (err) {
      // Error is handled in parent
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registeredKey);
    alert('Private Key copied to clipboard!');
  };

  if (registeredKey) {
    return (
      <div className="register-container">
        <div className="register-form-card success-card">
          <h2>🎉 Account Created!</h2>
          <p className="subtitle">Save your Private Key securely</p>

          <div className="key-display-box">
            <p className="key-label">Your Private Key:</p>
            <div className="key-value">{registeredKey}</div>
            <button onClick={copyToClipboard} className="copy-btn">
              📋 Copy to Clipboard
            </button>
          </div>

          <div className="warning-box">
            <p>⚠️ <strong>IMPORTANT:</strong> We have also emailed this key to <strong>{email}</strong>. Don't lose it!</p>
          </div>

          <div className="form-footer">
            <button className="submit-btn" onClick={onBack}>
              Proceed to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-form-card">
        <h2>📝 Create Account</h2>
        <p className="subtitle">Join the private Ethereum network</p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              className="form-input"
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
              className="form-input"
            />
            <small className="help-text">We will send your Private Key to this email</small>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="form-footer">
          <p>Already have an account?</p>
          <button className="link-btn" onClick={onBack} disabled={loading}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
