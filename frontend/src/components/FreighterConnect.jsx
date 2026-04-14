import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useStellarWalletContext } from '../contexts/StellarWalletContext';

const FreighterConnect = ({ variant = 'default' }) => {
  const { publicKey, isConnecting, isConnected, balance, connect, disconnect, error } =
    useStellarWalletContext();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error(err.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
    toast.success('Wallet disconnected');
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`
          px-6 py-2 rounded-lg font-semibold transition
          ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            variant === 'outline'
              ? 'border border-blue-500 text-blue-500 hover:bg-blue-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isConnecting ? 'Connecting...' : 'Connect Freighter'}
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          px-4 py-2 rounded-lg font-semibold transition
          ${
            variant === 'outline'
              ? 'border border-green-500 text-green-500 hover:bg-green-50'
              : 'bg-green-600 text-white hover:bg-green-700'
          }
        `}
      >
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        {publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'Connected'}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
          {/* Balance Display */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600 mb-1">USDC Balance</p>
            <p className="text-2xl font-bold text-gray-900">${parseFloat(balance).toFixed(2)}</p>
          </div>

          {/* Public Key */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Public Key</p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{publicKey}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey);
                toast.success('Copied!');
              }}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Copy
            </button>
          </div>

          {/* Network Info */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Network</p>
            <p className="text-sm font-semibold text-gray-900">Stellar Testnet</p>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 block"
            >
              View on Stellar Expert →
            </a>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 border-t border-gray-100 font-semibold"
          >
            Disconnect Wallet
          </button>

          {/* Close Button */}
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100"
          >
            Close
          </button>
        </div>
      )}

      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default FreighterConnect;
