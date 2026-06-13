"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const GuestAuthProviderLazy = dynamic(
  () => import("@/context/GuestAuthContext").then((m) => ({ default: m.GuestAuthProvider })),
  { ssr: false }
);

/** Guest auth wraps the app immediately so home does not re-render when idle fires. */
export default function DeferredGuestAuthProvider({ children }: { children: ReactNode }) {
  return <GuestAuthProviderLazy>{children}</GuestAuthProviderLazy>;
}
