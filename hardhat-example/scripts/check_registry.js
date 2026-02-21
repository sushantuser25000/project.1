const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    const userAuthAddress = deploymentInfo.userAuthAddress;
    const orgRegistryAddress = deploymentInfo.orgRegistryAddress;

    const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const sealerAddress = "0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f";

    const UserAuth = await hre.ethers.getContractFactory("UserAuth");
    const userAuth = UserAuth.attach(userAuthAddress);

    const OrgRegistry = await hre.ethers.getContractFactory("OrgRegistry");
    const orgRegistry = OrgRegistry.attach(orgRegistryAddress);

    console.log(`Checking accounts on UserAuth (${userAuthAddress}):`);
    console.log(`- Admin (0xf39f...): ${await userAuth.isRegistered(adminAddress)}`);
    console.log(`- Sealer (0x6bbb...): ${await userAuth.isRegistered(sealerAddress)}`);

    console.log(`\nChecking accounts on OrgRegistry (${orgRegistryAddress}):`);
    const org1 = await orgRegistry.organizations(adminAddress);
    console.log(`- Admin (0xf39f...): ${org1.isAuthorized} (${org1.name})`);
    const org2 = await orgRegistry.organizations(sealerAddress);
    console.log(`- Sealer (0x6bbb...): ${org2.isAuthorized} (${org2.name})`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
