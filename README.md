# 🔐 Ethereum PoA Authentication System

A complete authentication system using private key signatures on a private Ethereum network with Proof of Authority (PoA) consensus using Geth.

## 🌟 Features

- **Private Key Authentication**: Login using Ethereum private keys
- **Smart Contract Registry**: User data stored on blockchain
- **Cryptographic Signatures**: Secure authentication without passwords
- **Private Network**: Runs on isolated Ethereum PoA network
- **React Frontend**: Modern, responsive UI
- **Express Backend**: RESTful API for authentication
- **Real-time Verification**: Signature verification and user lookup

## 📁 Project Structure

```
.
├── UserAuth.sol              # Smart contract for user management
├── backend/                  # Express.js backend
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env.example         # Environment variables template
├── frontend/                # React frontend
│   ├── src/
│   │   ├── App.js          # Main application component
│   │   ├── components/     # React components
│   │   │   ├── LoginForm.js
│   │   │   ├── RegisterForm.js
│   │   │   └── Dashboard.js
│   │   └── App.css         # Styles
│   ├── package.json        # Frontend dependencies
│   └── .env.example        # Environment variables template
├── SETUP_GUIDE.md          # Comprehensive setup instructions
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- Geth (Go Ethereum)
- npm or yarn

### 1. Set Up Private Network
```bash
# Create network directory
mkdir eth-poa-network
cd eth-poa-network

# Create accounts
geth account new --datadir ./node1

# Create genesis.json and initialize
geth init --datadir ./node1 genesis.json

# Start Geth node
geth --datadir ./node1 --networkid 1337 --http --http.addr "0.0.0.0" \
  --http.port 8545 --http.api "eth,net,web3,personal,miner" \
  --http.corsdomain "*" --allow-insecure-unlock --mine console
```

### 2. Deploy Smart Contract
```bash
# Using Hardhat or Remix
# Deploy UserAuth.sol to your network
# Save the contract address
```

### 3. Set Up Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 4. Set Up Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 5. Access Application
Open http://localhost:3000 in your browser

## 📖 Detailed Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive step-by-step instructions including:
- Network configuration
- Contract deployment
- Troubleshooting
- Security best practices

## 🔑 How It Works

### Authentication Flow

1. **User Registration**
   - User provides username and private key
   - Transaction sent to register username on blockchain
   - Address is linked to username in smart contract

2. **Login Process**
   - User enters private key
   - Backend generates a nonce (challenge message)
   - Frontend signs the nonce with private key
   - Backend verifies signature and recovers address
   - Backend checks if address is registered in contract
   - User data retrieved and session created

3. **Session Management**
   - Auth data stored in localStorage (for demo)
   - Private key used for signing transactions
   - User can view profile and blockchain data

## 🛡️ Security Notes

### Development
- ⚠️ This is a **demonstration application**
- ⚠️ Use only test accounts with no real funds
- ⚠️ Private keys stored in localStorage (not production-ready)
- ⚠️ Network runs locally without production security

### Production Considerations
- Implement proper key management (hardware wallets, key vaults)
- Use HTTPS/WSS for all connections
- Add session timeouts and re-authentication
- Implement rate limiting
- Add comprehensive logging and monitoring
- Use secure random nonce generation
- Encrypt sensitive data at rest
- Add CORS restrictions
- Implement proper error handling

## 🧪 Testing

### Test Accounts
Generate test accounts:
```javascript
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Fund Test Account
```javascript
// In Geth console
eth.sendTransaction({
  from: eth.accounts[0],
  to: "TARGET_ADDRESS",
  value: web3.toWei(10, "ether")
})
```

## 📊 Tech Stack

### Blockchain
- **Geth**: Go Ethereum client for private network
- **Solidity**: Smart contract language
- **Proof of Authority**: Consensus mechanism

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Ethers.js**: Ethereum library

### Frontend
- **React**: UI framework
- **Ethers.js**: Web3 interactions
- **CSS3**: Styling

## 🔧 Configuration

### Network Configuration
- **Chain ID**: 1337
- **RPC URL**: http://localhost:8545
- **Block Time**: 5 seconds
- **Consensus**: Clique (PoA)

### Environment Variables

**Backend (.env)**
```env
PORT=5000
RPC_URL=http://localhost:8545
CHAIN_ID=1337
CONTRACT_ADDRESS=your_contract_address
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_CONTRACT_ADDRESS=your_contract_address
```

## 🐛 Troubleshooting

### Common Issues

**Geth not mining**
```bash
# In Geth console
miner.start()
```

**Contract not found**
- Verify contract address in .env files
- Check deployment was successful
- Ensure Geth is running and synced

**Transaction failed**
- Check account balance
- Verify gas limits
- Check Geth console for errors

**Cannot connect to backend**
- Ensure backend is running on port 5000
- Check firewall settings
- Verify CORS configuration

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting tips.

## 📚 API Documentation

### Authentication Endpoints

**POST /api/auth/verify**
```json
{
  "message": "Login message",
  "signature": "0x...",
  "address": "0x..."
}
```

**GET /api/auth/nonce/:address**
Returns nonce for signing

**POST /api/auth/register**
```json
{
  "privateKey": "0x...",
  "username": "user123"
}
```

**GET /api/user/:address**
Get user information

**GET /api/network/info**
Get network status

**GET /api/health**
Health check

## 🎯 Future Enhancements

- [ ] Multi-signature support
- [ ] Role-based access control
- [ ] Transaction history
- [ ] Profile picture NFTs
- [ ] Social recovery mechanisms
- [ ] Mobile app
- [ ] Hardware wallet integration
- [ ] Improved session management
- [ ] Analytics dashboard
- [ ] Multi-network support

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines before submitting PRs.

## 📞 Support

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## ⚠️ Disclaimer

This is an educational project demonstrating blockchain authentication concepts. Not recommended for production use without significant security enhancements.

---

Built with ❤️ using Ethereum, React, and Node.js
