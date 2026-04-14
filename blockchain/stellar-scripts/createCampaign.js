#!/usr/bin/env node
/**
 * Create a new campaign on Stellar
 * Usage: node stellar-scripts/createCampaign.js
 * 
 * Environment variables:
 *   STELLAR_ADMIN_SECRET or ORGANIZER_SECRET - Organizer's secret key
 *   CAMPAIGN_NAME - Name of the campaign
 *   CAMPAIGN_DESCRIPTION - Description of the campaign
 *   GOAL_AMOUNT - Goal amount in RELIEF tokens (e.g., 10000)
 *   STELLAR_NETWORK - Network to use (testnet/mainnet, default: testnet)
 */

require('dotenv').config();
const {
  getServer,
  loadKeypair,
  invokeContract,
  addressToScVal,
  stringToScVal,
  u128ToScVal,
  toStroops,
  displayTransactionResult,
  scValToNative,
  getContractExplorerUrl,
  CONTRACTS,
} = require('./stellarUtils');

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const organizerSecret = process.env.ORGANIZER_SECRET || process.env.STELLAR_ADMIN_SECRET;
  const campaignName = process.env.CAMPAIGN_NAME || process.argv[2];
  const campaignDescription = process.env.CAMPAIGN_DESCRIPTION || process.argv[3];
  const goalAmount = process.env.GOAL_AMOUNT || process.argv[4];
  
  if (!organizerSecret) {
    console.error('❌ Organizer secret key is required');
    console.log('Set ORGANIZER_SECRET or STELLAR_ADMIN_SECRET environment variable');
    process.exit(1);
  }
  
  if (!campaignName || !campaignDescription || !goalAmount) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node stellar-scripts/createCampaign.js <name> <description> <goal-amount>');
    console.log('\nOR set environment variables:');
    console.log('  CAMPAIGN_NAME - Name of the campaign');
    console.log('  CAMPAIGN_DESCRIPTION - Description');
    console.log('  GOAL_AMOUNT - Goal in RELIEF tokens (e.g., 10000)');
    console.log('  ORGANIZER_SECRET - Your secret key (must be approved organizer)');
    process.exit(1);
  }

  console.log('\n🚀 Creating Campaign on Stellar');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Campaign Name: ${campaignName}`);
  console.log(`Description: ${campaignDescription}`);
  console.log(`Goal: ${goalAmount} RELIEF`);
  console.log(`Factory Contract: ${CONTRACTS.CAMPAIGN_FACTORY}`);

  try {
    // Initialize
    const server = getServer(network);
    const organizerKeypair = loadKeypair(organizerSecret);
    
    console.log(`Organizer Address: ${organizerKeypair.publicKey()}\n`);

    // Convert goal amount to stroops (7 decimals)
    const goalInStroops = toStroops(Number(goalAmount));

    console.log('📤 Creating campaign...');
    
    // Invoke create_campaign method
    // Parameters: name (string), description (string), goal_amount (u128), relief_token (address)
    const result = await invokeContract(
      server,
      organizerKeypair,
      CONTRACTS.CAMPAIGN_FACTORY,
      'create_campaign',
      [
        stringToScVal(campaignName),
        stringToScVal(campaignDescription),
        u128ToScVal(goalInStroops),
        addressToScVal(CONTRACTS.RELIEF_TOKEN),
      ],
      network
    );

    displayTransactionResult(result, network);
    
    // Extract campaign address from result
    const campaignAddress = result.result ? scValToNative(result.result) : null;
    
    console.log('✅ Campaign Created Successfully!');
    console.log('==================================');
    console.log(`Campaign Name: ${campaignName}`);
    console.log(`Goal: ${goalAmount} RELIEF`);
    
    if (campaignAddress) {
      console.log(`\n📍 Campaign Contract Address:`);
      console.log(campaignAddress);
      console.log(`\n🔗 View Campaign:`);
      console.log(getContractExplorerUrl(campaignAddress, network));
      console.log('\n💡 Save this address! You\'ll need it for donations and allocations.');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error creating campaign:');
    console.error(error.message);
    console.log('\n💡 Make sure you are an approved organizer!');
    console.log('Run: node stellar-scripts/approveOrganizer.js <your-address>');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
