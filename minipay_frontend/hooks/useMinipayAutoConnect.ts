"use client";

import { useEffect, useState } from "react";
import { connect as wagmiConnect, disconnect, getAccount } from "@wagmi/core";
import { useAccount, useConnectors } from "wagmi";
import { getWagmiConfig } from "@/config";
import {
  authorizeMiniPayWallet,
  ensureInjectedMiniPayConnection,
  hasMiniPayProvider,
  isMiniPayEmbeddedWallet,
} from "@/lib/minipayGuestFlow";

/**
 * MiniPay requires auto-connect on page load — never rely on a manual connect button.
 * Do NOT auto-connect on desktop Chrome/Brave: Brave has built-in ethereum so a
 * blind injected()/WC fallback causes Chrome to hang on "Connecting" while Brave
 * happens to succeed.
 * @see https://docs.minipay.xyz/getting-started/wallet-connection.html
 */
export function useMinipayAutoConnect(): void {
  const connectors = useConnectors();
  const { address, connector } = useAccount();
  const [hasAttempted, setHasAttempted] = useState(false);

  // Drop persisted WalletConnect sessions inside MiniPay — they break raw sends.
  useEffect(() => {
    if (!hasMiniPayProvider()) return;

    const config = getWagmiConfig();
    const account = getAccount(config);
    if (account.isConnected && account.connector?.id !== "injected") {
      void (async () => {
        try {
          await disconnect(config);
          await ensureInjectedMiniPayConnection();
          await authorizeMiniPayWallet();
        } catch (err) {
          console.warn("MiniPay connector switch:", err);
        }
      })();
    }
  }, [connector?.id]);

  useEffect(() => {
    if (!hasMiniPayProvider()) return;
    void authorizeMiniPayWallet().catch((err) => {
      console.warn("MiniPay authorize on load:", err);
    });
  }, []);

  useEffect(() => {
    if (hasAttempted || address) return;

    let cancelled = false;
    let polls = 0;

    const attempt = async () => {
      // Wait briefly for MiniPay to inject ethereum (webview cold start).
      if (!hasMiniPayProvider()) {
        if (polls++ < 20) {
          window.setTimeout(() => {
            if (!cancelled) void attempt();
          }, 50);
        } else {
          setHasAttempted(true);
        }
        return;
      }

      if (!isMiniPayEmbeddedWallet()) {
        setHasAttempted(true);
        return;
      }

      try {
        // Prefer the AppKit-registered injected connector when available.
        const injectedConnector =
          connectors.find((c) => c.id === "injected") ??
          connectors.find((c) => c.type === "injected");

        if (injectedConnector) {
          const config = getWagmiConfig();
          const account = getAccount(config);
          if (!account.isConnected || account.connector?.id !== "injected") {
            if (account.isConnected) {
              try {
                await disconnect(config);
              } catch {
                // ignore
              }
            }
            await wagmiConnect(config, { connector: injectedConnector });
          }
        } else {
          await ensureInjectedMiniPayConnection();
        }
        await authorizeMiniPayWallet();
      } catch (err) {
        console.error("MiniPay auto-connect failed:", err);
      } finally {
        if (!cancelled) setHasAttempted(true);
      }
    };

    void attempt();
    return () => {
      cancelled = true;
    };
  }, [connectors, hasAttempted, address]);
}
