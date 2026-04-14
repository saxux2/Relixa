'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    // Check localStorage for wallet connection
    const storedKey = localStorage.getItem('stellarPublicKey');
    if (storedKey) {
      setAddress(storedKey);
      setIsConnected(true);
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
    localStorage.removeItem('stellarPublicKey');
  };

  const handleGoToDashboard = async () => {
    if (!isConnected || !address) return;
    // For now, just redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Floating Dots Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(180)].map((_, i) => {
          const size = 2 + Math.random() * 3;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-green-500/30"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          );
        })}
      </div>

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

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white">
              How It Works
            </a>
            <a href="#about" className="text-sm text-gray-400 hover:text-white">
              About
            </a>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <button
                  onClick={handleDisconnectWallet}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  Disconnect
                </button>
                <button
                  onClick={handleGoToDashboard}
                  className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700"
                >
                  Go to Dashboard
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

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm text-green-400">Built on Stellar Blockchain</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
            Disaster Relief
            <br />
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
            A decentralized platform for transparent disaster relief. Connect your wallet, donate USDC, and help those in need with complete transaction transparency.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-semibold text-white hover:from-green-600 hover:to-green-700 sm:w-auto"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-semibold text-white hover:from-green-600 hover:to-green-700 sm:w-auto"
              >
                Connect Wallet
              </button>
            )}
            <a
              href="#how-it-works"
              className="w-full rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-4xl font-bold text-white">
            Why <span className="text-green-500">Relixa</span>?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '🔗',
                title: 'Blockchain Transparency',
                description: 'Every transaction is recorded on the Stellar blockchain, ensuring complete transparency and immutability.',
              },
              {
                icon: '💸',
                title: 'USDC Stablecoin',
                description: 'Donations are made in USDC stablecoin, eliminating volatility and ensuring your full donation reaches recipients.',
              },
              {
                icon: '✅',
                title: 'Verified Campaigns',
                description: 'All campaigns are verified and monitored, preventing fraud and ensuring funds are used for intended purposes.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-green-500/30"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-4xl font-bold text-white">How It Works</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Link your Freighter wallet to get started. No complex setup required.',
              },
              {
                step: '02',
                title: 'Donate USDC',
                description: 'Donate USDC stablecoin which converts to RELIEF tokens at 1:1 rate.',
              },
              {
                step: '03',
                title: 'Help Those in Need',
                description: 'Your donation goes to verified campaigns and reaches affected families.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-green-500/30"
              >
                <span className="mb-4 block text-6xl font-bold text-green-500/20">{item.step}</span>
                <h3 className="mb-3 text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-8 text-4xl font-bold text-white">About Relixa</h2>
          <p className="text-lg text-gray-400">
            Relixa is a decentralized disaster relief platform built on Stellar blockchain. 
            We enable transparent and secure fund distribution to affected communities through 
            smart contracts, ensuring every donation reaches those who need it most.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/50 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-green-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-semibold text-white">Relixa</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 Relixa. Built on Stellar Blockchain.</p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
