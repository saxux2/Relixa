import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { USER_STATUS, SUPER_ADMIN_ADDRESS } from '../firebase/constants';
import { useStellarWallet } from '../contexts/StellarWalletContext';
import MagicBento from '../components/MagicBento';
import Web3Navbar from '../components/Web3Navbar';

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

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'about', label: 'About' },
];

export default function LandingPage() {
  const { address, isConnected, connectWallet, disconnectWallet } = useStellarWallet();
  const navigate = useNavigate();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 28);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.45 }
    );

    const sections = ['hero', 'features', 'how-it-works', 'about']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGoToDashboard = async () => {
    if (!isConnected || !address) return;

    setCheckingRole(true);

    try {
      if (SUPER_ADMIN_ADDRESS && address.toLowerCase() === SUPER_ADMIN_ADDRESS.toLowerCase()) {
        navigate('/admin/dashboard');
        return;
      }

      if (!db) {
        console.log('Firebase not configured, showing role selector');
        setShowRoleSelector(true);
        setCheckingRole(false);
        return;
      }

      const userRef = doc(db, 'users', address.toLowerCase());
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        navigate('/register');
        return;
      }

      const userData = userSnap.data();

      if (userData.status === USER_STATUS.PENDING) {
        navigate('/pending-approval', { state: { user: userData } });
      } else if (userData.status === USER_STATUS.REJECTED) {
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
        console.warn('Unknown user status:', userData.status);
        setShowRoleSelector(true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-[var(--text-primary)]">
      {/* ── Main dome glow — fills top half of viewport ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2"
        style={{
          width: '220%',
          height: '160vh',
          background: 'radial-gradient(ellipse 65% 55% at 50% 10%, rgba(22,163,74,0.52) 0%, rgba(16,185,129,0.30) 28%, rgba(5,150,105,0.14) 50%, transparent 75%)',
        }}
      />
      {/* Wide ambient halo — extends the glow edges */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2"
        style={{
          width: '260%',
          height: '140vh',
          background: 'radial-gradient(ellipse 80% 52% at 50% 8%, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.10) 40%, transparent 68%)',
        }}
      />
      {/* Bright inner core — hot center near top */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2"
        style={{
          width: '160%',
          height: '100vh',
          background: 'radial-gradient(ellipse 42% 48% at 50% 12%, rgba(74,222,128,0.32) 0%, rgba(34,197,94,0.14) 45%, transparent 78%)',
        }}
      />
      {/* Side spill — widens the glow circle at edges */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2"
        style={{
          width: '200%',
          height: '120vh',
          background: 'radial-gradient(ellipse 75% 50% at 50% 15%, rgba(16,185,129,0.12) 0%, transparent 60%)',
        }}
      />

      {/* ── Grid overlay — matches the glow coverage ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,197,94,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.09) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 95% 55% at 50% 10%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.2) 58%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 95% 55% at 50% 10%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.2) 58%, transparent 75%)',
        }}
      />

      {/* ── Scattered dot particles ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(120)].map((_, i) => {
          const size = 1.5 + Math.random() * 2.5;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: `rgba(74, 222, 128, ${0.10 + Math.random() * 0.30})`,
                animation: `float ${4 + Math.random() * 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          );
        })}
      </div>

      <Web3Navbar
        isScrolled={isScrolled}
        links={NAV_LINKS}
        activeSection={activeSection}
        onNavigate={scrollToSection}
        isConnected={isConnected}
        address={address}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
        onPrimaryAction={handleGoToDashboard}
        primaryActionLabel={checkingRole ? 'Checking...' : 'Go to Dashboard'}
        primaryActionDisabled={checkingRole}
      />

      <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-12 pt-32 sm:pt-36">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            <span className="text-sm text-emerald-200">Built on Stellar Blockchain</span>
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight text-white md:text-7xl lg:text-8xl">
            Disaster Relief
            <br />
            <span className="web3-text-gradient">Reimagined</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300/80 md:text-xl">
            A decentralized platform for transparent disaster relief. Connect your wallet, donate USDC, and help those in need with complete transaction transparency.
          </p>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                disabled={checkingRole}
                className="web3-button-primary w-full rounded-xl px-7 py-3 text-base font-bold transition-all duration-300 hover:scale-[1.02] sm:w-auto disabled:opacity-50 disabled:hover:scale-100"
              >
                {checkingRole ? 'Checking Role...' : 'Go to Dashboard'}
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="web3-button-primary w-full rounded-xl px-7 py-3 text-base font-bold transition-all duration-300 hover:scale-[1.02] sm:w-auto"
              >
                Connect Wallet
              </button>
            )}

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-semibold text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              Learn More
            </button>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 text-left md:grid-cols-3">
            {[
              { label: 'On-chain transparency', value: 'Every transfer verifiable' },
              { label: 'Wallet-first access', value: 'No passwords or friction' },
              { label: 'Fast aid distribution', value: 'Built for direct delivery' },
            ].map((item) => (
              <div key={item.label} className="web3-panel rounded-3xl px-5 py-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/80">{item.label}</div>
                <div className="text-sm text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/70">Protocol Advantages</div>
            <h2 className="text-4xl font-bold text-white">
              Why <span className="web3-text-gradient">Relixa</span>?
            </h2>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 shadow-[0_16px_70px_rgba(3,7,18,0.28)] sm:p-6">
            <MagicBento cards={featuresCards} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">User Flow</div>
            <h2 className="text-4xl font-bold text-white">How It Works</h2>
          </div>

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
            ].map((item) => (
              <div
                key={item.step}
                className="web3-panel group relative rounded-[2rem] p-8 transition-all hover:-translate-y-1 hover:border-emerald-400/30"
              >
                <div className="mb-5 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <span className="mb-4 block text-6xl font-bold text-emerald-400/20">{item.step}</span>
                <h3 className="mb-3 text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-slate-300/75">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative px-6 py-20">
        <div className="web3-panel mx-auto max-w-4xl rounded-[2rem] px-8 py-12 text-center sm:px-12">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/70">Mission</div>
          <h2 className="mb-8 text-4xl font-bold text-white">About Relixa</h2>
          <p className="text-lg text-slate-300/80">
            Relixa is a decentralized disaster relief platform built on Stellar blockchain.
            We enable transparent and secure fund distribution to affected communities through
            smart contracts, ensuring every donation reaches those who need it most.
          </p>
        </div>
      </section>

      <footer className="relative px-6 py-12">
        <div className="web3-panel mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-[2rem] px-6 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
              <img src="/relixa-logo.png" alt="Relixa logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-semibold text-white">Relixa</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Relixa. Built on Stellar Blockchain.</p>
        </div>
      </footer>

      {showRoleSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="web3-panel w-full max-w-3xl rounded-[2rem] p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Select Your Role</h2>
                <p className="mt-1 text-sm text-white/60">
                  Connected: <span className="font-mono text-emerald-300">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
                </p>
              </div>
              <button
                onClick={() => setShowRoleSelector(false)}
                className="text-2xl text-white/40 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="group relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <div className="mb-3 text-4xl">{role.icon}</div>
                  <h3 className="mb-1 text-lg font-bold text-white">{role.name}</h3>
                  <p className="text-sm text-white/50">{role.description}</p>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-[1.5rem] bg-gradient-to-r ${role.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-white/30">
                Stellar Testnet • Wallet-based authentication • No passwords required
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
