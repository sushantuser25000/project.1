# 🛡️ BBDVAMS - Blockchain-Based Document Verification & Authentication Management System

A hybrid system combining a private Ethereum Proof of Authority (PoA) blockchain, encrypted file storage, and a React-based frontend for secure document registration and certification.

## 🌟 Key Features

- **Immutable Document Registration**: Register documents on a private blockchain, creating a permanent proof of existence.
- **Organization Certification**: Users can request certification from authorized organizations (e.g., ACEM, Secure Doc Ledger).
- **Public Verification**: Verify any document publicly via Document ID, file hash, or QR code — no login required.
- **Secure Authentication**: Login using Ethereum private keys with EIP-712 cryptographic signatures.
- **Encrypted Storage**: Files are encrypted (AES-256-CBC) before being stored, with an optional Google Drive mirror.
- **Admin Dashboard**: Authorized organizations can approve or reject certification requests.

## 📁 Project Structure

```text
.
├── UserAuth.sol              # Core smart contract: user management & document storage
├── OrgRegistry.sol           # Organization registry: certification requests & approvals
├── backend/                  # Express.js backend (Node.js)
│   ├── server.js             # Central API (Auth, Upload, Verify, Certification)
│   ├── drive_service.js      # Local storage with Google Drive support
│   └── uploads/              # Local storage for encrypted documents
├── frontend/                 # React frontend (Vite)
│   ├── src/                  # Components (LoginForm, Dashboard, Documents, etc.)
│   └── vite.config.js        # Vite configuration
├── genesis.json              # Private PoA network configuration (Chain ID: 2025)
└── start-node1-updated.bat   # Startup script for Geth blockchain node
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- [Geth (Go Ethereum)](https://geth.ethereum.org/downloads/)
- npm or yarn

### 1. Start the Blockchain
Run the provided batch file to launch the private Geth PoA node:
```bash
./start-node1-updated.bat
```

### 2. Set Up the Backend
```bash
cd backend
npm install
# Configure your .env (refer to .env.example)
npm start
```

### 3. Set Up the Frontend
```bash
cd frontend
npm install
# Configure your .env (refer to .env.example)
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Blockchain RPC**: http://localhost:8545

## 📊 Technical Specifications

- **Consensus**: Clique (Proof of Authority)
- **Chain ID**: 2025
- **Block Time**: 5 seconds
- **Encryption**: AES-256-CBC
- **Hashing**: SHA-256
- **Smart Contracts**: Solidity (UserAuth, OrgRegistry)

## 🛡️ Security Notes

- **Development Only**: This is a demonstration application. Use only test accounts with no real funds.
- **Key Management**: Private keys are used for authentication. Never share your primary keys.
- **Environment Variables**: Sensistive data (SMTP, RPC, Private Keys) must be kept in `.env` files and never committed to version control.

## 📄 License

MIT License - See [License.txt](./frontend/License.txt) for details.

---

Built with ❤️ using Ethereum, React (Vite), and Node.js (Express).
