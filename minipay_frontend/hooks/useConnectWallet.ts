"use client";

import { useCallback, useRef } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useConnect, useConnectors } from "wagmi";
import { ensureAppKitInitialized } from "@/components/AppKitProviderWrapper";
import { isMiniPayEmbeddedWallet } from "@/lib/minipayGuestFlow";

function hasWindowEthereum(): boolean {
  if (typeof window === "undefined") return false;
  const eth = (window as Window & { ethereum?: { request?: unknown } }).ethereum;
  return typeof eth?.request === "function";
}

/**
 * Brave / MetaMask / MiniPay: use the registered injected connector.
 * Chrome (and any browser without window.ethereum): open Reown AppKit so the
 * user can pick WalletConnect / an installed wallet — calling injected() alone
 * hangs forever on "Connecting".
 *
 * Chrome extensions (Coinbase SDK, stale MetaMask, Phantom shim) can inject
 * window.ethereum but never answer eth_requestAccounts. Race the injected
 * connect against this timeout so we fall through to AppKit instead of hanging.
 */
const INJECTED_CONNECT_TIMEOUT_MS = 6000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(label)), ms),
    ),
  ]);
}

export function useConnectWallet() {
  const { connect, connectAsync } = useConnect();
  const connectors = useConnectors();
  const { open } = useAppKit();
  const connectingRef = useRef(false);

  return useCallback(async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;

    try {
      const injectedConnector =
        connectors.find((c) => c.id === "injected") ??
        connectors.find((c) => c.type === "injected");

      const preferInjected =
        isMiniPayEmbeddedWallet() || hasWindowEthereum();
      const timeoutMs = isMiniPayEmbeddedWallet()
        ? 0
        : INJECTED_CONNECT_TIMEOUT_MS;

      if (preferInjected && injectedConnector) {
        try {
          const connectPromise = connectAsync({ connector: injectedConnector });
          if (timeoutMs > 0) {
            await withTimeout(connectPromise, timeoutMs, "injected-timeout");
          } else {
            await connectPromise;
          }
          return;
        } catch (err) {
          // User rejection / unresponsive provider / no accounts —
          // fall through to AppKit on desktop so user can pick WalletConnect.
          if (isMiniPayEmbeddedWallet()) {
            console.warn("MiniPay injected connect failed:", err);
            return;
          }
          console.warn("Injected connect failed, opening AppKit:", err);
        }
      }

      if (preferInjected && !injectedConnector) {
        // Rare: ethereum present but AppKit hasn't registered injected yet.
        const { injected } = await import("wagmi/connectors");
        try {
          const connectPromise = connectAsync({ connector: injected() });
          if (timeoutMs > 0) {
            await withTimeout(connectPromise, timeoutMs, "injected-timeout");
          } else {
            await connectPromise;
          }
          return;
        } catch (err) {
          if (isMiniPayEmbeddedWallet()) {
            console.warn("MiniPay injected() connect failed:", err);
            return;
          }
          console.warn("Fallback injected() failed, opening AppKit:", err);
        }
      }

      ensureAppKitInitialized();
      await open({ view: "Connect" });
    } catch (err) {
      console.error("Connect wallet failed:", err);
      // Last resort: try wagmi connect with whatever we have
      const fallback =
        connectors.find((c) => c.id === "injected") ?? connectors[0];
      if (fallback) {
        connect({ connector: fallback });
      }
    } finally {
      // Allow a retry after AppKit / extension UI settles
      window.setTimeout(() => {
        connectingRef.current = false;
      }, 800);
    }
  }, [connect, connectAsync, connectors, open]);
}
