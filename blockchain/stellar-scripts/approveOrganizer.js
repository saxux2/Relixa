#!/usr/bin/env node
/**
 * Approve an organizer on Stellar CampaignFactory
 * Usage: node stellar-scripts/approveOrganizer.js <organizer-address>
 * 
 * Environment variables:
 *   STELLAR_ADMIN_SECRET - Admin secret key
 *   ORGANIZER_ADDRESS - Address to approve (alternative to CLI arg)
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
  const organizerAddress = process.env.ORGANIZER_ADDRESS || process.argv[2];
  
  if (!organizerAddress) {
    console.error('❌ Please provide an organizer address');
    console.log('Usage: ORGANIZER_ADDRESS=<address> node stellar-scripts/approveOrganizer.js');
    console.log('   OR: node stellar-scripts/approveOrganizer.js <organizer-address>');
    console.log('\nEnvironment variables needed:');
    console.log('  STELLAR_ADMIN_SECRET - Your admin secret key');
    process.exit(1);
  }

  console.log('\n🔐 Approving Organizer on Stellar CampaignFactory');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Organizer Address: ${organizerAddress}`);
  console.log(`Factory Contract: ${CONTRACTS.CAMPAIGN_FACTORY}`);

  try {
    // Initialize
    const server = getServer(network);
    const adminKeypair = loadAdminKeypair();
    
    console.log(`Admin Address: ${adminKeypair.publicKey()}\n`);

    // Check if already approved (optional - we can skip this to save transaction)
    console.log('📤 Sending approval transaction...');
    
    // Invoke approve_organizer method
    const result = await invokeContract(
      server,
      adminKeypair,
      CONTRACTS.CAMPAIGN_FACTORY,
      'approve_organizer',
      [addressToScVal(organizerAddress)],
      network
    );

    displayTransactionResult(result, network);
    
    console.log('✅ Organizer Approved Successfully!');
    console.log('==================================');
    console.log(`Organizer: ${organizerAddress}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error approving organizer:');
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
