'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import {
  isMinipayJulyBogoPromoActive,
  MINIPAY_JULY_BOGO_CTA,
  MINIPAY_JULY_BOGO_DISMISS_KEY,
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
            <p className="text-[10px] text-amber-200/60 mt-1.5">Your free copy is delivered automatically after payment.</p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-amber-400/60 mt-1" aria-hidden />
        </div>
      </motion.div>
    );
  }

  // hero
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`w-full max-w-sm mt-4 ${className}`}
    >
      <div className={`${shell} px-4 py-3.5`}>
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-2 right-2 rounded-lg p-1 text-amber-200/60 hover:bg-amber-500/15 hover:text-amber-100"
            aria-label="Dismiss promo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/50 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
            <Gift className="h-5 w-5 text-amber-200" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-orbitron font-bold uppercase tracking-[0.22em] text-amber-300/90">
              {MINIPAY_JULY_BOGO_HEADLINE}
            </p>
            <p className="text-[15px] font-black font-orbitron text-amber-50 mt-1 leading-snug">
              {MINIPAY_JULY_BOGO_MESSAGE}
            </p>
            <p className="text-[12px] text-[#F0F7F7]/65 mt-1.5 leading-relaxed font-dmSans">
              {MINIPAY_JULY_BOGO_SUBLINE}
            </p>
            <Link
              href={shopHref}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-[11px] font-orbitron font-bold uppercase tracking-widest text-amber-50 hover:bg-amber-500/30 transition-colors"
            >
              {MINIPAY_JULY_BOGO_CTA}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
