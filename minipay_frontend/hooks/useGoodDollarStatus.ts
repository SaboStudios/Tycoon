"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api";
import { useGuestAuthOptional } from "@/context/GuestAuthContext";
import { getGuestUserPlayAddress } from "@/lib/minipayGuestFlow";
import { walletAuthParams, type WalletChain } from "@/lib/walletSession";

export interface GoodDollarStatus {
  enabled: boolean;
  verified: boolean;
  /** Ops allowlist — may create games/Arena without G$ (not daily claim). */
  playGateExempt: boolean;
  /** Admin toggle — everyone may create games/Arena without G$ (not daily claim). */
  playOpenToAll: boolean;
  checkedAddresses: string[];
  verifyUrl: string;
}

interface RawResponse {
  data?: {
    success?: boolean;
    enabled?: boolean;
    verified?: boolean;
    play_gate_exempt?: boolean;
    play_open_to_all?: boolean;
    checkedAddresses?: unknown;
    verifyUrl?: string;
  };
}

function parse(res: unknown): GoodDollarStatus {
  const d = (res as RawResponse)?.data ?? {};
  const checked = Array.isArray(d.checkedAddresses)
    ? d.checkedAddresses.filter((a): a is string => typeof a === "string")
    : [];
  return {
    enabled: Boolean(d.enabled),
    verified: Boolean(d.verified),
    playGateExempt: Boolean(d.play_gate_exempt),
    playOpenToAll: Boolean(d.play_open_to_all),
    checkedAddresses: checked,
    verifyUrl: typeof d.verifyUrl === "string" ? d.verifyUrl : "https://goodid.gooddollar.org/",
  };
}

function hasBackendToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem("token")?.trim());
  } catch {
    return false;
  }
}

export interface UseGoodDollarStatusOptions {
  chain?: WalletChain;
  /** Optional override; otherwise resolved from wagmi → guest session (same as DailyClaim). */
  playAddress?: string | null;
}

/**
 * Mirrors DailyClaim's auth pattern: MiniPay guest/wallet sessions may lack a
 * JWT but have a play address, so `requireAuthOrWallet` is satisfied by the
 * `?address&chain` query params. Without them, the endpoint 401s and the card
 * flips to "Couldn't load" even though the server is live.
 */
export function useGoodDollarStatus(opts: UseGoodDollarStatusOptions = {}) {
  const chain: WalletChain = opts.chain ?? "CELO";
  const { address } = useAccount();
  const guestUser = useGuestAuthOptional()?.guestUser ?? null;

  const effectiveAddress = useMemo(() => {
    const fromProp = opts.playAddress?.trim();
    if (fromProp && /^0x[a-fA-F0-9]{40}$/i.test(fromProp)) return fromProp;
    const fromWagmi = address?.trim();
    if (fromWagmi && /^0x[a-fA-F0-9]{40}$/i.test(fromWagmi)) return fromWagmi;
    return getGuestUserPlayAddress(guestUser);
  }, [
    opts.playAddress,
    address,
    guestUser?.linked_wallet_address,
    guestUser?.smart_wallet_address,
    guestUser?.address,
  ]);

  const canCallApi = Boolean(effectiveAddress) || hasBackendToken();
  const walletKey = effectiveAddress ? `${effectiveAddress.toLowerCase()}:${chain}` : "no-wallet";

  const query = useQuery({
    queryKey: ["gooddollar", "status", walletKey],
    queryFn: async () => {
      const params = walletAuthParams(effectiveAddress ?? undefined, chain);
      return parse(await apiClient.get<unknown>("gooddollar/status", params ?? undefined));
    },
    staleTime: 60_000,
    enabled: canCallApi,
    retry: 1,
  });

  const errorStatus =
    query.error instanceof ApiError
      ? query.error.status
      : (query.error as { response?: { status?: number } } | undefined)?.response?.status;

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isUnauthorized: errorStatus === 401,
    canCallApi,
    refetch: query.refetch,
  };
}
