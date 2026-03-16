import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm({ onLogin, loading, onShowRegister, title, onBack }) {
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!privateKey) {
      return;
    }

    let formattedKey = privateKey.trim();
    if (!formattedKey.startsWith('0x')) {
      formattedKey = '0x' + formattedKey;
    }

    onLogin(formattedKey);
  };

  return (
    <div className="login-card">
      {title && title.includes('Admin') && <div className="admin-badge">Admin Access</div>}

      {onBack && (
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
      )}

      <h2>{title || 'Sign In'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Private Key</label>
          <div className="input-with-toggle">
            <input
              type={showPassword ? "text" : "password"}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '-' : '+'}
            </button>
          </div>
        </div>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {!title && (
        <div className="form-footer">
          Don't have an account? <span className="register-link" onClick={onShowRegister}>Sign Up</span>
        </div>
      )}

      <div className="security-notice">
        <p>Security Notice</p>
        <ul>
          <li>Never share your private key</li>
          <li>Your key is stored only in your browser</li>
          <li>Use test accounts for this demo</li>
        </ul>
      </div>
    </div>
  );
}

export default LoginForm;
