#!/usr/bin/env node
/**
 * Donate to a campaign on Stellar
 * Usage: node stellar-scripts/donate.js
 * 
 * Environment variables:
 *   DONOR_SECRET - Donor's secret key
 *   CAMPAIGN_ADDRESS - Campaign contract address
 *   AMOUNT - Amount to donate in RELIEF tokens (e.g., 100)
 *   STELLAR_NETWORK - Network to use (testnet/mainnet, default: testnet)
 */

require('dotenv').config();
const {
  getServer,
  loadKeypair,
  invokeContract,
  addressToScVal,
  u128ToScVal,
  toStroops,
  fromStroops,
  displayTransactionResult,
  scValToNative,
  CONTRACTS,
} = require('./stellarUtils');

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const donorSecret = process.env.DONOR_SECRET || process.env.STELLAR_ADMIN_SECRET;
  const campaignAddress = process.env.CAMPAIGN_ADDRESS || process.argv[2];
  const amount = process.env.AMOUNT || process.argv[3] || '100';
  
  if (!donorSecret) {
    console.error('❌ Donor secret key is required');
    console.log('Set DONOR_SECRET environment variable');
    process.exit(1);
  }
  
  if (!campaignAddress) {
    console.error('❌ Campaign address is required');
    console.log('Usage: CAMPAIGN_ADDRESS=<address> AMOUNT=100 node stellar-scripts/donate.js');
    console.log('   OR: node stellar-scripts/donate.js <campaign-address> <amount>');
    process.exit(1);
  }

  console.log('\n💸 Donating to Campaign on Stellar');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Campaign: ${campaignAddress}`);
  console.log(`Amount: ${amount} RELIEF`);

  try {
    // Initialize
    const server = getServer(network);
    const donorKeypair = loadKeypair(donorSecret);
    
    console.log(`Donor Address: ${donorKeypair.publicKey()}`);
    console.log(`ReliefToken: ${CONTRACTS.RELIEF_TOKEN}\n`);

    // Convert amount to stroops (7 decimals)
    const amountInStroops = toStroops(Number(amount));

    // Step 1: Approve tokens (if using token contract directly)
    // Note: On Stellar, we may need to use the token's approve method first
    console.log('🔄 Step 1/2: Approving tokens...');
    
    try {
      const approveResult = await invokeContract(
        server,
        donorKeypair,
        CONTRACTS.RELIEF_TOKEN,
        'approve',
        [
          addressToScVal(donorKeypair.publicKey()), // from
          addressToScVal(campaignAddress),          // spender
          u128ToScVal(amountInStroops),             // amount
          u128ToScVal(200000),                       // expiration_ledger (approximate, ~200k blocks = ~1 day)
        ],
        network
      );
      console.log('✅ Tokens approved\n');
    } catch (error) {
      console.log('⚠️  Approval may have failed or is not needed:', error.message);
      console.log('Continuing with donation...\n');
    }

    // Step 2: Donate
    console.log('🔄 Step 2/2: Sending donation...');
    
    const result = await invokeContract(
      server,
      donorKeypair,
      campaignAddress,
      'donate',
      [
        addressToScVal(donorKeypair.publicKey()), // donor
        u128ToScVal(amountInStroops),             // amount
      ],
      network
    );

    displayTransactionResult(result, network);
    
    // Get campaign details (optional)
    console.log('📊 Fetching campaign details...');
    try {
      const detailsResult = await invokeContract(
        server,
        donorKeypair,
        campaignAddress,
        'get_campaign_details',
        [],
        network
      );
      
      if (detailsResult.result) {
        const details = scValToNative(detailsResult.result);
        console.log('\n💰 Campaign Status:');
        console.log(`Raised: ${fromStroops(details.raised_amount)} RELIEF`);
        console.log(`Goal: ${fromStroops(details.goal_amount)} RELIEF`);
        const progress = (fromStroops(details.raised_amount) / fromStroops(details.goal_amount) * 100).toFixed(2);
        console.log(`Progress: ${progress}%`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch campaign details');
    }
    
    console.log('\n✅ Donation Successful!');
    console.log('==================================');
    console.log(`Donor: ${donorKeypair.publicKey()}`);
    console.log(`Campaign: ${campaignAddress}`);
    console.log(`Amount: ${amount} RELIEF`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error donating to campaign:');
    console.error(error.message);
    console.log('\n💡 Make sure you have enough RELIEF tokens!');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
