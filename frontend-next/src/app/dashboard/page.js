'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [donationAmount, setDonationAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [donations, setDonations] = useState([]);

  // Mock campaigns
  const [campaigns] = useState([
    { id: '1', title: 'Kerala Flood Relief', stellarAddress: 'GCYZHL2NVJK3A5DXG4D3H4T5VF6RQJ7UBN3J6NXD64P3TIAELMLG5K7U', goal: '50000', raised: '25000' },
    { id: '2', title: 'Nepal Earthquake Aid', stellarAddress: 'GDXYZHL2NVJK3A5DXG4D3H4T5VF6RQJ7UBN3J6NXD64P3TIAELMLG5K7V', goal: '75000', raised: '40000' },
    { id: '3', title: 'Philippines Typhoon Recovery', stellarAddress: 'GEABCHL2NVJK3A5DXG4D3H4T5VF6RQJ7UBN3J6NXD64P3TIAELMLG5K7W', goal: '100000', raised: '15000' },
  ]);

  useEffect(() => {
    // Check wallet connection
    const storedKey = localStorage.getItem('stellarPublicKey');
    if (storedKey) {
      setAddress(storedKey);
      setIsConnected(true);
    } else {
      window.location.href = '/';
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.freighterApi) {
        const publicKey = await window.freighterApi.getPublicKey();
        setAddress(publicKey);
        setIsConnected(true);
        localStorage.setItem('stellarPublicKey', publicKey);
      } else {
        alert('Please install Freighter wallet from https://freighter.app');
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect wallet');
    }
  };

  const handleDisconnectWallet = () => {
    setAddress('');
    setIsConnected(false);
    setBalance('0');
    localStorage.removeItem('stellarPublicKey');
    window.location.href = '/';
  };

  const handleDonate = async (campaign) => {
    try {
      if (!donationAmount || parseFloat(donationAmount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (!isConnected) {
        alert('Please connect your wallet');
        return;
      }

      setIsProcessing(true);
      setError('');
      setTxHash('');

      // For demo purposes, just simulate a transaction
      // In production, this would use Stellar SDK to build and submit the transaction
      const mockTxHash = 'TX' + Math.random().toString(36).substring(2, 15).toUpperCase();
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTxHash(mockTxHash);
      setDonationAmount('');

      // Add to donations list
      setDonations(prev => [...prev, {
        id: Date.now(),
        campaign: campaign.title,
        amount: donationAmount,
        txHash: mockTxHash,
        timestamp: new Date().toLocaleString()
      }]);

      alert(`✅ Donation of ${donationAmount} USDC to ${campaign.title} successful!`);

    } catch (err) {
      setError(err.message || 'Donation failed');
      console.error('Donation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-2xl font-bold text-transparent">
              Relixa
            </span>
          </a>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <span className="text-sm text-gray-400">
                  {address.substring(0, 8)}...{address.substring(address.length - 8)}
                </span>
                <button
                  onClick={handleDisconnectWallet}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          {/* Stats */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-gray-400 mb-2">Your Balance</p>
              <p className="text-3xl font-bold text-white">{balance} <span className="text-sm text-gray-400">USDC</span></p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-gray-400 mb-2">Total Donated</p>
              <p className="text-3xl font-bold text-green-500">{donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toFixed(2)} <span className="text-sm text-gray-400">USDC</span></p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-gray-400 mb-2">Campaigns Supported</p>
              <p className="text-3xl font-bold text-blue-500">{new Set(donations.map(d => d.campaign)).size}</p>
            </div>
          </div>

          {/* Campaigns */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Active Campaigns</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-green-500/30 transition-all">
                  <h3 className="text-xl font-semibold text-white mb-4">{campaign.title}</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Raised: ${campaign.raised}</span>
                      <span>Goal: ${campaign.goal}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount USDC"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleDonate(campaign)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                    >
                      {isProcessing ? '...' : 'Donate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Result */}
          {txHash && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <p className="text-green-400 text-sm">✅ Transaction successful!</p>
              <p className="text-green-400 text-xs mt-1 font-mono break-all">{txHash}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Donation History */}
          {donations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Donation History</h2>
              <div className="space-y-3">
                {donations.map(donation => (
                  <div key={donation.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="font-semibold text-white">{donation.campaign}</p>
                      <p className="text-xs text-gray-400">{donation.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-semibold">{donation.amount} USDC</p>
                      <p className="text-xs text-gray-400 font-mono">{donation.txHash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
