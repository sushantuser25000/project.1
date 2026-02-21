const hre = require("hardhat");

async function main() {
    console.log("Testing connection...");
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("Block number:", blockNumber);

    const signers = await hre.ethers.getSigners();
    console.log("Number of signers:", signers.length);
    if (signers.length > 0) {
        console.log("Signer 0 address:", await signers[0].getAddress());
        const balance = await hre.ethers.provider.getBalance(signers[0].getAddress());
        console.log("Signer 0 balance:", balance.toString());
    } else {
        console.log("No local signers found. Checking node accounts...");
        // Try to list accounts from the node provider directly if possible, or just standard provider.listAccounts() if available
        try {
            const accounts = await hre.ethers.provider.listAccounts();
            console.log("Node accounts:", accounts);
        } catch (e) {
            console.log("Could not list accounts:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
