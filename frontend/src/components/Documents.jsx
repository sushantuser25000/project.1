import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './Documents.css';

function Documents({ contract, account, signer }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showQR, setShowQR] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [verifyingDoc, setVerifyingDoc] = useState(null);
    const [docStatuses, setDocStatuses] = useState({});

    // Form State
    const [file, setFile] = useState(null);
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('Personal ID');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (contract && account) {
            loadDocuments();
            fetchOrganizations();
        }
    }, [contract, account]);

    const fetchOrganizations = async () => {
        try {
            const response = await fetch(`${API_URL}/api/organizations`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) setOrganizations(data.organizations);
        } catch (error) {
            console.error("Error fetching orgs:", error);
        }
    };

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const docs = await contract.getUserDocuments(account);
            const formattedDocs = docs.map(d => ({
                id: d.id.toString(),
                docType: d.docType,
                fileName: d.fileName,
                ipfsHash: d.ipfsHash,
                contentHash: d.contentHash,
                verificationId: d.verificationId,
                uploadedAt: new Date(Number(d.uploadedAt) * 1000).toLocaleString()
            }));
            setDocuments(formattedDocs);
            // Fetch statuses for these documents
            formattedDocs.forEach(d => fetchDocStatus(d.verificationId));
        } catch (error) {
            console.error("Error loading documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocStatus = async (verId) => {
        try {
            const response = await fetch(`${API_URL}/api/verify/status/${verId}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) {
                setDocStatuses(prev => ({ ...prev, [verId]: data }));
            }
        } catch (e) { console.error(e); }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !docName) {
            alert("Please select a file and provide a name.");
            return;
        }

        try {
            setUploading(true);

            // 1. Upload to Backend (Encrypt & Store)
            const formData = new FormData();
            formData.append('document', file);
            formData.append('address', account);
            formData.append('docType', docType);
            formData.append('docName', docName);

            const response = await fetch(`${API_URL}/api/documents/upload`, {
                method: 'POST',
                headers: { 'Bypass-Tunnel-Reminder': 'true' },
                body: formData
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Upload failed');

            const { path: serverPath, contentHash, verificationId } = data;

            // 2. Store Metadata on Chain (with hash and verification ID)
            console.log("Storing metadata on chain...");
            console.log("- Params:", { docType, docName, serverPath, contentHash, verificationId });

            const contractWithSigner = contract.connect(signer);

            const tx = await contractWithSigner.addDocument(
                docType,
                docName,
                serverPath,
                contentHash,
                verificationId,
                { gasLimit: 500000 }
            );
            console.log("- Tx Hash:", tx.hash);
            await tx.wait();

            alert(`Document uploaded successfully!\nVerification ID: ${verificationId}`);
            setFile(null);
            setDocName('');
            loadDocuments();

        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRequestVerification = async (targetOrg) => {
        if (!verifyingDoc) return;
        try {
            setUploading(true);
            // Try to get private key from session first
            let userKey = null;
            const savedAuth = localStorage.getItem('eth_auth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    userKey = authData.privateKey;
                } catch (e) { /* ignore */ }
            }
            if (!userKey) {
                userKey = prompt("Please enter your Private Key to authorize this verification request on-chain:");
            }
            if (!userKey) throw new Error("Private key required");

            const response = await fetch(`${API_URL}/api/documents/request-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    verificationId: verifyingDoc.verificationId,
                    targetOrg: targetOrg,
                    userPrivateKey: userKey,
                    docInfo: verifyingDoc
                })
            });

            const data = await response.json();
            if (data.success) {
                alert("Verification request sent successfully!");
                fetchDocStatus(verifyingDoc.verificationId);
            } else {
                throw new Error(data.error || "Request failed");
            }
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setUploading(false);
            setVerifyingDoc(null);
        }
    };

    const handlePreview = (doc) => {
        window.open(`${API_URL}/api/documents/preview/${account}/${doc.ipfsHash}?name=${encodeURIComponent(doc.fileName)}`, '_blank');
    };

    const handleDownload = (doc) => {
        window.open(`${API_URL}/api/documents/download/${account}/${doc.ipfsHash}?name=${encodeURIComponent(doc.fileName)}`, '_blank');
    };

    const handleCopyId = (verificationId) => {
        navigator.clipboard.writeText(verificationId);
        alert(`Copied: ${verificationId}`);
    };

    const handleCopyHash = (hash) => {
        navigator.clipboard.writeText(hash);
        alert("Hash copied to clipboard!");
    };

    const handleShareLink = (verificationId) => {
        const link = `${window.location.origin}/verify?id=${verificationId}`;
        navigator.clipboard.writeText(link);
        alert("Verification link copied!");
    };

    const toggleQR = (docId) => {
        setShowQR(showQR === docId ? null : docId);
    };

    return (
        <div className="documents-container">
            <h2>📂 Secure Document Vault</h2>

            {/* Upload Section */}
            <div className="upload-card">
                <h3>Upload New Document</h3>
                <form onSubmit={handleUpload}>
                    <div className="form-group">
                        <label>Document Type</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="form-input">
                            <option>Personal ID</option>
                            <option>Financial Record</option>
                            <option>Medical Report</option>
                            <option>Legal Contract</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Document Name</label>
                        <input
                            type="text"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="e.g., Drivers License"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Select File</label>
                        <input type="file" onChange={handleFileChange} className="form-input" />
                    </div>

                    <button type="submit" className="upload-btn" disabled={uploading}>
                        {uploading ? 'Encrypting & Uploading...' : '🔒 Secure Upload'}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="list-card">
                <h3>My Documents</h3>
                {loading ? (
                    <p>Loading chain data...</p>
                ) : documents.length === 0 ? (
                    <p className="empty-state">No documents stored yet.</p>
                ) : (
                    <ul className="doc-list">
                        {documents.map(doc => (
                            <li key={doc.id} className="doc-item-expanded">
                                <div className="doc-header">
                                    <div className="doc-icon">📄</div>
                                    <div className="doc-info">
                                        <h4>
                                            {doc.fileName}
                                            {docStatuses[doc.verificationId]?.status === 2 && <span className="status-badge verified" title="Verified on Chain"> ✅</span>}
                                            {docStatuses[doc.verificationId]?.status === 1 && <span className="status-badge pending" title="Verification Pending"> ⏳</span>}
                                            {docStatuses[doc.verificationId]?.status === 3 && <span className="status-badge rejected" title={`Rejected: ${docStatuses[doc.verificationId]?.rejectionReason}`}> ❌</span>}
                                        </h4>
                                        <span className="doc-meta">{doc.docType} • {doc.uploadedAt}</span>
                                        {docStatuses[doc.verificationId]?.status === 3 && (
                                            <div className="rejection-box">
                                                <strong>Reason:</strong> {docStatuses[doc.verificationId]?.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Info */}
                                <div className="verification-info">
                                    <div className="verification-id" onClick={() => handleCopyId(doc.verificationId)}>
                                        <span className="label">ID:</span>
                                        <span className="value">{doc.verificationId}</span>
                                        <span className="copy-icon">📋</span>
                                    </div>
                                    <div className="doc-hash" onClick={() => handleCopyHash(doc.contentHash)}>
                                        <span className="label">Hash:</span>
                                        <span className="value">{doc.contentHash?.slice(0, 10)}...{doc.contentHash?.slice(-8)}</span>
                                        <span className="copy-icon">📋</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="doc-actions-grid">
                                    <button onClick={() => handleDownload(doc)} className="action-btn download">
                                        ⬇️ Download
                                    </button>
                                    <button onClick={() => handlePreview(doc)} className="action-btn preview">
                                        👁️ View
                                    </button>
                                    <button onClick={() => toggleQR(doc.id)} className="action-btn qr">
                                        📱 QR Code
                                    </button>
                                    <button
                                        onClick={() => setVerifyingDoc(doc)}
                                        className="action-btn verify"
                                        disabled={docStatuses[doc.verificationId]?.status === 1 || docStatuses[doc.verificationId]?.status === 2}
                                    >
                                        {docStatuses[doc.verificationId]?.status === 2 ? '✅ Verified' :
                                            docStatuses[doc.verificationId]?.status === 1 ? '⏳ Pending' :
                                                docStatuses[doc.verificationId]?.status === 3 ? '🔁 Re-request' :
                                                    '🛡️ Request Verify'}
                                    </button>
                                    <button onClick={() => fetchDocStatus(doc.verificationId)} className="action-btn share" title="Refresh on-chain status">
                                        🔄 Refresh
                                    </button>
                                    <button onClick={() => handleShareLink(doc.verificationId)} className="action-btn share">
                                        🔗 Share
                                    </button>
                                </div>

                                {/* QR Code Popup */}
                                {showQR === doc.id && (
                                    <div className="qr-popup">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/verify?id=${doc.verificationId}`}
                                            size={150}
                                            level="M"
                                        />
                                        <p className="qr-id">{doc.verificationId}</p>
                                        <button className="close-qr" onClick={() => setShowQR(null)}>✕</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Verification Request Modal */}
            {verifyingDoc && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Request Official Verification</h3>
                        <p>Document: <strong>{verifyingDoc.fileName}</strong></p>
                        <p>Select an Organization to review and verify this document on the blockchain:</p>

                        <select id="orgSelect" className="form-input" style={{ marginBottom: '20px' }} defaultValue="">
                            <option value="" disabled>-- Choose Organization --</option>
                            {organizations.map(org => (
                                <option key={org.address} value={org.address}>
                                    {org.name} ({org.address.slice(0, 8)}...)
                                </option>
                            ))}
                        </select>

                        <div className="modal-actions">
                            <button onClick={() => setVerifyingDoc(null)} className="cancel-btn">Cancel</button>
                            <button
                                onClick={() => {
                                    const addr = document.getElementById('orgSelect').value;
                                    if (addr) handleRequestVerification(addr);
                                    else alert("Please select an organization");
                                }}
                                className="confirm-btn"
                                disabled={uploading}
                            >
                                {uploading ? 'Processing...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Documents;
