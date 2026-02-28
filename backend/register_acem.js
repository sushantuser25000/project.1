require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
    console.log("=== AUTHORIZING ACEM ADMIN ORG ===");

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    // Create a specific account for ACEM Admin
    const acemWallet = ethers.Wallet.createRandom();
    console.log("\n[ACEM ADMIN ACCOUNT]");
    console.log("Address:    ", acemWallet.address);
    console.log("Private Key:", acemWallet.privateKey);

    try {
        const ownerSigner = await provider.getSigner("0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f");

        console.log("\n... Sending 1.0 ETH to ACEM admin account ...");
        const fundTx = await ownerSigner.sendTransaction({
            to: acemWallet.address,
            value: ethers.parseEther("1.0")
        });
        await fundTx.wait();
        console.log("✓ Funded!");

        const orgRegistryAddress = process.env.ORG_REGISTRY_ADDRESS;
        if (!orgRegistryAddress) throw new Error("ORG_REGISTRY_ADDRESS not found in .env");

        const abi = [
            "function registerOrganization(string memory _name, address _wallet) public",
            "function registerUserFor(address _userAddress, string memory _username) public"
        ];
        const orgRegistry = new ethers.Contract(orgRegistryAddress, abi, ownerSigner);

        console.log("\n... Registering account as 'ACEM Admin' in OrgRegistry ...");
        const regOrgTx = await orgRegistry.registerOrganization("ACEM Admin", acemWallet.address);
        await regOrgTx.wait();
        console.log("✓ ACEM Admin successfully registered as an Authorized Organization!");

        // Also register in UserAuth
        const userAuthAddress = process.env.CONTRACT_ADDRESS;
        if (userAuthAddress) {
            console.log("... Registering in UserAuth as 'ACEM Admin' ...");
            const userAuth = new ethers.Contract(userAuthAddress, abi, ownerSigner);
            const regUserTx = await userAuth.registerUserFor(acemWallet.address, "ACEM Admin");
            await regUserTx.wait();
            console.log("✓ UserAuth registration complete!");
        }

        console.log("\n✅ READY TO USE ACEM ADMIN KEY:");
        console.log(acemWallet.privateKey);

        fs.writeFileSync('acem_key.txt', acemWallet.privateKey);

    } catch (e) {
        console.error("\n❌ Error creating ACEM admin:", e.message);
    }
}

main();
