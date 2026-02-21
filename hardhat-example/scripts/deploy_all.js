const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting Full Deployment...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deploying with account: ${deployer.address}`);

    // 1. Deploy OrgRegistry
    console.log("\n⏳ Deploying OrgRegistry...");
    const OrgRegistry = await hre.ethers.getContractFactory("OrgRegistry");
    const orgRegistry = await OrgRegistry.deploy();
    await orgRegistry.waitForDeployment();
    const orgAddress = await orgRegistry.getAddress();
    console.log(`✅ OrgRegistry deployed to: ${orgAddress}`);

    // 2. Deploy UserAuth
    console.log("\n⏳ Deploying UserAuth...");
    const UserAuth = await hre.ethers.getContractFactory("UserAuth");
    const userAuth = await UserAuth.deploy();
    await userAuth.waitForDeployment();
    const userAuthAddress = await userAuth.getAddress();
    console.log(`✅ UserAuth deployed to: ${userAuthAddress}`);

    // 3. Save Info
    const info = {
        userAuthAddress,
        orgRegistryAddress: orgAddress,
        network: hre.network.name,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync('deployment-info.json', JSON.stringify(info, null, 2));
    console.log("\n📄 Deployment info saved.");

    console.log("\n📋 Addresses for .env:");
    console.log(`CONTRACT_ADDRESS=${userAuthAddress}`);
    console.log(`ORG_REGISTRY_ADDRESS=${orgAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
