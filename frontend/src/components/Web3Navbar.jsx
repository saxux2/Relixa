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
        className={`pointer-events-auto relative mx-auto h-[1.5cm] max-w-3xl overflow-hidden rounded-[14px] border transition-all duration-300 ${
          isScrolled
            ? 'web3-glass web3-border-glow border-emerald-400/20 shadow-[0_24px_80px_rgba(3,7,18,0.55)]'
            : 'border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(3,7,18,0.28)] backdrop-blur-xl'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%)]" />
        <div className="relative flex h-full items-center justify-between gap-3 px-4 py-0 sm:px-4.5">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Home">
            <div className="aspect-square h-8 w-8 min-h-8 min-w-8 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-white">
              <img src="/relixa-logo.png" alt="Relixa logo" className="h-[95%] w-[95%] object-contain" />
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 md:flex">
            {links.map((link) => {
              const active = activeSection === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`rounded-full px-4 py-1 text-[13px] font-medium transition ${
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
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-[12px] font-medium text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-glow" />
                <span className="font-mono tracking-wide">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            ) : null}

            {isConnected ? (
              <>
                <button
                  onClick={onDisconnect}
                  className="rounded-full border border-white/12 bg-white/5 px-5 py-1.5 text-[13px] font-medium text-white transition hover:bg-white/10"
                >
                  Disconnect
                </button>
                <button
                  onClick={onPrimaryAction}
                  disabled={primaryActionDisabled}
                  className="web3-button-primary rounded-full px-5 py-1.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {primaryActionLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                className="rounded-full bg-black text-white px-5 py-1.5 text-[13px] font-semibold transition hover:bg-gray-900"
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
