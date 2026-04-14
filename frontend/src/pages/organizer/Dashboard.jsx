import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useStellarWalletContext } from '../../contexts/StellarWalletContext';
import FreighterConnect from '../../components/FreighterConnect';
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    location: '',
    deadline: '',
    beneficiaryCount: ''
  });

  const { publicKey, isConnected, disconnect } = useStellarWalletContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    loadData();
  }, [publicKey, isConnected]);

  const loadData = async () => {
    if (!db || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      // Load organizer's campaigns
      const campaignsRef = collection(db, 'campaigns');
      const campaignsQuery = query(campaignsRef, where('organizerAddress', '==', publicKey));
      
      const unsubscribeCampaigns = onSnapshot(campaignsQuery, async (snapshot) => {
        const campaignData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCampaigns(campaignData);

        // Load beneficiaries for campaigns
        if (campaignData.length > 0) {
          const allBeneficiaries = [];
          for (const campaign of campaignData) {
            const beneficiariesRef = collection(db, 'beneficiaries');
            const beneficiariesQuery = query(
              beneficiariesRef,
              where('campaignId', '==', campaign.id)
            );
            
            const snapshot = await new Promise((resolve) => {
              onSnapshot(beneficiariesQuery, resolve);
            });

            snapshot.docs.forEach(doc => {
              allBeneficiaries.push({
                id: doc.id,
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                ...doc.data()
              });
            });
          }
          setBeneficiaries(allBeneficiaries);
        } else {
          setBeneficiaries([]);
        }
      });

      setLoading(false);

      return () => {
        unsubscribeCampaigns();
      };
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const resetForm = () => ({
    title: '',
    description: '',
    goal: '',
    location: '',
    deadline: '',
    beneficiaryCount: ''
  });

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.goal || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setSuccess(false);

    try {
      const campaignData = {
        title: formData.title,
        description: formData.description,
        goal: parseFloat(formData.goal),
        location: formData.location || '',
        deadline: formData.deadline,
        organizerAddress: publicKey,
        status: 'pending',
        raised: 0,
        createdAt: serverTimestamp(),
        network: 'stellar-testnet'
      };

      const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
      
      setSuccess(true);
      toast.success(`✅ Campaign submitted for approval!`);
      
      setFormData(resetForm());
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setCreating(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const handleAllocateFunds = async (beneficiaryId, amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
      
      await updateDoc(doc(db, 'beneficiaries', beneficiaryId), {
        allocationAmount: parseFloat(amount),
        allocationStatus: 'allocated',
        allocatedBy: publicKey,
        allocatedAt: serverTimestamp()
      });

      toast.success(`✅ ${parseFloat(amount)} USDC allocated to ${beneficiary.name}`);
    } catch (error) {
      console.error('Error allocating funds:', error);
      toast.error('Failed to allocate funds');
    }
  };

  const handlePauseCampaign = async (campaignId) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        status: 'paused',
        pausedAt: serverTimestamp()
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
        status: 'active',
        resumedAt: serverTimestamp()
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
        <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
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
          <h1 className="text-4xl font-bold text-white">Organizer Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              + Create Campaign
            </button>
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
            <div className="text-white/60 text-sm">Active Campaigns</div>
            <div className="text-3xl font-bold text-green-400">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Beneficiaries</div>
            <div className="text-3xl font-bold text-blue-400">{beneficiaries.length}</div>
          </div>
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <div className="text-white/60 text-sm">Total Raised</div>
            <div className="text-3xl font-bold text-emerald-400">
              ${campaigns.reduce((sum, c) => sum + (c.raised || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Campaigns */}
        <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 mb-4">No campaigns yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                      <p className="text-white/60 text-sm mt-1">{campaign.description}</p>
                      <p className="text-white/40 text-xs mt-2">📍 {campaign.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      campaign.status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : campaign.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {campaign.status === 'active' ? '🟢 Active' : campaign.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-white/60 text-xs">Goal</p>
                      <p className="text-white font-semibold">${campaign.goal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Raised</p>
                      <p className="text-green-400 font-semibold">${(campaign.raised || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Progress</p>
                      <p className="text-white font-semibold">
                        {((campaign.raised || 0) / campaign.goal * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Deadline</p>
                      <p className="text-white font-semibold">{campaign.deadline}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                    <button
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        {beneficiaries.length > 0 && (
          <div className="glass-card border border-white/20 rounded-xl p-6 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Beneficiaries ({beneficiaries.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {beneficiaries.map(beneficiary => (
                <div key={beneficiary.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{beneficiary.name}</h4>
                      <p className="text-white/60 text-sm">{beneficiary.campaignTitle}</p>
                      <p className="text-white/40 text-xs">
                        {beneficiary.stellarAddress?.slice(0, 10)}...{beneficiary.stellarAddress?.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      {beneficiary.allocationStatus === 'allocated' && (
                        <p className="text-green-400 text-sm font-semibold">
                          ${beneficiary.allocationAmount} allocated
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-black border border-white/20 rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-white/60 text-sm block mb-2">Campaign Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                  placeholder="e.g., Flood Relief 2026"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                  placeholder="Describe the campaign..."
                  rows="3"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Goal Amount (USDC) *</label>
                <input
                  type="number"
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                  placeholder="e.g., 10000"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40"
                  placeholder="e.g., Kerala, India"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Deadline *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`flex-1 text-white px-4 py-2 rounded-lg font-semibold ${
                    success 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : creating 
                        ? 'bg-gray-600 cursor-wait' 
                        : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {success ? '✅ Created' : creating ? '⏳ Creating...' : '✅ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
