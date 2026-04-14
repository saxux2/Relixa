import React, { createContext, useContext } from 'react';
import { useStellarWallet } from '../hooks/useStellarWallet';

const StellarWalletContext = createContext();

export const StellarWalletProvider = ({ children }) => {
  const wallet = useStellarWallet();

  return (
    <StellarWalletContext.Provider value={wallet}>
      {children}
    </StellarWalletContext.Provider>
  );
};

export const useStellarWalletContext = () => {
  const context = useContext(StellarWalletContext);
  if (!context) {
    throw new Error(
      'useStellarWalletContext must be used within StellarWalletProvider'
    );
  }
  return context;
};

// Alias for backwards compatibility
export { useStellarWalletContext as useStellarWallet };
