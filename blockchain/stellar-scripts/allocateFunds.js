#!/usr/bin/env node
/**
 * Allocate funds to a beneficiary on Stellar
 * Usage: node stellar-scripts/allocateFunds.js
 * 
 * Environment variables:
 *   ORGANIZER_SECRET - Organizer's secret key
 *   CAMPAIGN_ADDRESS - Campaign contract address
 *   BENEFICIARY_ADDRESS - Beneficiary address
 *   AMOUNT - Amount to allocate in RELIEF tokens (e.g., 1000)
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
  getContractExplorerUrl,
} = require('./stellarUtils');

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const organizerSecret = process.env.ORGANIZER_SECRET || process.env.STELLAR_ADMIN_SECRET;
  const campaignAddress = process.env.CAMPAIGN_ADDRESS || process.argv[2];
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS || process.argv[3];
  const amount = process.env.AMOUNT || process.argv[4] || '1000';
  
  if (!organizerSecret) {
    console.error('❌ Organizer secret key is required');
    console.log('Set ORGANIZER_SECRET environment variable');
    process.exit(1);
  }
  
  if (!campaignAddress || !beneficiaryAddress) {
    console.error('❌ Campaign and beneficiary addresses are required');
    console.log('Usage: CAMPAIGN_ADDRESS=<address> BENEFICIARY_ADDRESS=<address> AMOUNT=1000 node stellar-scripts/allocateFunds.js');
    console.log('   OR: node stellar-scripts/allocateFunds.js <campaign-address> <beneficiary-address> <amount>');
    process.exit(1);
  }

  console.log('\n💰 Allocating Funds to Beneficiary on Stellar');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Campaign: ${campaignAddress}`);
  console.log(`Beneficiary: ${beneficiaryAddress}`);
  console.log(`Amount: ${amount} RELIEF`);

  try {
    // Initialize
    const server = getServer(network);
    const organizerKeypair = loadKeypair(organizerSecret);
    
    console.log(`Organizer Address: ${organizerKeypair.publicKey()}\n`);

    // Convert amount to stroops (7 decimals)
    const amountInStroops = toStroops(Number(amount));

    console.log('🔄 Allocating funds...');
    
    // Invoke allocate_funds method
    const result = await invokeContract(
      server,
      organizerKeypair,
      campaignAddress,
      'allocate_funds',
      [
        addressToScVal(beneficiaryAddress),  // beneficiary
        u128ToScVal(amountInStroops),        // amount
      ],
      network
    );

    displayTransactionResult(result, network);
    
    // Get beneficiary wallet address
    console.log('📊 Fetching beneficiary wallet...');
    try {
      const walletResult = await invokeContract(
        server,
        organizerKeypair,
        campaignAddress,
        'get_beneficiary_wallet',
        [addressToScVal(beneficiaryAddress)],
        network
      );
      
      if (walletResult.result) {
        const walletAddress = scValToNative(walletResult.result);
        console.log(`\n📍 Beneficiary Wallet Address:`);
        console.log(walletAddress);
        console.log(`\n🔗 View Wallet:`);
        console.log(getContractExplorerUrl(walletAddress, network));
        
        // Get wallet balance
        try {
          const balanceResult = await invokeContract(
            server,
            organizerKeypair,
            walletAddress,
            'get_balance',
            [],
            network
          );
          
          if (balanceResult.result) {
            const balance = scValToNative(balanceResult.result);
            console.log(`\n💰 Current Wallet Balance: ${fromStroops(balance)} RELIEF`);
          }
        } catch (error) {
          console.log('⚠️  Could not fetch wallet balance');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not fetch beneficiary wallet address');
    }
    
    console.log('\n✅ Funds Allocated Successfully!');
    console.log('==================================');
    console.log(`Campaign: ${campaignAddress}`);
    console.log(`Beneficiary: ${beneficiaryAddress}`);
    console.log(`Amount: ${amount} RELIEF`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error allocating funds:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('  - Make sure the beneficiary is approved');
    console.log('  - Ensure the campaign has enough raised funds');
    console.log('  - Verify you are the campaign organizer');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
