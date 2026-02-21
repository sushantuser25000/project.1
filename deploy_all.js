const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deploy() {
    console.log('🚀 Starting Unified Deployment...');

    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = await provider.getSigner();

    const prepareBin = (filename) => {
        const bin = fs.readFileSync(path.join('artifacts', filename), 'utf8').trim();
        return bin.startsWith('0x') ? bin : '0x' + bin;
    };

    // 1. Deploy OrgRegistry
    console.log('📦 Deploying OrgRegistry...');
    const orgAbi = JSON.parse(fs.readFileSync('artifacts/OrgRegistry_sol_OrgRegistry.abi', 'utf8'));
    const orgBin = prepareBin('OrgRegistry_sol_OrgRegistry.bin');
    const orgFactory = new ethers.ContractFactory(orgAbi, orgBin, signer);
    const orgContract = await orgFactory.deploy({ gasLimit: 5000000, gasPrice: 0 });
    await orgContract.waitForDeployment();
    const orgAddress = await orgContract.getAddress();
    console.log('✅ OrgRegistry:', orgAddress);

    // 2. Deploy UserAuth
    console.log('📦 Deploying UserAuth...');
    const authAbi = JSON.parse(fs.readFileSync('artifacts/UserAuth_sol_UserAuth.abi', 'utf8'));
    const authBin = prepareBin('UserAuth_sol_UserAuth.bin');
    const authFactory = new ethers.ContractFactory(authAbi, authBin, signer);
    const authContract = await authFactory.deploy({ gasLimit: 8000000, gasPrice: 0 });
    await authContract.waitForDeployment();
    const authAddress = await authContract.getAddress();
    console.log('✅ UserAuth:', authAddress);

    // 3. Register ACEM
    console.log('📝 Registering ACEM...');
    const acemWallet = await signer.getAddress();
    const tx = await orgContract.registerOrganization('ACEM', acemWallet, { gasPrice: 0 });
    await tx.wait();
    console.log('✅ ACEM Registered.');

    const summary = {
        ORG_REGISTRY: orgAddress,
        USER_AUTH: authAddress,
        ADMIN_WALLET: acemWallet
    };

    fs.writeFileSync('deployment_summary.json', JSON.stringify(summary, null, 2));
    console.log('📄 Deployment Summary saved.');
}

deploy().catch(console.error);
