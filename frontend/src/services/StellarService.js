import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
} from "stellar-sdk";
import { STELLAR_CONFIG } from "../config/stellar.config.js";
import { freighterService } from "./freighterService.js";

class StellarService {
  constructor() {
    this.server = new Horizon.Server(STELLAR_CONFIG.network.horizonUrl);
    this.networkPassphrase = STELLAR_CONFIG.network.networkPassphrase;
    this.baseUrl = STELLAR_CONFIG.network.url;
    // Cache for account loads to reduce API calls
    this.accountCache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  /**
   * Load account with caching for better performance
   */
  async loadAccountCached(publicKey) {
    const cached = this.accountCache.get(publicKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.account;
    }
    
    const account = await this.server.loadAccount(publicKey);
    this.accountCache.set(publicKey, { account, timestamp: Date.now() });
    return account;
  }

  /**
   * Get user account from Freighter wallet
   */
  async connectWallet() {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error("Freighter wallet not found. Please install it.");
      }

      const publicKey = await freighterService.getPublicKey();
      const account = await this.server.loadAccount(publicKey);

      return {
        publicKey,
        account,
        isConnected: true,
      };
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    }
  }

  /**
   * Get Stellar account details
   */
  async getAccountInfo(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        address: publicKey,
        balance: account.balances,
        sequenceNumber: account.sequence,
      };
    } catch (error) {
      console.error("Failed to fetch account info:", error);
      throw error;
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      // Look for USDC trustline
      const usdcBalance = account.balances.find(
        (b) =>
          b.asset_code === STELLAR_CONFIG.usdc.symbol &&
          b.asset_issuer === STELLAR_CONFIG.usdc.issuer,
      );
      if (usdcBalance) {
        return parseFloat(usdcBalance.balance);
      }
      // Fallback: return native XLM balance for testing
      const nativeBalance = account.balances.find(
        (b) => b.asset_type === "native",
      );
      return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    } catch (error) {
      console.error("Failed to fetch USDC balance:", error);
      return 0;
    }
  }

  /**
   * Get native XLM balance
   */
  async getXLMBalance(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      const nativeBalance = account.balances.find(
        (b) => b.asset_type === "native",
      );
      return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    } catch (error) {
      console.error("Failed to fetch XLM balance:", error);
      return 0;
    }
  }

  /**
   * Build transaction to send USDC (simulating donation) - OPTIMIZED FOR SPEED
   */
  async buildDonationTransaction(fromPublicKey, toPublicKey, usdcAmount) {
    try {
      // Use cached account load for speed
      const account = await this.loadAccountCached(fromPublicKey);

      // Use USDC asset directly (assume recipient has trustline - Stellar will fail gracefully if not)
      // This removes the slow recipient account lookup
      const asset = new Asset(
        STELLAR_CONFIG.usdc.symbol,
        STELLAR_CONFIG.usdc.issuer,
      );

      const transaction = new TransactionBuilder(account, {
        fee: "10000", // Higher fee for faster network confirmation (0.001 XLM)
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: toPublicKey,
            asset: asset,
            amount: usdcAmount.toString(),
          }),
        )
        .setTimeout(180) // 3 minutes timeout for network confirmation
        .build();

      return transaction;
    } catch (error) {
      console.error("Failed to build donation transaction:", error);
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
        throw new Error("Freighter wallet not found");
      }

      const signedXDR = await freighterService.signTransaction(
        transaction.toXDR(),
        STELLAR_CONFIG.network.name === "testnet" ? "TESTNET" : "PUBLIC",
      );

      return signedXDR;
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw error;
    }
  }

  /**
   * Submit signed transaction
   */
  async submitTransaction(signedXDR) {
    try {
      const transaction = TransactionBuilder.fromXDR(
        signedXDR,
        this.networkPassphrase,
      );
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
        ledger: result.ledger,
      };
    } catch (error) {
      console.error("Failed to submit transaction:", error);
      throw error;
    }
  }

  /**
   * Complete donation flow
   */
  async makeDonation(campaignAddress, usdcAmount) {
    try {
      // 1. Connect wallet
      const wallet = await this.connectWallet();

      // 2. Build transaction
      const transaction = await this.buildDonationTransaction(
        wallet.publicKey,
        campaignAddress,
        usdcAmount,
      );

      // 3. Sign transaction
      const signedTxn = await this.signTransaction(transaction);

      // 4. Submit transaction
      const result = await this.submitTransaction(signedTxn);

      return result;
    } catch (error) {
      console.error("Donation failed:", error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionHash) {
    try {
      const transaction = await this.server
        .transactions()
        .transaction(transactionHash)
        .call();

      return transaction;
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      throw error;
    }
  }

  /**
   * Get account payment history
   */
  async getPaymentHistory(publicKey, limit = 10) {
    try {
      const payments = await this.server
        .payments()
        .forAccount(publicKey)
        .order("desc")
        .limit(limit)
        .call();

      return payments.records;
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      return [];
    }
  }

  /**
   * Check if account exists
   */
  async accountExists(publicKey) {
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(hash) {
    return `https://stellar.expert/explorer/testnet/tx/${hash}`;
  }

  /**
   * Get explorer URL for account
   */
  getAccountExplorerUrl(address) {
    return `https://stellar.expert/explorer/testnet/account/${address}`;
  }
}

export default new StellarService();
