import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm({ onLogin, loading, onShowRegister }) {
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!privateKey) {
      alert('Please enter your private key');
      return;
    }

    // Add 0x prefix if not present
    let formattedKey = privateKey.trim();
    if (!formattedKey.startsWith('0x')) {
      formattedKey = '0x' + formattedKey;
    }

    if (formattedKey.length !== 66) {
      alert(`Invalid Private Key length (${formattedKey.length}). It should be 66 characters (including 0x).`);
      return;
    }

    onLogin(formattedKey);
  };

  return (
    <div className="login-form-container">
      <div className="login-card">
        <h2>🔑 Login with Private Key</h2>
        <p className="subtitle">Sign in to your account using your Ethereum private key</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="privateKey">Private Key</label>
            <div className="input-with-icon">
              <input
                type={showKey ? 'text' : 'password'}
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key"
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="toggle-btn"
                disabled={loading}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="form-hint">
              Check your email/console for the Private Key sent during registration.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="form-footer">
          <p>Don't have an account?</p>
          <button
            onClick={onShowRegister}
            className="btn btn-link"
            disabled={loading}
          >
            Register Now
          </button>
        </div>

        <div className="security-notice">
          <p>⚠️ <strong>Security Notice:</strong></p>
          <ul>
            <li>Never share your private key with anyone</li>
            <li>This is a demo application - use test accounts only</li>
            <li>Your private key is stored locally in your browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
