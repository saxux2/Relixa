import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Web3Navbar({
  isScrolled,
  links,
  activeSection,
  onNavigate,
  isConnected,
  address,
  onConnect,
  onDisconnect,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionDisabled,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (target) => {
    setMenuOpen(false);
    onNavigate?.(target);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav
        className={`pointer-events-auto relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border transition-all duration-300 ${
          isScrolled
            ? 'web3-glass web3-border-glow border-emerald-400/20 shadow-[0_24px_80px_rgba(3,7,18,0.55)]'
            : 'border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(3,7,18,0.28)] backdrop-blur-xl'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%)]" />
        <div className="relative flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 shadow-[0_10px_24px_rgba(16,185,129,0.38)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.24em] text-white/50">WEB3 RELIEF</div>
              <div className="web3-text-gradient text-2xl font-black tracking-[0.08em]">RELIXA</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-2 md:flex">
            {links.map((link) => {
              const active = activeSection === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isConnected && address ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-glow" />
                <span className="font-mono tracking-wide">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            ) : null}

            {isConnected ? (
              <>
                <button
                  onClick={onDisconnect}
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Disconnect
                </button>
                <button
                  onClick={onPrimaryAction}
                  disabled={primaryActionDisabled}
                  className="web3-button-primary rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {primaryActionLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                className="web3-button-primary rounded-full px-5 py-2.5 text-sm font-semibold transition"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 text-white md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </span>
          </button>
        </div>

        {menuOpen ? (
          <div className="relative border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const active = activeSection === link.id;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              {isConnected && address ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center font-mono text-xs text-emerald-200">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              ) : null}

              {isConnected ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPrimaryAction?.();
                    }}
                    disabled={primaryActionDisabled}
                    className="web3-button-primary rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {primaryActionLabel}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDisconnect?.();
                    }}
                    className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-medium text-white"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onConnect?.();
                  }}
                  className="web3-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  );
}
