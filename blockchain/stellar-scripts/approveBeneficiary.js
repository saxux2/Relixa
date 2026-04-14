#!/usr/bin/env node
/**
 * Approve a beneficiary on a campaign
 * Usage: node stellar-scripts/approveBeneficiary.js
 * 
 * Environment variables:
 *   ORGANIZER_SECRET - Organizer's secret key
 *   CAMPAIGN_ADDRESS - Campaign contract address
 *   BENEFICIARY_ADDRESS - Beneficiary to approve
 *   STELLAR_NETWORK - Network to use (testnet/mainnet, default: testnet)
 */

require('dotenv').config();
const {
  getServer,
  loadKeypair,
  invokeContract,
  addressToScVal,
  displayTransactionResult,
} = require('./stellarUtils');

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const organizerSecret = process.env.ORGANIZER_SECRET || process.env.STELLAR_ADMIN_SECRET;
  const campaignAddress = process.env.CAMPAIGN_ADDRESS || process.argv[2];
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS || process.argv[3];
  
  if (!organizerSecret) {
    console.error('❌ Organizer secret key is required');
    console.log('Set ORGANIZER_SECRET environment variable');
    process.exit(1);
  }
  
  if (!campaignAddress || !beneficiaryAddress) {
    console.error('❌ Campaign and beneficiary addresses are required');
    console.log('Usage: CAMPAIGN_ADDRESS=<address> BENEFICIARY_ADDRESS=<address> node stellar-scripts/approveBeneficiary.js');
    console.log('   OR: node stellar-scripts/approveBeneficiary.js <campaign-address> <beneficiary-address>');
    process.exit(1);
  }

  console.log('\n👤 Approving Beneficiary on Campaign');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Campaign: ${campaignAddress}`);
  console.log(`Beneficiary: ${beneficiaryAddress}`);

  try {
    // Initialize
    const server = getServer(network);
    const organizerKeypair = loadKeypair(organizerSecret);
    
    console.log(`Organizer Address: ${organizerKeypair.publicKey()}\n`);

    console.log('📤 Approving beneficiary...');
    
    // Invoke approve_beneficiary method
    const result = await invokeContract(
      server,
      organizerKeypair,
      campaignAddress,
      'approve_beneficiary',
      [addressToScVal(beneficiaryAddress)],
      network
    );

    displayTransactionResult(result, network);
    
    console.log('✅ Beneficiary Approved Successfully!');
    console.log('==================================');
    console.log(`Beneficiary: ${beneficiaryAddress}`);
    console.log('\n💡 You can now allocate funds to this beneficiary.');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error approving beneficiary:');
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
