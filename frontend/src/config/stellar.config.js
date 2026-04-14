// Stellar Network Configuration
export const STELLAR_CONFIG = {
  // Stellar Testnet
  network: {
    name: 'testnet',
    url: 'https://soroban-testnet.stellar.org:443',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    chainId: 'testnet'
  },

  // USDC on Stellar Testnet
  usdc: {
    address: 'CAQYAU4RVHTPV7KXQNHK73MQKXSV4DKP2NOFQXHDBT3IUCDPBDUU6Y3',
    decimals: 6,
    symbol: 'USDC',
    issuer: 'GBBD47UZQ5LMKC7TGZRM7INBHQFN3W5C35TZDWC6N7K2WS3DMMM3F5KJ'
  },

  // Campaign Factory Info
  campaign: {
    address: null, // Will be set after deployment
    decimals: 6
  },

  // Beneficiary Wallet Template
  beneficiary: {
    address: null // Will be set after deployment
  }
};

// Network constants
export const STELLAR_NETWORKS = {
  TESTNET: 'testnet',
  PUBLIC: 'public',
  CUSTOM: 'custom'
};

// Contract Methods
export const STELLAR_METHODS = {
  // Campaign operations
  CREATE_CAMPAIGN: 'create_campaign',
  DONATE: 'donate',
  ALLOCATE_FUNDS: 'allocate_to_beneficiary',
  WITHDRAW: 'withdraw',

  // Beneficiary wallet operations
  SPEND_AT_MERCHANT: 'spend_at_merchant',
  GET_BALANCE: 'get_balance',

  // Read methods
  GET_CAMPAIGN_INFO: 'get_campaign_info',
  GET_BENEFICIARY_INFO: 'get_beneficiary_info'
};
