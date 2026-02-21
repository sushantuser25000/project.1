const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY environment variable not set');
  console.log('Usage: PRIVATE_KEY=0x... node deploy-contract.js');
  process.exit(1);
}

// Read contract source
const contractPath = path.join(__dirname, '../UserAuth.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

async function deployContract() {
  try {
    console.log('🚀 Starting Contract Deployment\n');
    console.log('=' .repeat(80));
    
    // Connect to network
    console.log('📡 Connecting to network...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`   Network: ${RPC_URL}`);
    console.log(`   Deployer: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance === 0n) {
      throw new Error('Insufficient balance. Please fund your account first.');
    }
    
    // Note: For this script to work, you need to compile the contract first
    // This is a placeholder showing the deployment process
    console.log('\n⚠️  Note: You need to compile the contract first using Hardhat or another tool');
    console.log('   This script shows the deployment process structure\n');
    
    // Example deployment code (requires compiled contract)
    /*
    const ContractFactory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
    const contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('\n✅ Contract Deployed Successfully!');
    console.log(`   Address: ${address}`);
    console.log(`   Transaction: ${contract.deploymentTransaction().hash}`);
    
    // Save deployment info
    const deploymentInfo = {
      address,
      deployer: wallet.address,
      network: RPC_URL,
      timestamp: new Date().toISOString(),
      transactionHash: contract.deploymentTransaction().hash
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n📄 Deployment info saved to deployment-info.json');
    */
    
    console.log('\n📚 Recommended Deployment Methods:');
    console.log('   1. Using Hardhat: npx hardhat run scripts/deploy.js --network poa');
    console.log('   2. Using Remix IDE: https://remix.ethereum.org');
    console.log('   3. Using Foundry: forge create UserAuth --rpc-url $RPC_URL --private-key $PRIVATE_KEY');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployContract();
