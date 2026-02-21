const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const driveService = require('./drive_service');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}));
app.use(express.json());

// Ethereum network configuration
const NETWORK_CONFIG = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.CHAIN_ID || '1337'),
    contractAddress: process.env.CONTRACT_ADDRESS,
    orgRegistryAddress: process.env.ORG_REGISTRY_ADDRESS
};

// --- Document Upload & Encryption ---
const fs = require('fs');
const multer = require('multer');
const QRCode = require('qrcode');

// Encryption Settings
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default_secret_key_salt', 'salt', 32);
const IV_LENGTH = 16;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer (Memory storage to allow encryption before saving)
const upload = multer({ storage: multer.memoryStorage() });

function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { iv: iv.toString('hex'), content: encrypted };
}

function decryptBuffer(encryptedBuffer, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
}

// Generate unique verification ID
function generateVerificationId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'DOC-';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Upload Endpoint (Modified for Google Drive)
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
    try {
        const { address, docType, docName } = req.body;
        const file = req.file;

        if (!file || !address || !docType || !docName) {
            return res.status(400).json({ error: 'Missing file, address, docType, or docName' });
        }

        // 1. Derive User ID (Last 16 digits of address)
        const cleanAddress = address.toLowerCase().replace('0x', '');
        const userId = cleanAddress.slice(-16);

        // 2. Calculate SHA-256 hash of original file
        const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const contentHashBytes32 = '0x' + contentHash;

        // 3. Generate verification ID
        const verificationId = generateVerificationId();

        // 4. Encrypt File
        const { iv, content } = encryptBuffer(file.buffer);

        // 5. Store IV + Encrypted Content in Buffer
        const fileData = Buffer.concat([Buffer.from(iv, 'hex'), content]);

        // 6. Upload to Google Drive
        const filename = `${Date.now()}_${file.originalname}.enc`;
        const driveFileId = await driveService.uploadFile(
            fileData,
            filename,
            'application/octet-stream',
            process.env.GOOGLE_DRIVE_FOLDER_ID
        );

        console.log(`File uploaded to Drive: ${driveFileId}`);
        console.log(`Content Hash: ${contentHashBytes32}`);
        console.log(`Verification ID: ${verificationId}`);

        // 7. Return Drive ID for Chain
        res.json({
            success: true,
            path: driveFileId, // Using Drive ID as the path stored on chain
            userId: userId,
            contentHash: contentHashBytes32,
            verificationId: verificationId
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Download Endpoint (Retrieve from Drive & Decrypt)
app.get('/api/documents/download/:address/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        let requestedName = req.query.name || 'document';

        // Recover original extension from fileId (e.g., .pdf.enc -> .pdf)
        const originalExtMatch = fileId.match(/(\.[a-zA-Z0-9]+)\.enc$/);
        if (originalExtMatch && !requestedName.includes('.')) {
            requestedName += originalExtMatch[1];
        }

        // 1. Download from Google Drive
        const fileData = await driveService.downloadFile(fileId);

        // 2. Extract IV and Decrypt
        const iv = fileData.subarray(0, 16);
        const encryptedContent = fileData.subarray(16);

        const decrypted = decryptBuffer(encryptedContent, iv.toString('hex'));

        const contentType = mime.lookup(requestedName) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${requestedName}"`);
        res.send(decrypted);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Preview Endpoint (View Drive file in browser)
app.get('/api/documents/preview/:address/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        let requestedName = req.query.name || 'document';

        // Recover original extension from fileId
        const originalExtMatch = fileId.match(/(\.[a-zA-Z0-9]+)\.enc$/);
        if (originalExtMatch && !requestedName.includes('.')) {
            requestedName += originalExtMatch[1];
        }

        // 1. Download from Google Drive
        const fileData = await driveService.downloadFile(fileId);

        // 2. Extract IV and Decrypt
        const iv = fileData.subarray(0, 16);
        const encryptedContent = fileData.subarray(16);

        const decrypted = decryptBuffer(encryptedContent, iv.toString('hex'));

        const contentType = mime.lookup(requestedName) || 'application/pdf';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${requestedName}"`);
        res.send(decrypted);

    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: 'Preview failed' });
    }
});

// ABI for the UserAuth contract (updated with verification functions)
const CONTRACT_ABI = [
    "function registerUser(string memory _username) public",
    "function registerUserFor(address _userAddress, string memory _username) public",
    "function getUserInfo(address _userAddress) public view returns (address, string, uint256, bool)",
    "function getMyInfo() public view returns (address, string, uint256, bool)",
    "function isRegistered(address) public view returns (bool)",
    "function verifySignature(bytes32 message, bytes memory signature) public pure returns (address)",
    "function addDocument(string memory _docType, string memory _fileName, string memory _ipfsHash, bytes32 _contentHash, string memory _verificationId) public",
    "function getUserDocuments(address _userAddress) public view returns (tuple(uint256 id, string docType, string fileName, string ipfsHash, bytes32 contentHash, string verificationId, uint256 uploadedAt)[])",
    "function verifyByHash(bytes32 _hash) public view returns (bool verified, address owner, string memory fileName, string memory docType, string memory verificationId, uint256 uploadedAt)",
    "function verifyById(string memory _verificationId) public view returns (bool verified, address owner, string memory fileName, string memory docType, bytes32 contentHash, uint256 uploadedAt)",
    "function hashExists(bytes32 _hash) public view returns (bool)",
    "function verificationIdExists(string memory _verificationId) public view returns (bool)",
    "event UserRegistered(address indexed userAddress, string username, uint256 timestamp)",
    "event DocumentUploaded(address indexed userAddress, uint256 docId, string docType, string fileName, bytes32 contentHash, string verificationId)"
];

const ORG_REGISTRY_ABI = [
    "function organizations(address) public view returns (string name, address wallet, bool isAuthorized, uint256 registeredAt)",
    "function getAllOrganizations() public view returns (address[])",
    "function requestVerification(string memory _verificationId, address _org) public",
    "function verifyDocument(string memory _verificationId, string memory _remarks) public",
    "function rejectDocument(string memory _verificationId, string memory _reason) public",
    "function getAuditTrail(string memory _verificationId) public view returns (tuple(string verificationId, address verifierOrg, uint256 timestamp, string remarks)[])",
    "function getVerificationStatus(string memory _verificationId) public view returns (uint8 status, address verifierOrg, string memory rejectionReason, uint256 lastUpdated)",
    "event DocumentVerified(string indexed verificationId, address indexed verifier, uint256 timestamp)",
    "event VerificationRequested(string indexed verificationId, address indexed uploader, address indexed targetOrg)",
    "event DocumentRejected(string indexed verificationId, address indexed verifier, string reason)"
];

// Provider setup
let provider;
let contract;
let orgRegistry;

function initializeProvider() {
    try {
        provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl, {
            chainId: NETWORK_CONFIG.chainId,
            name: "unknown"
        });
        if (NETWORK_CONFIG.contractAddress) {
            contract = new ethers.Contract(
                NETWORK_CONFIG.contractAddress,
                CONTRACT_ABI,
                provider
            );
        }
        if (NETWORK_CONFIG.orgRegistryAddress) {
            orgRegistry = new ethers.Contract(
                NETWORK_CONFIG.orgRegistryAddress,
                ORG_REGISTRY_ABI,
                provider
            );
        }
        console.log('✓ Providers initialized');
    } catch (error) {
        console.error('Failed to initialize provider:', error.message);
    }
}

initializeProvider();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        network: NETWORK_CONFIG,
        contractAddress: NETWORK_CONFIG.contractAddress || 'Not configured'
    });
});

// Verify signature and authenticate
app.post('/api/auth/verify', async (req, res) => {
    try {
        const { message, signature, address } = req.body;

        if (!message || !signature || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        console.log(`Verification Debug:`);
        console.log(`- Message (JSON): ${JSON.stringify(message)}`);
        console.log(`- Message Length: ${message.length}`);
        console.log(`- Claimed Address: ${address}`);
        console.log(`- Recovered Address: ${recoveredAddress}`);
        console.log(`- Signature: ${signature.slice(0, 20)}...`);

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.error('❌ Signature mismatch!');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('✅ Signature verified');

        // Check if user is registered
        if (contract) {
            const isRegistered = await contract.isRegistered(address);

            if (!isRegistered) {
                return res.json({
                    success: true,
                    verified: true,
                    registered: false,
                    address: recoveredAddress,
                    message: 'Signature verified but user not registered'
                });
            }

            // Get user info
            const userInfo = await contract.getUserInfo(address);

            return res.json({
                success: true,
                verified: true,
                registered: true,
                address: recoveredAddress,
                user: {
                    address: userInfo[0],
                    username: userInfo[1],
                    registeredAt: userInfo[2].toString(),
                    isActive: userInfo[3]
                }
            });
        } else {
            return res.json({
                success: true,
                verified: true,
                registered: false,
                address: recoveredAddress,
                message: 'Signature verified (contract not configured)'
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

// Get user info by address
app.get('/api/user/:address', async (req, res) => {
    try {
        const { address } = req.params;

        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        if (!contract) {
            return res.status(503).json({ error: 'Contract not configured' });
        }

        const isRegistered = await contract.isRegistered(address);

        if (!isRegistered) {
            return res.status(404).json({ error: 'User not registered' });
        }

        const userInfo = await contract.getUserInfo(address);

        res.json({
            success: true,
            user: {
                address: userInfo[0],
                username: userInfo[1],
                registeredAt: userInfo[2].toString(),
                isActive: userInfo[3]
            }
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});

// Get nonce for signing
app.get('/api/auth/nonce/:address', (req, res) => {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const timestamp = Date.now();
    const nonce = `Login to the application\n\nAddress: ${address}\nTimestamp: ${timestamp}`;

    res.json({
        success: true,
        nonce,
        timestamp
    });
});

// Email transporter setup
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use STARTTLS (port 587)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certs in dev
    }
});

// Register new user (generate key -> fund -> register -> email)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, address: providedAddress } = req.body;

        if (!email || !username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!contract) {
            return res.status(503).json({ error: 'Contract not configured' });
        }

        // 1. Setup Registration Target
        let address = providedAddress;
        let privateKey = null;
        let wallet;

        if (!address) {
            // Generate new wallet if address not provided
            wallet = ethers.Wallet.createRandom(provider);
            privateKey = wallet.privateKey;
            address = wallet.address;
            console.log(`Creating account for ${email}: ${address}`);
        } else {
            console.log(`Registering provided address for ${email}: ${address}`);
        }

        const sealerAddress = process.env.SEALER_ADDRESS || "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f";
        const adminSigner = await provider.getSigner(sealerAddress);

        // 2. Fund the wallet (Send 1.0 ETH from Admin)
        try {
            console.log(`Funding account from sealer: ${sealerAddress}`);

            const fundTx = await adminSigner.sendTransaction({
                to: address,
                value: ethers.parseEther("1.0")
            });
            console.log(`Funding tx sent: ${fundTx.hash}`);
            await fundTx.wait();
            console.log('Account funded');
        } catch (fundError) {
            console.error('Funding failed:', fundError);
            return res.status(500).json({ error: 'Failed to fund account', details: fundError.message });
        }

        // 3. Register user on chain
        let tx;
        if (privateKey) {
            // Self-registration for new wallets
            const contractWithSigner = contract.connect(new ethers.Wallet(privateKey, provider));
            tx = await contractWithSigner.registerUser(username);
        } else {
            // Admin registration for provided addresses
            const contractWithAdmin = contract.connect(adminSigner);
            tx = await contractWithAdmin.registerUserFor(address, username);
        }

        console.log(`Registration tx sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Account registered in block ${receipt.blockNumber}`);

        // 4. Send Email Notification
        const mailOptions = {
            from: `"Secure Doc Ledger" <${process.env.SMTP_USER || 'bbdvam@gmail.com'}>`,
            to: email,
            subject: '🔐 Your Account Credentials',
            html: `
                <h2>Welcome, ${username}!</h2>
                <p>Your account has been registered on the blockchain.</p>
                <hr/>
                <p><strong>Address:</strong> <code>${address}</code></p>
                ${privateKey ? `<p><strong>Private Key:</strong> <code>${privateKey}</code></p>` : ''}
                <hr/>
                <p style="color:red"><strong>⚠️ Keep your private key safe and never share it!</strong></p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent to ${email}`);
        } catch (mailError) {
            console.error('❌ Email sending failed:', mailError.message);
            // We don't fail the registration if email fails, but we log it
        }

        // 5. Response
        console.log('✅ Account registered successfully');
        if (privateKey) {
            console.log(`[CREDENTIALS] Email: ${email} | Address: ${address} | Key: ${privateKey}`);
        } else {
            console.log(`[REGISTRATION] Email: ${email} | Address: ${address} (External Key)`);
        }

        res.json({
            success: true,
            message: 'Registration successful! Check your email for credentials.',
            address: address,
            privateKey: privateKey,
            detail: privateKey ? 'Keep your private key safe!' : 'Your provided address is now registered.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Get network info
app.get('/api/network/info', async (req, res) => {
    try {
        if (!provider) {
            return res.status(503).json({ error: 'Provider not initialized' });
        }

        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();

        res.json({
            success: true,
            network: {
                name: network.name,
                chainId: network.chainId.toString(),
                blockNumber
            }
        });

    } catch (error) {
        console.error('Network info error:', error);
        res.status(500).json({ error: 'Failed to fetch network info', details: error.message });
    }
});

// =============================================
// PUBLIC VERIFICATION ENDPOINTS (No auth needed)
// =============================================

// Verify document by verification ID
app.get('/api/verify/id/:verificationId', async (req, res) => {
    try {
        const { verificationId } = req.params;

        if (!contract) {
            return res.status(503).json({ error: 'Contract not configured' });
        }

        const result = await contract.verifyById(verificationId);
        const [verified, owner, fileName, docType, contentHash, uploadedAt] = result;

        if (!verified) {
            return res.json({
                verified: false,
                message: 'Document not found in system'
            });
        }

        res.json({
            verified: true,
            document: {
                fileName,
                docType,
                owner,
                contentHash,
                uploadedAt: new Date(Number(uploadedAt) * 1000).toISOString(),
                verificationId
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

// Verify document by hash
app.get('/api/verify/hash/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (!contract) {
            return res.status(503).json({ error: 'Contract not configured' });
        }

        // Ensure hash is properly formatted
        const formattedHash = hash.startsWith('0x') ? hash : '0x' + hash;

        const result = await contract.verifyByHash(formattedHash);
        const [verified, owner, fileName, docType, verificationId, uploadedAt] = result;

        if (!verified) {
            return res.json({
                verified: false,
                message: 'Document hash not found in system'
            });
        }

        res.json({
            verified: true,
            document: {
                fileName,
                docType,
                owner,
                contentHash: formattedHash,
                uploadedAt: new Date(Number(uploadedAt) * 1000).toISOString(),
                verificationId
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

// Verify document by uploading file (computes hash)
app.post('/api/verify/file', upload.single('document'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!contract) {
            return res.status(503).json({ error: 'Contract not configured' });
        }

        // Calculate hash of uploaded file
        const contentHash = '0x' + crypto.createHash('sha256').update(file.buffer).digest('hex');

        const result = await contract.verifyByHash(contentHash);
        const [verified, owner, fileName, docType, verificationId, uploadedAt] = result;

        if (!verified) {
            return res.json({
                verified: false,
                message: 'Document not found in system',
                computedHash: contentHash
            });
        }

        res.json({
            verified: true,
            document: {
                fileName,
                docType,
                owner,
                contentHash,
                uploadedAt: new Date(Number(uploadedAt) * 1000).toISOString(),
                verificationId
            }
        });

    } catch (error) {
        console.error('File verification error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

// Generate QR code for verification ID
app.get('/api/verify/qr/:verificationId', async (req, res) => {
    try {
        const { verificationId } = req.params;
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/verify?id=${verificationId}`;

        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Return as JSON with data URL
        res.json({
            success: true,
            verificationId,
            verifyUrl,
            qrCode: qrDataUrl
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ error: 'QR generation failed', details: error.message });
    }
});

// Get on-chain verification status for a document
app.get('/api/verify/status/:verificationId', async (req, res) => {
    try {
        const { verificationId } = req.params;
        if (!orgRegistry) {
            return res.status(503).json({ error: 'OrgRegistry contract not configured' });
        }

        const statusData = await orgRegistry.getVerificationStatus(verificationId);
        const statusNum = Number(statusData[0]);
        const statusMap = ['NONE', 'PENDING', 'VERIFIED', 'REJECTED'];

        res.json({
            success: true,
            verificationId,
            status: statusNum,
            statusText: statusMap[statusNum] || 'UNKNOWN',
            verifierOrg: statusData[1],
            rejectionReason: statusData[2],
            lastUpdated: Number(statusData[3])
        });
    } catch (error) {
        console.error('Status fetch error:', error);
        // Return NONE status if not found (new doc never requested)
        res.json({ success: true, status: 0, statusText: 'NONE' });
    }
});

// Generate QR code as image
// =============================================
// ADMIN & ORGANIZATION ENDPOINTS
// =============================================

let PENDING_DOCUMENTS = [];

// List authorized organizations
app.get('/api/organizations', async (req, res) => {
    try {
        if (!orgRegistry) return res.status(503).json({ error: 'OrgRegistry not configured' });

        const orgAddresses = await orgRegistry.getAllOrganizations();
        const orgs = await Promise.all(orgAddresses.map(async (addr) => {
            try {
                const info = await orgRegistry.organizations(addr);
                return {
                    name: info[0],
                    address: info[1],
                    isAuthorized: info[2]
                };
            } catch (e) { return null; }
        }));

        res.json({
            success: true,
            organizations: orgs.filter(o => o && o.isAuthorized)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request verification on-chain
app.post('/api/documents/request-verification', async (req, res) => {
    try {
        const { verificationId, targetOrg, userPrivateKey, docInfo } = req.body;
        if (!verificationId || !targetOrg || !userPrivateKey) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedOrg = ethers.getAddress(targetOrg);
        const userWallet = new ethers.Wallet(userPrivateKey, provider);
        const orgContractWithSigner = orgRegistry.connect(userWallet);

        console.log(`📡 Requesting verification for ${verificationId} to ${normalizedOrg}`);
        const tx = await orgContractWithSigner.requestVerification(verificationId, normalizedOrg, {
            gasLimit: 300000,
            type: 0,
            gasPrice: 1000000000
        });
        await tx.wait();

        // Track locally for the admin queue
        PENDING_DOCUMENTS.push({
            verificationId,
            targetOrg: normalizedOrg.toLowerCase(),
            userId: userWallet.address,
            docName: docInfo?.fileName || 'Document',
            docType: docInfo?.docType || 'Personal ID',
            driveFileId: docInfo?.ipfsHash,
            uploadedAt: Date.now(),
            status: 'pending'
        });

        res.json({ success: true, message: 'Verification request sent on-chain' });
    } catch (error) {
        console.error('Request verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fetch pending documents for an organization
app.get('/api/admin/pending/:orgAddress', (req, res) => {
    const orgAddress = req.params.orgAddress.toLowerCase();
    res.json({
        success: true,
        count: PENDING_DOCUMENTS.length,
        documents: PENDING_DOCUMENTS.filter(d =>
            d.targetOrg === orgAddress && d.status === 'pending'
        )
    });
});

// Admin verification call (Blockchain Bridge)
app.post('/api/admin/verify', async (req, res) => {
    try {
        const { verificationId, remarks, adminPrivateKey } = req.body;

        if (!verificationId || !adminPrivateKey) {
            return res.status(400).json({ error: 'Missing verificationId or adminPrivateKey' });
        }

        if (!orgRegistry) {
            return res.status(503).json({ error: 'OrgRegistry contract not configured' });
        }

        const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
        const orgContractWithSigner = orgRegistry.connect(adminWallet);

        console.log(`🚀 Admin verifying document: ${verificationId} with address: ${adminWallet.address}`);

        // PRE-FLIGHT CHECK: Fetch status to debug revert explicitly
        try {
            const statusData = await orgContractWithSigner.getVerificationStatus(verificationId);
            console.log(`[Pre-flight Check] Target Verifier Org on-chain: ${statusData.verifierOrg}`);
            console.log(`[Pre-flight Check] Admin wallet attempt: ${adminWallet.address}`);

            if (statusData.verifierOrg.toLowerCase() !== adminWallet.address.toLowerCase()) {
                console.error("Mismatch: Admin wallet does not match the requested verifier Org!");
                return res.status(403).json({ error: `Not assigned verifier. Expected ${statusData.verifierOrg}, got ${adminWallet.address}` });
            }
            if (statusData.status != 1) { // 1 = PENDING
                console.error(`Document status is not PENDING. Current status code: ${statusData.status}`);
                return res.status(400).json({ error: `Document not pending. Status: ${statusData.status}` });
            }
        } catch (preFlightErr) {
            console.error("Pre-flight check failed. Does this verificationId exist?", preFlightErr.message);
        }

        const tx = await orgContractWithSigner.verifyDocument(verificationId, remarks || 'Verified by Organization', {
            gasLimit: 300000,
            type: 0,
            gasPrice: 1000000000
        });

        const receipt = await tx.wait();
        console.log(`✅ Verification recorded on chain: ${receipt.hash}`);

        // Update local status
        const docIndex = PENDING_DOCUMENTS.findIndex(d => d.verificationId === verificationId);
        if (docIndex !== -1) {
            PENDING_DOCUMENTS[docIndex].status = 'verified';
            PENDING_DOCUMENTS[docIndex].txHash = receipt.hash;
        }

        res.json({
            success: true,
            txHash: receipt.hash,
            message: 'Document officially verified on blockchain'
        });

    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Verification bridge failed', details: error.message });
    }
});

// Admin Reject Call
app.post('/api/admin/reject', async (req, res) => {
    try {
        const { verificationId, reason, adminPrivateKey } = req.body;

        if (!verificationId || !adminPrivateKey || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
        const orgContractWithSigner = orgRegistry.connect(adminWallet);

        console.log(`❌ Admin rejecting document: ${verificationId} with reason: ${reason} (Admin: ${adminWallet.address})`);

        // PRE-FLIGHT CHECK: Fetch status to debug revert explicitly
        try {
            const statusData = await orgContractWithSigner.getVerificationStatus(verificationId);
            if (statusData.verifierOrg.toLowerCase() !== adminWallet.address.toLowerCase()) {
                console.error("Mismatch: Admin wallet does not match the requested verifier Org!");
                return res.status(403).json({ error: `Not assigned verifier. Expected ${statusData.verifierOrg}, got ${adminWallet.address}` });
            }
            if (statusData.status != 1) { // 1 = PENDING
                console.error(`Document status is not PENDING. Current status code: ${statusData.status}`);
                return res.status(400).json({ error: `Document not pending. Status: ${statusData.status}` });
            }
        } catch (preFlightErr) {
            console.error("Pre-flight check failed.", preFlightErr.message);
        }

        const tx = await orgContractWithSigner.rejectDocument(verificationId, reason, {
            gasLimit: 300000,
            type: 0,
            gasPrice: 1000000000
        });
        await tx.wait();

        // Update local status
        const docIndex = PENDING_DOCUMENTS.findIndex(d => d.verificationId === verificationId);
        if (docIndex !== -1) {
            PENDING_DOCUMENTS[docIndex].status = 'rejected';
            PENDING_DOCUMENTS[docIndex].rejectionReason = reason;
        }

        res.json({ success: true, message: 'Document rejected on-chain' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ error: 'Rejection failed', details: error.message });
    }
});

// Admin verification status check
app.get('/api/verify/status/:verificationId', async (req, res) => {
    try {
        const { verificationId } = req.params;
        if (!orgRegistry) return res.status(503).json({ error: 'OrgRegistry not configured' });

        const statusData = await orgRegistry.getVerificationStatus(verificationId);
        // [status, verifierOrg, rejectionReason, lastUpdated]

        res.json({
            success: true,
            status: Number(statusData[0]), // 0:NONE, 1:PENDING, 2:VERIFIED, 3:REJECTED
            verifier: statusData[1],
            rejectionReason: statusData[2],
            lastUpdated: Number(statusData[3]) * 1000
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Audit Trail for a document
app.get('/api/verify/audit/:verificationId', async (req, res) => {
    try {
        const { verificationId } = req.params;

        if (!orgRegistry) {
            return res.status(503).json({ error: 'OrgRegistry not configured' });
        }

        const auditTrail = await orgRegistry.getAuditTrail(verificationId);

        const formattedAudit = auditTrail.map(log => ({
            verificationId: log[0],
            verifier: log[1],
            timestamp: new Date(Number(log[2]) * 1000).toISOString(),
            remarks: log[3]
        }));

        res.json({
            success: true,
            auditTrail: formattedAudit
        });

    } catch (error) {
        console.error('Audit trail error:', error);
        res.status(500).json({ error: 'Failed to fetch audit trail', details: error.message });
    }
});

app.get('/api/verify/qr/:verificationId/image', async (req, res) => {
    try {
        const { verificationId } = req.params;
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/verify?id=${verificationId}`;

        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
            width: 300,
            margin: 2
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${verificationId}.png"`);
        res.send(qrBuffer);

    } catch (error) {
        console.error('QR image generation error:', error);
        res.status(500).json({ error: 'QR image generation failed', details: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Connected to network: ${NETWORK_CONFIG.rpcUrl}`);
    console.log(`📜 Contract address: ${NETWORK_CONFIG.contractAddress || 'Not configured'}`);
});
