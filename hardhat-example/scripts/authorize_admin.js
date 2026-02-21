const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    const orgAddress = deploymentInfo.orgRegistryAddress;
    const sealerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    console.log(`🔌 Connecting to OrgRegistry at: ${orgAddress}`);
    const orgRegistryAddress = deploymentInfo.orgRegistryAddress;
    const userAuthAddress = deploymentInfo.userAuthAddress;

    const OrgRegistry = await hre.ethers.getContractFactory("OrgRegistry");
    const orgRegistry = OrgRegistry.attach(orgRegistryAddress);

    const UserAuth = await hre.ethers.getContractFactory("UserAuth");
    const userAuth = UserAuth.attach(userAuthAddress);

    console.log(`⏳ Registering ${sealerAddress} as "ACEM Admin" in OrgRegistry...`);
    const tx1 = await orgRegistry.registerOrganization("ACEM Admin", sealerAddress);
    await tx1.wait();

    // Check if already registered as user
    const isReg = await userAuth.isRegistered(sealerAddress);
    if (!isReg) {
        console.log(`⏳ Registering ${sealerAddress} as "ACEM Admin" in UserAuth...`);
        // We need a signer for sealerAddress. 
        // Admin account #0 is the owner of UserAuth too (usually).
        const [owner] = await hre.ethers.getSigners();
        const tx2 = await userAuth.registerUser("ACEM Admin"); // Registering the current signer
        await tx2.wait();
        console.log("✅ Admin registered as User!");
    } else {
        console.log("ℹ️ Admin already registered as User.");
    }

    console.log("✅ Admin Organization Registered!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
