
const { ethers } = require('ethers');

async function main() {
    console.log("Testing signer connection...");
    try {
        const provider = new ethers.JsonRpcProvider('http://localhost:8545');
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log("Signer address:", address);
        const balance = await provider.getBalance(address);
        console.log("Balance:", balance.toString());

        // Also verify we can send a transaction (simulated)
        // const tx = await signer.sendTransaction({
        //     to: address,
        //     value: 0
        // });
        // console.log("Self-tx hash:", tx.hash);

    } catch (e) {
        console.error("Error getting signer:", e.message);
        console.error(e);
    }
}

main();
