/**
 * Stellar SDK Utility Module
 * Provides common functions for interacting with Stellar/Soroban contracts
 */

const StellarSdk = require('@stellar/stellar-sdk');

// Network configuration
const NETWORKS = {
  testnet: {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    rpcUrl: 'https://soroban-testnet.stellar.org',
  },
  mainnet: {
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    rpcUrl: 'https://soroban-mainnet.stellar.org',
  }
};

// Contract addresses (loaded from environment or config)
const CONTRACTS = {
  RELIEF_TOKEN: process.env.STELLAR_RELIEF_TOKEN || 'CCVU3EEHQF3BPADY37SU3AG5K3LGS2O4HXVJZEJY3T6WADTUAN6NQTYY',
  CAMPAIGN_FACTORY: process.env.STELLAR_CAMPAIGN_FACTORY || 'CAEI5K6BGQC4IR2M2S4HZDLA2ZKAU3RSDZ3WH6D2OZAXBS7PSWJNL4SK',
  TOKEN_SALE: process.env.STELLAR_TOKEN_SALE || 'CAABYCCXEEKXA6Q32EFNQWEPOL3G66BRCKISJDY6V7LXS4NABBAGCG7N',
  USDC: process.env.STELLAR_USDC || 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  CAMPAIGN_WASM_HASH: process.env.STELLAR_CAMPAIGN_WASM_HASH || '9d4bc5a5f55a6840a56b18e76a5f9aa709acbc0fdb1a6f4239b7f210bec4d947',
  WALLET_WASM_HASH: process.env.STELLAR_WALLET_WASM_HASH || '164c78d33eb5e84b82be68fe832dd241b7bd02cb159947e477ba8f49510fe9a7',
};

/**
 * Get network configuration
 */
function getNetwork(network = 'testnet') {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Invalid network: ${network}. Use 'testnet' or 'mainnet'`);
  }
  return config;
}

/**
 * Create a Stellar server instance
 */
function getServer(network = 'testnet') {
  const config = getNetwork(network);
  return new StellarSdk.SorobanRpc.Server(config.rpcUrl);
}

/**
 * Load keypair from secret key
 */
function loadKeypair(secretKey) {
  if (!secretKey) {
    throw new Error('Secret key is required');
  }
  return StellarSdk.Keypair.fromSecret(secretKey);
}

/**
 * Get account from Stellar
 */
async function getAccount(server, publicKey) {
  try {
    const account = await server.getAccount(publicKey);
    return account;
  } catch (error) {
    throw new Error(`Failed to load account: ${error.message}`);
  }
}

/**
 * Convert amount to Stellar stroop format (7 decimals)
 */
function toStroops(amount) {
  return BigInt(Math.floor(amount * 10_000_000));
}

/**
 * Convert from Stellar stroop format to decimal
 */
function fromStroops(stroops) {
  return Number(stroops) / 10_000_000;
}

/**
 * Build and sign a contract invocation transaction
 */
async function buildAndSignTransaction(server, keypair, contractAddress, method, params, network = 'testnet') {
  const config = getNetwork(network);
  const account = await getAccount(server, keypair.publicKey());
  
  const contract = new StellarSdk.Contract(contractAddress);
  
  // Build transaction
  let transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();
  
  // Prepare transaction (simulate and get auth)
  transaction = await server.prepareTransaction(transaction);
  
  // Sign transaction
  transaction.sign(keypair);
  
  return transaction;
}

/**
 * Send a transaction and wait for confirmation
 */
async function sendTransaction(server, transaction) {
  try {
    const response = await server.sendTransaction(transaction);
    
    if (response.status === 'ERROR') {
      throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
    }
    
    // Wait for transaction to be confirmed
    let getResponse = await server.getTransaction(response.hash);
    let attempts = 0;
    const maxAttempts = 30;
    
    while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(response.hash);
      attempts++;
    }
    
    if (getResponse.status === 'NOT_FOUND') {
      throw new Error('Transaction not found after 30 seconds');
    }
    
    if (getResponse.status === 'FAILED') {
      throw new Error(`Transaction failed: ${JSON.stringify(getResponse)}`);
    }
    
    return {
      hash: response.hash,
      status: getResponse.status,
      result: getResponse.returnValue,
      response: getResponse,
    };
  } catch (error) {
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

/**
 * Invoke a contract method
 */
async function invokeContract(
  server,
  keypair,
  contractAddress,
  method,
  params,
  network = 'testnet'
) {
  const transaction = await buildAndSignTransaction(
    server,
    keypair,
    contractAddress,
    method,
    params,
    network
  );
  
  return await sendTransaction(server, transaction);
}

/**
 * Create a Stellar address ScVal
 */
function addressToScVal(address) {
  return StellarSdk.Address.fromString(address).toScVal();
}

/**
 * Create a u128 ScVal from number or BigInt
 */
function u128ToScVal(value) {
  return StellarSdk.nativeToScVal(BigInt(value), { type: 'u128' });
}

/**
 * Create a string ScVal
 */
function stringToScVal(str) {
  return StellarSdk.nativeToScVal(str, { type: 'string' });
}

/**
 * Create a boolean ScVal
 */
function boolToScVal(bool) {
  return StellarSdk.nativeToScVal(bool, { type: 'bool' });
}

/**
 * Parse ScVal result to JavaScript value
 */
function scValToNative(scVal) {
  return StellarSdk.scValToNative(scVal);
}

/**
 * Get contract balance
 */
async function getContractBalance(server, contractAddress, network = 'testnet') {
  try {
    const contract = new StellarSdk.Contract(contractAddress);
    const account = await getAccount(server, contractAddress);
    
    // Get balance from contract storage or account
    return account.balances;
  } catch (error) {
    throw new Error(`Failed to get contract balance: ${error.message}`);
  }
}

/**
 * Format transaction hash for explorer
 */
function getExplorerUrl(hash, network = 'testnet') {
  const networkPath = network === 'testnet' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${networkPath}/tx/${hash}`;
}

/**
 * Format contract address for explorer
 */
function getContractExplorerUrl(contractAddress, network = 'testnet') {
  const networkPath = network === 'testnet' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${networkPath}/contract/${contractAddress}`;
}

/**
 * Format account address for explorer
 */
function getAccountExplorerUrl(accountAddress, network = 'testnet') {
  const networkPath = network === 'testnet' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${networkPath}/account/${accountAddress}`;
}

/**
 * Read contract storage entry
 */
async function readContractStorage(server, contractAddress, key) {
  try {
    const contract = new StellarSdk.Contract(contractAddress);
    const ledgerKey = contract.getFootprint();
    
    // This is a simplified version - actual implementation may vary
    // based on how contract storage is structured
    return null; // TODO: Implement based on specific contract storage structure
  } catch (error) {
    throw new Error(`Failed to read contract storage: ${error.message}`);
  }
}

/**
 * Helper to load admin keypair from environment
 */
function loadAdminKeypair() {
  const secretKey = process.env.STELLAR_ADMIN_SECRET || process.env.ADMIN_SECRET;
  if (!secretKey) {
    throw new Error('Admin secret key not found in environment. Set STELLAR_ADMIN_SECRET or ADMIN_SECRET');
  }
  return loadKeypair(secretKey);
}

/**
 * Display transaction result
 */
function displayTransactionResult(result, network = 'testnet') {
  console.log('\n✅ Transaction Successful!');
  console.log('==================================');
  console.log(`Hash: ${result.hash}`);
  console.log(`Status: ${result.status}`);
  console.log(`Explorer: ${getExplorerUrl(result.hash, network)}`);
  if (result.result) {
    console.log(`Result: ${JSON.stringify(scValToNative(result.result), null, 2)}`);
  }
  console.log('');
}

module.exports = {
  // Network functions
  getNetwork,
  getServer,
  
  // Account functions
  loadKeypair,
  loadAdminKeypair,
  getAccount,
  
  // Contract interaction
  invokeContract,
  buildAndSignTransaction,
  sendTransaction,
  getContractBalance,
  readContractStorage,
  
  // ScVal conversions
  addressToScVal,
  u128ToScVal,
  stringToScVal,
  boolToScVal,
  scValToNative,
  
  // Amount conversions
  toStroops,
  fromStroops,
  
  // URLs and formatting
  getExplorerUrl,
  getContractExplorerUrl,
  getAccountExplorerUrl,
  displayTransactionResult,
  
  // Constants
  CONTRACTS,
  NETWORKS,
};
