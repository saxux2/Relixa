import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { addDoc, doc, getDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp, setDoc, getDocs } from 'firebase/firestore';
import { useStellarWalletContext } from '../../contexts/StellarWalletContext';
import StellarService from '../../services/StellarService';
import FreighterConnect from '../../components/FreighterConnect';
import toast from 'react-hot-toast';

export default function MerchantDashboard() {
  const { publicKey, isConnected, balance, disconnect } = useStellarWalletContext();
  const navigate = useNavigate();
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [merchantRequests, setMerchantRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    if (!db || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      // Load merchant profile
      const profileDoc = await getDoc(doc(db, 'merchant_profile', publicKey));
      if (profileDoc.exists()) {
        setMerchantProfile(profileDoc.data());
      } else {
        toast.error('Merchant profile not found');
        navigate('/');
        return;
      }

      // Load transactions where this merchant received payments
      const transactionsRef = collection(db, 'spending');
      const q = query(transactionsRef, where('merchantAddress', '==', publicKey));
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch transaction details from Stellar for hash verification
        const enrichedData = await Promise.all(
          transData.map(async (trans) => {
            if (trans.txHash) {
              try {
                const details = await StellarService.getTransactionDetails(trans.txHash);
                return { ...trans, verified: !!details };
              } catch (err) {
                console.error('Error fetching tx details:', err);
                return { ...trans, verified: false };
              }
            }
            return { ...trans, verified: false };
          })
        );
        
        setTransactions(enrichedData.sort((a, b) => 
          new Date(b.timestamp?.toDate?.() || b.timestamp) - 
          new Date(a.timestamp?.toDate?.() || a.timestamp)
        ));
        setLoading(false);
      });

      // Load campaigns so merchants can discover newly created ones too
      const campaignsRef = collection(db, 'campaigns');
      const unsubscribeCampaigns = onSnapshot(campaignsRef, (snapshot) => {
        const campaignData = snapshot.docs
          .map((campaignDoc) => ({ id: campaignDoc.id, ...campaignDoc.data() }))
          .filter((campaign) => campaign.status !== 'rejected')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.() || b.createdAt || 0;
            return new Date(bTime) - new Date(aTime);
          });
        setCampaigns(campaignData);
      });

// Load this merchant's campaign join requests
      const requestsRef = collection(db, 'merchant_campaign_requests');
      const unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
        const requestsData = snapshot.docs.map((requestDoc) => ({ id: requestDoc.id, ...requestDoc.data() }));
        console.log('All merchant requests from Firebase:', requestsData.length);
        console.log('Sample request:', requestsData[0] || 'none');
        // Filter for this merchant
        const myRequests = requestsData.filter(r => r.merchantAddress === publicKey.toLowerCase());
        console.log('My requests:', myRequests.length);
        setMerchantRequests(myRequests);
      });

      return () => {
        unsubscribe();
        unsubscribeCampaigns();
        unsubscribeRequests();
      };
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, [publicKey, navigate]);

  useEffect(() => {
    if (!isConnected || !publicKey) {
      setLoading(false);
      return;
    }

    let cleanup;
    loadData().then((unsubscribeFn) => {
      cleanup = unsubscribeFn;
    });

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [publicKey, isConnected, loadData]);

const handleApplyToCampaign = async (campaign) => {
    try {
      if (!publicKey) {
        toast.error('Please connect wallet first');
        return;
      }

      const normalizedMerchantAddress = publicKey.toLowerCase();
      
      // Check if already applied to this specific campaign
      const existingRequest = merchantRequests.find(
        (request) => request.campaignId === campaign.id && request.merchantAddress === normalizedMerchantAddress
      );

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error('Already pending for this campaign.');
          return;
        }
        if (existingRequest.status === 'approved') {
          toast.success('Already approved for this campaign.');
          return;
        }
      }

      // DEBUG: Let's see if we reach here
      console.log('DEBUG: About to save merchant request for campaign:', campaign.id);
      
      // Add new request - save with merchantAddress as document ID for easy tracking
      const docRef = doc(db, 'merchant_campaign_requests', `${campaign.id}_${normalizedMerchantAddress}`);
      await setDoc(docRef, {
        id: `${campaign.id}_${normalizedMerchantAddress}`,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        merchantAddress: normalizedMerchantAddress,
        merchantName: merchantProfile?.businessName || merchantProfile?.name || 'Unnamed Merchant',
        businessType: merchantProfile?.businessType || '',
        status: 'pending',
        requestedAt: serverTimestamp()
      });

      console.log('DEBUG: Merchant request saved successfully!');
      toast.success(`Applied to "${campaign.title}"! Waiting for approval.`);
    } catch (error) {
      console.error('Error applying to campaign:', error);
      toast.error('Failed to apply: ' + error.message);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      setWithdrawing(true);

      // Build withdrawal transaction (send USDC back to merchant's wallet)
      const tx = await StellarService.buildDonationTransaction(
        publicKey,
        publicKey, // Send to self
        withdrawAmount
      );

      const signed = await StellarService.signTransaction(tx);
      const result = await StellarService.submitTransaction(signed);

      // Log withdrawal to Firebase
      await updateDoc(doc(db, 'merchant_profile', publicKey), {
        lastWithdrawal: result.transactionHash,
        lastWithdrawalAmount: withdrawAmount,
        lastWithdrawalDate: serverTimestamp()
      });

      toast.success(`✅ Withdrawal successful! Amount: ${withdrawAmount} USDC`);
      setWithdrawAmount('');
      setWithdrawing(false);
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Withdrawal failed: ' + error.message);
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-white">Merchant Dashboard</h1>
        <p className="text-white/60">Please connect your Freighter wallet</p>
        <FreighterConnect variant="default" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-12 right-12 w-80 h-80 bg-green-500/18 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-52 w-80 h-80 bg-green-400/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Merchant Dashboard</h1>
            {merchantProfile && (
              <p className="text-white/60 mt-2">{merchantProfile.businessName}</p>
            )}
          </div>
          <div className="flex gap-4">
            <FreighterConnect variant="outline" />
            <button
              onClick={() => {
                disconnect();
                setTimeout(() => navigate('/', { replace: true }), 50);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Current Balance</div>
            <div className="text-3xl font-bold text-green-400">${parseFloat(balance).toFixed(2)}</div>
            <p className="text-white/40 text-xs mt-2">USDC on Stellar</p>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Transactions</div>
            <div className="text-3xl font-bold text-blue-400">{transactions.length}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Verification Status</div>
            <div className="text-3xl font-bold text-emerald-400">
              {merchantProfile?.status === 'approved' ? '✅ Verified' : '⏳ Pending'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'overview'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'campaigns'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'withdraw'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Content */}
        {activeTab === 'campaigns' && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Available Campaigns</h2>
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <p className="text-white/40 text-center py-8">No active campaigns available right now</p>
              ) : (
                campaigns.map((campaign) => {
                  const existingRequest = merchantRequests.find((request) => request.campaignId === campaign.id);
                  const requestStatus = existingRequest?.status;

                  return (
                    <div key={campaign.id} className="bg-white/5 p-6 rounded-lg border border-white/10 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                        <p className="text-white/60 text-sm mt-1">{campaign.description}</p>
                        <p className="text-white/40 text-xs mt-2">📍 {campaign.location || 'Location not specified'}</p>
                        <p className="text-white/40 text-xs">🎯 Goal: ${(campaign.goal || 0).toLocaleString()}</p>
                        <p className="text-white/40 text-xs">Status: {campaign.status || 'unknown'}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-start md:items-end">
                        {campaign.status === 'active' && (
                          <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30">
                            🟢 Active
                          </span>
                        )}
                        {campaign.status === 'pending' && (
                          <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30">
                            ⏳ Pending Approval
                          </span>
                        )}
                        {campaign.status === 'paused' && (
                          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm border border-yellow-500/30">
                            ⏸ Paused
                          </span>
                        )}
                        {requestStatus === 'approved' && (
                          <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30">
                            ✓ Approved
                          </span>
                        )}
                        {requestStatus === 'pending' && (
                          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm border border-yellow-500/30">
                            ⏳ Pending Request
                          </span>
                        )}
                        {requestStatus === 'rejected' && (
                          <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
                            ✗ Rejected
                          </span>
                        )}
                        <button
                          onClick={() => handleApplyToCampaign(campaign)}
                          disabled={campaign.status === 'rejected' || requestStatus === 'pending' || requestStatus === 'approved'}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {requestStatus === 'approved' ? 'Joined' : requestStatus === 'pending' ? 'Requested' : 'Apply to Join'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && merchantProfile && (
          <div className="glass-card border border-white/20 rounded-xl p-8 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Business Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-white/60 text-sm">Business Name</p>
                <p className="text-white text-lg font-semibold">{merchantProfile.businessName}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Business Type</p>
                <p className="text-white text-lg font-semibold">{merchantProfile.businessType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Email</p>
                <p className="text-white text-lg font-semibold">{merchantProfile.email}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Contact Number</p>
                <p className="text-white text-lg font-semibold">{merchantProfile.contactNumber || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-white/60 text-sm">Stellar Address</p>
                <p className="text-green-400 text-sm font-mono break-all">{publicKey}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {transactions.length === 0 ? (
                <p className="text-white/40 text-center py-8">No transactions yet</p>
              ) : (
                transactions.map(trans => (
                  <div key={trans.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold">${trans.amount || '0'}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            trans.verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {trans.verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">From: {trans.beneficiaryAddress?.slice(0, 10)}...{trans.beneficiaryAddress?.slice(-4)}</p>
                        <p className="text-white/40 text-xs">
                          {trans.timestamp?.toDate?.() 
                            ? new Date(trans.timestamp.toDate()).toLocaleString()
                            : 'Unknown date'
                          }
                        </p>
                      </div>
                      {trans.txHash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${trans.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="glass-card border border-white/20 rounded-xl p-8 bg-white/5 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Withdraw Funds</h2>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm block mb-2">Amount to Withdraw (USDC)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                  />
                  <button
                    onClick={() => setWithdrawAmount(balance)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Max
                  </button>
                </div>
                <p className="text-white/40 text-xs mt-2">Available: ${parseFloat(balance).toFixed(2)}</p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
              >
                {withdrawing ? '⏳ Processing...' : '💳 Withdraw to My Wallet'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .glass-card {
          box-shadow: 0 8px 32px 0 rgba(16, 185, 129, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
      `}</style>
    </div>
  );
}
