import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Reuse some styles

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ account, onLogout }) => {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [adminKey, setAdminKey] = useState('');
    const [showKeyField, setShowKeyField] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [rejectingDoc, setRejectingDoc] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Restore admin key from sessionStorage
    useEffect(() => {
        const savedKey = sessionStorage.getItem('admin_key');
        if (savedKey) setAdminKey(savedKey);
        fetchPendingDocs();
    }, []);

    // Persist admin key to sessionStorage when updated
    useEffect(() => {
        if (adminKey) {
            sessionStorage.setItem('admin_key', adminKey);
        }
    }, [adminKey]);

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

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            alert('Please enter a rejection reason');
            return;
        }
        if (!adminKey) {
            setShowKeyField(true);
            alert('Please enter your Organization Private Key');
            return;
        }

        try {
            setVerifyingId(rejectingDoc.verificationId);
            const response = await fetch(`${API_URL}/api/admin/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    verificationId: rejectingDoc.verificationId,
                    reason: rejectReason,
                    adminPrivateKey: adminKey
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Document rejected on-chain.');
                fetchPendingDocs();
                setRejectingDoc(null);
                setRejectReason('');
            } else {
                throw new Error(data.error || 'Rejection failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const handlePreviewInline = (doc) => {
        setPreviewDoc(previewDoc?.verificationId === doc.verificationId ? null : doc);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Organization Admin Panel</h1>
                <div className="user-badge">
                    <span>Admin: {account.slice(0, 8)}...{account.slice(-4)}</span>
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card full-width">
                    <h3>Verification Queue (Pending Approval)</h3>

                    <div className="admin-actions">
                        <button className="refresh-btn" onClick={fetchPendingDocs}>🔄 Refresh Queue</button>
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
                                    <th>Hash</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingDocs.map((doc) => (
                                    <React.Fragment key={doc.verificationId}>
                                        <tr>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{doc.docName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{doc.verificationId}</div>
                                            </td>
                                            <td>{doc.docType}</td>
                                            <td title={doc.userId}>{doc.userId.slice(0, 8)}...</td>
                                            <td>
                                                {doc.contentHash ? (
                                                    <span className="hash-preview" title={doc.contentHash}>
                                                        {doc.contentHash.slice(0, 10)}...
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                                            <td>
                                                <button
                                                    className="preview-btn"
                                                    onClick={() => handlePreviewInline(doc)}
                                                >
                                                    {previewDoc?.verificationId === doc.verificationId ? '✕ Close' : '👁️ Review'}
                                                </button>
                                                <button
                                                    className="verify-action-btn"
                                                    disabled={verifyingId === doc.verificationId}
                                                    onClick={() => handleVerify(doc)}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    {verifyingId === doc.verificationId ? '...' : '✅ Verify'}
                                                </button>
                                                <button
                                                    className="reject-action-btn"
                                                    disabled={verifyingId === doc.verificationId}
                                                    onClick={() => { setRejectingDoc(doc); setRejectReason(''); }}
                                                >
                                                    {verifyingId === doc.verificationId ? '...' : '❌ Reject'}
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Inline Document Preview */}
                                        {previewDoc?.verificationId === doc.verificationId && (
                                            <tr>
                                                <td colSpan="6">
                                                    <div className="inline-preview">
                                                        <h4>📄 Document Preview</h4>
                                                        <iframe
                                                            src={`${API_URL}/api/documents/preview/${account}/${doc.driveFileId}?name=${encodeURIComponent(doc.docName)}`}
                                                            title="Document Preview"
                                                            className="preview-iframe"
                                                        />
                                                        <a
                                                            href={`${API_URL}/api/documents/preview/${account}/${doc.driveFileId}?name=${encodeURIComponent(doc.docName)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="open-tab-link"
                                                        >
                                                            Open in new tab ↗
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectingDoc && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>❌ Reject Document</h3>
                        <p>Document: <strong>{rejectingDoc.docName}</strong></p>
                        <p>ID: <code>{rejectingDoc.verificationId}</code></p>
                        <label style={{ display: 'block', marginTop: '15px', fontWeight: '600' }}>Rejection Reason:</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Document is blurry, information is incomplete..."
                            className="reject-textarea"
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button onClick={() => { setRejectingDoc(null); setRejectReason(''); }} className="cancel-btn">Cancel</button>
                            <button
                                onClick={handleRejectSubmit}
                                className="confirm-reject-btn"
                                disabled={!rejectReason.trim() || verifyingId === rejectingDoc.verificationId}
                            >
                                {verifyingId === rejectingDoc.verificationId ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
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
          cursor: pointer;
        }
        .empty-msg {
          text-align: center;
          padding: 40px;
          color: #888;
        }
        .hash-preview {
          font-family: monospace;
          font-size: 0.8rem;
          color: #1864ab;
          cursor: help;
        }
        .inline-preview {
          padding: 20px;
          background: #f0f4f8;
          border-radius: 8px;
          text-align: center;
        }
        .inline-preview h4 {
          margin: 0 0 12px 0;
        }
        .preview-iframe {
          width: 100%;
          height: 500px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          background: white;
        }
        .open-tab-link {
          display: inline-block;
          margin-top: 10px;
          color: #007bff;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .open-tab-link:hover {
          text-decoration: underline;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .modal-content h3 {
          margin-top: 0;
        }
        .reject-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          resize: vertical;
          margin-top: 8px;
          font-family: inherit;
        }
        .reject-textarea:focus {
          outline: none;
          border-color: #dc3545;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .cancel-btn {
          padding: 10px 20px;
          background: #e9ecef;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .confirm-reject-btn {
          padding: 10px 20px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .confirm-reject-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
