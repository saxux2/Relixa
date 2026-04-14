#!/usr/bin/env node
/**
 * Exchange USDC for RELIEF tokens via TokenSale contract
 * Usage: node stellar-scripts/buyReliefTokens.js
 * 
 * Environment variables:
 *   BUYER_SECRET - Buyer's secret key
 *   AMOUNT - Amount of USDC to spend (e.g., 100)
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
  const buyerSecret = process.env.BUYER_SECRET || process.env.STELLAR_ADMIN_SECRET;
  const amount = process.env.AMOUNT || process.argv[2] || '100';
  
  if (!buyerSecret) {
    console.error('❌ Buyer secret key is required');
    console.log('Set BUYER_SECRET environment variable');
    process.exit(1);
  }

  console.log('\n💱 Exchanging USDC for RELIEF Tokens');
  console.log('==============================================');
  console.log(`Network: ${network}`);
  console.log(`Amount: ${amount} USDC → ${amount} RELIEF (1:1 rate)`);
  console.log(`TokenSale Contract: ${CONTRACTS.TOKEN_SALE}`);

  try {
    // Initialize
    const server = getServer(network);
    const buyerKeypair = loadKeypair(buyerSecret);
    
    console.log(`Buyer Address: ${buyerKeypair.publicKey()}`);
    console.log(`USDC Token: ${CONTRACTS.USDC}`);
    console.log(`RELIEF Token: ${CONTRACTS.RELIEF_TOKEN}\n`);

    // Convert amount to stroops (7 decimals)
    const amountInStroops = toStroops(Number(amount));

    // Step 1: Approve USDC tokens
    console.log('🔄 Step 1/2: Approving USDC tokens...');
    
    try {
      const approveResult = await invokeContract(
        server,
        buyerKeypair,
        CONTRACTS.USDC,
        'approve',
        [
          addressToScVal(buyerKeypair.publicKey()),  // from
          addressToScVal(CONTRACTS.TOKEN_SALE),      // spender (TokenSale contract)
          u128ToScVal(amountInStroops),              // amount
          u128ToScVal(200000),                        // expiration_ledger
        ],
        network
      );
      console.log('✅ USDC approved\n');
    } catch (error) {
      console.log('⚠️  USDC approval may have failed:', error.message);
      console.log('Continuing with token purchase...\n');
    }

    // Step 2: Buy RELIEF tokens
    console.log('🔄 Step 2/2: Purchasing RELIEF tokens...');
    
    const result = await invokeContract(
      server,
      buyerKeypair,
      CONTRACTS.TOKEN_SALE,
      'buy_tokens',
      [
        addressToScVal(buyerKeypair.publicKey()),  // buyer
        u128ToScVal(amountInStroops),              // amount
      ],
      network
    );

    displayTransactionResult(result, network);
    
    // Get user's RELIEF balance (optional)
    console.log('📊 Fetching RELIEF balance...');
    try {
      const balanceResult = await invokeContract(
        server,
        buyerKeypair,
        CONTRACTS.RELIEF_TOKEN,
        'balance',
        [addressToScVal(buyerKeypair.publicKey())],
        network
      );
      
      if (balanceResult.result) {
        const balance = scValToNative(balanceResult.result);
        console.log(`\n💰 Your RELIEF Balance: ${fromStroops(balance)} RELIEF`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch RELIEF balance');
    }
    
    console.log('\n✅ Token Purchase Successful!');
    console.log('==================================');
    console.log(`Spent: ${amount} USDC`);
    console.log(`Received: ${amount} RELIEF`);
    console.log(`Buyer: ${buyerKeypair.publicKey()}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error buying RELIEF tokens:');
    console.error(error.message);
    console.log('\n💡 Make sure you have enough USDC!');
    console.log('On testnet, you can get USDC from Stellar Testnet faucet.');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
