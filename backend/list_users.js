
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    console.log("Checking contract at:", contractAddress);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const abi = [
        "function getTotalUsers() public view returns (uint256)",
        "function userAddresses(uint256) public view returns (address)",
        "function getUserInfo(address) public view returns (address, string, uint256, bool)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
        const total = await contract.getTotalUsers();
        console.log(`Total Registered Users: ${total}`);

        for (let i = 0; i < total; i++) {
            const addr = await contract.userAddresses(i);
            const info = await contract.getUserInfo(addr);
            console.log(`[${i}] ${info[1]} (${addr}) - Active: ${info[3]}`);
        }

    } catch (e) {
        console.error("Error reading contract:", e.message);
    }
}

main();
