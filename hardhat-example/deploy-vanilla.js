const { ethers } = require("ethers");
const fs = require('fs');

async function main() {
    console.log("🚀 Starting standalone deployment via unlocked node account...");

    // 1. Connect to local Geth
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Use the already unlocked node account (the miner/sealer)
    // We request the signer directly from the node.
    const signer = await provider.getSigner("0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f");

    console.log(`👤 Deploying from unlocked account: ${signer.address}`);

    // Load compiled artifacts
    const userAuthArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/UserAuth.sol/UserAuth.json', 'utf8'));
    const orgRegistryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/OrgRegistry.sol/OrgRegistry.json', 'utf8'));

    // Deploy UserAuth
    console.log("\n⏳ Deploying UserAuth...");
    const UserAuthFactory = new ethers.ContractFactory(userAuthArtifact.abi, userAuthArtifact.bytecode, signer);
    const userAuth = await UserAuthFactory.deploy();
    await userAuth.waitForDeployment();
    const userAuthAddress = await userAuth.getAddress();
    console.log(`✅ UserAuth deployed at: ${userAuthAddress}`);

    // Deploy OrgRegistry
    console.log("\n⏳ Deploying OrgRegistry...");
    const OrgRegistryFactory = new ethers.ContractFactory(orgRegistryArtifact.abi, orgRegistryArtifact.bytecode, signer);
    const orgRegistry = await OrgRegistryFactory.deploy();
    await orgRegistry.waitForDeployment();
    const orgRegistryAddress = await orgRegistry.getAddress();
    console.log(`✅ OrgRegistry deployed at: ${orgRegistryAddress}`);


    console.log("\n📋 Next Steps:");
    console.log(`Update backend/.env and frontend/.env with:\nCONTRACT_ADDRESS=${userAuthAddress}\nORG_REGISTRY_ADDRESS=${orgRegistryAddress}`);
}

main().catch(console.error);
