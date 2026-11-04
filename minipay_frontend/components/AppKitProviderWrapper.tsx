// components/AppKitProviderWrapper.tsx
'use client';

import { wagmiAdapter, projectId, defaultNetwork } from '@/config';
import { ReactNode, useEffect } from 'react';
import { createAppKit } from '@reown/appkit/react';

/** Canonical app origin for wallet metadata (Reown). Set `NEXT_PUBLIC_URL` on Vercel to your canonical origin (www vs apex). */
const siteUrl = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://www.playtycoon.xyz';
})();

let isInitialized = false;

/** Safe to call multiple times — required before `useAppKit().open()` on browsers without an injected wallet (e.g. Chrome). */
export function ensureAppKitInitialized(): void {
  if (isInitialized) return;
  if (typeof window === 'undefined') return;
  if (!projectId) {
    console.error("AppKit: NEXT_PUBLIC_PROJECT_ID is missing");
    return;
  }
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [defaultNetwork],
    projectId,
    defaultNetwork,
    themeVariables: {
      "--w3m-z-index": 10000,
    },
    metadata: {
      name: "Tycoon",
      description: "Play Monopoly onchain",
      url: siteUrl,
      icons: [`${siteUrl}/logo.png`],
    },
    features: {
      analytics: false,
    },
  });
  isInitialized = true;
}

/** Reown injects #wcm-modal without aria-label; set one for screen readers / Lighthouse. */
function useWcmModalAccessibleName() {
  useEffect(() => {
    const label = "Wallet connection";
    const apply = () => {
      const el = document.getElementById("wcm-modal");
      if (!el) return;
      if (!el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) {
        el.setAttribute("aria-label", label);
      }
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
}

export default function AppKitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Init on the client as early as possible so Chrome (no Brave/MetaMask inject)
  // can open the Connect modal instead of hanging on injected().
  if (typeof window !== "undefined") {
    ensureAppKitInitialized();
  }

  useWcmModalAccessibleName();

  useEffect(() => {
    ensureAppKitInitialized();
  }, []);

  return <>{children}</>;
}
