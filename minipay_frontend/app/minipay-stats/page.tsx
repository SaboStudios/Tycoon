"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canonical public stats live at /stats. */
export default function MinipayStatsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/stats");
  }, [router]);
  return <p className="py-8 text-center text-sm text-slate-400">Redirecting to /stats…</p>;
}
