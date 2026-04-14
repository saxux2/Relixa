import * as StellarSdk from 'stellar-sdk';

// Network configuration
export const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET';
export const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

// Initialize Stellar server (use Horizon.Server - the non-deprecated API)
export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Network passphrase
export const networkPassphrase = 
  STELLAR_NETWORK === 'TESTNET'
    ? StellarSdk.Networks.TESTNET
    : StellarSdk.Networks.PUBLIC;

// Super Admin Address
export const SUPER_ADMIN_ADDRESS = import.meta.env.VITE_SUPER_ADMIN_ADDRESS;

console.log('🌟 Relifo - Stellar Network:', STELLAR_NETWORK);
console.log('🌟 Relifo - Horizon URL:', HORIZON_URL);
console.log('🌟 Relifo - Super Admin:', SUPER_ADMIN_ADDRESS);
