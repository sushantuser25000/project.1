
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Deploying UserAuth via Backend Script...");

    // 1. Connect to Geth
    const rpcUrl = 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 2. Get Signer (Admin)
    const signer = await provider.getSigner();
    console.log("Deploying from:", await signer.getAddress());

    // 3. Load Artifact
    const artifactPath = path.resolve(__dirname, '../hardhat-example/artifacts/contracts/UserAuth.sol/UserAuth.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // 4. Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy();

    console.log("Tx Hash:", contract.deploymentTransaction().hash);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("✅ Contract Deployed at:", address);

    // 5. Update .env
    const envPath = path.resolve(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace CONTRACT_ADDRESS
    const regex = /CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/;
    if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `CONTRACT_ADDRESS=${address}`);
    } else {
        envContent += `\nCONTRACT_ADDRESS=${address}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("Updated backend/.env");

}

main().catch(console.error);
