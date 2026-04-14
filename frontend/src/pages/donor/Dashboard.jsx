import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useStellarWalletContext } from '../../contexts/StellarWalletContext';
import StellarService from '../../services/StellarService';
import FreighterConnect from '../../components/FreighterConnect';
import StellarDonationFlow from '../../components/StellarDonationFlow';

export default function DonorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, campaignsSupported: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [xlmBalance, setXlmBalance] = useState('0.00');
  
  const { publicKey, isConnected, balance, refreshBalance, disconnect } = useStellarWalletContext();
  const navigate = useNavigate();

  // Load USDC and XLM balances from Stellar
  const loadBalances = async () => {
    if (!publicKey) return;
    
    try {
      const usdc = await StellarService.getUSDCBalance(publicKey);
      setUsdcBalance(usdc.toFixed(2));
      
      const xlm = await StellarService.getXLMBalance(publicKey);
      setXlmBalance(xlm.toFixed(2));
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  // Fetch campaigns and donations
  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }

    console.log('🌟 Stellar Donor Dashboard: Setting up listeners for', publicKey);

    let unsubscribeCampaigns;
    let unsubscribeDonations;

    const setupListeners = async () => {
      try {
        // Load balances
        await loadBalances();

        if (!db) {
          // Demo mode when Firebase is not configured
          setCampaigns([
            {
              id: 'demo-1',
              title: 'Flood Relief - Kerala',
              stellarAddress: 'GAAA...',
              goal: 50000,
              raised: 25000,
              location: 'Kerala, India',
              status: 'active'
            },
            {
              id: 'demo-2',
              title: 'Earthquake Recovery - Nepal',
              stellarAddress: 'GBBB...',
              goal: 100000,
              raised: 75000,
              location: 'Kathmandu, Nepal',
              status: 'active'
            }
          ]);
          setDonations([
            {
              id: 'demo-d1',
              campaignId: 'demo-1',
              campaignTitle: 'Flood Relief - Kerala',
              amount: 500,
              donorAddress: publicKey,
              txHash: 'demo_hash_123',
              createdAt: new Date()
            }
          ]);
          setStats({ totalDonated: 500, campaignsSupported: 1 });
          setLoading(false);
          return;
        }

        // Real-time campaigns listener
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(campaignsRef, where('status', '==', 'active'));
        unsubscribeCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
          const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('📋 Campaigns updated:', campaignsData.length);
          setCampaigns(campaignsData);
        });

        // Real-time donations listener
        const donationsRef = collection(db, 'donations');
        const donationsQuery = query(donationsRef, where('donorAddress', '==', publicKey));
        unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
          const donationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('💰 Donations updated:', donationsData.length);
          setDonations(donationsData);

          // Calculate stats
          const totalDonated = donationsData.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
          const uniqueCampaigns = new Set(donationsData.map(d => d.campaignId));
          setStats({ totalDonated, campaignsSupported: uniqueCampaigns.size });
        });

        setLoading(false);
      } catch (error) {
        console.error('❌ Error setting up listeners:', error);
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (unsubscribeCampaigns) unsubscribeCampaigns();
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, [publicKey]);

  const handleDisconnect = () => {
    disconnect();
    setTimeout(() => navigate('/', { replace: true }), 50);
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
        <h1 className="text-3xl font-bold text-white">Donor Dashboard</h1>
        <p className="text-white/60">Please connect your Freighter wallet</p>
        <FreighterConnect variant="default" />
      </div>
    );
  }

  // Get campaigns donor has donated to
  const donatedCampaignIds = new Set(donations.map(d => d.campaignId));
  const donatedCampaigns = campaigns.filter(c => donatedCampaignIds.has(c.id));
  const availableCampaigns = campaigns.filter(c => !donatedCampaignIds.has(c.id));

  return (
    <div className="min-h-screen h-screen bg-black relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-12 right-12 w-80 h-80 bg-green-500/18 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-16 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-52 w-80 h-80 bg-green-400/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
        
        {/* Small Floating Dots */}
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-float"
            style={{
              width: '3px',
              height: '3px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.2 + 0.05,
              animationDuration: `${Math.random() * 8 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <div className="fixed top-[20px] left-0 right-0 z-50 py-4 pointer-events-none px-4">
        <nav className="flex max-w-4xl mx-auto border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(255,255,255,0.1),0px_0px_0px_1px_rgba(255,255,255,0.05)] px-4 py-2 items-center justify-between relative pointer-events-auto">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/5 via-gray-100/10 to-white/5 rounded-3xl"></div>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-full w-8 h-8 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">Relixa</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-white/80 transition cursor-pointer text-base font-medium"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-white/80 transition cursor-pointer text-base font-medium"
            >
              About
            </button>
            <button
              className="text-white hover:text-white/80 transition cursor-pointer text-base font-medium"
            >
              Dashboard
            </button>
          </div>

          {/* Disconnect Button */}
          <div className="flex items-center">
            <button
              onClick={handleDisconnect}
              className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-full border border-white/10 transition-all"
            >
              Disconnect
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col pt-36 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Top Row - Wallet Info & Donation Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-4 flex-shrink-0">
          {/* Left Card - Wallet Information */}
          <div className="glass-card border border-white/20 rounded-3xl p-5 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all h-[200px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-3">Stellar Wallet</h2>
            <p className="text-white/60 text-xs font-mono mb-4 break-all">
              {publicKey || 'Not connected'}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  XLM Balance
                </h3>
                <p className="text-green-400 font-bold text-lg">{xlmBalance} XLM</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  USDC Balance
                </h3>
                <p className="text-blue-400 font-bold text-lg">${usdcBalance}</p>
              </div>
            </div>

            <button
              onClick={loadBalances}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm mt-auto flex-shrink-0"
            >
              🔄 Refresh Balance
            </button>
          </div>

          {/* Right Card - Donation Stats */}
          <div className="glass-card border border-white/20 rounded-3xl p-5 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all h-[200px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-2 flex-shrink-0">
              Total Donated: ${stats.totalDonated.toFixed(2)} USDC
            </h2>
            <p className="text-xs text-white/60 mb-3">From {donations.length} donation{donations.length !== 1 ? 's' : ''} to {stats.campaignsSupported} campaign{stats.campaignsSupported !== 1 ? 's' : ''}</p>
            
            <div className="mt-2 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-base font-semibold text-white mb-3 flex-shrink-0">My Donation History</h3>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {donations.length === 0 ? (
                  <p className="text-white/40 text-xs">No donations yet</p>
                ) : (
                  donations.slice(0, 5).map(donation => (
                    <div key={donation.id} className="flex justify-between items-center text-xs border-b border-white/10 pb-1">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-white/80 truncate mr-2">{donation.campaignTitle || 'Campaign'}</span>
                        {donation.txHash && (
                          <a
                            href={StellarService.getExplorerUrl(donation.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-[10px] whitespace-nowrap"
                          >
                            View TX ↗
                          </a>
                        )}
                      </div>
                      <span className="text-green-400 font-semibold whitespace-nowrap">${parseFloat(donation.amount).toFixed(2)} USDC</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stellar Network Info */}
        <div className="glass-card border border-white/20 rounded-3xl p-4 backdrop-blur-md bg-white/5 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm">Stellar Testnet</span>
              <span className="text-white/40 text-xs">|</span>
              <span className="text-white/60 text-xs">Connected via Freighter</span>
            </div>
            <a
              href={StellarService.getAccountExplorerUrl(publicKey)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              View Account on Stellar Expert ↗
            </a>
          </div>
        </div>

        {/* Available Campaigns */}
        <div className="glass-card border border-white/20 rounded-3xl p-5 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all mb-4 flex-shrink-0 overflow-hidden h-[200px] flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">Available Campaigns</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar flex-1">
            {availableCampaigns.length === 0 ? (
              <p className="text-white/40 col-span-full text-center py-8">No available campaigns</p>
            ) : (
              availableCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={() => {
                    setSelectedCampaign(campaign);
                    setDonateModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* My Donated Campaigns */}
        <div className="glass-card border border-white/20 rounded-3xl p-5 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all flex-shrink-0 overflow-hidden h-[200px] flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">My Donated Campaigns</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar flex-1">
            {donatedCampaigns.length === 0 ? (
              <p className="text-white/40 text-center py-8">You haven't donated to any campaigns yet</p>
            ) : (
              donatedCampaigns.map(campaign => {
                const userDonations = donations.filter(d => d.campaignId === campaign.id);
                const totalSupported = userDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;

                return (
                  <div key={campaign.id} className="glass-card border border-white/10 rounded-2xl p-3 bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-semibold text-white truncate mr-2">{campaign.title}</h3>
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-semibold text-xs whitespace-nowrap">You: ${totalSupported.toFixed(2)} USDC</span>
                        <span className="text-white/40 text-[10px] whitespace-nowrap">Total: ${campaign.raised?.toFixed(2) || 0} USDC</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>Goal: ${campaign.goal?.toFixed(1) || 0} USDC</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Donate Again Button */}
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setDonateModalOpen(true);
                      }}
                      className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
                    >
                      💝 Donate Again
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      {donateModalOpen && selectedCampaign && (
        <StellarDonationFlow
          campaign={selectedCampaign}
          onClose={() => {
            setDonateModalOpen(false);
            setSelectedCampaign(null);
            loadBalances(); // Refresh after donation
          }}
        />
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(5px);
          }
          50% {
            transform: translateY(-40px) translateX(-5px);
          }
          75% {
            transform: translateY(-20px) translateX(5px);
          }
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
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
      `}</style>
    </div>
  );
}

// Campaign Card Component
function CampaignCard({ campaign, onDonate }) {
  const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;

  return (
    <div className="glass-card border border-white/10 rounded-2xl p-3 bg-white/5 hover:bg-white/10 transition-all">
      <h3 className="text-white font-semibold mb-2 text-xs truncate">{campaign.title}</h3>
      {campaign.location && (
        <p className="text-white/40 text-[10px] mb-2">📍 {campaign.location}</p>
      )}
      <div className="mb-2">
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>${(campaign.raised || 0).toFixed(0)} / ${(campaign.goal || 0).toFixed(0)}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
      </div>
      <button
        onClick={onDonate}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-1.5 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
      >
        💝 Donate
      </button>
    </div>
  );
}
