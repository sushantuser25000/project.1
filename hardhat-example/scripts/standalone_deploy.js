const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting Standalone Deployment using Unlocked Sealer...");

    const rpcUrl = "http://127.0.0.1:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Address of the unlocked sealer account on the Geth node
    const sealerAddress = "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f";
    const signer = await provider.getSigner(sealerAddress);
    console.log(`👤 Deploying with account: ${sealerAddress}`);

    const balance = await provider.getBalance(sealerAddress);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Load Artifacts
    const orgArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/OrgRegistry.sol/OrgRegistry.json'), 'utf8'));
    const authArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/UserAuth.sol/UserAuth.json'), 'utf8'));

    // 1. Deploy OrgRegistry
    console.log("\n⏳ Deploying OrgRegistry...");
    const OrgFactory = new ethers.ContractFactory(orgArtifact.abi, orgArtifact.bytecode, signer);
    const orgRegistry = await OrgFactory.deploy();
    await orgRegistry.waitForDeployment();
    const orgAddress = await orgRegistry.getAddress();
    console.log(`✅ OrgRegistry deployed to: ${orgAddress}`);

    // 2. Deploy UserAuth
    console.log("\n⏳ Deploying UserAuth...");
    const AuthFactory = new ethers.ContractFactory(authArtifact.abi, authArtifact.bytecode, signer);
    const userAuth = await AuthFactory.deploy();
    await userAuth.waitForDeployment();
    const userAuthAddress = await userAuth.getAddress();
    console.log(`✅ UserAuth deployed to: ${userAuthAddress}`);

    // Update .env files
    const backendEnvPath = path.join(__dirname, '../../backend/.env');
    const frontendEnvPath = path.join(__dirname, '../../frontend/.env');

    function updateEnv(filePath, updates) {
        if (!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        for (const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (content.match(regex)) {
                content = content.replace(regex, `${key}=${value}`);
            } else {
                content += `\n${key}=${value}`;
            }
        }
        fs.writeFileSync(filePath, content);
    }

    updateEnv(backendEnvPath, {
        CONTRACT_ADDRESS: userAuthAddress,
        ORG_REGISTRY_ADDRESS: orgAddress
    });
    updateEnv(frontendEnvPath, {
        VITE_CONTRACT_ADDRESS: userAuthAddress,
        VITE_ORG_REGISTRY_ADDRESS: orgAddress
    });

    // Save Deployment Info
    const info = {
        userAuthAddress,
        orgRegistryAddress: orgAddress,
        network: "localhost",
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(__dirname, '../deployment-info.json'), JSON.stringify(info, null, 2));

    console.log("\n📄 Deployment complete and .env files updated.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
