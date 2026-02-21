import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard({ userInfo, contract, signer }) {
  const [blockNumber, setBlockNumber] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlockchainData();
  }, [signer]);

  const fetchBlockchainData = async () => {
    if (!signer) return;

    try {
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();
      setBlockNumber(currentBlock);

      const userBalance = await provider.getBalance(userInfo.address);
      setBalance(userBalance);
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return parseFloat(balance.toString()) / 1e18;
  };

  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome back, {userInfo.username}! 👋</h2>
        <p>Your secure identity is active on the Document Ledger.</p>
      </div>

      <div className="dashboard-grid">
        <div className="info-card">
          <h3>👤 Service Profile</h3>
          <div className="info-row">
            <label>Full Name:</label>
            <span className="value">{userInfo.username}</span>
          </div>
          <div className="info-row">
            <label>Public User ID:</label>
            <div className="address-container">
              <span className="value address">{userInfo.address}</span>
              <button
                onClick={() => copyToClipboard(userInfo.address)}
                className="copy-btn"
                title="Copy ID"
              >
                📋
              </button>
            </div>
          </div>
          <div className="info-row">
            <label>Member Since:</label>
            <span className="value">{formatDate(userInfo.registeredAt)}</span>
          </div>
          <div className="info-row">
            <label>Verification Status:</label>
            <span className={`badge ${userInfo.isActive ? 'active' : 'inactive'}`}>
              {userInfo.isActive ? '✓ Verified Identity' : '✗ Suspended'}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>📂 Quick Actions</h3>
          <p className="helper-text">Manage your encrypted documents and verify public ledger entries.</p>
          <div className="action-buttons-dashboard">
            <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'documents' }))}>
              Manage Vault
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/verify'}>
              Public Verification
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="feature-info">
          <h4>✨ Secure doc ledger Features</h4>
          <ul>
            <li>Military-grade AES-256 document encryption</li>
            <li>Immutable audit trails via private blockchain</li>
            <li>Zero-password architecture (Private Key sign-in)</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
