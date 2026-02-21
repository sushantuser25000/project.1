import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Reuse some styles

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ account, onLogout }) => {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [adminKey, setAdminKey] = useState('');
    const [showKeyField, setShowKeyField] = useState(false);

    useEffect(() => {
        fetchPendingDocs();
    }, []);

    const fetchPendingDocs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/pending/${account}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) {
                setPendingDocs(data.documents);
            }
        } catch (error) {
            console.error('Error fetching pending docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (doc) => {
        if (!adminKey) {
            setShowKeyField(true);
            alert('Please enter your Organization Private Key');
            return;
        }

        try {
            setVerifyingId(doc.verificationId);
            const response = await fetch(`${API_URL}/api/admin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    verificationId: doc.verificationId,
                    remarks: `Verified by Organization (Admin: ${account.slice(0, 6)}...)`,
                    adminPrivateKey: adminKey
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Document officially verified on-chain!');
                fetchPendingDocs();
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (error) {
            alert('Verification error: ' + error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const handleReject = async (doc) => {
        if (!adminKey) {
            setShowKeyField(true);
            alert('Please enter your Organization Private Key');
            return;
        }

        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            setVerifyingId(doc.verificationId);
            const response = await fetch(`${API_URL}/api/admin/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    verificationId: doc.verificationId,
                    reason: reason,
                    adminPrivateKey: adminKey
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Document rejected on-chain.');
                fetchPendingDocs();
            } else {
                throw new Error(data.error || 'Rejection failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const handlePreview = async (driveFileId, docName) => {
        window.open(`${API_URL}/api/documents/preview/${account}/${driveFileId}?name=${encodeURIComponent(docName)}`, '_blank');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Organization Admin Panel (ACEM)</h1>
                <div className="user-badge">
                    <span>Admin: {account}</span>
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card full-width">
                    <h3>Verification Queue (Pending Approval)</h3>

                    <div className="admin-actions">
                        <button className="refresh-btn" onClick={fetchPendingDocs}>Refresh Queue</button>
                        <div className="key-input-group">
                            <input
                                type={showKeyField ? "text" : "password"}
                                placeholder="Enter Org Private Key"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="admin-key-input"
                            />
                            <button onClick={() => setShowKeyField(!showKeyField)}>
                                {showKeyField ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading queue...</p>
                    ) : pendingDocs.length === 0 ? (
                        <p className="empty-msg">No pending documents to review.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Document Details</th>
                                    <th>Type</th>
                                    <th>Uploader</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingDocs.map((doc) => (
                                    <tr key={doc.verificationId}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{doc.docName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{doc.verificationId}</div>
                                        </td>
                                        <td>{doc.docType}</td>
                                        <td>{doc.userId.slice(0, 8)}...</td>
                                        <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                                        <td>
                                            <button
                                                className="preview-btn"
                                                onClick={() => handlePreview(doc.driveFileId, doc.docName)}
                                            >
                                                Review
                                            </button>
                                            <button
                                                className="verify-action-btn"
                                                disabled={verifyingId === doc.verificationId}
                                                onClick={() => handleVerify(doc)}
                                                style={{ marginRight: '8px' }}
                                            >
                                                {verifyingId === doc.verificationId ? '...' : 'Verify'}
                                            </button>
                                            <button
                                                className="reject-action-btn"
                                                disabled={verifyingId === doc.verificationId}
                                                onClick={() => handleReject(doc)}
                                            >
                                                {verifyingId === doc.verificationId ? '...' : 'Reject'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style jsx>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .admin-table th, .admin-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .admin-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }
        .key-input-group {
          display: flex;
          gap: 10px;
        }
        .admin-key-input {
          padding: 8px;
          width: 300px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .verify-action-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .preview-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        }
        .reject-action-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .refresh-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
        }
        .empty-msg {
          text-align: center;
          padding: 40px;
          color: #888;
        }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
