import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ account, onLogout }) => {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [adminKey, setAdminKey] = useState('');
    const [previewDoc, setPreviewDoc] = useState(null);

    useEffect(() => {
        const savedKey = sessionStorage.getItem('admin_key');
        if (savedKey) setAdminKey(savedKey);
        fetchPendingDocs();
    }, []);

    const fetchPendingDocs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/pending/${account}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) setPendingDocs(data.documents);
        } catch (error) {
            console.error('Error fetching pending docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const [remarks, setRemarks] = useState({});

    const handleVerify = async (doc) => {
        if (!adminKey) {
            alert('Please enter your Organization Private Key');
            return;
        }
        try {
            setVerifyingId(doc.verificationId);
            const response = await fetch(`${API_URL}/api/admin/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({
                    verificationId: doc.verificationId,
                    remarks: remarks[doc.verificationId] || `Certified by Organization`,
                    adminPrivateKey: adminKey
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Document Certified!');
                fetchPendingDocs();
            } else throw new Error(data.error);
        } catch (error) {
            alert(error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const handleReject = async (doc) => {
        if (!adminKey) return alert('Enter Organization Private Key');

        const reason = remarks[doc.verificationId];
        if (!reason || reason.trim() === '') {
            return alert("Please enter a rejection reason in the remarks field before rejecting.");
        }

        try {
            setVerifyingId(doc.verificationId);
            const response = await fetch(`${API_URL}/api/admin/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({
                    verificationId: doc.verificationId,
                    reason,
                    adminPrivateKey: adminKey
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Document Rejected');
                fetchPendingDocs();
            } else throw new Error(data.error);
        } catch (error) {
            alert(error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h2 style={{ margin: 0 }}>BBDVAM Certification Queue</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Authorized Organization: {account.slice(0, 10)}...</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="password"
                        placeholder="Organization Key"
                        value={adminKey}
                        onChange={(e) => { setAdminKey(e.target.value); sessionStorage.setItem('admin_key', e.target.value); }}
                        className="admin-key-field"
                    />
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Uploader</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : pendingDocs.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Queue is empty</td></tr>
                        ) : (
                            pendingDocs.map(doc => (
                                <tr key={doc.verificationId}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{doc.docName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{doc.verificationId}</div>
                                    </td>
                                    <td>{doc.userId.slice(0, 8)}...</td>
                                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Add remarks (optional)"
                                                value={remarks[doc.verificationId] || ''}
                                                onChange={(e) => setRemarks(prev => ({ ...prev, [doc.verificationId]: e.target.value }))}
                                                className="admin-remarks-input"
                                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn-admin btn-review" onClick={() => window.open(`${API_URL}/api/documents/preview/${account}/${doc.driveFileId}`, '_blank')}>Review</button>
                                                <button className="btn-admin btn-approve" onClick={() => handleVerify(doc)} disabled={verifyingId === doc.verificationId}>
                                                    {verifyingId === doc.verificationId ? '...' : 'Approve'}
                                                </button>
                                                <button className="btn-admin btn-reject" onClick={() => handleReject(doc)} disabled={verifyingId === doc.verificationId} style={{ backgroundColor: '#fb7185', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
