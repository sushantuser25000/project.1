
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = '0xb348dfdbacde82fb1b1e826823690b2ee771a1f07c99dc2a3a6db856f7cb443f';

    console.log("=== BLOCKCHAIN TEST TRANSACTION ===");
    console.log("Contract:", contractAddress);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Using Account:", wallet.address);

    // Check balance and gas limit
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    const block = await provider.getBlock('latest');
    console.log("Block Gas Limit:", block.gasLimit.toString());

    const abi = [
        "function registerUser(string memory _username) public",
        "function addDocument(string memory _docType, string memory _fileName, string memory _ipfsHash) public",
        "function isRegistered(address) public view returns (bool)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    try {
        console.log("1. Checking registration status...");
        const registered = await contract.isRegistered(wallet.address);
        console.log("Registered:", registered);

        if (!registered) {
            console.log("... Account NOT registered. Registering now ...");
            const regTx = await contract.registerUser("TestAdminUser");
            await regTx.wait();
            console.log("✅ Registration Successful!");
        }

        console.log("2. Attempting to add document...");

        try {
            console.log("... Performing staticCall for revert check ...");
            await contract.addDocument.staticCall(
                "TestType",
                "TestFile.txt",
                "test_hash_123"
            );
            console.log("✅ staticCall Succeeded!");
        } catch (staticError) {
            console.error("❌ staticCall REVERTED!");
            console.error("Error Name:", staticError.name);
            console.error("Error Reason:", staticError.reason);
            console.error("Error Message:", staticError.message);
        }

        // Proceed with actual tx if staticCall didn't throw (or just stop here to debug)
        // Use high gas limit and explicit parameters
        const tx = await contract.addDocument(
            "TestType",
            "TestFile.txt",
            "test_hash_123",
            { gasLimit: 1000000 }
        );

        console.log("Tx Sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ SUCCESS! Document added in block:", receipt.blockNumber);

    } catch (e) {
        console.error("❌ TRANSACTION REVERTED!");
        console.error("Message:", e.message);
        if (e.reason) console.error("Reason:", e.reason);
        if (e.data) console.error("Data:", e.data);
    }
}

main();
