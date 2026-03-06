import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import './Dashboard.css';

function Dashboard({ userInfo, contract, signer }) {
  const [stats, setStats] = useState({
    totalDocs: 0,
    verifiedDocs: 0,
    balance: '0'
  });

  useEffect(() => {
    if (contract && userInfo) {
      loadStats();
    }
  }, [contract, userInfo]);

  const loadStats = async () => {
    try {
      const docs = await contract.getUserDocuments(userInfo.address);
      setStats(prev => ({ ...prev, totalDocs: docs.length }));
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadIDCard = () => {
    const node = document.getElementById('user-id-card');
    if (node) {
      toPng(node, { cacheBust: true, style: { background: 'var(--bg-main, #0f172a)' } })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'BBDVAM_ResidentID.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Error downloading ID card:', err);
          alert('Could not download ID card at this time.');
        });
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <div className="user-welcome">
          <h2>Welcome back, {userInfo.username}! 👋</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>BBDVAM Trusted Resident - {userInfo.address}</p>
        </div>
        <div className="header-status">
          <span className={`badge ${userInfo.isActive ? 'active' : 'inactive'}`}>
            {userInfo.isActive ? '🛡️ Identity Verified' : '❌ Account Inactive'}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Documents</h3>
          <div className="stat-value">{stats.totalDocs}</div>
        </div>
        <div className="stat-card">
          <h3>Vault Status</h3>
          <div className="stat-value">Encrypted</div>
        </div>
        <div className="stat-card">
          <h3>Security Level</h3>
          <div className="stat-value">High</div>
        </div>
      </div>

      <div className="upload-section">
        <h3>Manage Your Secure Vault</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your documents are encrypted using AES-256 and stored with immutable proof on the blockchain.
        </p>
        <button
          className="btn-upload"
          onClick={() => {
            alert("Please use the 'Documents' tab to upload and manage your files.");
          }}
        >
          📂 Open Document Vault
        </button>
      </div>

      <div className="id-card-section">
        <h3>Your Digital ID</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Download your blockchain-verified Resident ID Card.
        </p>

        <div className="id-card-container">
          <div id="user-id-card" className="id-card-visual">
            <div className="id-card-header">
              <h4>BBDVAM</h4>
              <span>Resident Identity Card</span>
            </div>
            <div className="id-card-body">
              <div className="id-card-details">
                <p><strong>Name:</strong> {userInfo.username}</p>
                <p><strong>Status:</strong> <span style={{ color: userInfo.isActive ? '#10b981' : '#f43f5e' }}>{userInfo.isActive ? 'Verified Resident' : 'Unverified'}</span></p>
                <p className="wallet-address"><strong>Address:</strong><br />{userInfo.address}</p>
              </div>
              <div className="id-card-qr">
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
                  <QRCodeCanvas value={`verify:${userInfo.address}`} size={90} />
                </div>
              </div>
            </div>
            <div className="id-card-footer">
              <p>🔒 Secured by Blockchain Validation</p>
            </div>
          </div>
        </div>

        <button onClick={downloadIDCard} className="btn-upload btn-download-id">
          ⬇️ Download ID Card
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
