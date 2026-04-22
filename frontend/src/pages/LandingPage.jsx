import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { USER_STATUS, SUPER_ADMIN_ADDRESS } from '../firebase/constants';
import { useStellarWallet } from '../contexts/StellarWalletContext';
import MagicBento from '../components/MagicBento';

const featuresCards = [
  {
    title: 'Transparent Donations',
    description: 'Every transaction is recorded on the Stellar blockchain, ensuring complete transparency and accountability.',
    label: 'Transparency',
    color: '#0d1b1a'
  },
  {
    title: 'Direct Impact',
    description: 'Funds go directly to verified beneficiaries with zero middleman fees, maximizing your impact.',
    label: 'Efficiency',
    color: '#0d1b1a'
  },
  {
    title: 'Global Reach',
    description: 'Support disaster relief efforts worldwide instantly using fast, low-cost crypto transactions.',
    label: 'Borderless',
    color: '#0d1b1a'
  }
];

const ROLE_OPTIONS = [
  { id: 'admin', name: 'Admin', icon: '🛡️', description: 'Platform administration & oversight', color: 'from-red-500 to-rose-600' },
  { id: 'donor', name: 'Donor', icon: '💝', description: 'Donate to relief campaigns', color: 'from-green-500 to-emerald-600' },
  { id: 'organizer', name: 'Organizer', icon: '🏢', description: 'Create & manage relief campaigns', color: 'from-blue-500 to-indigo-600' },
  { id: 'beneficiary', name: 'Beneficiary', icon: '🤝', description: 'Receive relief funds', color: 'from-purple-500 to-pink-600' },
  { id: 'merchant', name: 'Merchant', icon: '🏪', description: 'Provide goods & services', color: 'from-orange-500 to-amber-600' },
];

export default function LandingPage() {
  const { address, isConnected, connectWallet, disconnectWallet } = useStellarWallet();
  const navigate = useNavigate();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check once on mount

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = ['hero', 'features', 'how-it-works', 'about'].map(id => document.getElementById(id));
    sections.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToDashboard = async () => {
    if (!isConnected || !address) return;

    setCheckingRole(true);

    try {
      // Check if Super Admin
      if (SUPER_ADMIN_ADDRESS && address.toLowerCase() === SUPER_ADMIN_ADDRESS.toLowerCase()) {
        navigate('/admin/dashboard');
        return;
      }

      // If Firebase is not configured, show role selector
      if (!db) {
        console.log('⚠️ Firebase not configured — showing role selector');
        setShowRoleSelector(true);
        setCheckingRole(false);
        return;
      }

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', address.toLowerCase());
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user — go to register or show role selector
        navigate('/register');
        return;
      }

      const userData = userSnap.data();

      if (userData.status === USER_STATUS.PENDING) {
        navigate('/pending-approval', { state: { user: userData } });
      } else if (userData.status === USER_STATUS.REJECTED) {
        // Show rejection modal with options to re-apply or contact support
        const reapply = window.confirm(
          `Your ${userData.role || 'application'} application was rejected.\n\n` +
          `Reason: ${userData.rejectionReason || 'Not specified'}\n\n` +
          `Click OK to apply for a different role, or Cancel to try the role selector.`
        );
        if (reapply) {
          navigate('/register');
        } else {
          setShowRoleSelector(true);
        }
      } else if (userData.status === USER_STATUS.APPROVED) {
        navigate(`/${userData.role}/dashboard`);
      } else {
        // Unknown status - show role selector
        console.warn('Unknown user status:', userData.status);
        setShowRoleSelector(true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // On any Firebase error, fallback to role selector
      setShowRoleSelector(true);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleSelectRole = (roleId) => {
    setShowRoleSelector(false);
    navigate(`/${roleId}/dashboard`);
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection error:', err);
      alert(err.message || 'Failed to connect to Freighter wallet');
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setShowRoleSelector(false);
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
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'border-b border-white/10 bg-gray-900/90 backdrop-blur-md shadow-lg shadow-black/40' : 'bg-transparent border-b border-transparent'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-2xl font-bold text-transparent">
              Relixa
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <button 
              onClick={() => scrollToSection('features')} 
              className={`text-sm transition-colors ${activeSection === 'features' ? 'text-green-500 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className={`text-sm transition-colors ${activeSection === 'how-it-works' ? 'text-green-500 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className={`text-sm transition-colors ${activeSection === 'about' ? 'text-green-500 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              About
            </button>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <span className="hidden md:flex items-center gap-2 text-xs text-green-400 font-mono bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={handleDisconnectWallet}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  Disconnect
                </button>
                <button
                  onClick={handleGoToDashboard}
                  disabled={checkingRole}
                  className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                >
                  {checkingRole ? 'Checking...' : 'Go to Dashboard'}
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
      <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
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

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                disabled={checkingRole}
                className="w-full rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 px-10 py-5 text-xl font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all duration-300 hover:scale-105 hover:from-green-300 hover:to-emerald-400 hover:shadow-[0_0_40px_rgba(52,211,153,0.8)] sm:w-auto disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]"
              >
                {checkingRole ? '⏳ Checking Role...' : 'Go to Dashboard'}
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="w-full rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 px-10 py-5 text-xl font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all duration-300 hover:scale-105 hover:from-green-300 hover:to-emerald-400 hover:shadow-[0_0_40px_rgba(52,211,153,0.8)] sm:w-auto"
              >
                Connect Wallet
              </button>
            )}
            <Link
              to="/#how-it-works"
              className="w-full rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-4xl font-bold text-white">
            Why <span className="text-green-500">Relixa</span>?
          </h2>
          <MagicBento cards={featuresCards} />
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

      {/* Role Selector Modal */}
      {showRoleSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-black/95 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">Select Your Role</h2>
                <p className="text-white/60 text-sm mt-1">
                  Connected: <span className="text-green-400 font-mono">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
                </p>
              </div>
              <button
                onClick={() => setShowRoleSelector(false)}
                className="text-white/40 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="group relative bg-white/5 border border-white/10 hover:border-green-500/50 rounded-2xl p-6 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
                >
                  <div className="text-4xl mb-3">{role.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{role.name}</h3>
                  <p className="text-white/50 text-sm">{role.description}</p>
                  
                  {/* Gradient bottom bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-white/30 text-xs">
                🔒 Stellar Testnet • Wallet-based authentication • No passwords required
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
