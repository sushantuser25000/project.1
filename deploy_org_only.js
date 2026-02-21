const { ethers } = require('ethers');
const fs = require('fs');

async function deploy() {
    console.log('📦 Deploying OrgRegistry...');
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = await provider.getSigner();

    const abi = JSON.parse(fs.readFileSync('artifacts/OrgRegistry_sol_OrgRegistry.abi', 'utf8'));
    const bin = fs.readFileSync('artifacts/OrgRegistry_sol_OrgRegistry.bin', 'utf8').trim();
    const finalBin = bin.startsWith('0x') ? bin : '0x' + bin;
    const factory = new ethers.ContractFactory(abi, finalBin, signer);

    try {
        const contract = await factory.deploy({ gasLimit: 5000000 });
        console.log('⏳ Waiting for OrgRegistry...');
        await contract.waitForDeployment();
        console.log('✅ OrgRegistry:', await contract.getAddress());
    } catch (e) {
        console.error('❌ OrgRegistry deployment failed:', e.message);
        if (e.data) console.error('Data:', e.data);
    }
}

deploy().catch(console.error);
