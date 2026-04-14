#!/usr/bin/env node
/**
 * Make a payment from beneficiary wallet
 * Usage: node stellar-scripts/beneficiaryPayment.js
 * 
 * Environment variables:
 *   BENEFICIARY_SECRET - Beneficiary's secret key
 *   WALLET_ADDRESS - Beneficiary wallet contract address
 *   MERCHANT_ADDRESS - Merchant receiving the payment
 *   AMOUNT - Amount to pay in RELIEF tokens (e.g., 50)
 *   CATEGORY - Payment category (0=Food, 1=Medicine, 2=Shelter, 3=Education, 4=Other)
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
} = require('./stellarUtils');

const CATEGORIES = {
  '0': 'Food',
  '1': 'Medicine',
  '2': 'Shelter',
  '3': 'Education',
  '4': 'Other',
  'Food': 0,
  'Medicine': 1,
  'Shelter': 2,
  'Education': 3,
  'Other': 4,
};

async function main() {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const beneficiarySecret = process.env.BENEFICIARY_SECRET;
  const walletAddress = process.env.WALLET_ADDRESS || process.argv[2];
  const merchantAddress = process.env.MERCHANT_ADDRESS || process.argv[3];
  const amount = process.env.AMOUNT || process.argv[4] || '50';
  const category = process.env.CATEGORY || process.argv[5] || '0';
  
  if (!beneficiarySecret) {
    console.error('❌ Beneficiary secret key is required');
    console.log('Set BENEFICIARY_SECRET environment variable');
    process.exit(1);
  }
  
  if (!walletAddress || !merchantAddress) {
    console.error('❌ Wallet and merchant addresses are required');
    console.log('Usage: WALLET_ADDRESS=<address> MERCHANT_ADDRESS=<address> AMOUNT=50 CATEGORY=0 node stellar-scripts/beneficiaryPayment.js');
    console.log('   OR: node stellar-scripts/beneficiaryPayment.js <wallet-address> <merchant-address> <amount> <category>');
    console.log('\nCategories: 0=Food, 1=Medicine, 2=Shelter, 3=Education, 4=Other');
    process.exit(1);
  }

  // Convert category name to number if needed
  let categoryNum = parseInt(category);
  if (isNaN(categoryNum)) {
    categoryNum = CATEGORIES[category];
    if (categoryNum === undefined) {
      console.error('❌ Invalid category. Use: Food, Medicine, Shelter, Education, or Other');
      process.exit(1);
    }
  }

  const categoryName = CATEGORIES[categoryNum.toString()];

  console.log('\n🛒 Making Payment from Beneficiary Wallet');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Merchant: ${merchantAddress}`);
  console.log(`Amount: ${amount} RELIEF`);
  console.log(`Category: ${categoryName} (${categoryNum})`);

  try {
    // Initialize
    const server = getServer(network);
    const beneficiaryKeypair = loadKeypair(beneficiarySecret);
    
    console.log(`Beneficiary Address: ${beneficiaryKeypair.publicKey()}\n`);

    // Convert amount to stroops (7 decimals)
    const amountInStroops = toStroops(Number(amount));

    console.log('🔄 Processing payment...');
    
    // Invoke spend method
    const result = await invokeContract(
      server,
      beneficiaryKeypair,
      walletAddress,
      'spend',
      [
        addressToScVal(merchantAddress),  // merchant
        u128ToScVal(amountInStroops),     // amount
        u128ToScVal(categoryNum),         // category (as u32)
      ],
      network
    );

    displayTransactionResult(result, network);
    
    // Get remaining balance
    console.log('📊 Fetching remaining balance...');
    try {
      const balanceResult = await invokeContract(
        server,
        beneficiaryKeypair,
        walletAddress,
        'get_balance',
        [],
        network
      );
      
      if (balanceResult.result) {
        const balance = scValToNative(balanceResult.result);
        console.log(`\n💰 Remaining Balance: ${fromStroops(balance)} RELIEF`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch balance');
    }
    
    // Get category spent amount
    console.log(`📊 Fetching ${categoryName} spending...`);
    try {
      const spentResult = await invokeContract(
        server,
        beneficiaryKeypair,
        walletAddress,
        'get_category_spent',
        [u128ToScVal(categoryNum)],
        network
      );
      
      if (spentResult.result) {
        const spent = scValToNative(spentResult.result);
        console.log(`Total ${categoryName} Spent: ${fromStroops(spent)} RELIEF`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch category spending');
    }
    
    console.log('\n✅ Payment Successful!');
    console.log('==================================');
    console.log(`Merchant: ${merchantAddress}`);
    console.log(`Amount: ${amount} RELIEF`);
    console.log(`Category: ${categoryName}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error processing payment:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('  - Make sure the merchant is verified');
    console.log('  - Ensure wallet has sufficient balance');
    console.log('  - Check that category spending limit is not exceeded');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
