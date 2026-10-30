"use client";

import { ExternalLink, Loader2, RefreshCw, Shield, ShieldCheck } from "lucide-react";
import { useGoodDollarStatus } from "@/hooks/useGoodDollarStatus";

function shorten(addr?: string | null): string | null {
  if (!addr || typeof addr !== "string") return null;
  const s = addr.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) return null;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function GoodDollarStatusCard() {
  const { data, isLoading, isFetching, isError, refetch } = useGoodDollarStatus();

  // Don't flash "Not verified" while the first fetch is in flight.
  if (isLoading || (!data && !isError)) {
    return (
      <div className="rounded-xl border border-[#003B3E]/60 bg-[#0E1415]/50 p-4 flex items-center gap-3 min-h-[80px]">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="text-sm text-slate-400">Checking GoodDollar verification…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-[#003B3E]/60 bg-[#0E1415]/50 p-4 text-sm text-slate-400 flex items-center justify-between gap-3">
        <span>Couldn&apos;t load GoodDollar status.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        GoodDollar verification isn&apos;t available on this environment.
      </div>
    );
  }

  const primary = shorten(data.checkedAddresses[0]);
  const extraCount = Math.max(0, data.checkedAddresses.length - 1);

  if (data.verified) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/20 p-2 border border-emerald-400/30 flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Verified with GoodDollar</p>
          <p className="text-xs text-slate-400 truncate">
            {primary ? primary : "Verified wallet"}
            {extraCount > 0 ? ` · +${extraCount} other${extraCount === 1 ? "" : "s"} checked` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 disabled:opacity-50"
          aria-label="Recheck verification"
          title="Recheck (cached up to 1 min)"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
  }

  const handleVerify = () => {
    if (typeof window !== "undefined") {
      window.open(data.verifyUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0E1415]/50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-lg bg-cyan-500/10 p-2 border border-cyan-400/20 flex-shrink-0">
          <Shield className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Not verified with GoodDollar</p>
          <p className="text-xs text-slate-400 truncate">
            {primary ? `Checked ${primary}` : "No wallet linked yet"}
            {extraCount > 0 ? ` · +${extraCount} other${extraCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 disabled:opacity-50"
          aria-label="Recheck verification"
          title="Recheck (cached up to 1 min)"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
      <button
        type="button"
        onClick={handleVerify}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0DD6E0] text-[#010F10] font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity text-sm"
      >
        <ExternalLink className="w-4 h-4" />
        Verify with GoodDollar
      </button>
      <p className="mt-2 text-[11px] text-slate-500">
        May take up to a minute to update here after you verify.
      </p>
    </div>
  );
}
