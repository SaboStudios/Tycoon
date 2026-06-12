import { dmSans, kronaOne, orbitron } from "@/components/shared/fonts";
import NavBar from "@/components/shared/navbar"; // Remove if not used elsewhere
import ScrollToTopBtn from "@/components/shared/scroll-to-top-btn";
import "@/styles/globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import AppKitProviderWrapper from "@/components/AppKitProviderWrapper";
import ReferralCapture from "@/components/ReferralCapture";
import { TycoonProvider } from "@/context/ContractProvider";
import { GuestAuthProvider } from "@/context/GuestAuthContext";
import { Toaster } from "react-hot-toast";
import FarcasterReady from "@/components/FarcasterReady";
import { minikitConfig } from "../minikit.config";
import type { Metadata } from "next";
import Script from "next/script";
import ClientLayout from "../clients/ClientLayout";
import QueryProvider from "./QueryProvider";
import BfcacheReloadGuard from "@/components/BfcacheReloadGuard";
import MinipaySiteRedirect from "@/components/MinipaySiteRedirect";
import MinipayAutoConnect from "@/components/MinipayAutoConnect";
import { buildMinipaySiteRedirectScript } from "@/lib/minipaySiteRedirect";

// Run before React: (1) Reload board when restored from bfcache so WebGL is fresh. (2) Disable bfcache on board so back button does full load instead of restore (avoids Context Lost + .style crash).
const BFCACHE_RELOAD_SCRIPT = `
(function(){
  var boardPath = /\\/board-3d-(mobile|multi-mobile)(\\/|$)/;
  function isBoard() { return boardPath.test(window.location.pathname); }
  window.addEventListener('pageshow', function(e) {
    if (e.persisted && isBoard()) { window.location.reload(); }
  });
  if (isBoard()) {
    window.addEventListener('unload', function() {});
  }
})();
`;

// Remove the duplicate 'cookies' global variable—it's not needed

/** Safe metadataBase — invalid env (missing protocol, spaces) must not 500 the whole site. */
function resolveMetadataBase(): URL {
  const fallback = "https://www.playtycoon.xyz";
  const raw = (process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const candidate = raw || fallback;
  try {
    if (/^https?:\/\//i.test(candidate)) {
      return new URL(candidate);
    }
    return new URL(`https://${candidate}`);
  } catch {
    return new URL(fallback);
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: resolveMetadataBase(),
    title: {
      default: "Tycoon — On-chain Monopoly on Celo",
      template: "%s | Tycoon",
    },
    description:
      "Tycoon is a decentralized on-chain game inspired by the classic Monopoly game, built on Celo. It allows players to buy, sell, and trade digital properties in a trustless gaming environment.",
    icons: {
      icon: "/favicon.png",
    },
    other: {
      "talentapp:project_verification":
        "5d078ddf22e877e4b4a4508b55b82c826e0b7d2bef4d1505b4b14945a216f62eaf013de3c9fe99c4fd58ae7fc896455a9ada31130565d32c8a5eb785b394113a",
      "base:app_id": "695d328c3ee38216e9af4359", 
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        images: {
          url: minikitConfig.miniapp.heroImageUrl,
          alt: "Tycoon - Monopoly Game Onchain",
        },
        button: {
          title: `Play ${minikitConfig.miniapp.name} `,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie"); // Local var—no need for global

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://api.web3modal.org" />
        <link rel="dns-prefetch" href="https://pulse.walletconnect.org" />
        <link rel="dns-prefetch" href="https://fonts.reown.com" />
        <link rel="preconnect" href="https://fonts.reown.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pulse.walletconnect.org" />

        {/* Inline critical CSS for above-fold (LCP optimization) */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --mobile-nav-height: 82px;
            --mobile-nav-offset: calc(var(--mobile-nav-height) + env(safe-area-inset-top, 0px));
            --radius: 0.625rem;
            --background: oklch(0.145 0 0);
            --foreground: oklch(0.985 0 0);
            --card: oklch(0.205 0 0);
            --card-foreground: oklch(0.985 0 0);
            --primary: oklch(0.922 0 0);
            --primary-foreground: oklch(0.205 0 0);
            --accent: oklch(0.269 0 0);
            --accent-foreground: oklch(0.985 0 0);
            --border: oklch(1 0 0 / 10%);
            --input: oklch(1 0 0 / 15%);
          }
          * { border-color: var(--border); outline-color: var(--accent) / 0.5; }
          body { background-color: #010F10; color: var(--foreground); font-family: var(--font-dm-sans), system-ui, sans-serif; }
          .neon-title-hero { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: geometricPrecision; }
          .neon-title-text { position: relative; z-index: 1; display: block; text-shadow: 0 0 8px rgba(0, 240, 255, 0.8), 0 0 16px rgba(0, 240, 255, 0.6); }
          .neon-title-glow-pulse { position: absolute; inset: 0; display: block; color: inherit; pointer-events: none; user-select: none; text-shadow: 0 0 10px rgba(0, 240, 255, 0.9), 0 0 20px rgba(15, 240, 252, 0.75); opacity: 0.55; will-change: opacity; animation: neon-title-glow-opacity 3s ease-in-out infinite; }
          @keyframes neon-title-glow-opacity { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
          @media (prefers-reduced-motion: reduce) { .neon-title-glow-pulse { animation: none; opacity: 0.55; } }
          .game-badge { font-weight: 700; font-size: 0.65rem; letter-spacing: 0.2em; color: #00F0FF; text-shadow: 0 0 8px rgba(0, 240, 255, 0.5); border: 1px solid rgba(0, 240, 255, 0.4); background: rgba(1, 15, 16, 0.85); padding: 6px 12px; border-radius: 4px; }
          .game-section-title { font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #F0F7F7; text-shadow: 0 0 20px rgba(0, 240, 255, 0.15); }
        ` }} />

      </head>

      <body
        className={`${dmSans.variable} ${kronaOne.variable} ${orbitron.variable} antialiased bg-[#010F10] w-full`}
      >
        <Script id="bfcache-reload" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: BFCACHE_RELOAD_SCRIPT }} />
        <Script
          id="minipay-site-redirect"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: buildMinipaySiteRedirectScript() }}
        />
        <MinipaySiteRedirect />
        <FarcasterReady />
        <ContextProvider cookies={cookies}>
            <TycoonProvider>
              <GuestAuthProvider>
              <ReferralCapture />
              <AppKitProviderWrapper>
                <QueryProvider>
                <MinipayAutoConnect />
                <BfcacheReloadGuard />
                <ClientLayout cookies={cookies}>
                  {children}
                </ClientLayout>

                <ScrollToTopBtn />
                <Toaster position="top-center" />
                </QueryProvider>
              </AppKitProviderWrapper>
              </GuestAuthProvider>
            </TycoonProvider>
        </ContextProvider>
      </body>
    </html>
  );
}