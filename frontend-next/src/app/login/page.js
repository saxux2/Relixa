'use client';
import { useState } from 'react';

export default function Login() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      if (typeof window !== 'undefined' && window.freighterApi) {
        const publicKey = await window.freighterApi.getPublicKey();
        localStorage.setItem('stellarPublicKey', publicKey);
        
        // Check if user exists in system (for now, just redirect to dashboard)
        window.location.href = '/dashboard';
      } else {
        alert('Please install Freighter wallet from https://freighter.app');
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-2xl font-bold text-transparent">
              Relixa
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Connect your wallet to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-6 p-6 bg-green-500/10 rounded-xl border border-green-500/30">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-lg font-semibold text-white mb-2">Connect Freighter Wallet</h3>
                <p className="text-sm text-gray-400">
                  Use your Stellar wallet to authenticate and access your account.
                </p>
              </div>

              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  'Connect Freighter Wallet'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Don't have Freighter?{' '}
                <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                  Download here
                </a>
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-gray-400 text-sm text-center">
                New to Relixa?{' '}
                <a href="/register" className="text-green-400 hover:underline">
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
