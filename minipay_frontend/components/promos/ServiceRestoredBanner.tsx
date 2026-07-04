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

type ServiceRestoredBannerProps = {
  className?: string;
};

/** Dismissible apology / all-clear strip — shown app-wide after the Jul 2026 outage. */
export function ServiceRestoredBanner({ className = "" }: ServiceRestoredBannerProps) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!isMinipayServiceRestoredBannerActive()) {
      setHidden(true);
      return;
    }
    try {
      setHidden(sessionStorage.getItem(MINIPAY_SERVICE_RESTORED_DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (!isMinipayServiceRestoredBannerActive() || hidden) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(MINIPAY_SERVICE_RESTORED_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden rounded-xl border border-emerald-400/35 bg-gradient-to-r from-emerald-950/55 via-[#0a1518]/95 to-[#081517]/90 shadow-[0_0_20px_rgba(52,211,153,0.1)] px-3.5 py-2.5 ${className}`}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 rounded-lg p-1 text-emerald-200/60 hover:bg-emerald-500/15 hover:text-emerald-100"
        aria-label="Dismiss notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
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
