"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** MiniPay stats are public at /stats — redirect from the old admin path. */
export default function AdminMinipayStatsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/stats");
  }, [router]);
  return <p className="py-8 text-sm text-slate-400">Redirecting to public stats…</p>;
}
