import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './VerifyPage.css';

function VerifyPage() {
    const [verificationMethod, setVerificationMethod] = useState('id');
    const [verificationId, setVerificationId] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [auditTrail, setAuditTrail] = useState([]);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Check for ID in URL on load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setVerificationId(id);
            setVerificationMethod('id');
            verifyById(id);
        }
    }, []);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const verifyById = async (id) => {
        const idToVerify = id || verificationId;
        if (!idToVerify.trim()) {
            setError('Please enter a verification ID');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setVerificationStatus(null);

        try {
            const response = await fetch(`${API_URL}/api/verify/id/${idToVerify}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            setResult(data);
            if (data.verificationStatus) {
                setVerificationStatus(data.verificationStatus);
            }
            if (data.verified) {
                fetchAuditTrail(idToVerify);
            }
        } catch (err) {
            setError('Verification failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditTrail = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/verify/audit/${id}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            if (data.success) {
                setAuditTrail(data.auditTrail);
            }
        } catch (err) {
            console.error('Audit trail fetch failed:', err);
        }
    };

    const verifyByFile = async () => {
        if (!file) {
            setError('Please select a file to verify');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setVerificationStatus(null);

        try {
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch(`${API_URL}/api/verify/file`, {
                method: 'POST',
                headers: { 'Bypass-Tunnel-Reminder': 'true' },
                body: formData
            });
            const data = await response.json();
            setResult(data);
            if (data.verificationStatus) {
                setVerificationStatus(data.verificationStatus);
            }
            if (data.verified && data.document?.verificationId) {
                fetchAuditTrail(data.document.verificationId);
            }
        } catch (err) {
            setError('Verification failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const startCameraScanner = async () => {
        if (scanning) {
            await stopScanner();
            return;
        }

        setScanning(true);
        setError(null);

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    handleQRResult(decodedText);
                    stopScanner();
                },
                (errorMessage) => {
                    // Ignore scan errors (no QR found)
                }
            );
        } catch (err) {
            setError('Camera access failed: ' + err.message);
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (e) {
                console.error('Error stopping scanner:', e);
            }
        }
        setScanning(false);
    };

    const handleImageUpload = async (e) => {
        const imageFile = e.target.files[0];
        if (!imageFile) return;

        setError(null);

        try {
            const html5QrCode = new Html5Qrcode("hidden-scanner");
            const result = await html5QrCode.scanFile(imageFile, true);
            handleQRResult(result);
            html5QrCode.clear();
        } catch (err) {
            setError('Could not read QR code from image');
        }
    };

    const handleQRResult = (text) => {
        // Extract verification ID from URL or use as-is
        try {
            const url = new URL(text);
            const id = url.searchParams.get('id');
            if (id) {
                setVerificationId(id);
                setVerificationMethod('id');
                verifyById(id);
                return;
            }
        } catch {
            // Not a URL, check if it's a verification ID directly
        }

        if (text.startsWith('DOC-')) {
            setVerificationId(text);
            setVerificationMethod('id');
            verifyById(text);
        } else {
            setError('Invalid QR code');
        }
    };

    const handleVerify = () => {
        if (verificationMethod === 'id') {
            verifyById();
        } else {
            verifyByFile();
        }
    };

    const getStatusBadge = () => {
        if (!verificationStatus) return null;
        const { status, statusText } = verificationStatus;
        const badges = {
            0: { icon: '📋', text: 'Not Requested', className: 'status-none' },
            1: { icon: '⏳', text: 'Pending Review', className: 'status-pending' },
            2: { icon: '✅', text: 'Verified by Organization', className: 'status-verified' },
            3: { icon: '❌', text: 'Rejected', className: 'status-rejected' }
        };
        const badge = badges[status] || badges[0];
        return (
            <div className={`verification-status-badge ${badge.className}`}>
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-text">{badge.text}</span>
            </div>
        );
    };

    return (
        <div className="verify-container">
            <div className="verify-header">
                <h1>🔍 Document Verification</h1>
                <p>Verify if a document is registered and certified on the blockchain</p>
            </div>

            {/* Method Selection */}
            <div className="method-tabs">
                <button
                    className={`tab ${verificationMethod === 'id' ? 'active' : ''}`}
                    onClick={() => setVerificationMethod('id')}
                >
                    📝 Verification ID
                </button>
                <button
                    className={`tab ${verificationMethod === 'file' ? 'active' : ''}`}
                    onClick={() => setVerificationMethod('file')}
                >
                    📁 Upload File
                </button>
                <button
                    className={`tab ${verificationMethod === 'camera' ? 'active' : ''}`}
                    onClick={() => setVerificationMethod('camera')}
                >
                    📷 Scan QR
                </button>
            </div>

            <div className="verify-card">
                {/* ID Verification */}
                {verificationMethod === 'id' && (
                    <div className="verify-form">
                        <label>Enter Verification ID</label>
                        <input
                            type="text"
                            value={verificationId}
                            onChange={(e) => setVerificationId(e.target.value.toUpperCase())}
                            placeholder="e.g., DOC-A3F7B2"
                            className="verify-input"
                        />
                        <button onClick={handleVerify} disabled={loading} className="verify-btn">
                            {loading ? 'Verifying...' : '✓ Verify Document'}
                        </button>
                    </div>
                )}

                {/* File Verification */}
                {verificationMethod === 'file' && (
                    <div className="verify-form">
                        <label>Upload Document to Verify</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="verify-input file-input"
                        />
                        {file && <p className="file-name">Selected: {file.name}</p>}
                        <button onClick={handleVerify} disabled={loading} className="verify-btn">
                            {loading ? 'Computing Hash & Verifying...' : '✓ Verify Document'}
                        </button>
                    </div>
                )}

                {/* Camera/Image QR Scanner */}
                {verificationMethod === 'camera' && (
                    <div className="scanner-section">
                        <div className="scanner-options">
                            <button
                                onClick={startCameraScanner}
                                className={`scanner-btn ${scanning ? 'scanning' : ''}`}
                            >
                                {scanning ? '⏹ Stop Camera' : '📷 Start Camera'}
                            </button>
                            <label className="scanner-btn upload-label">
                                🖼️ Upload QR Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div id="qr-reader" className={scanning ? 'active' : ''}></div>
                        <div id="hidden-scanner" style={{ display: 'none' }}></div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* Result Display */}
            {result && (
                <div className={`result-card ${result.verified ? 'verified' : 'not-found'}`}>
                    {result.verified ? (
                        <>
                            <div className="result-header verified">
                                <span className="status-icon">✅</span>
                                <h2>DOCUMENT FOUND</h2>
                            </div>

                            {/* Org Verification Status Badge */}
                            {getStatusBadge()}

                            <div className="result-details">
                                <div className="detail-row">
                                    <span className="label">Document:</span>
                                    <span className="value">{result.document.fileName}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Type:</span>
                                    <span className="value">{result.document.docType}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Owner:</span>
                                    <span className="value address">{result.document.owner}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">User ID:</span>
                                    <span className="value mono">{result.document.userId}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Uploaded:</span>
                                    <span className="value">{new Date(result.document.uploadedAt).toLocaleString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Doc ID:</span>
                                    <span className="value mono">{result.document.verificationId}</span>
                                </div>
                                <div className="detail-row hash-row">
                                    <span className="label">Doc Hash:</span>
                                    <span className="value hash">{result.document.contentHash}</span>
                                </div>

                                {/* Verification Metadata */}
                                {verificationStatus && verificationStatus.status >= 1 && (
                                    <div className="verification-metadata">
                                        <h4>🏛️ Organization Verification Details</h4>
                                        <div className="detail-row">
                                            <span className="label">Verifier (Admin ID):</span>
                                            <span className="value address">{verificationStatus.verifierOrg}</span>
                                        </div>
                                        {verificationStatus.verificationDate && (
                                            <div className="detail-row">
                                                <span className="label">Verification Date:</span>
                                                <span className="value">{new Date(verificationStatus.verificationDate).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {verificationStatus.status === 3 && verificationStatus.rejectionReason && (
                                            <div className="detail-row rejection-row">
                                                <span className="label">Rejection Reason:</span>
                                                <span className="value rejection-text">{verificationStatus.rejectionReason}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Audit Trail Section */}
                            <div className="audit-section">
                                <h3>📜 Official Audit Trail</h3>
                                {auditTrail.length === 0 ? (
                                    <p className="no-audit">This document is self-registered and pending official organization review.</p>
                                ) : (
                                    <div className="audit-list">
                                        {auditTrail.map((log, index) => (
                                            <div key={index} className="audit-item">
                                                <div className="audit-header">
                                                    <span className="verifier-org">🏦 {log.verifier}</span>
                                                    <span className="audit-time">{log.timestamp}</span>
                                                </div>
                                                <p className="audit-remarks">{log.remarks}</p>
                                            </div>
                                        ))}
                                        <div className="on-chain-verified-badge">
                                            ✅ On-Chain Verified by Organization
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="result-header not-found">
                                <span className="status-icon">❌</span>
                                <h2>NOT FOUND</h2>
                            </div>
                            <p className="not-found-message">
                                {result.message || 'This document is not registered in the blockchain.'}
                            </p>
                            {result.computedHash && (
                                <div className="computed-hash">
                                    <span className="label">Computed Hash:</span>
                                    <span className="value">{result.computedHash}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default VerifyPage;
