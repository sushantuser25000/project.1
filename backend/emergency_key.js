require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    console.log("=== EMERGENCY ACCOUNT RECOVERY ===");

    // 1. Create a fresh account
    const wallet = ethers.Wallet.createRandom();
    console.log("\n[NEW ACCOUNT]");
    console.log("Address:    ", wallet.address);
    console.log("Private Key:", wallet.privateKey);

    // 2. Fund it from the node's unlocked signer
    try {
        const signer = await provider.getSigner();
        console.log("\n[FUNDING SOURCE]");
        console.log("Admin Address:", await signer.getAddress());
        console.log("Balance:      ", ethers.formatEther(await provider.getBalance(signer)));

        console.log("\n... Sending 1.0 ETH to new account ...");
        const tx = await signer.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("1.0")
        });
        await tx.wait();
        console.log("Transfer successful! Tx:", tx.hash);

        // 3. Register it on the contract (optional, but helps login)
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) throw new Error("CONTRACT_ADDRESS not found in .env");
        const abi = ["function registerUser(string memory _username) public"];
        const contract = new ethers.Contract(contractAddress, abi, provider);

        console.log("\n... Registering account as 'AdminUser' ...");
        const walletConnected = wallet.connect(provider);
        const contractWithSigner = contract.connect(walletConnected);

        const regTx = await contractWithSigner.registerUser("AdminUser");
        await regTx.wait();
        console.log("Registration successful!");

        console.log("\n✅ READY TO USE KEY:");
        console.log(wallet.privateKey);

        const fs = require('fs');
        fs.writeFileSync('key.txt', wallet.privateKey);
        console.log("Key saved to key.txt");

    } catch (e) {
        console.error("\n❌ Error funding/registering:", e.message);
        console.log("You can still use the key, but it has 0 ETH.");
    }
}

main();
