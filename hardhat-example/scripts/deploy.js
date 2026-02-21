const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying UserAuth Contract...\n");

  // Get the contract factory
  const UserAuth = await hre.ethers.getContractFactory("UserAuth");
  
  console.log("📝 Contract factory created");
  console.log("⏳ Deploying contract...");
  
  // Deploy the contract
  const userAuth = await UserAuth.deploy();
  
  // Wait for deployment
  await userAuth.waitForDeployment();
  
  const address = await userAuth.getAddress();
  
  console.log("\n✅ Contract deployed successfully!");
  console.log("=" .repeat(80));
  console.log(`📍 Contract Address: ${address}`);
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`⛓️  Chain ID: ${hre.network.config.chainId}`);
  console.log("=" .repeat(80));
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📄 Deployment info saved to deployment-info.json");
  
  // Instructions
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update backend/.env with CONTRACT_ADDRESS");
  console.log("3. Update frontend/.env with REACT_APP_CONTRACT_ADDRESS");
  console.log("4. Restart both backend and frontend servers\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
