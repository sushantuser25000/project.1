# 📘 BBDVAM - Project Master Guide

> **Blockchain-Based Document Verification & Authentication Management**  
> A hybrid system combining a private Ethereum PoA blockchain, encrypted file storage, and a React-based front end for secure document registration and certification.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [File & Directory Reference](#3-file--directory-reference)
4. [Hardhat & Deployment History](#4-hardhat--deployment-history)
5. [Quick Commands & Startup](#5-quick-commands--startup)
6. [Environment Configuration](#6-environment-configuration)
7. [Roles & Access](#7-roles--access)
8. [Security Notes](#8-security-notes)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Overview

BBDVAM allows residents and institutions to:

- **Register** documents on a private blockchain, creating an immutable proof of existence.
- **Request certification** from authorized organizations (ACEM, Secure Doc Ledger).
- **Publicly verify** any document by ID, file hash, or QR code — no login required.
- **Admin orgs** approve or reject documents, creating an on-chain audit trail.

### User Roles
| Role | Capability |
|---|---|
| Resident User | Register, upload documents, request certification |
| Organization Admin | Log in to Admin Dashboard, approve/reject pending documents |
| Public | Verify any document via ID, hash, or QR code |

---

## 2. System Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│  React Frontend │────►│  Express.js Backend  │────►│  Geth PoA Node    │
│  (Vite, port    │     │  (Node.js, port 5000)│     │  (port 8545)      │
│   3000)         │     │                      │     │  Chain ID: 2025   │
└─────────────────┘     └──────────┬───────────┘     └──────────┬────────┘
                                   │                             │
                          ┌────────▼────────┐        ┌──────────▼─────────┐
                          │  Local Storage  │        │  Smart Contracts   │
                          │  (uploads/)     │        │  UserAuth.sol      │
                          └─────────────────┘        │  OrgRegistry.sol   │
                                                     └────────────────────┘
```

### Core Data Flows
1. **Upload** → Backend hashes file (SHA-256) → Encrypts (AES-256-CBC) → Stores locally → Records hash on `UserAuth` blockchain.
2. **Request Certification** → User selects org → `OrgRegistry.requestVerification()` stores pending request on chain.
3. **Admin Approves** → Admin calls `OrgRegistry.verifyDocument()` → Status updated to `VERIFIED` on-chain.
4. **Public Verify** → Anyone submits ID/file/QR → Backend queries `UserAuth` → Returns owner, date, certification status.

---

## 3. File & Directory Reference

### Root
| File | Purpose |
|---|---|
| `UserAuth.sol` | Core smart contract — user registration, document storage, hash lookups |
| `OrgRegistry.sol` | Organization registry — certification request, approval, audit trail |
| `genesis.json` | Defines the private PoA network (Chain ID 2025, Clique PoA, 5s blocks) |
| `genesis_single.json` | Alternative single-node genesis config |
| `start-node1-updated.bat` | Launches the Geth blockchain node |
| `addresses.json` | Deployed contract addresses snapshot |
| `README.md` | Quick project intro |

### Backend (`/backend`)
| File | Purpose |
|---|---|
| `server.js` | Central Express API — auth, upload, verify, certification, email |
| `drive_service.js` | Local file storage with optional Google Drive mirror |
| `.env` | **Secret** — SMTP, RPC, contract addresses. Never commit. |
| `.env.example` | Template for `.env` |
| `ADMIN_KEYS.txt` | **Consolidated admin keys** — all org addresses & private keys |
| `pending_docs.json` | Local cache of documents awaiting admin review |

### Frontend (`/frontend/src/components`)
| File | Purpose |
|---|---|
| `App.jsx` | Root component — routing, authentication, Web3 init |
| `LoginForm.jsx` | Private key login with signature challenge |
| `RegisterForm.jsx` | New user registration with auto key display |
| `Dashboard.jsx` | User home — balance, block number, ID card download |
| `Documents.jsx` | Upload documents, request certification |
| `VerifyPage.jsx` | Public verification — ID, file hash, QR camera, QR upload |
| `AdminDashboard.jsx` | Org admin — review & approve/reject pending docs |

### Blockchain Config (`genesis.json`)
- `chainId: 2025` — unique chain ID
- `clique.period: 5` — block every 5 seconds (Proof of Authority)
- `extraData` — embeds the sealer address (`0x6bbb7f...`) who is the only authorized block producer
- `alloc` — pre-funds sealer and developer accounts with test ETH

---

## 4. Hardhat & Deployment History

> **Note:** The `hardhat-example/` directory was used **only during initial contract deployment**. It is no longer needed for day-to-day operation. Contracts are already deployed and addresses are saved in `.env`.

### What Hardhat Did
- **Compiled** `UserAuth.sol` and `OrgRegistry.sol` into ABI + Bytecode.
- `deploy-vanilla.js` connected to local Geth, used the **sealer's** unlocked account (`0x6bbb7f...`) to deploy both contracts sequentially.
- Output contract addresses were copied to `backend/.env` and `frontend/.env`.

### Current Deployed Addresses (Chain 2025)
| Contract | Address |
|---|---|
| `UserAuth` | `0xE594562239A22f784A673977220d8CaC89D3E085` |
| `OrgRegistry` | `0x865e6BD09310477d8F4cA566b09b00a30e01CB61` |

### To Re-deploy (if needed)
```bash
cd hardhat-example
npm install
node deploy-vanilla.js
# Copy the output addresses to backend/.env and frontend/.env
```

---

## 5. Quick Commands & Startup

### Full Startup Sequence
```bash
# Terminal 1: Start Geth blockchain
start-node1-updated.bat

# Terminal 2: Start backend
cd backend
npm start

# Terminal 3: Start frontend
cd frontend
npm run dev

# Browser: http://localhost:3000
# LAN access: http://192.168.254.6:3000
```

### Useful Geth Console Commands
```javascript
geth attach http://127.0.0.1:8545

eth.blockNumber          // Current block (should be rising)
eth.mining               // Should be true
eth.getBalance("0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f")
```

### Check Ports
```powershell
netstat -ano | findstr :5000   # Backend
netstat -ano | findstr :3000   # Frontend
netstat -ano | findstr :8545   # Geth
```

### Register a New Organization (CLI)
```bash
cd backend
node add_org.js NEW "OrgName"   # Generates a new wallet and registers it
node add_org.js EXISTING "0xADDRESS" "OrgName"  # Registers an existing address
```

---

## 6. Environment Configuration

### `backend/.env`
```env
PORT=5000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=2025
CONTRACT_ADDRESS=0xE594562239A22f784A673977220d8CaC89D3E085
ORG_REGISTRY_ADDRESS=0x865e6BD09310477d8F4cA566b09b00a30e01CB61
SEALER_ADDRESS=0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bbdvam@gmail.com
SMTP_PASS=<16-char-app-password>
```

### `frontend/.env`
```env
VITE_API_URL=http://192.168.254.6:5000
VITE_RPC_URL=http://192.168.254.6:8545
VITE_CHAIN_ID=2025
VITE_CONTRACT_ADDRESS=0xE594562239A22f784A673977220d8CaC89D3E085
VITE_ORG_REGISTRY_ADDRESS=0x865e6BD09310477d8F4cA566b09b00a30e01CB61
```

---

## 7. Roles & Access

### Organization Admin Login
Use the Admin Dashboard at the bottom of the login screen.  
Enter the **private key** from `backend/ADMIN_KEYS.txt` for the organization you want to manage.

| Organization | Admin Address |
|---|---|
| ACEM | `0x25750C3E613F1edAE6e1395D1fEC5C2e15DF5AC6` |
| Secure Doc Ledger | `0x1336D19b7Aa8a1b15723620E06C3b013D0afB9b3` |

### Blockchain Sealer
The Geth node uses the sealer account (`0x6bbb7f...`) to produce blocks and fund new user wallets. It must remain unlocked in the running Geth process.

---

## 8. Security Notes

- **AES-256-CBC Encryption**: Files are encrypted before storage. The `iv` (random per file) is prepended to the encrypted blob.
- **EIP-712 Signature Auth**: Login never sends a private key to the server. A challenge message is signed locally.
- **On-chain Immutability**: Once a document hash is recorded, it cannot be modified.
- **`.env` files** are gitignored — never commit them.
- **`ADMIN_KEYS.txt`** is gitignored — back it up securely.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Email not sending | Check `backend/.env` SMTP credentials. Ensure 2FA is on for Gmail and App Password is used. |
| Frontend can't reach backend | Verify `VITE_API_URL` in `frontend/.env` matches your server IP/port |
| Geth not mining | Run `start-node1-updated.bat`, check password.txt exists in Geth data dir |
| Contract address mismatch | Re-deploy via `hardhat-example/deploy-vanilla.js` and update both `.env` files |
| 403 on LAN device | Check Windows Firewall — open ports 3000, 5000, 8545 for private network |
| Camera not working for QR | Browser needs HTTPS for camera. Use LAN IP or set chrome flag for insecure origins |
