import { useState } from 'react';
import { useStellarWallet } from '../hooks/useStellarWallet';
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function ApproveMerchantModal({ beneficiaryWalletAddress, beneficiaryName, onClose, onSuccess }) {
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('Food');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const { address, isConnected } = useStellarWallet();

  const categories = ['Food', 'Medicine', 'Shelter', 'Education', 'Clothing', 'Other'];

  const handleApprove = async () => {
    try {
      if (!merchantAddress || !merchantName) {
        alert('Please enter merchant address and name');
        return;
      }

      if (!isConnected || !address) {
        alert('Please connect your wallet');
        return;
      }

      setIsProcessing(true);
      setTxStatus('Approving merchant...');

      const merchantDoc = await getDoc(doc(db, 'users', merchantAddress.toLowerCase()));
      if (!merchantDoc.exists()) {
        alert('Merchant not found in database');
        setIsProcessing(false);
        return;
      }

      const merchantData = merchantDoc.data();
      const currentApprovedCategories = merchantData.approvedCategories || [];
      
      if (!currentApprovedCategories.includes(category)) {
        currentApprovedCategories.push(category);
      }

      await updateDoc(doc(db, 'users', merchantAddress.toLowerCase()), {
        approvedCategories: currentApprovedCategories,
        approvedAt: new Date().toISOString(),
        approvedBy: address,
      });

      alert(`✅ Merchant Approved!\n\nMerchant: ${merchantName}\nCategory: ${category}`);

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Error approving merchant:', error);
      alert('Failed to approve merchant');
    } finally {
      setIsProcessing(false);
      setTxStatus('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-2 border-green-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            🏪 Approve Merchant
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Beneficiary:</strong> {beneficiaryName}
          </p>
          <p className="text-blue-300 text-xs mt-1 font-mono">
            {beneficiaryWalletAddress}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-green-300 mb-2 font-semibold">Merchant Name</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Local Food Store"
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-green-300 mb-2 font-semibold">Merchant Wallet Address</label>
            <input
              type="text"
              value={merchantAddress}
              onChange={(e) => setMerchantAddress(e.target.value)}
              placeholder="G..."
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-green-300 mb-2 font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {txStatus && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">{txStatus}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-purple-300 text-sm">
            ⚠️ <strong>Important:</strong> Approving a merchant allows the beneficiary to spend relief funds at this merchant for <strong>{category}</strong> purchases.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing || !merchantAddress || !merchantName}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '⏳ Processing...' : '✅ Approve Merchant'}
          </button>
        </div>
      </div>
    </div>
  );
}
