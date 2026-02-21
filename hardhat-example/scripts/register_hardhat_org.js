const { ethers } = require("ethers");
require("dotenv").config({ path: "../backend/.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545", { chainId: 2025, name: "unknown" });
    const sealerAddress = process.env.SEALER_ADDRESS || "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f";
    const adminSigner = await provider.getSigner(sealerAddress);

    const ORG_ABI = [
        "function registerOrganization(string memory _name, address _wallet) public",
        "function organizations(address) public view returns (string name, address wallet, bool isAuthorized, uint256 registeredAt)",
    ];

    const orgRegistryAddress = process.env.ORG_REGISTRY_ADDRESS;
    console.log("Using OrgRegistry at:", orgRegistryAddress);

    const orgContract = new ethers.Contract(orgRegistryAddress, ORG_ABI, adminSigner);

    const hardhat0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    console.log("Registering Hardhat #0 as ACEM Admin...");

    try {
        const tx = await orgContract.registerOrganization("ACEM Admin", hardhat0, {
            type: 0,
            gasPrice: 1000000000,
            gasLimit: 300000
        });
        const receipt = await tx.wait();
        console.log("✅ Successfully registered Hardhat #0 as an Org in block", receipt.blockNumber);
    } catch (e) {
        console.error("Failed to register:", e);
    }
}

main().catch(console.error);
