import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './VerifyPage.css';

function VerifyPage() {
    const [verificationMethod, setVerificationMethod] = useState('id');
    const [verificationId, setVerificationId] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const html5QrCodeRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setVerificationId(id);
            verifyById(id);
        }
    }, []);

    const verifyById = async (id) => {
        const idToVerify = id || verificationId;
        if (!idToVerify.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${API_URL}/api/verify/id/${idToVerify}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            setResult(data);
            if (data.verificationStatus) setVerificationStatus(data.verificationStatus);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileVerify = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);

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
            if (data.verificationStatus) setVerificationStatus(data.verificationStatus);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async () => {
        try {
            setScanning(true);
            setError(null);

            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                () => { }
            );
        } catch (err) {
            console.error(err);
            setError("Camera access denied. Please allow camera permissions in your browser.");
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
        setScanning(false);
    };

    const handleQrFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setError(null);
            const html5QrCode = new Html5Qrcode("reader");
            const decodedText = await html5QrCode.scanFile(file, true);
            handleScanSuccess(decodedText);
        } catch (err) {
            console.error(err);
            setError("Could not read QR code from the provided image. Please ensure the QR is clear.");
        }
        e.target.value = ''; // Reset input
    };

    const handleScanSuccess = (decodedText) => {
        stopScanner();
        try {
            const url = new URL(decodedText);
            const id = url.searchParams.get('id');
            if (id) {
                setVerificationId(id);
                setVerificationMethod('id');
                verifyById(id);
            } else {
                setVerificationId(decodedText);
                setVerificationMethod('id');
                verifyById(decodedText);
            }
        } catch (e) {
            // Fallback if not a URL
            setVerificationId(decodedText);
            setVerificationMethod('id');
            verifyById(decodedText);
        }
    };

    const handleVerify = () => {
        if (verificationMethod === 'id') verifyById();
        else handleFileVerify();
    };

    return (
        <div className="verify-container">
            <div className="verify-card">
                <h2>BBDVAM Verification</h2>
                <p>Verify document registration and certification on the private ledger.</p>

                <div className="verify-methods">
                    <button
                        className={`method-tab ${verificationMethod === 'id' ? 'active' : ''}`}
                        onClick={() => setVerificationMethod('id')}
                    >
                        Verification ID
                    </button>
                    <button
                        className={`method-tab ${verificationMethod === 'file' ? 'active' : ''}`}
                        onClick={() => setVerificationMethod('file')}
                    >
                        Upload File
                    </button>
                </div>

                <div className="search-section">
                    {verificationMethod === 'id' ? (
                        <input
                            type="text"
                            value={verificationId}
                            onChange={(e) => setVerificationId(e.target.value.toUpperCase())}
                            placeholder="Enter Verification ID (e.g. DOC-...)"
                            className="search-input"
                        />
                    ) : (
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="file-verify-input"
                            />
                        </div>
                    )}
                    <button onClick={handleVerify} disabled={loading} className="btn-verify">
                        {loading ? '...' : 'Verify'}
                    </button>
                </div>

                {error && <div className="error-message">⚠️ {error}</div>}

                {result && result.verified && (
                    <div className="result-card" style={{ borderColor: verificationStatus?.status === 2 ? '#4ade80' : 'var(--glass-border)' }}>
                        <div className="result-header">
                            <span className="result-status-icon">
                                {verificationStatus?.status === 2 ? '💎' : '🛡️'}
                            </span>
                            <div className="result-title">
                                <h3 style={{ color: verificationStatus?.status === 2 ? '#4ade80' : 'inherit' }}>
                                    {verificationStatus?.status === 2 ? 'Certified Document' : 'Unverified Document'}
                                </h3>
                                <p style={{ margin: 0 }}>
                                    {verificationStatus?.status === 2
                                        ? 'Validated & Authenticated by Organization'
                                        : 'Registered on Private Ethereum Ledger'}
                                </p>
                            </div>
                        </div>

                        <div className="result-details">
                            <div className="detail-item">
                                <label>Document Name</label>
                                <span>{result.document.fileName}</span>
                            </div>
                            <div className="detail-item">
                                <label>Verification ID</label>
                                <span>{result.document.verificationId}</span>
                            </div>
                            <div className="detail-item">
                                <label>Type</label>
                                <span>{result.document.docType}</span>
                            </div>
                            <div className="detail-item">
                                <label>Registry Date</label>
                                <span>{new Date(result.document.uploadedAt).toLocaleString()}</span>
                            </div>
                            {verificationMethod === 'id' && (
                                <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                                    <label>Content Hash (SHA-256)</label>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{result.document.contentHash}</span>
                                </div>
                            )}
                        </div>

                        {verificationStatus && verificationStatus.status > 0 && (
                            <div className="certification-badge-area" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div className={`status-banner ${verificationStatus.statusText.toLowerCase()}`}>
                                    <span className="status-label">ORGANIZATIONAL STATUS: {verificationStatus.statusText}</span>
                                </div>
                                <div className="cert-info-grid" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="cert-item">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Verifier Organization</label>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{verificationStatus.verifierOrg || 'N/A'}</span>
                                    </div>
                                    <div className="cert-item">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            {verificationStatus.status === 3 ? 'Rejection Reason' : 'Verifier Remarks'}
                                        </label>
                                        <span style={{ fontSize: '0.9rem', color: verificationStatus.status === 3 ? '#fb7185' : 'var(--primary-color)' }}>
                                            {verificationStatus.rejectionReason || verificationStatus.remarks || 'Verified by official auditor'}
                                        </span>
                                    </div>
                                    {verificationStatus.verificationDate && (
                                        <div className="cert-item" style={{ gridColumn: '1/-1' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Verification Timestamp</label>
                                            <span style={{ fontSize: '0.85rem' }}>{new Date(verificationStatus.verificationDate).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {result && !result.verified && (
                    <div className="result-card" style={{ background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                        <div className="result-header">
                            <span className="result-status-icon">❌</span>
                            <div className="result-title">
                                <h3 style={{ color: '#fb7185' }}>Verification Failed</h3>
                                <p style={{ margin: 0 }}>This document is not registered on the ledger.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="scanner-section">
                    {!scanning ? (
                        <div className="scanner-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <button className="btn-scanner" onClick={startScanner}>
                                📷 Scan QR Code
                            </button>
                            <label className="btn-scanner" style={{ cursor: 'pointer', margin: 0 }}>
                                🖼️ Upload QR Image
                                <input type="file" accept="image/*" onChange={handleQrFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    ) : (
                        <button className="btn-scanner" onClick={stopScanner} style={{ background: '#f43f5e', color: 'white', borderColor: '#f43f5e' }}>
                            Stop Scanner
                        </button>
                    )}
                    <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '1rem auto 0', display: scanning ? 'block' : 'none' }}></div>
                </div>
            </div>
        </div>
    );
}

export default VerifyPage;
