import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useStellarWalletContext } from '../contexts/StellarWalletContext';
import StellarService from '../services/StellarService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

const StellarDonationFlow = ({ campaign, onClose }) => {
  const { publicKey, isConnected, refreshBalance } = useStellarWalletContext();

  const [donationAmount, setDonationAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('');

  /**
   * Handle donation submission - OPTIMIZED FOR SPEED & UX
   */
  const handleDonate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStep('Preparing transaction...');

    try {
      // Validation
      if (!publicKey) {
        throw new Error('Please connect your Freighter wallet');
      }

      if (!donationAmount || parseFloat(donationAmount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const campaignAddress = campaign?.stellarAddress || campaign?.blockchainAddress;
      if (!campaignAddress || campaignAddress === 'GAAA...' || campaignAddress === 'GBBB...') {
        // For campaigns without blockchain address, log to Firebase only
        setStep('Saving donation...');
        await logDonationToFirebase(null);
        setTransactionHash('firebase-only');
        toast.success('💝 Donation recorded!');
        setDonationAmount('');
        refreshBalance();
        return;
      }

      // Build transaction (fast - single API call)
      setStep('Building transaction...');
      const transaction = await StellarService.buildDonationTransaction(
        publicKey,
        campaignAddress,
        parseFloat(donationAmount)
      );

      // Sign with Freighter (user interaction required)
      setStep('Waiting for signature...');
      const signedXDR = await StellarService.signTransaction(transaction);

      // Submit to Stellar network (fast with higher fees)
      setStep('Confirming on blockchain...');
      const result = await StellarService.submitTransaction(signedXDR);

      // SUCCESS - Show immediate feedback
      setTransactionHash(result.transactionHash);
      setDonationAmount('');
      toast.success('💝 Donation successful!', { duration: 3000 });

      // Log to Firebase in background (non-blocking)
      setStep('Updating records...');
      logDonationToFirebase(result).catch(err => {
        console.error('Firebase logging failed:', err);
        // Retry once after 1 second
        setTimeout(() => {
          logDonationToFirebase(result).catch(e => console.error('Firebase retry failed:', e));
        }, 1000);
      });

      // Refresh balance in background
      setTimeout(() => refreshBalance(), 500);

    } catch (err) {
      const errorMsg = err.message || 'Donation failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Donation error:', err);
    } finally {
      setIsLoading(false);
      setStep('');
    }
  };

  /**
   * Log donation to Firebase for record-keeping - OPTIMIZED
   */
  const logDonationToFirebase = async (transactionResult) => {
    try {
      if (!db) {
        console.log('⚠️ Firebase not configured, skipping donation log');
        return;
      }

      const donationData = {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        donorAddress: publicKey,
        amount: parseFloat(donationAmount),
        currency: 'USDC',
        txHash: transactionResult?.transactionHash || null,
        ledger: transactionResult?.ledger || null,
        network: 'stellar-testnet',
        createdAt: serverTimestamp()
      };

      // Execute both Firebase operations in parallel (batched)
      const promises = [
        addDoc(collection(db, 'donations'), donationData)
      ];

      // Only update campaign if we have an ID
      if (campaign.id) {
        promises.push(
          updateDoc(doc(db, 'campaigns', campaign.id), {
            raised: increment(parseFloat(donationAmount))
          })
        );
      }

      await Promise.all(promises);
      console.log('✅ Donation logged to Firebase');
    } catch (err) {
      console.error('Failed to log donation to Firebase:', err);
      // Don't fail the donation if logging fails
    }
  };

  const progress = campaign?.goal > 0 ? ((campaign?.raised || 0) / campaign.goal) * 100 : 0;

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card border border-white/20 rounded-3xl max-w-md w-full p-8 bg-black/90 backdrop-blur-md">
          <p className="text-yellow-400 font-semibold mb-2">Connect Wallet to Donate</p>
          <p className="text-sm text-white/60">
            Please connect your Freighter wallet to make donations to this campaign.
          </p>
          {onClose && (
            <button onClick={onClose} className="mt-4 text-white/40 hover:text-white text-sm">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card border border-white/20 rounded-3xl max-w-md w-full p-8 bg-black/90 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Donate to Campaign</h2>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white/60 hover:text-white text-3xl"
            >
              ×
            </button>
          )}
        </div>

        <form onSubmit={handleDonate}>
          {/* Campaign Info */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="font-semibold text-white mb-2">{campaign?.title}</h3>
            {campaign?.location && (
              <p className="text-sm text-white/60 mb-3">📍 {campaign.location}</p>
            )}
            
            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Progress</span>
                <span className="font-semibold text-green-400">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-white/60">Raised: <strong className="text-white">${campaign?.raised || 0} USDC</strong></span>
              <span className="text-white/60">Goal: <strong className="text-white">${campaign?.goal} USDC</strong></span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">
              Donation Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1000000"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Step Progress */}
          {step && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                <p className="text-sm text-yellow-400">{step}</p>
              </div>
            </div>
          )}

          {/* Transaction Hash Display */}
          {transactionHash && transactionHash !== 'firebase-only' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-white/60 mb-1">✅ Transaction Hash</p>
              <p className="font-mono text-xs break-all text-green-400 bg-white/5 p-2 rounded">
                {transactionHash}
              </p>
              <a
                href={StellarService.getExplorerUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 block"
              >
                View on Stellar Expert →
              </a>
            </div>
          )}

          {transactionHash === 'firebase-only' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-400">✅ Donation recorded successfully!</p>
              <p className="text-xs text-white/40 mt-1">Campaign does not have a blockchain address yet. Donation has been logged to the database.</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !donationAmount || parseFloat(donationAmount) <= 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              '💝 Donate USDC'
            )}
          </button>

          <p className="text-xs text-white/40 mt-3 text-center">
            You will be prompted to sign with Freighter Wallet. This donation will be recorded on
            Stellar Testnet.
          </p>
        </form>
      </div>
    </div>
  );
};

export default StellarDonationFlow;
