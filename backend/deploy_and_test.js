
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const adminSigner = await provider.getSigner();

    console.log("=== ATOMIC DEPLOY \u0026 TEST ===");

    // 1. Load Artifact
    const artifactPath = path.join(__dirname, '../hardhat-example/artifacts/contracts/UserAuth.sol/UserAuth.json');
    if (!fs.existsSync(artifactPath)) {
        console.error("Artifact not found at:", artifactPath);
        return;
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // 2. Deploy
    console.log("Deploying contract...");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, adminSigner);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("✅ Contract deployed at:", address);

    // 3. Setup Test User (Emergency Key)
    const privateKey = '0xb348dfdbacde82fb1b1e826823690b2ee771a1f07c99dc2a3a6db856f7cb443f';
    const userWallet = new ethers.Wallet(privateKey, provider);

    // Fund User
    console.log("Funding user with 1.0 ETH...");
    const fundTx = await adminSigner.sendTransaction({
        to: userWallet.address,
        value: ethers.parseEther("1.0")
    });
    await fundTx.wait();

    // 4. Register User
    const userContract = new ethers.Contract(address, artifact.abi, userWallet);
    console.log("Available Contract Functions:", Object.keys(userContract).filter(k => typeof userContract[k] === 'function').slice(0, 10));

    console.log("Registering user...");
    const regTx = await userContract.registerUser("TestUserAtom");
    await regTx.wait();
    console.log("✅ User registered!");

    // 5. Test addDocument
    console.log("Testing addDocument...");
    try {
        const tx = await userContract.addDocument("Report", "test.pdf", "hash_xyz_123", { gasLimit: 500000 });
        await tx.wait();
        console.log("✅ SUCCESS! addDocument worked!");

        // Final sanity check: read it back
        const docs = await userContract.getMyDocuments();
        console.log("Retrieved Docs Count:", docs.length);
        console.log("First Doc Name:", docs[0].fileName);

        // UPDATE .env if it worked
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
        fs.writeFileSync(envPath, envContent);
        console.log("Updated .env with working address.");

    } catch (e) {
        console.error("❌ FAILED!");
        console.error(e.message);
    }
}

main().catch(console.error);
