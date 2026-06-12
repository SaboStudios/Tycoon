"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const GuestAuthProviderLazy = dynamic(
  () => import("@/context/GuestAuthContext").then((m) => ({ default: m.GuestAuthProvider })),
  { ssr: false }
);

/** On home, defer guest-auth chunk until idle so first paint parses less JS. */
export default function DeferredGuestAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const deferOnHome = pathname === "/";
  const [ready, setReady] = useState(!deferOnHome);

  useEffect(() => {
    if (!deferOnHome) {
      setReady(true);
      return;
    }
    const run = () => setReady(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 600);
    return () => window.clearTimeout(t);
  }, [deferOnHome]);

  if (!ready) return <>{children}</>;
  return <GuestAuthProviderLazy>{children}</GuestAuthProviderLazy>;
}
