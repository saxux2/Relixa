import { useState } from 'react';
import { useStellarWallet } from '../hooks/useStellarWallet';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { USER_STATUS } from '../firebase/constants';

export default function VerifyMerchantModal({ merchant, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [showDocuments, setShowDocuments] = useState(false);
  const { address, isConnected } = useStellarWallet();

  const handleVerify = async () => {
    try {
      if (!isConnected || !address) {
        alert('Please connect your wallet');
        return;
      }

      if (!merchant.walletAddress) {
        alert('Merchant wallet address not found');
        return;
      }

      setIsProcessing(true);
      setTxStatus('Verifying merchant...');

      await updateDoc(doc(db, 'users', merchant.walletAddress.toLowerCase()), {
        status: USER_STATUS.APPROVED,
        verifiedOnChain: true,
        verifiedAt: new Date().toISOString(),
      });

      alert(`✅ Merchant Verified Successfully!\n\nBusiness: ${merchant.businessName}\nWallet: ${merchant.walletAddress}`);

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Error verifying merchant:', error);
      alert('Failed to verify merchant');
    } finally {
      setIsProcessing(false);
      setTxStatus('');
    }
  };

  const handleReject = async () => {
    if (!confirm(`Are you sure you want to reject ${merchant.businessName}?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      await updateDoc(doc(db, 'users', merchant.walletAddress.toLowerCase()), {
        status: USER_STATUS.REJECTED,
        rejectedAt: new Date().toISOString(),
      });

      alert(`❌ Merchant Rejected\n\n${merchant.businessName} has been rejected.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error rejecting merchant:', error);
      alert('Failed to reject merchant');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-2 border-green-500/30 rounded-2xl p-8 max-w-4xl w-full shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            🏪 Verify Merchant
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm font-semibold mb-1">Business Name</p>
              <p className="text-white text-lg">{merchant.businessName}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm font-semibold mb-1">Owner Name</p>
              <p className="text-white text-lg">{merchant.ownerName}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm font-semibold mb-1">Business Type</p>
              <p className="text-white text-lg capitalize">{merchant.businessType}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm font-semibold mb-1">Phone</p>
              <p className="text-white text-lg">{merchant.phone}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg md:col-span-2">
              <p className="text-green-300 text-sm font-semibold mb-1">Email</p>
              <p className="text-white text-lg">{merchant.email}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg md:col-span-2">
              <p className="text-green-300 text-sm font-semibold mb-1">Address</p>
              <p className="text-white text-lg">{merchant.address}</p>
            </div>

            <div className="p-4 bg-black/40 border border-green-500/30 rounded-lg md:col-span-2">
              <p className="text-green-300 text-sm font-semibold mb-1">Service Categories</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {merchant.categories?.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-blue-500/30 rounded-lg md:col-span-2">
              <p className="text-blue-300 text-sm font-semibold mb-1">Wallet Address</p>
              <p className="text-white text-sm font-mono break-all">{merchant.walletAddress}</p>
            </div>
          </div>
        </div>

        {txStatus && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">{txStatus}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            ⚠️ <strong>Important:</strong> Verifying this merchant will allow organizers to approve them for beneficiary spending.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ❌ Reject
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '⏳ Processing...' : '✅ Verify Merchant'}
          </button>
        </div>
      </div>
    </div>
  );
}
