"use client";

import { useEffect, useState } from "react";
import MinipayAutoConnect from "@/components/MinipayAutoConnect";

/** Connect MiniPay after first paint so home LCP is not blocked by wallet hooks. */
export default function DeferredMinipayAutoConnect() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = () => setReady(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 800);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <MinipayAutoConnect />;
}
