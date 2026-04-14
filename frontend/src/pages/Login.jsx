import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SUPER_ADMIN_ADDRESS, APP_NAME, USER_STATUS } from '../firebase/constants';
import { useStellarWallet } from '../contexts/StellarWalletContext';

const ROLE_OPTIONS = [
  { id: 'admin', name: 'Admin', icon: '🛡️', description: 'Platform administration', color: 'from-red-500 to-rose-600' },
  { id: 'donor', name: 'Donor', icon: '💝', description: 'Donate to relief campaigns', color: 'from-green-500 to-emerald-600' },
  { id: 'organizer', name: 'Organizer', icon: '🏢', description: 'Manage relief campaigns', color: 'from-blue-500 to-indigo-600' },
  { id: 'beneficiary', name: 'Beneficiary', icon: '🤝', description: 'Receive relief funds', color: 'from-purple-500 to-pink-600' },
  { id: 'merchant', name: 'Merchant', icon: '🏪', description: 'Provide goods & services', color: 'from-orange-500 to-amber-600' },
];

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { address, isConnected, connectWallet, disconnectWallet } = useStellarWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected && address) {
      handleWalletConnected(address);
    }
  }, [isConnected, address]);

  const handleWalletConnected = async (walletAddress) => {
    setLoading(true);
    setError('');

    try {
      // Check if super admin
      if (SUPER_ADMIN_ADDRESS && walletAddress.toLowerCase() === SUPER_ADMIN_ADDRESS.toLowerCase()) {
        navigate('/admin/dashboard');
        return;
      }

      // If Firebase is not configured, show role selector
      if (!db) {
        console.log('⚠️ Firebase not configured — showing role selector');
        setShowRoleSelector(true);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', walletAddress.toLowerCase());
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        navigate('/register');
        return;
      }

      const userData = userSnap.data();

      // Update last login
      setDoc(userRef, {
        lastLoginAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Failed to update last login:', err));

      if (userData.status === USER_STATUS.PENDING) {
        navigate('/pending-approval', { state: { user: userData } });
      } else if (userData.status === USER_STATUS.REJECTED) {
        alert('Your application was rejected. Please contact support.');
        navigate('/register');
      } else if (userData.status === USER_STATUS.APPROVED) {
        navigate(`/${userData.role}/dashboard`);
      }

    } catch (error) {
      console.error('❌ Connection error:', error);
      // On Firebase error, show role selector as fallback
      setShowRoleSelector(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect to Freighter wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowRoleSelector(false);
  };

  const handleSelectRole = (roleId) => {
    setShowRoleSelector(false);
    navigate(`/${roleId}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {APP_NAME}
          </h1>
          <p className="text-gray-600">
            Transparent Disaster Relief Platform
          </p>
        </div>

        <div className="mb-6">
          {isConnected && address ? (
            <div className="flex items-center justify-center text-green-600 text-sm bg-green-50 py-2 px-4 rounded-lg">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Wallet connected: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          ) : (
            <div className="flex items-center justify-center text-orange-600 text-sm bg-orange-50 py-2 px-4 rounded-lg">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No wallet connected
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        <div className="w-full">
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
            </button>
          ) : (
            <div className="text-center">
              {loading ? (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Verifying your role...</p>
                </div>
              ) : showRoleSelector ? (
                /* Role Selection */
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Select Your Dashboard</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleSelectRole(role.id)}
                        className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 bg-white hover:bg-green-50 transition-all text-left group`}
                      >
                        <span className="text-3xl">{role.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-green-700">{role.name}</h4>
                          <p className="text-gray-500 text-sm">{role.description}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-2">Wallet Connected</p>
                  <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-2 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              )}

              <button
                onClick={handleDisconnect}
                className="mt-4 text-sm text-red-600 hover:text-red-700"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-4">
            🔒 Using Stellar <span className="font-semibold text-green-600">Testnet</span>
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">Low</p>
              <p className="text-xs text-gray-600">Gas Fees</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">Fast</p>
              <p className="text-xs text-gray-600">Confirmation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">100%</p>
              <p className="text-xs text-gray-600">Transparent</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Why Stellar Blockchain?
          </h3>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Fast & scalable transactions
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Ultra low transaction costs
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Smart contract support for transparency
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Native USDC support
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
