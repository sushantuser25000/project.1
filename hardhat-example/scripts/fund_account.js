const { ethers } = require("ethers");

async function main() {
    const rpcUrl = "http://127.0.0.1:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const unlockedAccount = "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f"; // from bat file
    const targetAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat #0

    console.log(`Sending 100 ETH from ${unlockedAccount} to ${targetAccount}...`);

    try {
        const txHash = await provider.send("eth_sendTransaction", [{
            from: unlockedAccount,
            to: targetAccount,
            value: "0x" + ethers.parseEther("100").toString(16)
        }]);
        console.log("Transaction Hash:", txHash);

        // Wait a bit for mining
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newBalance = await provider.getBalance(targetAccount);
        console.log("New Balance of target account:", ethers.formatEther(newBalance), "ETH");

    } catch (e) {
        console.error("Error funding:", e);
    }
}

main().catch(console.error);
