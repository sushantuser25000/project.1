# 🚀 Quick Command Reference - Your Geth Network

## Network Configuration
- **Chain ID**: 2025
- **RPC URL**: http://127.0.0.1:8545
- **Sealer**: 0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f

---

## 1️⃣ Start Geth (UPDATED VERSION!)

```batch
# Use this file: start-node1-updated.bat
# It includes all necessary CORS settings
start-node1-updated.bat
```

---

## 2️⃣ Test Connection

### PowerShell:
```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### CMD:
```cmd
curl http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}"
```

---

## 3️⃣ Attach to Geth Console

```bash
geth attach http://127.0.0.1:8545
```

---

## 4️⃣ Useful Geth Console Commands

### Check Accounts
```javascript
eth.accounts
eth.getBalance("0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f")
eth.getBalance("0x2600cb7e01df861682923fe84a36bd68b9d8b69f")
```

### Check Mining
```javascript
eth.mining         // Should be true
eth.blockNumber    // Current block
miner.getHashrate()
```

### Create New Account
```javascript
personal.newAccount("password123")
```

### Send ETH
```javascript
eth.sendTransaction({
  from: "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f",
  to: "0xRECIPIENT_ADDRESS",
  value: web3.toWei(100, "ether")
})
```

### Check Transaction
```javascript
eth.getTransaction("0xTRANSACTION_HASH")
eth.getTransactionReceipt("0xTRANSACTION_HASH")
```

### Check Contract
```javascript
eth.getCode("0xCONTRACT_ADDRESS")  // Should return bytecode
```

---

## 5️⃣ Deploy Contract (Hardhat)

```bash
cd hardhat-example
npm install

# Create .env file with:
# PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Deploy
npx hardhat run scripts/deploy.js --network geth
```

---

## 6️⃣ Generate Test Account (Node.js)

```javascript
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
```

Save the script as `generate-account.js` and run:
```bash
node generate-account.js
```

---

## 7️⃣ Setup Backend

```bash
cd backend
npm install

# Create .env with:
PORT=5000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=2025
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS

npm start
```

---

## 8️⃣ Setup Frontend

```bash
cd frontend
npm install

# Create .env with:
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_CHAIN_ID=2025
REACT_APP_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS

npm start
```

---

## 🔧 Troubleshooting Commands

### Check if port is in use:
```powershell
netstat -ano | findstr :8545
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

### Kill process on port (PowerShell):
```powershell
# Get process ID
$processId = (Get-NetTCPConnection -LocalPort 8545).OwningProcess
# Kill it
Stop-Process -Id $processId -Force
```

### Check Geth logs:
Look at the console where Geth is running for errors

### Test backend:
```bash
curl http://localhost:5000/api/health
```

### Test frontend connection:
Open browser console at http://localhost:3000 and check for errors

---

## 📝 Environment Files Summary

### backend/.env
```env
PORT=5000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=2025
CONTRACT_ADDRESS=
SEALER_ADDRESS=0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_CHAIN_ID=2025
REACT_APP_CONTRACT_ADDRESS=
```

### hardhat-example/.env
```env
PRIVATE_KEY=0x...
```

---

## ⚡ Full Startup Sequence

```bash
# Terminal 1: Start Geth
start-node1-updated.bat

# Wait 10 seconds for node to start

# Terminal 2: Deploy contract (first time only)
cd hardhat-example
npx hardhat run scripts/deploy.js --network geth
# Copy the contract address!

# Update .env files with contract address

# Terminal 3: Start backend
cd backend
npm start

# Terminal 4: Start frontend
cd frontend  
npm start

# Browser: http://localhost:3000
```

---

## 🎯 Important Addresses

| Account | Address |
|---------|---------|
| Sealer (Funded) | 0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f |
| User 2 (Funded) | 0x2600cb7e01df861682923fe84a36bd68b9d8b69f |
| Contract | (Deploy and update here) |

---

## ✅ Pre-flight Checklist

Before starting:
- [ ] Geth initialized (only first time)
- [ ] password.txt exists in node1 folder
- [ ] Node.js installed
- [ ] npm packages installed (backend + frontend)

Ready to deploy:
- [ ] Geth is running and mining
- [ ] Have private key ready
- [ ] Account has ETH balance

Ready to run app:
- [ ] Contract deployed
- [ ] Contract address in .env files
- [ ] Backend started
- [ ] Frontend started

---

Keep this handy while setting up! 🚀
