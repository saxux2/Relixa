import { useState, useCallback, useEffect } from 'react';
import { isAllowed, isConnected as isFreighterConnected, requestAccess, getAddress as getFreighterAddress } from '@stellar/freighter-api';
import StellarService from '../services/StellarService';

export const useStellarWallet = () => {
  const [publicKey, setPublicKey] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState(null);

  /**
   * Connect to Freighter wallet
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if Freighter is installed
      const connectedResponse = await isFreighterConnected();
      if (!connectedResponse.isConnected) {
        throw new Error(
          'Freighter wallet not installed. Please install it from https://freighter.app'
        );
      }

      // Request public key from Freighter
      const accessResponse = await requestAccess();
      if (accessResponse.error) throw new Error(accessResponse.error);
      const pubKey = accessResponse.address;
      if (!pubKey) throw new Error('User declined access');
      setPublicKey(pubKey);
      setIsConnected(true);

      // Fetch USDC balance
      const usdcBalance = await StellarService.getUSDCBalance(pubKey);
      setBalance(usdcBalance.toString());

      // Store in localStorage
      localStorage.setItem('stellarPublicKey', pubKey);

      return pubKey;
    } catch (err) {
      const errorMsg = err.message || 'Failed to connect wallet';
      setError(errorMsg);
      console.error('Wallet connection error:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect from wallet
   */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setBalance('0');
    setError(null);
    localStorage.removeItem('stellarPublicKey');
  }, []);

  /**
   * Reconnect to previously connected wallet
   */
  useEffect(() => {
    const reconnect = async () => {
      const storedKey = localStorage.getItem('stellarPublicKey');
      if (storedKey) {
        try {
          const connectedResponse = await isFreighterConnected();
          const allowedResponse = await isAllowed();
          if (connectedResponse.isConnected && allowedResponse.isAllowed) {
            const addressResponse = await getFreighterAddress();
            if (addressResponse.error) throw new Error(addressResponse.error);
            const pubKey = addressResponse.address;
            if (pubKey === storedKey) {
              setPublicKey(pubKey);
              setIsConnected(true);
              
              const usdcBalance = await StellarService.getUSDCBalance(pubKey);
              setBalance(usdcBalance.toString());
            }
          }
        } catch (err) {
          console.error('Auto-reconnect failed:', err);
          disconnect();
        }
      }
    };

    reconnect();
  }, [disconnect]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      const usdcBalance = await StellarService.getUSDCBalance(publicKey);
      setBalance(usdcBalance.toString());
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [publicKey]);

  /**
   * Sign message (for verification)
   */
  const signMessage = useCallback(
    async (message) => {
      const connected = await isFreighterConnected();
      if (!publicKey || !connected) {
        throw new Error('Wallet not connected');
      }

      try {
        // Freighter uses transaction signing, not direct message signing
        // For message signing, you'd need to create a special transaction
        throw new Error('Message signing not yet implemented for Stellar');
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [publicKey]
  );

  return {
    // State - expose both names for compatibility
    publicKey,
    address: publicKey,
    isConnected,
    isConnecting,
    balance,
    error,

    // Methods - expose both names for compatibility
    connect,
    connectWallet: connect,
    disconnect,
    disconnectWallet: disconnect,
    refreshBalance,
    signMessage
  };
};
