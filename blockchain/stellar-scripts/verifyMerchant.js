#!/usr/bin/env node
/**
 * Verify a merchant globally on Stellar CampaignFactory
 * Usage: node stellar-scripts/verifyMerchant.js <merchant-address>
 * 
 * Environment variables:
 *   STELLAR_ADMIN_SECRET - Admin secret key
 *   MERCHANT_ADDRESS - Address to verify (alternative to CLI arg)
 *   STELLAR_NETWORK - Network to use (testnet/mainnet, default: testnet)
 */

require('dotenv').config();
const {
  getServer,
  loadAdminKeypair,
  invokeContract,
  addressToScVal,
  displayTransactionResult,
  CONTRACTS,
} = require('./stellarUtils');

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const merchantAddress = process.env.MERCHANT_ADDRESS || process.argv[2];
  
  if (!merchantAddress) {
    console.error('❌ Please provide a merchant address');
    console.log('Usage: MERCHANT_ADDRESS=<address> node stellar-scripts/verifyMerchant.js');
    console.log('   OR: node stellar-scripts/verifyMerchant.js <merchant-address>');
    console.log('\nEnvironment variables needed:');
    console.log('  STELLAR_ADMIN_SECRET - Your admin secret key');
    process.exit(1);
  }

  console.log('\n🏪 Verifying Merchant on Stellar CampaignFactory');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Merchant Address: ${merchantAddress}`);
  console.log(`Factory Contract: ${CONTRACTS.CAMPAIGN_FACTORY}`);

  try {
    // Initialize
    const server = getServer(network);
    const adminKeypair = loadAdminKeypair();
    
    console.log(`Admin Address: ${adminKeypair.publicKey()}\n`);

    console.log('📤 Sending verification transaction...');
    
    // Invoke verify_merchant method
    const result = await invokeContract(
      server,
      adminKeypair,
      CONTRACTS.CAMPAIGN_FACTORY,
      'verify_merchant',
      [addressToScVal(merchantAddress)],
      network
    );

    displayTransactionResult(result, network);
    
    console.log('✅ Merchant Verified Successfully!');
    console.log('==================================');
    console.log(`Merchant: ${merchantAddress}`);
    console.log('\nThis merchant can now receive payments from any beneficiary wallet.');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error verifying merchant:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
