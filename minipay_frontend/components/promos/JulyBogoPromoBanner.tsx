'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import {
  isMinipayJulyBogoPromoActive,
  MINIPAY_JULY_BOGO_CTA,
  MINIPAY_JULY_BOGO_DISMISS_KEY,
  MINIPAY_JULY_BOGO_FOOTNOTE,
  MINIPAY_JULY_BOGO_HEADLINE,
  MINIPAY_JULY_BOGO_MESSAGE,
  MINIPAY_JULY_BOGO_SHOP_HREF,
  MINIPAY_JULY_BOGO_SUBLINE,
} from '@/lib/promos/minipayJulyBogo';

export type JulyBogoPromoVariant = 'hero' | 'compact' | 'shop' | 'menu';

type JulyBogoPromoBannerProps = {
  variant?: JulyBogoPromoVariant;
  className?: string;
  /** When true, user can dismiss for this browser session (hero / menu). */
  dismissible?: boolean;
  shopHref?: string;
};

export function JulyBogoPromoBanner({
  variant = 'compact',
  className = '',
  dismissible = false,
  shopHref = MINIPAY_JULY_BOGO_SHOP_HREF,
}: JulyBogoPromoBannerProps) {
  const [hidden, setHidden] = useState(dismissible);

  useEffect(() => {
    if (!dismissible) {
      setHidden(false);
      return;
    }
    if (!isMinipayJulyBogoPromoActive()) {
      setHidden(true);
      return;
    }
    try {
      setHidden(sessionStorage.getItem(MINIPAY_JULY_BOGO_DISMISS_KEY) === '1');
    } catch {
      setHidden(false);
    }
  }, [dismissible]);

  if (!isMinipayJulyBogoPromoActive() || hidden) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(MINIPAY_JULY_BOGO_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const shell =
    'relative overflow-hidden rounded-xl border border-amber-400/35 bg-gradient-to-r from-amber-950/50 via-[#0a1518]/95 to-[#081517]/90 shadow-[0_0_24px_rgba(251,191,36,0.12)]';

  if (variant === 'menu') {
    return (
      <Link
        href={shopHref}
        className={`mb-4 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-3 hover:border-amber-400/50 hover:bg-amber-500/15 transition-colors ${className}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-400/40">
          <Gift className="h-4 w-4 text-amber-200" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-amber-300/80">
            {MINIPAY_JULY_BOGO_HEADLINE}
          </p>
          <p className="text-sm font-semibold text-amber-50 leading-snug">{MINIPAY_JULY_BOGO_MESSAGE}</p>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-amber-400/70" aria-hidden />
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${shell} px-3.5 py-2.5 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <Gift className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-orbitron font-bold uppercase tracking-wide text-amber-200/90 leading-tight">
              {MINIPAY_JULY_BOGO_HEADLINE} · {MINIPAY_JULY_BOGO_MESSAGE}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">{MINIPAY_JULY_BOGO_SUBLINE}</p>
          </div>
          <Link
            href={shopHref}
            className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-orbitron font-bold uppercase tracking-wide text-amber-100 hover:bg-amber-500/25"
          >
            {MINIPAY_JULY_BOGO_CTA}
          </Link>
        </div>
      </motion.div>
    );
  }

  if (variant === 'shop') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${shell} px-4 py-3.5 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/45">
            <Gift className="h-5 w-5 text-amber-200" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-orbitron font-bold uppercase tracking-[0.2em] text-amber-300/85">
              {MINIPAY_JULY_BOGO_HEADLINE}
            </p>
            <p className="text-base font-black font-orbitron text-amber-50 mt-0.5 leading-snug">
              {MINIPAY_JULY_BOGO_MESSAGE}
            </p>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">{MINIPAY_JULY_BOGO_SUBLINE}</p>
            <p className="text-[10px] text-amber-200/60 mt-1.5">{MINIPAY_JULY_BOGO_FOOTNOTE}</p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-amber-400/60 mt-1" aria-hidden />
        </div>
      </motion.div>
    );
  }

  // hero — sleek glass promo (cool, not loud)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full max-w-sm mt-4 ${className}`}
    >
      <div className="group relative overflow-hidden rounded-2xl border border-[#00F0FF]/20 bg-[#0a1618]/40 p-[1px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {/* soft inner glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(0,240,255,0.12), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(251,191,36,0.08), transparent 45%)',
          }}
          aria-hidden
        />

        <div className="relative rounded-[0.9rem] bg-[#061012]/75 px-4 py-3.5 backdrop-blur-md">
          {dismissible && (
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-2.5 right-2.5 z-10 rounded-md p-1 text-[#F0F7F7]/35 hover:text-[#F0F7F7]/70 transition-colors"
              aria-label="Dismiss promo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="flex items-center gap-3.5 pr-5">
            <motion.div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/25 bg-gradient-to-br from-[#00F0FF]/10 to-amber-500/5"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Gift className="h-5 w-5 text-[#00F0FF]/90" strokeWidth={1.75} aria-hidden />
              <span className="absolute -bottom-1 -right-1 rounded-md border border-amber-400/40 bg-amber-500/20 px-1 py-px font-orbitron text-[8px] font-bold text-amber-200/95 backdrop-blur-sm">
                1+1
              </span>
            </motion.div>

            <div className="min-w-0 flex-1">
              <p className="font-orbitron text-[9px] font-medium uppercase tracking-[0.28em] text-[#00F0FF]/70">
                {MINIPAY_JULY_BOGO_HEADLINE}
              </p>
              <p className="mt-1 font-orbitron text-[14px] font-semibold leading-snug text-[#F0F7F7]">
                {MINIPAY_JULY_BOGO_MESSAGE}
              </p>
              <p className="mt-1 font-dmSans text-[11px] leading-relaxed text-[#F0F7F7]/50 line-clamp-2">
                {MINIPAY_JULY_BOGO_SUBLINE}
              </p>
            </div>
          </div>

          <Link
            href={shopHref}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#00F0FF]/30 bg-[#00F0FF]/[0.07] py-2.5 font-orbitron text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF] transition-all hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/12 active:scale-[0.99]"
          >
            <Sparkles className="h-3 w-3 opacity-80" aria-hidden />
            {MINIPAY_JULY_BOGO_CTA}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
