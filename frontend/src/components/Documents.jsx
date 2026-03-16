import React, { useState, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import './Documents.css';

function Documents({ contract, account, signer }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showQR, setShowQR] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [verifyingDoc, setVerifyingDoc] = useState(null);
    const [docStatuses, setDocStatuses] = useState({});
    const [certifyModeDocId, setCertifyModeDocId] = useState(null);

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
                uploadedAt: new Date(Number(d.uploadedAt) * 1000).toLocaleDateString()
            }));
            setDocuments(formattedDocs);
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
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !docName) return;

        try {
            setUploading(true);
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
            if (!data.success) throw new Error(data.error);

            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.addDocument(
                docType,
                docName,
                data.path,
                data.contentHash,
                data.verificationId
            );
            await tx.wait();

            setFile(null);
            setDocName('');
            loadDocuments();
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const [showAudit, setShowAudit] = useState(null);
    const [auditData, setAuditData] = useState([]);
    const [requestingOrg, setRequestingOrg] = useState('');

    const fetchAuditTrail = async (verId) => {
        try {
            const response = await fetch(`${API_URL}/api/verify/audit/${verId}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) {
                setAuditData(data.auditTrail);
                setShowAudit(verId);
            }
        } catch (e) { console.error(e); }
    };

    const handleRequestVerification = async (doc) => {
        if (!requestingOrg) return alert("Select an organization");

        const privateKey = prompt("Please enter your private key to authorize this on-chain request:");
        if (!privateKey) return;

        try {
            setUploading(true);
            const response = await fetch(`${API_URL}/api/documents/request-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    verificationId: doc.verificationId,
                    targetOrg: requestingOrg,
                    userPrivateKey: privateKey,
                    docInfo: doc
                })
            });
            const data = await response.json();
            if (data.success) {
                alert("Certification request sent to organization!");
                setCertifyModeDocId(null);
                loadDocuments();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert("Request failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const getStatusInfo = (verId) => {
        const status = docStatuses[verId]?.status;
        if (status === 2) return { label: 'Certified', class: 'verified', icon: '' };
        if (status === 1) return { label: 'Pending', class: 'pending', icon: '' };
        if (status === 3) return { label: 'Rejected', class: 'rejected', icon: '' };
        return { label: 'Unverified', class: 'unverified', icon: '' };
    };

    const downloadQR = (docName) => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${docName}_QR.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="documents-container">
            <div className="docs-header">
                <h2>Secure Vault</h2>
                <p>Manage your encrypted credentials and institutional certifications.</p>
            </div>

            <div className="upload-section" style={{ marginBottom: '3rem' }}>
                <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Document Name</label>
                        <input type="text" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Identity Card" required />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                            <option>Personal ID</option>
                            <option>Financial</option>
                            <option>Medical</option>
                            <option>Legal</option>
                            <option>Others</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>File</label>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
                    </div>
                    <button type="submit" className="btn-upload" disabled={uploading}>
                        {uploading ? 'Securing...' : 'Secure Upload'}
                    </button>
                </form>
            </div>

            <div className="docs-grid">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="loading-skeleton" />)
                ) : documents.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-icon"></div>
                        <h3>Your vault is empty</h3>
                        <p>Upload your first document to secure it on the ledger.</p>
                    </div>
                ) : (
                    documents.map(doc => {
                        const status = getStatusInfo(doc.verificationId);
                        const isUnverified = !docStatuses[doc.verificationId] || docStatuses[doc.verificationId].status === 0;
                        const isRejected = docStatuses[doc.verificationId]?.status === 3;

                        return (
                            <div key={doc.id} className="doc-card">
                                <div className="doc-type-badge">{doc.docType}</div>
                                <div className="doc-name">{doc.fileName}</div>
                                <div className="doc-id">{doc.verificationId}</div>
                                <div className="doc-meta">
                                    <span>{doc.uploadedAt}</span>
                                    <span className={`status-badge ${status.class}`} onClick={() => fetchAuditTrail(doc.verificationId)} style={{ cursor: 'pointer' }} title="Click for history">
                                        {status.icon} {status.label}
                                    </span>
                                </div>

                                {(isUnverified || isRejected) && (
                                    <div className="certify-request">
                                        {certifyModeDocId === doc.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                                                <select value={requestingOrg} onChange={(e) => setRequestingOrg(e.target.value)} className="org-select">
                                                    <option value="">Select Verifier...</option>
                                                    {organizations.map(org => (
                                                        <option key={org.address} value={org.address}>{org.name}</option>
                                                    ))}
                                                </select>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleRequestVerification(doc)} className="btn-request-cert" style={{ flex: 1 }}>Confirm</button>
                                                    <button onClick={() => setCertifyModeDocId(null)} className="btn-doc-action" style={{ background: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setCertifyModeDocId(doc.id)} className="btn-request-cert" style={{ width: '100%' }}>Request Certification</button>
                                        )}
                                    </div>
                                )}

                                <div className="doc-actions">
                                    <button onClick={() => window.open(`${API_URL}/api/documents/preview/${account}/${doc.ipfsHash}?name=${encodeURIComponent(doc.fileName)}`, '_blank')} className="btn-doc-action">Preview</button>
                                    <button onClick={() => window.open(`${API_URL}/api/documents/download/${account}/${doc.ipfsHash}?name=${encodeURIComponent(doc.fileName)}`, '_blank')} className="btn-doc-action">Download</button>
                                    <button onClick={() => setShowQR(showQR === doc.id ? null : doc.id)} className="btn-doc-action">QR Proof</button>
                                </div>

                                {showQR === doc.id && (
                                    <div className="qr-overlay">
                                        <QRCodeCanvas
                                            id="qr-code-canvas"
                                            value={`${window.location.origin}/verify?id=${doc.verificationId}`}
                                            size={160}
                                        />
                                        <p className="qr-hint">Scan to verify authenticity</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                                            <button onClick={() => downloadQR(doc.fileName)} className="btn-doc-action" style={{ background: 'var(--primary-color)' }}>Download</button>
                                            <button onClick={() => setShowQR(null)} className="btn-close">Close</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showAudit && (
                <div className="modal-overlay">
                    <div className="audit-modal">
                        <h3>Certification History</h3>
                        <div className="audit-list">
                            {auditData.length === 0 ? <p>No verification events recorded.</p> :
                                auditData.map((event, idx) => (
                                    <div key={idx} className="audit-item">
                                        <div className="audit-verifier">{event.verifier}</div>
                                        <div className="audit-time">{new Date(event.timestamp).toLocaleString()}</div>
                                        <div className="audit-remarks">"{event.remarks}"</div>
                                    </div>
                                ))
                            }
                        </div>
                        <button onClick={() => setShowAudit(null)} className="btn-close">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Documents;
