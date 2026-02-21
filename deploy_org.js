const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deploy() {
    console.log('🚀 Deploying OrgRegistry...');

    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = await provider.getSigner();

    const artifactPath = path.join(__dirname, 'hardhat-example', 'artifacts', 'contracts', 'OrgRegistry.sol', 'OrgRegistry.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy();

    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log('✅ OrgRegistry Deployed to:', address);

    // Auto-register ACEM
    console.log('📝 Registering ACEM organization...');
    const acemWallet = '0x6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f'; // Using sealer for demo
    const tx = await contract.registerOrganization('ACEM', acemWallet);
    await tx.wait();
    console.log('✅ ACEM registered.');

    fs.writeFileSync('org_registry_address.txt', address);
    return address;
}

deploy().catch(console.error);
