import { useState, useEffect } from 'react';
import { useStellarWallet } from '../hooks/useStellarWallet';
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AllocateFundsModal({ campaign, beneficiaries, onClose, onSuccess }) {
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [campaignBalance, setCampaignBalance] = useState('0');
  const { address, isConnected } = useStellarWallet();

  useEffect(() => {
    if (campaign) {
      setCampaignBalance(campaign.raised || '0');
    }
  }, [campaign]);

  const handleAllocate = async () => {
    try {
      if (!selectedBeneficiary || !amount || parseFloat(amount) <= 0) {
        alert('Please select a beneficiary and enter a valid amount');
        return;
      }

      if (!isConnected || !address) {
        alert('Please connect your wallet');
        return;
      }

      setIsProcessing(true);
      setTxStatus('Allocating funds...');

      const beneficiaryDoc = await getDoc(doc(db, 'users', selectedBeneficiary.toLowerCase()));
      if (!beneficiaryDoc.exists()) {
        alert('Beneficiary not found');
        setIsProcessing(false);
        return;
      }

      const currentBalance = beneficiaryDoc.data().allocatedFunds || 0;
      const newBalance = currentBalance + parseFloat(amount);

      await updateDoc(doc(db, 'users', selectedBeneficiary.toLowerCase()), {
        allocatedFunds: newBalance,
        lastAllocation: new Date().toISOString(),
        allocatedBy: address,
      });

      await addDoc(collection(db, 'allocations'), {
        campaignId: campaign.id,
        beneficiaryId: selectedBeneficiary.toLowerCase(),
        amount: parseFloat(amount),
        allocatedBy: address,
        allocatedAt: new Date().toISOString(),
      });

      alert(`✅ Funds Allocated!\n\nAmount: ${amount} USDC\nBeneficiary: ${selectedBeneficiary}`);

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Error allocating funds:', error);
      alert('Failed to allocate funds');
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
            💰 Allocate Funds
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
            <strong>Campaign:</strong> {campaign?.title}
          </p>
          <p className="text-blue-300 text-sm mt-1">
            <strong>Available Balance:</strong> {campaignBalance} USDC
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-green-300 mb-2 font-semibold">Select Beneficiary</label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none"
            >
              <option value="">-- Select beneficiary --</option>
              {beneficiaries?.map(b => (
                <option key={b.walletAddress} value={b.walletAddress}>
                  {b.name || b.businessName || b.walletAddress}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-green-300 mb-2 font-semibold">Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isProcessing}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        {txStatus && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">{txStatus}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAllocate}
            disabled={isProcessing || !selectedBeneficiary || !amount}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '⏳ Processing...' : '💰 Allocate Funds'}
          </button>
        </div>
      </div>
    </div>
  );
}
