# Ethereum PoA Authentication System - Complete Setup Guide

This guide will walk you through setting up a complete authentication system using private keys on a private Ethereum network with Proof of Authority (PoA) using Geth.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setting Up Private Ethereum Network](#setting-up-private-ethereum-network)
3. [Deploying Smart Contract](#deploying-smart-contract)
4. [Setting Up Backend](#setting-up-backend)
5. [Setting Up Frontend](#setting-up-frontend)
6. [Testing the Application](#testing-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js (v16 or higher)
- npm or yarn
- Go Ethereum (Geth) v1.10 or higher
- A code editor (VS Code recommended)

### Install Geth
**Ubuntu/Debian:**
```bash
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum
```

**macOS:**
```bash
brew tap ethereum/ethereum
brew install ethereum
```

**Windows:**
Download from https://geth.ethereum.org/downloads/

---

## Setting Up Private Ethereum Network

### Step 1: Create Network Directory
```bash
mkdir -p ~/eth-poa-network
cd ~/eth-poa-network
```

### Step 2: Create Accounts
Create at least two accounts (one for sealer, one for user):

```bash
# Create sealer account
geth account new --datadir ./node1
# Save the address and password

# Create user account
geth account new --datadir ./node1
# Save the address and password
```

**Important:** Save all addresses and passwords securely!

### Step 3: Create Genesis File
Create a file named `genesis.json`:

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "clique": {
      "period": 5,
      "epoch": 30000
    }
  },
  "difficulty": "1",
  "gasLimit": "8000000",
  "extradata": "0x0000000000000000000000000000000000000000000000000000000000000000SEALER_ADDRESS_WITHOUT_0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "alloc": {
    "SEALER_ADDRESS": { "balance": "1000000000000000000000" },
    "USER_ADDRESS": { "balance": "1000000000000000000000" }
  }
}
```

**Replace:**
- `SEALER_ADDRESS_WITHOUT_0x` with your sealer address (remove 0x prefix)
- `SEALER_ADDRESS` and `USER_ADDRESS` with full addresses (including 0x)

### Step 4: Initialize the Network
```bash
geth init --datadir ./node1 genesis.json
```

### Step 5: Create Password File
```bash
echo "your_sealer_password" > password.txt
```

### Step 6: Start Geth Node
```bash
geth --datadir ./node1 \
  --networkid 1337 \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,miner" \
  --http.corsdomain "*" \
  --allow-insecure-unlock \
  --unlock "SEALER_ADDRESS" \
  --password password.txt \
  --mine \
  --miner.etherbase "SEALER_ADDRESS" \
  console
```

**Replace `SEALER_ADDRESS` with your actual sealer address.**

### Step 7: Verify Network
In the Geth console:
```javascript
> eth.blockNumber  // Should be increasing
> eth.accounts     // Should show your accounts
> eth.getBalance(eth.accounts[0])  // Should show balance
```

---

## Deploying Smart Contract

### Option 1: Using Hardhat

#### Install Hardhat
```bash
mkdir contract-deployment
cd contract-deployment
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

#### Configure Hardhat
Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    poa: {
      url: "http://localhost:8545",
      accounts: ["0xYOUR_SEALER_PRIVATE_KEY"],
      chainId: 1337
    }
  }
};
```

#### Create Deployment Script
Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const UserAuth = await hre.ethers.getContractFactory("UserAuth");
  const userAuth = await UserAuth.deploy();
  await userAuth.waitForDeployment();
  
  const address = await userAuth.getAddress();
  console.log("UserAuth deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

#### Deploy
```bash
# Copy UserAuth.sol to contracts/
cp ../UserAuth.sol contracts/

# Deploy
npx hardhat run scripts/deploy.js --network poa
```

### Option 2: Using Remix IDE

1. Go to https://remix.ethereum.org
2. Create new file `UserAuth.sol` and paste the contract code
3. Compile the contract (Solidity Compiler tab)
4. Deploy:
   - Environment: "Injected Provider - Custom"
   - Connect to http://localhost:8545
   - Deploy

**Save the deployed contract address!**

---

## Setting Up Backend

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
RPC_URL=http://localhost:8545
CHAIN_ID=1337
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Step 4: Start Backend Server
```bash
npm start
```

Server should start on http://localhost:5000

### Step 5: Test Backend
```bash
curl http://localhost:5000/api/health
```

---

## Setting Up Frontend

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Step 4: Start Frontend
```bash
npm start
```

Frontend should open at http://localhost:3000

---

## Testing the Application

### Test 1: Register a New User

1. Open http://localhost:3000
2. Click "Register Now"
3. Enter:
   - Username: `testuser`
   - Private Key: Use the private key from one of your Geth accounts
4. Click "Register"
5. Wait for transaction confirmation
6. You should be automatically logged in

### Test 2: Login with Existing User

1. Click "Logout" if logged in
2. Enter your private key
3. Click "Login"
4. You should see the dashboard with your user information

### Test 3: Get Private Key from Geth

To export a private key from your Geth account:

**Method 1: Using Geth Console**
```javascript
// In Geth console
personal.unlockAccount("YOUR_ADDRESS", "YOUR_PASSWORD", 300)

// Then use a tool or script to extract the private key
```

**Method 2: Using Keystore File**
The keystore files are in `~/eth-poa-network/node1/keystore/`
Use a tool like MyEtherWallet or a script to extract the private key.

**Method 3: Create New Account Programmatically**
```javascript
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│                 │         │                 │         │                  │
│  React Frontend │◄────────┤  Express.js API │◄────────┤  Geth (PoA Node) │
│                 │         │                 │         │                  │
└────────┬────────┘         └────────┬────────┘         └────────┬─────────┘
         │                           │                           │
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                                     │
                         ┌───────────▼───────────┐
                         │                       │
                         │  UserAuth Contract    │
                         │    (Solidity)         │
                         │                       │
                         └───────────────────────┘
```

### Authentication Flow

1. **User enters private key** → Frontend creates wallet
2. **Request nonce** → Backend generates challenge message
3. **Sign message** → Frontend signs with private key
4. **Verify signature** → Backend recovers address from signature
5. **Check registration** → Backend queries smart contract
6. **Return user data** → Backend sends user info to frontend
7. **Store session** → Frontend stores auth data in localStorage

---

## Security Best Practices

### For Development
- ✅ Use test accounts with no real funds
- ✅ Never commit private keys to git
- ✅ Use environment variables for sensitive data
- ✅ Keep the network isolated (localhost only)

### For Production
- ⚠️ Use HTTPS for all connections
- ⚠️ Implement proper key management (hardware wallets)
- ⚠️ Add rate limiting to API endpoints
- ⚠️ Implement session timeouts
- ⚠️ Use secure random nonce generation
- ⚠️ Add CORS restrictions
- ⚠️ Implement proper error handling
- ⚠️ Add logging and monitoring
- ⚠️ Use encrypted storage for keys

---

## Troubleshooting

### Geth Issues

**Problem:** Geth won't start
```bash
# Check if port is in use
lsof -i :8545

# Check logs
geth --datadir ./node1 --verbosity 5
```

**Problem:** No new blocks being mined
```bash
# In Geth console
> miner.start()
> eth.mining  // Should return true
```

**Problem:** Account locked
```bash
# Unlock account
> personal.unlockAccount("YOUR_ADDRESS", "PASSWORD", 0)
```

### Backend Issues

**Problem:** Cannot connect to Geth
- Check if Geth is running: `curl http://localhost:8545`
- Verify RPC_URL in `.env`
- Check firewall settings

**Problem:** Contract not found
- Verify CONTRACT_ADDRESS is correct
- Check if contract is deployed: Use block explorer or Geth console

### Frontend Issues

**Problem:** Invalid private key
- Ensure private key starts with `0x`
- Check private key is 64 characters (hex)
- Try creating new wallet with ethers.js

**Problem:** Transaction failed
- Check account has sufficient balance
- Verify gas limits
- Check Geth console for errors

---

## Additional Commands

### Create Test Accounts
```javascript
// Node.js script to create accounts
const { ethers } = require('ethers');

for (let i = 0; i < 5; i++) {
  const wallet = ethers.Wallet.createRandom();
  console.log(`Account ${i + 1}:`);
  console.log(`Address: ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}\n`);
}
```

### Fund Accounts
```javascript
// In Geth console
eth.sendTransaction({
  from: eth.accounts[0],
  to: "TARGET_ADDRESS",
  value: web3.toWei(10, "ether")
})
```

### Check Contract
```javascript
// In Geth console
var abi = [...]; // Contract ABI
var contract = eth.contract(abi).at("CONTRACT_ADDRESS");
contract.getTotalUsers();
```

---

## Next Steps

1. **Enhance Security**: Implement JWT tokens, session management
2. **Add Features**: Profile updates, password recovery (with seed phrases)
3. **Improve UI**: Add loading states, better error handling
4. **Add Tests**: Unit tests, integration tests
5. **Deploy**: Set up production environment with proper security
6. **Monitor**: Add logging and analytics

---

## Resources

- [Geth Documentation](https://geth.ethereum.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Geth logs: `tail -f ~/eth-poa-network/node1/geth.log`
3. Check backend logs: Browser console and server console
4. Verify all addresses and configurations

---

## License

MIT License - Feel free to use this for learning and development purposes.
