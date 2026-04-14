/**
 * Stellar Soroban Service
 * Handles interactions with Relifo smart contracts on Stellar
 */

import * as StellarSdk from 'stellar-sdk';
import { freighterService } from './freighterService.js';

// Configuration from environment
const CONFIG = {
  network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  horizonUrl: import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET,
  
  // Contract addresses
  reliefToken: import.meta.env.VITE_STELLAR_RELIEF_TOKEN,
  campaignFactory: import.meta.env.VITE_STELLAR_CAMPAIGN_FACTORY,
  tokenSale: import.meta.env.VITE_STELLAR_TOKEN_SALE,
  usdc: import.meta.env.VITE_STELLAR_USDC_ADDRESS,
  
  // WASM hashes
  campaignWasmHash: import.meta.env.VITE_STELLAR_CAMPAIGN_WASM_HASH,
  walletWasmHash: import.meta.env.VITE_STELLAR_WALLET_WASM_HASH,
};

class StellarSorobanService {
  constructor() {
    this.server = new StellarSdk.SorobanRpc.Server(CONFIG.rpcUrl);
    this.horizonServer = new StellarSdk.Horizon.Server(CONFIG.horizonUrl);
    this.networkPassphrase = CONFIG.networkPassphrase;
  }

  /**
   * Connect to Freighter wallet
   */
  async connectWallet() {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error('Freighter wallet not installed. Please install it from https://www.freighter.app/');
      }

      const publicKey = await freighterService.getPublicKey();
      const connectionStatus = await freighterService.checkConnection();

      if (!connectionStatus.connected) {
        // Request access if not already allowed
        await freighterService.requestAccess();
      }

      return {
        publicKey,
        isConnected: true,
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Get account from Stellar
   */
  async getAccount(publicKey) {
    try {
      const account = await this.server.getAccount(publicKey);
      return account;
    } catch (error) {
      throw new Error(`Failed to load account: ${error.message}`);
    }
  }

  /**
   * Convert amount to stroops (7 decimals on Stellar)
   */
  toStroops(amount) {
    return BigInt(Math.floor(amount * 10_000_000));
  }

  /**
   * Convert from stroops to decimal
   */
  fromStroops(stroops) {
    return Number(stroops) / 10_000_000;
  }

  /**
   * Build and prepare a contract transaction
   */
  async buildContractTransaction(userPublicKey, contractAddress, method, params) {
    try {
      const account = await this.getAccount(userPublicKey);
      const contract = new StellarSdk.Contract(contractAddress);

      // Build transaction
      let transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...params))
        .setTimeout(30)
        .build();

      // Prepare transaction (simulate and get auth)
      transaction = await this.server.prepareTransaction(transaction);

      return transaction;
    } catch (error) {
      console.error('Failed to build transaction:', error);
      throw error;
    }
  }

  /**
   * Sign transaction with Freighter
   */
  async signTransaction(transaction) {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error('Freighter wallet not found');
      }

      const networkLabel = CONFIG.network === 'testnet' ? 'TESTNET' : 'PUBLIC';
      const signedXDR = await freighterService.signTransaction(
        transaction.toXDR(),
        networkLabel
      );

      return StellarSdk.TransactionBuilder.fromXDR(signedXDR, this.networkPassphrase);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

  /**
   * Submit transaction and wait for result
   */
  async submitTransaction(transaction) {
    try {
      const response = await this.server.sendTransaction(transaction);

      if (response.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
      }

      // Wait for transaction confirmation
      let getResponse = await this.server.getTransaction(response.hash);
      let attempts = 0;
      const maxAttempts = 30;

      while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await this.server.getTransaction(response.hash);
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
      console.error('Failed to submit transaction:', error);
      throw error;
    }
  }

  /**
   * Invoke a contract method (complete flow)
   */
  async invokeContract(userPublicKey, contractAddress, method, params) {
    try {
      // 1. Build transaction
      const transaction = await this.buildContractTransaction(
        userPublicKey,
        contractAddress,
        method,
        params
      );

      // 2. Sign with Freighter
      const signedTransaction = await this.signTransaction(transaction);

      // 3. Submit and wait
      const result = await this.submitTransaction(signedTransaction);

      return result;
    } catch (error) {
      console.error(`Error invoking ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get RELIEF token balance
   */
  async getReliefBalance(userAddress) {
    try {
      const result = await this.invokeContract(
        userAddress,
        CONFIG.reliefToken,
        'balance',
        [StellarSdk.Address.fromString(userAddress).toScVal()]
      );

      if (result.result) {
        const balance = StellarSdk.scValToNative(result.result);
        return this.fromStroops(balance);
      }
      return 0;
    } catch (error) {
      console.error('Error getting RELIEF balance:', error);
      return 0;
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(userAddress) {
    try {
      const result = await this.invokeContract(
        userAddress,
        CONFIG.usdc,
        'balance',
        [StellarSdk.Address.fromString(userAddress).toScVal()]
      );

      if (result.result) {
        const balance = StellarSdk.scValToNative(result.result);
        return this.fromStroops(balance);
      }
      return 0;
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return 0;
    }
  }

  /**
   * Buy RELIEF tokens with USDC
   */
  async buyReliefTokens(userAddress, usdcAmount, onProgress) {
    try {
      onProgress?.('Approving USDC...', 1);
      
      // Step 1: Approve USDC for TokenSale contract
      const amountInStroops = this.toStroops(usdcAmount);
      
      await this.invokeContract(
        userAddress,
        CONFIG.usdc,
        'approve',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.Address.fromString(CONFIG.tokenSale).toScVal(),
          StellarSdk.nativeToScVal(amountInStroops, { type: 'u128' }),
          StellarSdk.nativeToScVal(200000, { type: 'u128' }), // expiration_ledger
        ]
      );

      onProgress?.('Purchasing RELIEF tokens...', 2);

      // Step 2: Buy tokens
      const buyResult = await this.invokeContract(
        userAddress,
        CONFIG.tokenSale,
        'buy_tokens',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.nativeToScVal(amountInStroops, { type: 'u128' }),
        ]
      );

      return {
        success: true,
        txHash: buyResult.hash,
        reliefAmount: usdcAmount,
      };
    } catch (error) {
      console.error('Error buying RELIEF tokens:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Donate to a campaign
   */
  async donateToCampaign(userAddress, campaignAddress, reliefAmount, onProgress) {
    try {
      onProgress?.('Approving RELIEF tokens...', 1);

      // Step 1: Approve RELIEF for campaign
      const amountInStroops = this.toStroops(reliefAmount);
      
      await this.invokeContract(
        userAddress,
        CONFIG.reliefToken,
        'approve',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.Address.fromString(campaignAddress).toScVal(),
          StellarSdk.nativeToScVal(amountInStroops, { type: 'u128' }),
          StellarSdk.nativeToScVal(200000, { type: 'u128' }), // expiration_ledger
        ]
      );

      onProgress?.('Donating to campaign...', 2);

      // Step 2: Donate
      const donateResult = await this.invokeContract(
        userAddress,
        campaignAddress,
        'donate',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.nativeToScVal(amountInStroops, { type: 'u128' }),
        ]
      );

      return {
        success: true,
        txHash: donateResult.hash,
        reliefAmount,
      };
    } catch (error) {
      console.error('Error donating to campaign:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Complete donation flow: USDC → RELIEF → Campaign
   */
  async completeDonationFlow(userAddress, campaignAddress, usdcAmount, onProgress, campaignMetadata = {}) {
    try {
      onProgress?.('Checking USDC balance...', 1);
      
      const usdcBalance = await this.getUSDCBalance(userAddress);
      if (usdcBalance < usdcAmount) {
        throw new Error(`Insufficient USDC balance. You have ${usdcBalance} USDC, need ${usdcAmount} USDC`);
      }

      // Step 1: Buy RELIEF tokens with USDC
      onProgress?.('Buying RELIEF tokens...', 2);
      const purchaseResult = await this.buyReliefTokens(
        userAddress,
        usdcAmount,
        (msg, step) => onProgress?.(msg, step + 1)
      );

      if (!purchaseResult.success) {
        throw new Error('Token purchase failed: ' + purchaseResult.error);
      }

      // Step 2: Donate RELIEF to campaign
      onProgress?.('Donating to campaign...', 5);
      const donationResult = await this.donateToCampaign(
        userAddress,
        campaignAddress,
        usdcAmount, // 1:1 ratio
        (msg, step) => onProgress?.(msg, step + 4)
      );

      if (!donationResult.success) {
        throw new Error('Donation failed: ' + donationResult.error);
      }

      onProgress?.('Donation complete!', 7);

      return {
        success: true,
        usdcAmount,
        reliefAmount: usdcAmount,
        txHash: donationResult.txHash,
      };
    } catch (error) {
      console.error('Complete donation flow error:', error);
      return {
        success: false,
        error: error.message || 'Donation failed',
      };
    }
  }

  /**
   * Get campaign details
   */
  async getCampaignDetails(campaignAddress, userAddress) {
    try {
      const result = await this.invokeContract(
        userAddress,
        campaignAddress,
        'get_campaign_details',
        []
      );

      if (result.result) {
        const details = StellarSdk.scValToNative(result.result);
        return {
          name: details.name,
          description: details.description,
          goalAmount: this.fromStroops(details.goal_amount),
          raisedAmount: this.fromStroops(details.raised_amount),
          organizer: details.organizer,
          reliefToken: details.relief_token,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting campaign details:', error);
      return null;
    }
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(hash) {
    const networkPath = CONFIG.network === 'testnet' ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${networkPath}/tx/${hash}`;
  }

  /**
   * Get explorer URL for contract
   */
  getContractExplorerUrl(contractAddress) {
    const networkPath = CONFIG.network === 'testnet' ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${networkPath}/contract/${contractAddress}`;
  }

  /**
   * Get explorer URL for account
   */
  getAccountExplorerUrl(accountAddress) {
    const networkPath = CONFIG.network === 'testnet' ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${networkPath}/account/${accountAddress}`;
  }
}

export default new StellarSorobanService();
