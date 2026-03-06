require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node add_org.js <ORG_NAME> <WALLET_ADDRESS_OR_NEW>");
        console.log("Example: node add_org.js 'My University' 0x123...");
        console.log("Example: node add_org.js 'New Org' NEW");
        return;
    }

    const orgName = args[0];
    let walletAddress = args[1];

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    // The sealer account is the owner of the contracts
    const ownerSigner = await provider.getSigner(process.env.SEALER_ADDRESS || "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f");

    if (walletAddress.toUpperCase() === 'NEW') {
        const newWallet = ethers.Wallet.createRandom();
        walletAddress = newWallet.address;
        console.log("\n✨ GENERATED NEW WALLET:");
        console.log("Address:    ", newWallet.address);
        console.log("Private Key:", newWallet.privateKey);
        console.log("-----------------------------------");
    }

    try {
        const orgRegistryAddress = process.env.ORG_REGISTRY_ADDRESS;
        const abi = ["function registerOrganization(string memory _name, address _wallet) public"];
        const orgRegistry = new ethers.Contract(orgRegistryAddress, abi, ownerSigner);

        console.log(`\n⏳ Registering '${orgName}' (${walletAddress})...`);
        const tx = await orgRegistry.registerOrganization(orgName, walletAddress);
        await tx.wait();

        console.log("✅ Successfully authorized in OrgRegistry!");

        // Optional: Send a little bit of ETH for gas if it's a new or empty wallet
        const balance = await provider.getBalance(walletAddress);
        if (balance < ethers.parseEther("0.1")) {
            console.log("💰 Funding account with 0.5 ETH for gas...");
            const fundTx = await ownerSigner.sendTransaction({
                to: walletAddress,
                value: ethers.parseEther("0.5")
            });
            await fundTx.wait();
            console.log("✓ Funded!");
        }

    } catch (e) {
        console.error("❌ Link failed:", e.message);
    }
}

main();
