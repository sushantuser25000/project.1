const { ethers } = require("ethers");

async function main() {
    console.log("Testing connection to http://localhost:8545...");
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");

    try {
        const net = await provider.getNetwork();
        console.log("Network Name:", net.name);
        console.log("Chain ID:", net.chainId.toString());

        const blockNumber = await provider.getBlockNumber();
        console.log("Block number:", blockNumber);

        const sealer = "0xb36319f077F21F06992ce652C062BC3610B7fF90";
        const balance = await provider.getBalance(sealer);
        console.log(`Balance of Sealer (${sealer}): ${ethers.formatEther(balance)} ETH`);

        // Check Hardhat Account #0 just in case
        const hardhat0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const balance0 = await provider.getBalance(hardhat0);
        console.log(`Balance of Hardhat #0 (${hardhat0}): ${ethers.formatEther(balance0)} ETH`);

    } catch (e) {
        console.error("Error connecting:", e.message);
    }
}

main().catch(console.error);
