
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    try {
        const signer = await provider.getSigner();
        console.log("Signer Address:", await signer.getAddress());
        console.log("Signer Balance:", (await provider.getBalance(signer)).toString());

        // Try to send ETH
        const wallet = ethers.Wallet.createRandom();
        console.log("Funding:", wallet.address);

        const tx = await signer.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("0.01")
        });
        console.log("Fund Tx:", tx.hash);
        await tx.wait();
        console.log("Funded!");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
