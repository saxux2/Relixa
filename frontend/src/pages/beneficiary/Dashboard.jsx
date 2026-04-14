import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useStellarWalletContext } from '../../contexts/StellarWalletContext';
import StellarService from '../../services/StellarService';
import FreighterConnect from '../../components/FreighterConnect';
import toast from 'react-hot-toast';

export default function BeneficiaryDashboard() {
  const { publicKey, isConnected, balance, refreshBalance, disconnect } = useStellarWalletContext();
  const navigate = useNavigate();
  const [beneficiaryData, setBeneficiaryData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [spendingHistory, setSpendingHistory] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [merchantRequests, setMerchantRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [pending, setPending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Independent campaign loading - always loads active campaigns
  useEffect(() => {
    const campaignsRef = collection(db, 'campaigns');
    const unsubscribe = onSnapshot(campaignsRef, (snapshot) => {
      const allCampaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Raw campaign data:', allCampaigns);
      const activeOnes = allCampaigns.filter(c => c.status === 'active');
      console.log('Filtered active campaigns:', activeOnes.length);
      setCampaigns(activeOnes);
    });
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!db || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      // Load beneficiary profile via onSnapshot (support both lowercase and exact wallet doc ids)
      const lowerUserRef = doc(db, 'users', publicKey.toLowerCase());
      const exactUserRef = doc(db, 'users', publicKey);
      const lowerUserSnap = await getDoc(lowerUserRef);
      const exactUserSnap = lowerUserSnap.exists() ? null : await getDoc(exactUserRef);
      const userRefToWatch = lowerUserSnap.exists() ? lowerUserRef : exactUserSnap?.exists() ? exactUserRef : null;

      const unsubscribeUser = userRefToWatch
        ? onSnapshot(userRefToWatch, (docSnap) => {
            if (docSnap.exists()) {
              setBeneficiaryData(docSnap.data());
              setLoading(false);
            } else {
              setLoading(false);
              toast.error('Beneficiary profile not found. Please complete registration.');
            }
          })
        : () => {};

      if (!userRefToWatch) {
        setLoading(false);
        toast.error('Beneficiary profile not found. Please register first.');
      }

      // Campaigns are loaded via independent useEffect above

      // Load spending history
      const spendingRef = collection(db, 'spending');
      const spendingQuery = query(spendingRef, where('beneficiaryAddress', '==', publicKey));
      const unsubscribeSpending = onSnapshot(spendingQuery, (snapshot) => {
        const spendingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSpendingHistory(spendingData.sort((a, b) => 
          new Date(b.timestamp?.toDate?.() || b.timestamp) - 
          new Date(a.timestamp?.toDate?.() || a.timestamp)
        ));
      });

      // Load merchants
      const merchantsRef = collection(db, 'merchant_profile');
      const unsubscribeMerchants = onSnapshot(merchantsRef, (snapshot) => {
        const merchantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMerchants(merchantsData.filter(m => m.status === 'approved'));
      });

      // Load merchant campaign requests for campaigns visible to this beneficiary
      const requestsRef = collection(db, 'merchant_campaign_requests');
      const unsubscribeMerchantRequests = onSnapshot(requestsRef, (snapshot) => {
        const requestData = snapshot.docs.map((requestDoc) => ({ id: requestDoc.id, ...requestDoc.data() }));
        const sortedRequests = requestData.sort((a, b) => {
          const aTime = a.requestedAt?.toDate?.() || a.requestedAt || 0;
          const bTime = b.requestedAt?.toDate?.() || b.requestedAt || 0;
          return new Date(bTime) - new Date(aTime);
        });

        setMerchantRequests(sortedRequests);
      });

      setLoading(false);

      return () => {
        unsubscribeUser();
        unsubscribeCampaigns();
        unsubscribeSpending();
        unsubscribeMerchants();
        unsubscribeMerchantRequests();
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

  const handleSpendAtMerchant = async () => {
    if (!selectedMerchant || !spendAmount || parseFloat(spendAmount) <= 0) {
      toast.error('Please select merchant and enter valid amount');
      return;
    }

    try {
      setSpending(true);

      // Build transaction to merchant
      const tx = await StellarService.buildDonationTransaction(
        publicKey,
        selectedMerchant.stellarAddress,
        spendAmount
      );

      const signed = await StellarService.signTransaction(tx);
      const result = await StellarService.submitTransaction(signed);

      // Log spending to Firebase
      await addDoc(collection(db, 'spending'), {
        beneficiaryAddress: publicKey,
        merchantAddress: selectedMerchant.stellarAddress,
        merchantName: selectedMerchant.businessName,
        amount: spendAmount,
        txHash: result.transactionHash,
        timestamp: serverTimestamp(),
        network: 'stellar-testnet',
        status: 'completed'
      });

      toast.success(`✅ Payment of ${spendAmount} USDC sent to ${selectedMerchant.businessName}`);
      setSpendAmount('');
      setSelectedMerchant(null);
      setShowSpendModal(false);
      await refreshBalance();
      setSpending(false);
    } catch (error) {
      console.error('Error spending:', error);
      toast.error('Payment failed: ' + error.message);
      setSpending(false);
    }
  };

  const handleApplyToCampaign = async (campaignId) => {
    try {
      if (!publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Check if already applied to this campaign
      if (beneficiaryData?.campaignId === campaignId && beneficiaryData?.status === 'pending') {
        toast.error('Already applied to this campaign. Wait for approval.');
        return;
      }

      // Check if already approved
      if (beneficiaryData?.status === 'approved') {
        toast.error('You are already approved for a campaign.');
        return;
      }

      setPending(true);
      const userId = publicKey.toLowerCase();
      
      // Get campaign details
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      
      if (!campaignSnap.exists()) {
        toast.error('Campaign not found');
        return;
      }

      const campaignData = campaignSnap.data();

      // Update users collection
      await setDoc(doc(db, 'users', userId), {
        campaignId: campaignId,
        status: 'pending',
        role: 'beneficiary',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update beneficiary_profile collection
      await setDoc(doc(db, 'beneficiary_profile', userId), {
        campaignId: campaignId,
        status: 'pending',
        appliedAt: serverTimestamp()
      }, { merge: true });

      // Add to beneficiaries collection for organizer dashboard
      await setDoc(doc(db, 'beneficiaries', userId), {
        campaignId: campaignId,
        campaignTitle: campaignData.title,
        beneficiaryAddress: publicKey,
        beneficiaryName: beneficiaryData?.name || 'Anonymous',
        status: 'pending',
        appliedAt: serverTimestamp()
      }, { merge: true });

      toast.success(`Applied to "${campaignData.title}"! Waiting for approval.`);
      
      // Force refresh to show "Applied" status
      window.location.reload();
    } catch (error) {
      console.error('Error applying to campaign:', error);
      toast.error('Failed to apply. Try again.');
    } finally {
      setPending(false);
    }
  };

  const handleApproveMerchantRequest = async (requestId, merchantAddress, campaignId) => {
    try {
      // Update merchant_campaign_requests collection
      await updateDoc(doc(db, 'merchant_campaign_requests', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: publicKey
      });

      // Update merchant_profile to link to campaign
      await updateDoc(doc(db, 'merchant_profile', merchantAddress), {
        campaignId: campaignId,
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      toast.success('✅ Merchant request approved successfully!');
    } catch (error) {
      console.error('Error approving merchant request:', error);
      toast.error('Failed to approve merchant: ' + error.message);
    }
  };

  const handleRejectMerchantRequest = async (requestId, merchantName) => {
    const reason = prompt(`Reject ${merchantName}?\n\nOptionally enter a reason for rejection:`);
    
    // User clicked cancel
    if (reason === null) return;

    try {
      // Update merchant_campaign_requests collection
      await updateDoc(doc(db, 'merchant_campaign_requests', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: publicKey,
        rejectionReason: reason || 'No reason provided'
      });

      toast.success(`❌ ${merchantName} request has been rejected`);
    } catch (error) {
      console.error('Error rejecting merchant request:', error);
      toast.error('Failed to reject merchant: ' + error.message);
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
        <h1 className="text-3xl font-bold text-white">Beneficiary Dashboard</h1>
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
            <h1 className="text-4xl font-bold text-white">Beneficiary Dashboard</h1>
            {beneficiaryData && (
              <p className="text-white/60 mt-2">{beneficiaryData.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Current Balance</div>
            <div className="text-3xl font-bold text-green-400">${parseFloat(balance).toFixed(2)}</div>
            <p className="text-white/40 text-xs mt-2">USDC Available</p>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Campaigns Assigned</div>
            <div className="text-3xl font-bold text-blue-400">
              {beneficiaryData?.campaignId ? 1 : 0}
            </div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Spending Transactions</div>
            <div className="text-3xl font-bold text-purple-400">{spendingHistory.length}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Spent</div>
            <div className="text-3xl font-bold text-emerald-400">
              ${spendingHistory.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0).toFixed(2)}
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
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('spend')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'spend'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Spend Funds
          </button>
          <button
            onClick={() => setActiveTab('merchantRequests')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'merchantRequests'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Merchant Requests ({merchantRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            History ({spendingHistory.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && beneficiaryData && (
          <div className="glass-card border border-white/20 rounded-xl p-8 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Beneficiary Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-white/60 text-sm">Full Name</p>
                <p className="text-white text-lg font-semibold">{beneficiaryData.name}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Email</p>
                <p className="text-white text-lg font-semibold">{beneficiaryData.email}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Phone Number</p>
                <p className="text-white text-lg font-semibold">{beneficiaryData.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Location</p>
                <p className="text-white text-lg font-semibold">{beneficiaryData.location || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-white/60 text-sm">Stellar Wallet Address</p>
                <p className="text-green-400 text-sm font-mono break-all">{publicKey}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="glass-card border border-white/20 rounded-xl p-8 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-2">Available Relief Campaigns</h2>
            <p className="text-white/50 text-sm mb-2">Admin-approved campaigns you can join</p>
            <p className="text-yellow-300 text-xs mb-4">Debug: {campaigns.length} active campaigns | Status: {beneficiaryData?.status || 'not found'}</p>
            
            {beneficiaryData?.status === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-lg mb-6 text-sm">
                ⏳ Your application is currently pending approval. You can apply to a different campaign if you wish to switch.
              </div>
            )}
            {(beneficiaryData?.status === 'approved' || beneficiaryData?.allocationStatus === 'allocated') && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-6 text-sm">
                ✅ You are already approved and locked into your campaign. You cannot apply to other campaigns.
              </div>
            )}
            
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-green-500/30 transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                          ✓ Admin Approved
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mt-2 mb-3">{campaign.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-white/40">📍 Location</span>
                          <p className="text-white/80">{campaign.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-white/40">🎯 Goal</span>
                          <p className="text-white/80">${(campaign.goal || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-white/40">💰 Raised</span>
                          <p className="text-green-400 font-semibold">${(campaign.raised || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {campaign.organizerName && (
                        <p className="text-white/40 text-xs mt-3">
                          🏢 Organized by: <span className="text-white/60">{campaign.organizerName}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end whitespace-nowrap gap-2">
                      {(beneficiaryData?.campaignId === campaign.id || pending) ? (
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold border border-green-500/30">
                          {pending ? 'Applying...' : '✓ You Applied'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyToCampaign(campaign.id)}
                          disabled={pending || beneficiaryData?.status === 'approved'}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                          {pending ? 'Applying...' : 'Apply to Join'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-white/40 text-lg">Loading campaigns or none available...</p>
                  <p className="text-white/30 text-sm mt-2">Campaign status must be "active" after admin approval</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'spend' && (
          <div className="glass-card border border-white/20 rounded-xl p-8 bg-white/5 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Spend at Merchants</h2>
            
            {parseFloat(balance) === 0 ? (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-300 text-sm">No funds available. Wait for campaign organizer to allocate funds.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm block mb-2">Select Merchant</label>
                  <select
                    value={selectedMerchant?.id || ''}
                    onChange={(e) => {
                      const merchant = merchants.find(m => m.id === e.target.value);
                      setSelectedMerchant(merchant);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Choose a merchant...</option>
                    {merchants.map(merchant => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.businessName} ({merchant.businessType || 'Store'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">Amount to Spend (USDC)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={spendAmount}
                      onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                    />
                    <button
                      onClick={() => setSpendAmount(balance)}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Max
                    </button>
                  </div>
                  <p className="text-white/40 text-xs mt-2">Available: ${parseFloat(balance).toFixed(2)}</p>
                </div>

                <button
                  onClick={handleSpendAtMerchant}
                  disabled={spending || !selectedMerchant || !spendAmount}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  {spending ? '⏳ Processing...' : '💰 Send Payment'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'merchantRequests' && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Merchant Join Requests</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {merchantRequests.length === 0 ? (
                <p className="text-white/40 text-center py-8">No merchant requests yet</p>
              ) : (
                merchantRequests.map((request) => (
                  <div key={request.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{request.merchantName || request.merchantProfile?.businessName || 'Unnamed Merchant'}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : request.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {request.status === 'approved' ? '✓ Approved' : request.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-blue-400 text-sm">Campaign: {request.campaignTitle || 'Unknown Campaign'}</p>
                        <p className="text-white/60 text-sm">Type: {request.businessType || request.merchantProfile?.businessType || 'Not specified'}</p>
                        <p className="text-white/60 text-sm">Email: {request.merchantEmail || request.merchantProfile?.email || 'N/A'}</p>
                        <p className="text-white/60 text-sm">Phone: {request.merchantPhone || request.merchantProfile?.contactNumber || 'N/A'}</p>
                        <p className="text-white/40 text-xs mt-2 font-mono break-all">Wallet: {request.merchantAddress}</p>
                        {(request.merchantCategories?.length > 0 || request.merchantProfile?.categories?.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(request.merchantCategories?.length > 0 ? request.merchantCategories : request.merchantProfile?.categories).map((category) => (
                              <span key={`${request.id}-${category}`} className="px-2 py-0.5 bg-white/10 text-white/80 rounded text-xs">
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApproveMerchantRequest(request.id, request.merchantAddress, request.campaignId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectMerchantRequest(request.id, request.merchantName || request.merchantProfile?.businessName || 'Merchant')}
                            className="bg-red-600/80 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm transition-all"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Spending History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {spendingHistory.length === 0 ? (
                <p className="text-white/40 text-center py-8">No spending transactions yet</p>
              ) : (
                spendingHistory.map(trans => (
                  <div key={trans.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold">${trans.amount || '0'}</p>
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                            ✓ Completed
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">Merchant: {trans.merchantName || 'Unknown'}</p>
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
                          View TX
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
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
