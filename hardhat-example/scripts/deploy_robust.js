const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Deploying UserAuth Contract...");

    try {
        const UserAuth = await hre.ethers.getContractFactory("UserAuth");
        // Use the first signer from the node
        const accounts = await hre.ethers.getSigners();
        console.log(`Using account: ${accounts[0].address}`);

        const userAuth = await UserAuth.deploy();
        console.log("⏳ Waiting for deployment...");

        await userAuth.waitForDeployment();

        const address = await userAuth.getAddress();
        console.log(`UserAuth deployed to: ${address}`);
        fs.writeFileSync("deploy_address.txt", address);
    } catch (error) {
        console.error("Deployment error:", error);
        fs.writeFileSync("deploy_error.txt", error.toString());
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
