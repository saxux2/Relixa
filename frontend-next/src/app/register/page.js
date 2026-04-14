'use client';
import { useState, useEffect } from 'react';

export default function Register() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    description: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    
    try {
      // For demo purposes, just simulate registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('✅ Registration successful! Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'donor',
      name: 'Donor',
      icon: '💝',
      description: 'Support relief campaigns with donations',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'organizer',
      name: 'Campaign Organizer',
      icon: '🏢',
      description: 'Create and manage disaster relief campaigns',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'beneficiary',
      name: 'Beneficiary',
      icon: '🤝',
      description: 'Receive relief funds for disaster recovery',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'merchant',
      name: 'Merchant',
      icon: '🏪',
      description: 'Provide essential goods and services to beneficiaries',
      color: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Join Relixa
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your role to start making a difference
          </p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="grid md:grid-cols-4 gap-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-500"
              >
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                  {role.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {role.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {role.description}
                </p>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color} rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform`} />
              </button>
            ))}
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setSelectedRole(null)}
              className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to role selection
            </button>

            {/* Selected Role Header */}
            <div className={`bg-gradient-to-r ${roles.find(r => r.id === selectedRole)?.color} text-white rounded-xl p-6 mb-8`}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">{roles.find(r => r.id === selectedRole)?.icon}</div>
                <div>
                  <h2 className="text-3xl font-bold">{roles.find(r => r.id === selectedRole)?.name}</h2>
                  <p className="text-white/90">{roles.find(r => r.id === selectedRole)?.description}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Merchant specific fields */}
              {selectedRole === 'merchant' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <select
                      required
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select business type --</option>
                      <option value="retail">Retail Store</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="restaurant">Restaurant/Food Service</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="grocery">Grocery Store</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {/* Organization (for Organizer/Beneficiary) */}
              {(selectedRole === 'organizer' || selectedRole === 'beneficiary') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization {selectedRole === 'organizer' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    required={selectedRole === 'organizer'}
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    placeholder="Organization name"
                  />
                </div>
              )}

              {/* Description */}
              {(selectedRole === 'organizer' || selectedRole === 'beneficiary') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedRole === 'beneficiary' ? 'Why do you need relief funds?' : 'Why do you need this role?'} *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    rows="4"
                    placeholder={selectedRole === 'beneficiary' ? 'Describe your situation...' : 'Explain your need...'}
                  />
                </div>
              )}

              {/* Wallet Connection */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Wallet Address</p>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Connected</span>
                    <span className="text-gray-500 text-xs font-mono truncate">
                      {address.substring(0, 8)}...{address.substring(address.length - 8)}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-600"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isConnected}
                className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all ${
                  loading || !isConnected
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : `bg-gradient-to-r ${roles.find(r => r.id === selectedRole)?.color} hover:scale-105`
                }`}
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:underline font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
