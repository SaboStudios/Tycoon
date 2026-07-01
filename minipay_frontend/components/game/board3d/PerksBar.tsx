'use client';

import React, { useMemo } from "react";
import Image from "next/image";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import type { Address, Abi } from "viem";
import { Zap, Crown, Coins, Sparkles, Gem, Shield, Percent, CircleDollarSign, MapPin } from "lucide-react";
import RewardABI from "@/context/abi/rewardabi.json";
import { REWARD_CONTRACT_ADDRESSES } from "@/constants/contracts";
import { getPerkShopAsset } from "@/lib/perkShopAssets";
import {
  balancesFromReadResults,
  buildBalanceOfCallsForHeldTokens,
  buildMergedHolderSlotCalls,
  collectRewardHolderAddresses,
  mergeSlotScanResultsForHolders,
  REWARD_OWNED_SLOT_SCAN_CAP,
  sumBalances,
  uniqueHeldTokensFromSlotScan,
} from "@/lib/rewardOwnedEnumerable";

const COLLECTIBLE_ID_START = 2_000_000_000;

const PERK_ICONS: Record<number, React.ReactNode> = {
  1: <Zap className="w-4 h-4" />,
  2: <Crown className="w-4 h-4" />,
  3: <Coins className="w-4 h-4" />,
  4: <Sparkles className="w-4 h-4" />,
  5: <Gem className="w-4 h-4" />,
  6: <Zap className="w-4 h-4" />,
  7: <Shield className="w-4 h-4" />,
  8: <Coins className="w-4 h-4" />,
  9: <Gem className="w-4 h-4" />,
  10: <Sparkles className="w-4 h-4" />,
  11: <Percent className="w-4 h-4" />,
  12: <CircleDollarSign className="w-4 h-4" />,
  13: <Sparkles className="w-4 h-4" />,
  14: <MapPin className="w-4 h-4" />,
};

const PERK_NAMES: Record<number, string> = {
  1: "Extra Turn",
  2: "Jail Free",
  3: "Double Rent",
  4: "Roll Boost",
  5: "Instant Cash",
  6: "Teleport",
  7: "Shield",
  8: "Discount",
  9: "Tax Refund",
  10: "Exact Roll",
  11: "Rent Cashback",
  12: "Interest",
  13: "Lucky 7",
  14: "Free Parking Bonus",
};

interface PerksBarProps {
  onOpenModal: () => void;
  /** When set, clicking a perk activates it (burn + apply) instead of opening the modal. */
  onUsePerk?: (tokenId: bigint, perk: number, strength: number, name: string) => void;
  className?: string;
  /** All wallets that may hold perks (connected, guest, linked, smart). */
  userWalletAddresses?: string[];
  /**
   * Mobile 3D: render as a fixed strip above the bottom nav. Returns null when the wallet has no perk NFTs
   * (avoids duplicating the main “Perks” nav button).
   */
  dockAboveNav?: boolean;
}

export default function PerksBar({
  onOpenModal,
  onUsePerk,
  className = "",
  userWalletAddresses,
  dockAboveNav = false,
}: PerksBarProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = REWARD_CONTRACT_ADDRESSES[chainId as keyof typeof REWARD_CONTRACT_ADDRESSES] as Address | undefined;

  const holders = useMemo(
    () => collectRewardHolderAddresses(...(userWalletAddresses ?? []), address),
    [userWalletAddresses, address]
  );

  const tokenCalls = useMemo(() => {
    if (!contractAddress || holders.length === 0) return [];
    return buildMergedHolderSlotCalls(contractAddress, RewardABI as Abi, holders, chainId, REWARD_OWNED_SLOT_SCAN_CAP);
  }, [contractAddress, holders, chainId]);

  const { data: tokenResults } = useReadContracts({
    contracts: tokenCalls,
    query: { enabled: !!contractAddress && holders.length > 0 },
  });

  const { tokenIds, heldBy } = useMemo(
    () => mergeSlotScanResultsForHolders(holders, tokenResults, REWARD_OWNED_SLOT_SCAN_CAP),
    [holders, tokenResults]
  );

  const heldTokens = useMemo(() => uniqueHeldTokensFromSlotScan(tokenIds, heldBy), [tokenIds, heldBy]);

  const collectibleHeldTokens = useMemo(
    () => heldTokens.filter((t) => t.tokenId >= COLLECTIBLE_ID_START),
    [heldTokens]
  );

  const balanceCalls = useMemo(() => {
    if (!contractAddress || collectibleHeldTokens.length === 0) return [];
    return buildBalanceOfCallsForHeldTokens(contractAddress, RewardABI as Abi, collectibleHeldTokens, chainId);
  }, [contractAddress, collectibleHeldTokens, chainId]);

  const { data: balanceResults } = useReadContracts({
    contracts: balanceCalls,
    query: { enabled: !!contractAddress && collectibleHeldTokens.length > 0 },
  });

  const collectibleBalances = useMemo(() => {
    const balances = balancesFromReadResults(balanceResults);
    return collectibleHeldTokens
      .map((t, i) => ({ ...t, balance: balances[i] ?? 0 }))
      .filter((t) => t.balance > 0);
  }, [collectibleHeldTokens, balanceResults]);

  const infoCalls = useMemo(() => {
    if (!contractAddress || collectibleBalances.length === 0) return [];
    return collectibleBalances.map((t) => ({
      address: contractAddress,
      abi: RewardABI as Abi,
      functionName: "getCollectibleInfo" as const,
      args: [t.tokenId],
    }));
  }, [contractAddress, collectibleBalances]);

  const { data: infoResults } = useReadContracts({
    contracts: infoCalls,
    query: { enabled: collectibleBalances.length > 0 },
  });

  const perks = useMemo(() => {
    if (!infoResults || infoResults.length !== collectibleBalances.length) return [];
    return infoResults
      .map((res, i) => {
        if (res?.status !== "success") return null;
        const { tokenId, balance } = collectibleBalances[i]!;
        const arr = res.result as [bigint, bigint?, ...unknown[]];
        const perk = Number(arr?.[0]);
        if (Number.isNaN(perk) || perk < 1 || perk > 14) return null;
        const strength = arr?.[1] != null ? Number(arr[1]) : 1;
        return { perk, tokenId, strength, balance };
      })
      .filter((c): c is { perk: number; tokenId: bigint; strength: number; balance: number } => c !== null);
  }, [infoResults, collectibleBalances]);

  const totalPerkBalance = useMemo(() => sumBalances(perks.map((p) => p.balance)), [perks]);

  /** Group by perk + strength: count balances, keep first tokenId for activation */
  const perksGrouped = useMemo(() => {
    const byKey: Record<string, { count: number; tokenId: bigint; strength: number; perk: number }> = {};
    perks.forEach(({ perk, tokenId, strength, balance }) => {
      const key = `${perk}-${strength}`;
      if (!byKey[key]) byKey[key] = { count: balance, tokenId, strength, perk };
      else byKey[key].count += balance;
    });
    return Object.values(byKey);
  }, [perks]);

  if (holders.length === 0 || totalPerkBalance === 0) {
    if (dockAboveNav) return null;
    return (
      <button
        type="button"
        onClick={onOpenModal}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-500/40 bg-violet-950/30 text-violet-200/80 hover:bg-violet-900/40 hover:border-violet-400/50 transition-colors text-sm font-medium ${className}`}
        aria-label="View perks"
      >
        <Sparkles className="w-4 h-4" />
        <span>Perks</span>
      </button>
    );
  }

  const chips = (
    <>
      {perksGrouped.map(({ perk, count, tokenId, strength }) => (
        <button
          key={`${perk}-${strength}`}
          type="button"
          onClick={() => (onUsePerk ? onUsePerk(tokenId, perk, strength, PERK_NAMES[perk] ?? `Perk ${perk}`) : onOpenModal())}
          title={`${PERK_NAMES[perk] ?? `Perk ${perk}`}${count > 1 ? ` (×${count})` : ""}`}
          className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden border border-violet-400/50 bg-gradient-to-br from-violet-600/90 to-fuchsia-600/80 text-white hover:scale-105 hover:border-violet-300/70 active:scale-95 transition-transform shadow-md shrink-0"
        >
          {(() => {
            const asset = getPerkShopAsset(perk);
            if (asset) {
              return (
                <Image
                  src={asset.image}
                  alt={PERK_NAMES[perk] ?? asset.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              );
            }
            return PERK_ICONS[perk] ?? <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
          })()}
          {count > 1 && (
            <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-md bg-slate-900/95 border border-violet-400/60 text-[9px] font-bold text-violet-200 flex items-center justify-center">
              ×{count}
            </span>
          )}
        </button>
      ))}
    </>
  );

  if (dockAboveNav) {
    return (
      <div
        className="fixed left-0 right-0 z-[9997] px-2 py-1 bg-slate-950/95 backdrop-blur-md border-t border-slate-600/40"
        style={{ bottom: "72px" }}
      >
        <div className={`flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin] ${className}`} role="region" aria-label="Perks bar">
          {chips}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="region" aria-label="Perks bar">
      {chips}
    </div>
  );
}
