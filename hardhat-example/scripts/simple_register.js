const { ethers } = require("ethers");
require("dotenv").config({ path: "../backend/.env" });

async function main() {
    const rpcUrl = "http://127.0.0.1:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Address of the unlocked sealer account on the Geth node
    const sealerAddress = "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f";
    const signer = await provider.getSigner(sealerAddress);

    const orgRegistryAddress = process.env.ORG_REGISTRY_ADDRESS;
    console.log("OrgRegistry Address from .env:", orgRegistryAddress);

    const abi = [
        "function owner() view returns (address)",
        "function registerOrganization(string name, address wallet) public",
        "function organizations(address) view returns (string, address, bool, uint256)",
        "function getAllOrganizations() view returns (address[])"
    ];

    const contract = new ethers.Contract(orgRegistryAddress, abi, signer);

    try {
        const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        console.log(`📡 Registering "ACEM Admin" (${adminAddress})...`);

        const tx = await contract.registerOrganization("ACEM Admin", adminAddress);
        console.log("Transaction Hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Organization registered successfully! Status:", receipt.status);

        const orgs = await contract.getAllOrganizations();
        console.log("Current Organizations:", orgs);
    } catch (e) {
        console.error("FAIL:", e.message);
        if (e.data) console.error("Error Data:", e.data);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
