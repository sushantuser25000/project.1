const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    console.log("Network info:", await provider.getNetwork());
    console.log("Wallet address:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance));

    console.log("Sending dummy transaction...");
    try {
        const tx = await wallet.sendTransaction({
            to: wallet.address,
            value: 0,
            gasLimit: 21000,
            gasPrice: 0 // Geth node accepts 0 gas price
        });
        console.log("Tx Hash:", tx.hash);
        console.log("Waiting for receipt...");
        const receipt = await tx.wait();
        console.log("Confirmed in block:", receipt.blockNumber);
    } catch (e) {
        console.error("Error:", e);
    }
}

main().catch(console.error);
