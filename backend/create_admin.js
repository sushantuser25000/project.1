require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    console.log("=== AUTHORIZING NEW ADMIN ORG ===");

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    // 1. Create a fresh account for the admin
    const adminWallet = ethers.Wallet.createRandom();
    console.log("\n[NEW ADMIN ACCOUNT]");
    console.log("Address:    ", adminWallet.address);
    console.log("Private Key:", adminWallet.privateKey);

    try {
        // Use the node's unlocked signer (Owner of OrgRegistry)
        const ownerSigner = await provider.getSigner("0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f");

        console.log("\n... Sending 1.0 ETH to new admin account ...");
        const fundTx = await ownerSigner.sendTransaction({
            to: adminWallet.address,
            value: ethers.parseEther("1.0")
        });
        await fundTx.wait();
        console.log("✓ Funded!");

        // Connect to OrgRegistry
        const orgRegistryAddress = process.env.ORG_REGISTRY_ADDRESS;
        if (!orgRegistryAddress) throw new Error("ORG_REGISTRY_ADDRESS not found in .env");

        const abi = [
            "function registerOrganization(string memory _name, address _wallet) public",
            "function registerUserFor(address _userAddress, string memory _username) public"
        ];
        const orgRegistry = new ethers.Contract(orgRegistryAddress, abi, ownerSigner);

        console.log("\n... Registering account as 'Admin Organization' in OrgRegistry ...");
        const regOrgTx = await orgRegistry.registerOrganization("Default Admin", adminWallet.address);
        await regOrgTx.wait();
        console.log("✓ Authorized Organization registered!");

        // Also register in UserAuth so the admin can log in as a user too
        const userAuthAddress = process.env.CONTRACT_ADDRESS;
        if (userAuthAddress) {
            console.log("... Registering in UserAuth as 'Admin' ...");
            const userAuth = new ethers.Contract(userAuthAddress, abi, ownerSigner);
            const regUserTx = await userAuth.registerUserFor(adminWallet.address, "Admin");
            await regUserTx.wait();
            console.log("✓ UserAuth registration complete!");
        }

        console.log("\n✅ READY TO USE ADMIN KEY:");
        console.log(adminWallet.privateKey);

        fs.writeFileSync('admin_key.txt', adminWallet.privateKey);
        console.log("Key saved to backend/admin_key.txt");

    } catch (e) {
        console.error("\n❌ Error creating admin:", e.message);
    }
}

main();
