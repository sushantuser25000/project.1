# 📖 Exhaustive Project Documentation: Secure Doc Ledger

This guide provides a rigorous, line-by-line and block-by-block analysis of every source file in the Secure Doc Ledger system.

---

## 🏗️ 1. Blockchain Configuration

### `genesis.json`
**Path:** `/genesis.json`  
This file defines the technical DNA of your private Ethereum network.

*   **Lines 2-18 (`config`)**: The core network parameters.
    *   **Line 3 (`chainId: 2025`)**: The unique identifier for your network.
    *   **Lines 4-13**: These define various Ethereum hardforks. By setting them to `0`, we enable all modern Ethereum features right from block 1.
    *   **Lines 14-17 (`clique`)**: Configures "Proof of Authority" (PoA).
        *   **`period: 5`**: A new block is generated every 5 seconds.
*   **Line 21 (`extraData`)**: This is critical for PoA. It contains the address of the authorized **Sealer** (`6bbb7f...`). This address is the ONLY one allowed to "mine" blocks.
*   **Lines 26-29 (`alloc`)**: Pre-allocates massive "Free" Ether to the sealer and developer accounts.

### `hardhat.config.js`
**Path:** `/hardhat-example/hardhat.config.js`  
*   **Line 6-14 (`solidity`)**: Specifies compiler version `0.8.20` and enables the **Optimizer** to shrink bytecode.
*   **Lines 15-29 (`networks`)**: Defines `poa`. Note the `httpHeaders: { "Connection": "close" }`, which ensures stable connections to the local node.

### `deploy-vanilla.js`
**Path:** `/hardhat-example/deploy-vanilla.js`  
*   **Line 12**: Grabs the **Signer** for the unlocked node account (`0x6bbb...`).
*   **Lines 22-34**: Orchestrates the sequential deployment of `UserAuth` and `OrgRegistry`, recording their permanent addresses on the ledger.

---

## 📜 2. Smart Contracts (Solidity)

### `UserAuth.sol`
**Path:** `/UserAuth.sol`  
*   **Lines 5-20 (`structs`)**: Data Schemas. `struct User` handles identity; `struct Document` handles file metadata including a SHA-256 `contentHash`.
*   **Lines 42-55 (`addDocument`)**: The core storage function. It takes metadata from the backend and saves it permanently to the blockchain state.
*   **Lines 66-98**: Registration logic. Supports both user self-signup and admin-managed onboarding.
*   **Lines 163-187 (`verifyByHash` / `verifyById`)**: Search Engine. These functions iterate through every document globally to find a match, proving authenticity.

### `OrgRegistry.sol`
**Path:** `/OrgRegistry.sol`  
*   **Line 20 (`VerificationStatus`)**: Tracks lifecycle: `NONE` -> `PENDING` -> `VERIFIED` / `REJECTED`.
*   **Lines 76-94 (`requestVerification`)**: Links a document's ID to a specific organization's wallet for review.
*   **Lines 97-127 (`verifyDocument`)**: Allows authorized organizations to create a permanent, non-deletable audit log of their verification.

---

## ⚙️ 3. Backend Engine (Node.js)

### `server.js`
**Path:** `/backend/server.js`  
The central orchestration layer.

- **Lines 35-57 (`Encryption Phase`)**: Implements AES-256-CBC.
    - **Line 46**: Generates a random **IV** (Initialization Vector) for every file, ensuring maximum privacy.
- **Lines 70-122 (`/api/documents/upload`)**:
    - **Line 84**: Computes the SHA-256 hash. This is the **Proof** saved on the blockchain.
    - **Line 98**: Sends the encrypted blob to Google Drive.
- **Lines 402-508 (`/api/auth/register`)**: Blockchain onboarding.
    - **Line 439**: Funds the new wallet with ETH.
    - **Line 469**: Emails the Private Key to the user.
- **Lines 837-956**: Verification Bridges. Connects frontend actions (Approve/Reject) to the `OrgRegistry` smart contract functions.

### `drive_service.js`
**Path:** `/backend/drive_service.js`  
- **Lines 8-15**: Fail-safe logic. Detects Google credentials and falls back to local storage if offline.
- **Lines 38-71 (`uploadFile`)**: Dual-storage mechanism—saves locally first, then syncs to Cloud.

---

## 💻 4. Frontend Application (React/Vite)

### `App.jsx`
**Path:** `/frontend/src/App.jsx`  
- **Lines 11-13**: Loads environment variables from `.env`.
- **Lines 56-84 (`initializeWeb3`)**: Creates the `provider` and `signer` from the user's private key.
- **Lines 86-157 (`handleLogin`)**: Security-first login. It uses a **Digital Signature** to prove ownership of a private key without ever sending the key to the server.
- **Lines 308-346**: The View Controller. Dynamically switches between **Admin Dashboard**, **User Vault**, and **Public Homepage**.

### `Dashboard.jsx`
**Path:** `/frontend/src/components/Dashboard.jsx`  
- **Lines 15-30**: `useEffect` that catches the real-time block number and balance from the blockchain on load.

### `Documents.jsx`
**Path:** `/frontend/src/components/Documents.jsx`  
- **Lines 81-137 (`handleUpload`)**: Orchestrates the multi-step upload: File Upload -> Hash Received -> Blockchain Transaction Triggered.
- **Lines 139-183**: Sends legal verification requests to Organizations.

### `VerifyPage.jsx`
**Path:** `/frontend/src/components/VerifyPage.jsx`  
- **Lines 40-69**: Connects the UI search bar to the blockchain database.
- **Lines 120-162**: Camera integration for instant QR code verification.

### `LoginForm.jsx` & `RegisterForm.jsx`
- Handle sensitive inputs. **RegisterForm** includes a custom success screen that ensures you never lose your auto-generated private key.

### `AdminDashboard.jsx`
- **Lines 30-45**: Polls the queue for documents awaiting this organization's official stamp.
- **Lines 47-81**: The "Approve" button that signs the blockchain verification log.

---

## 📦 5. Core Dependencies
- **`ethers`**: The library used to interact with the Ethereum network.
- **`googleapis`**: Powers the storage mirror to Google Drive.
- **`html5-qrcode`**: Powers the camera scanning feature.
- **`crypto`**: Ensures your files are encrypted with military-grade standards.

---

## 🏁 Summary Checklist
1.  **Block Proof**: Saved on Blockchain (`UserAuth.sol`).
2.  **Audit Trail**: Saved on Blockchain (`OrgRegistry.sol`).
3.  **Data Content**: Encrypted and saved on Google Drive (`drive_service.js`).
4.  **Security Bridge**: Node Express API (`server.js`).
5.  **User Interface**: React Dashboard (`App.jsx`).

Every line of code is synchronized to ensure that documents are **Private**, **Permanent**, and **Verifiable**.

---

## 🛠️ 6. System Utilities & Scripts

### `start-node1-updated.bat`
**Path:** `/start-node1-updated.bat`  
The Windows batch file that launches your private Ethereum node.

- **Lines 5-6**: Defines the data directory (`D:\projects\geth\node1`) and the primary **Sealer** wallet address.
- **Lines 12-35**: The main Geth command.
    - **`--networkid 2025`**: Matches your `genesis.json`.
    - **`--http.api eth,clique,miner...`**: Enables the specific functions the backend needs to check balances and send transactions.
    - **`--unlock %SIGNER%`**: Automatically logs the sealer in so the node can mine blocks without manual password entry.
    - **`--mine`**: Starts the block production process immediately.

### `add_org.js`
**Path:** `/backend/add_org.js`  
A command-line tool to register new Organizations.

- **Lines 21-28**: Includes a special `NEW` flag. If used, it generates a brand new Ethereum wallet on-the-fly and prints the private key for you.
- **Lines 32-37**: Connects to the `OrgRegistry` contract and calls `registerOrganization`.
- **Lines 42-51**: Automatically checks the new organization's balance. If they have no gas, the Sealer sends them **0.5 ETH** so they can start verifying documents immediately.

### `list_users.js`
**Path:** `/backend/list_users.js`  
- **Lines 25-29**: A lookup loop that queries the blockchain and prints every registered user’s username and wallet address to your terminal.

### `pending_docs.json`
**Path:** `/backend/pending_docs.json`  
A local JSON database that acts as a cache for the Admin Dashboard. It stores document metadata, verification status, and transaction hashes so the UI doesn't have to scan the entire blockchain for every page load.

---

## 🎨 7. UI Entry Point & Styling

### `main.jsx` & `index.css`
- **`main.jsx`**: The React entry point. It wraps your app in `StrictMode` and mounts it to the HTML `<div id="root">`.
- **`index.css`**: Defines the "Glassmorphism" and "Dark Mode" baseline. It sets up the gradients and modern typography used across all pages.

### Component CSS (`*.css`)
- **`Dashboard.css` / `Documents.css`**: These define the "Card" layouts and the transition animations.
- **`VerifyPage.css`**: Contains the specific styling for the camera scanner overlay, ensuring it looks professional on mobile devices.

---

## 📦 8. Configuration Files

### `.env` (Backend & Frontend)
- **Backend `.env`**: Contains sensitive secrets like your `ENCRYPTION_SECRET` and SMTP credentials for emailing private keys.
- **Frontend `.env`**: Contains public pointers like `VITE_API_URL` so the browser knows where to find the server on your network.

### `package.json` (Root & Others)
- Manages the ecosystem of libraries (Ethers, Vite, Express) that allow this system to function. Use `npm install` in both the frontend and backend folders to sync these.

