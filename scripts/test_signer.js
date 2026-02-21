
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    try {
        const signer = await provider.getSigner();
        console.log("Signer address:", await signer.getAddress());
        console.log("Balance:", (await provider.getBalance(signer.getAddress())).toString());
    } catch (e) {
        console.error("Error getting signer:", e.message);
    }
}

main();
