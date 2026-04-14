import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { USER_STATUS, ROLES } from '../../firebase/constants';
import { useStellarWalletContext } from '../../contexts/StellarWalletContext';
import FreighterConnect from '../../components/FreighterConnect';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [beneficiaryApplications, setBeneficiaryApplications] = useState([]);
  const [campaignRequests, setCampaignRequests] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeCampaigns: 0,
    totalDonations: 0,
    organizers: 0,
    beneficiaries: 0,
    pendingMerchants: 0,
    verifiedMerchants: 0
  });
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const { publicKey, isConnected, disconnect } = useStellarWalletContext();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!db) {
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'organizer', status: 'pending', organization: 'Red Cross' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'beneficiary', status: 'approved' }
      ]);
      setCampaigns([
        { id: '1', title: 'Relief Campaign', status: 'active', raised: 5000, goal: 10000 }
      ]);
      setStats({
        totalUsers: 2,
        pendingApprovals: 1,
        activeCampaigns: 1,
        totalDonations: 5000,
        organizers: 1,
        beneficiaries: 1
      });
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);

        const pending = usersData.filter(u => u.status === USER_STATUS.PENDING && u.role !== ROLES.BENEFICIARY).length;
        const organizers = usersData.filter(u => u.role === ROLES.ORGANIZER && u.status === USER_STATUS.APPROVED).length;
        const beneficiaries = usersData.filter(u => u.role === ROLES.BENEFICIARY && u.status === USER_STATUS.APPROVED).length;

        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          pendingApprovals: pending,
          organizers,
          beneficiaries
        }));
      });

      const campaignsRef = collection(db, 'campaigns');
      const unsubscribeCampaigns = onSnapshot(campaignsRef, (snapshot) => {
        const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCampaigns(campaignsData);

        const active = campaignsData.filter(c => c.status === 'active').length;
        const totalRaised = campaignsData.reduce((sum, c) => sum + (c.raised || 0), 0);

        setStats(prev => ({
          ...prev,
          activeCampaigns: active,
          totalDonations: totalRaised
        }));
      });

      const merchantsRef = collection(db, 'merchant_profile');
      const unsubscribeMerchants = onSnapshot(merchantsRef, (snapshot) => {
        const merchantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMerchants(merchantsData);
        
        const pending = merchantsData.filter(m => m.status === USER_STATUS.PENDING).length;
        const verified = merchantsData.filter(m => m.status === USER_STATUS.APPROVED).length;
        
        setStats(prev => ({
          ...prev,
          pendingMerchants: pending,
          verifiedMerchants: verified
        }));
      });

      setLoading(false);

      const beneficiariesRef = collection(db, 'beneficiaries');
      const unsubscribeBeneficiaries = onSnapshot(beneficiariesRef, (snapshot) => {
        const beneficiaryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pendingApps = beneficiaryData.filter(b => b.status === 'pending');
        setBeneficiaryApplications(pendingApps);
      });

      const requestsRef = collection(db, 'merchant_campaign_requests');
      const unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Merchant requests:', requestsData);
        setCampaignRequests(requestsData);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeCampaigns();
        unsubscribeMerchants();
        if (unsubscribeBeneficiaries) unsubscribeBeneficiaries();
        if (unsubscribeRequests) unsubscribeRequests();
      };
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleApproveUser = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      setApproving(userId);
      
      await updateDoc(doc(db, 'users', userId), {
        status: USER_STATUS.APPROVED,
        approvedAt: serverTimestamp(),
        approvedBy: publicKey
      });
      
      toast.success(`✅ ${user.name} approved!`);
      setApproving(null);
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
      setApproving(null);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      
      await updateDoc(doc(db, 'users', userId), {
        status: USER_STATUS.REJECTED,
        rejectedAt: serverTimestamp(),
        rejectedBy: publicKey
      });
      
      toast.success('User rejected');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  const handleApproveBeneficiary = async (beneficiaryId) => {
    try {
      await updateDoc(doc(db, 'beneficiaries', beneficiaryId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: publicKey
      });
      toast.success('Beneficiary approved!');
    } catch (error) {
      console.error('Error approving beneficiary:', error);
      toast.error('Failed to approve');
    }
  };

  const handleApproveMerchantRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'merchant_campaign_requests', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: publicKey
      });
      toast.success('Merchant request approved!');
    } catch (error) {
      console.error('Error approving merchant request:', error);
      toast.error('Failed to approve');
    }
  };

  const handleApproveMerchant = async (merchantId) => {
    try {
      const merchant = merchants.find(m => m.id === merchantId);
      setApproving(merchantId);
      
      await updateDoc(doc(db, 'merchant_profile', merchantId), {
        status: USER_STATUS.APPROVED,
        approvedAt: serverTimestamp(),
        approvedBy: publicKey
      });
      
      toast.success(`✅ ${merchant.businessName} approved!`);
      setApproving(null);
    } catch (error) {
      console.error('Error approving merchant:', error);
      toast.error('Failed to approve merchant');
      setApproving(null);
    }
  };

  const handleRejectMerchant = async (merchantId) => {
    try {
      const merchant = merchants.find(m => m.id === merchantId);
      
      await updateDoc(doc(db, 'merchant_profile', merchantId), {
        status: USER_STATUS.REJECTED,
        rejectedAt: serverTimestamp(),
        rejectedBy: publicKey
      });
      
      toast.success('Merchant rejected');
    } catch (error) {
      console.error('Error rejecting merchant:', error);
      toast.error('Failed to reject merchant');
    }
  };

  const handlePauseCampaign = async (campaignId) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        status: 'paused'
      });
      toast.success('Campaign paused');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        status: 'active'
      });
      toast.success('Campaign resumed');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast.error('Failed to resume campaign');
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
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/60">Please connect your Freighter wallet to continue</p>
        <FreighterConnect variant="default" />
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === USER_STATUS.PENDING && u.role !== ROLES.BENEFICIARY);
  const pendingMerchants = merchants.filter(m => m.status === USER_STATUS.PENDING);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-12 right-12 w-80 h-80 bg-green-500/18 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-52 w-80 h-80 bg-green-400/15 rounded-full blur-3xl"></div>
        
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-float"
            style={{
              width: '3px',
              height: '3px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.2 + 0.05,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <FreighterConnect variant="default" />
            <button
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Users</div>
            <div className="text-3xl font-bold text-green-400">{stats.totalUsers}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Pending Approvals</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.pendingApprovals}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Active Campaigns</div>
            <div className="text-3xl font-bold text-blue-400">{stats.activeCampaigns}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Donations</div>
            <div className="text-3xl font-bold text-emerald-400">${stats.totalDonations.toLocaleString()}</div>
          </div>
        </div>

        {beneficiaryApplications.length > 0 && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Beneficiary Campaign Applications ({beneficiaryApplications.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {beneficiaryApplications.map(ben => (
                <div key={ben.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{ben.beneficiaryAddress?.slice(0, 8)}...</h3>
                    <p className="text-white/60 text-sm">Campaign: {ben.campaignTitle}</p>
                    <p className="text-yellow-400 text-xs">Status: {ben.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveBeneficiary(ben.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {campaignRequests.length > 0 && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Merchant Campaign Requests ({campaignRequests.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {campaignRequests.map(req => (
                <div key={req.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{req.merchantName}</h3>
                    <p className="text-white/60 text-sm">Campaign: {req.campaignTitle}</p>
                    <p className="text-yellow-400 text-xs">Status: {req.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleApproveMerchantRequest(req.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingUsers.length > 0 && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Pending User Approvals ({pendingUsers.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{user.name}</h3>
                    <p className="text-white/60 text-sm">{user.email}</p>
                    <p className="text-white/40 text-xs">Role: {user.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      disabled={approving === user.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      {approving === user.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectUser(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingMerchants.length > 0 && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Pending Merchant Approvals ({pendingMerchants.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {pendingMerchants.map(merchant => (
                <div key={merchant.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{merchant.businessName}</h3>
                    <p className="text-white/60 text-sm">{merchant.email}</p>
                    <p className="text-white/40 text-xs">{merchant.businessType || 'Store'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveMerchant(merchant.id)}
                      disabled={approving === merchant.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      {approving === merchant.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectMerchant(merchant.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
          <h2 className="text-2xl font-bold text-white mb-4">Campaign Management</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {campaigns.length === 0 ? (
              <p className="text-white/40 text-center py-8">No campaigns yet</p>
            ) : (
              campaigns.map(campaign => (
                <div key={campaign.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{campaign.title}</h3>
                    <p className="text-white/60 text-sm">
                      Status: <span className={campaign.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>{campaign.status}</span>
                    </p>
                    <p className="text-white/40 text-xs">
                      Raised: ${(campaign.raised || 0).toLocaleString()} / ${(campaign.goal || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {campaign.status === 'active' ? (
                      <button
                        onClick={() => handlePauseCampaign(campaign.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResumeCampaign(campaign.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(5px); }
          50% { transform: translateY(-40px) translateX(-5px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
        .animate-float {
          animation: float linear infinite;
        }
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
