const { ethers } = require('ethers');

console.log('🔑 Generating Test Ethereum Accounts\n');
console.log('=' .repeat(80));

// Generate 5 test accounts
for (let i = 0; i < 5; i++) {
  const wallet = ethers.Wallet.createRandom();
  
  console.log(`\n📝 Account ${i + 1}:`);
  console.log(`   Address:     ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}`);
  console.log(`   Mnemonic:    ${wallet.mnemonic.phrase}`);
  console.log('-'.repeat(80));
}

console.log('\n⚠️  SECURITY WARNING:');
console.log('   - These are TEST accounts only');
console.log('   - NEVER use these on mainnet');
console.log('   - NEVER share private keys');
console.log('   - Store mnemonics securely\n');
