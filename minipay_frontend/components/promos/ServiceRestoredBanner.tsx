"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import {
  isMinipayServiceRestoredBannerActive,
  MINIPAY_SERVICE_RESTORED_DISMISS_KEY,
  MINIPAY_SERVICE_RESTORED_HEADLINE,
  MINIPAY_SERVICE_RESTORED_MESSAGE,
  MINIPAY_SERVICE_RESTORED_SUBLINE,
} from "@/lib/promos/minipayServiceRestored";

export type ServiceRestoredBannerVariant = "hero" | "compact";

type ServiceRestoredBannerProps = {
  variant?: ServiceRestoredBannerVariant;
  className?: string;
  dismissible?: boolean;
};

const shell =
  "relative overflow-hidden rounded-xl border border-emerald-400/35 bg-gradient-to-r from-emerald-950/55 via-[#0a1518]/95 to-[#081517]/90 shadow-[0_0_24px_rgba(52,211,153,0.12)]";

/** Apology / all-clear strip after the Jul 2026 roll outage. */
export function ServiceRestoredBanner({
  variant = "compact",
  className = "",
  dismissible = false,
}: ServiceRestoredBannerProps) {
  const [hidden, setHidden] = useState(dismissible);

  useEffect(() => {
    if (!isMinipayServiceRestoredBannerActive()) {
      setHidden(true);
      return;
    }
    if (!dismissible) {
      setHidden(false);
      return;
    }
    try {
      setHidden(sessionStorage.getItem(MINIPAY_SERVICE_RESTORED_DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, [dismissible]);

  if (!isMinipayServiceRestoredBannerActive() || hidden) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(MINIPAY_SERVICE_RESTORED_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`w-full max-w-sm mt-4 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className={`${shell} px-4 py-3.5`}>
          {dismissible && (
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-2 right-2 rounded-lg p-1 text-emerald-200/60 hover:bg-emerald-500/15 hover:text-emerald-100"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.2)]">
              <CheckCircle2 className="h-5 w-5 text-emerald-200" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-orbitron font-bold uppercase tracking-[0.22em] text-emerald-300/90">
                {MINIPAY_SERVICE_RESTORED_HEADLINE}
              </p>
              <p className="text-[15px] font-black font-orbitron text-emerald-50 mt-1 leading-snug">
                {MINIPAY_SERVICE_RESTORED_MESSAGE}
              </p>
              <p className="text-[12px] text-[#F0F7F7]/65 mt-1.5 leading-relaxed font-dmSans">
                {MINIPAY_SERVICE_RESTORED_SUBLINE}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      className={`${shell} px-3.5 py-2.5 ${className}`}
    >
      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-1.5 right-1.5 rounded-lg p-1 text-emerald-200/60 hover:bg-emerald-500/15 hover:text-emerald-100"
          aria-label="Dismiss notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-start gap-2.5 pr-6">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-orbitron font-bold uppercase tracking-[0.18em] text-emerald-300/90">
            {MINIPAY_SERVICE_RESTORED_HEADLINE}
          </p>
          <p className="text-[12px] font-semibold text-emerald-50 leading-snug mt-0.5">
            {MINIPAY_SERVICE_RESTORED_MESSAGE}
          </p>
          <p className="text-[11px] text-white/55 mt-0.5 leading-relaxed font-dmSans">
            {MINIPAY_SERVICE_RESTORED_SUBLINE}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
