'use client';

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { formatUnits, type Address, type Abi } from 'viem';
import RewardABI from '@/context/abi/rewardabi.json';
import {
  balancesFromReadResults,
  buildBalanceOfCallsForHeldTokens,
  buildMergedHolderSlotCalls,
  mergeSlotScanResultsForHolders,
  REWARD_OWNED_SLOT_SCAN_CAP,
  sumBalances,
  uniqueHeldTokensFromSlotScan,
} from '@/lib/rewardOwnedEnumerable';

const VOUCHER_ID_START = 1_000_000_000n;
const COLLECTIBLE_ID_START = 2_000_000_000n;

function isVoucherToken(tokenId: bigint): boolean {
  return tokenId >= VOUCHER_ID_START && tokenId < COLLECTIBLE_ID_START;
}

export type MergedCollectibleRow = {
  tokenId: bigint;
  perk: number;
  strength: number;
  shopStock: number;
  heldBy: Address;
  /** ERC-1155 balance for this holder + token type (shop re-buys stack on the same id). */
  balance: number;
};

export type MergedVoucherRow = {
  tokenId: bigint;
  value: string;
  heldBy: Address;
  balance: number;
};

/**
 * Load ERC-1155-style reward "perks" and vouchers from every holder address (deduped).
 * Shop / Naira fulfillment mints to the connected MiniPay wallet while profile used to read only
 * linked/smart — pass connected + guest.address + linked via holderCandidates.
 *
 * Uses slot-scan `tokenOfOwnerByIndex` (not `ownedTokenCount`) so zero-balance zombie slots in _ownedIds
 * cannot hide later tokens on older contract deployments, then `balanceOf` for accurate counts.
 */
export function useMergedProfileRewardAssets(
  rewardAddress: Address | undefined,
  chainId: number | undefined,
  holderCandidates: (Address | undefined | null)[]
) {
  const holders = useMemo(() => {
    const out: Address[] = [];
    const seen = new Set<string>();
    for (const raw of holderCandidates) {
      if (!raw) continue;
      const a = raw as Address;
      const k = a.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(a);
    }
    return out;
  }, [holderCandidates]);

  const tokenCalls = useMemo(() => {
    if (!rewardAddress || holders.length === 0) return [];
    return buildMergedHolderSlotCalls(rewardAddress, RewardABI as Abi, holders, chainId, REWARD_OWNED_SLOT_SCAN_CAP);
  }, [rewardAddress, holders, chainId]);

  const tokenRes = useReadContracts({
    contracts: tokenCalls,
    query: { enabled: !!rewardAddress && holders.length > 0 },
  });

  const { tokenIds, heldBy } = useMemo(
    () => mergeSlotScanResultsForHolders(holders, tokenRes.data, REWARD_OWNED_SLOT_SCAN_CAP),
    [holders, tokenRes.data]
  );

  const heldTokens = useMemo(() => uniqueHeldTokensFromSlotScan(tokenIds, heldBy), [tokenIds, heldBy]);

  const balanceCalls = useMemo(() => {
    if (!rewardAddress || heldTokens.length === 0) return [];
    return buildBalanceOfCallsForHeldTokens(rewardAddress, RewardABI as Abi, heldTokens, chainId);
  }, [rewardAddress, heldTokens, chainId]);

  const balanceRes = useReadContracts({
    contracts: balanceCalls,
    query: { enabled: !!rewardAddress && heldTokens.length > 0 },
  });

  const heldBalances = useMemo(() => balancesFromReadResults(balanceRes.data), [balanceRes.data]);

  const collectibleBalances = useMemo(() => {
    return heldTokens
      .map((t, i) => ({ t, balance: heldBalances[i] ?? 0 }))
      .filter(({ t, balance }) => !isVoucherToken(t.tokenId) && balance > 0);
  }, [heldTokens, heldBalances]);

  const infoCalls = useMemo(
    () =>
      collectibleBalances.map(({ t }) => ({
        address: rewardAddress!,
        abi: RewardABI as Abi,
        functionName: 'getCollectibleInfo' as const,
        args: [t.tokenId] as const,
        ...(chainId != null ? { chainId } : {}),
      })),
    [rewardAddress, collectibleBalances, chainId]
  );

  const infoRes = useReadContracts({
    contracts: infoCalls,
    query: { enabled: collectibleBalances.length > 0 && !!rewardAddress },
  });

  const ownedCollectibles: MergedCollectibleRow[] = useMemo(() => {
    const rows: MergedCollectibleRow[] = [];
    infoRes.data?.forEach((res, i) => {
      if (res?.status !== 'success') return;
      const { t, balance } = collectibleBalances[i]!;
      const [perkNum, strength, , , shopStock] = res.result as [bigint, bigint, bigint, bigint, bigint];
      const perk = Number(perkNum);
      if (perk === 0) return;
      rows.push({
        tokenId: t.tokenId,
        perk,
        strength: Number(strength),
        shopStock: Number(shopStock),
        heldBy: t.holder,
        balance,
      });
    });
    return rows;
  }, [infoRes.data, collectibleBalances]);

  const totalCollectibleBalance = useMemo(
    () => sumBalances(ownedCollectibles.map((r) => r.balance)),
    [ownedCollectibles]
  );

  const voucherHeldTokens = useMemo(() => {
    return heldTokens
      .map((t, i) => ({ t, balance: heldBalances[i] ?? 0 }))
      .filter(({ t, balance }) => isVoucherToken(t.tokenId) && balance > 0);
  }, [heldTokens, heldBalances]);

  const voucherInfoCalls = useMemo(
    () =>
      voucherHeldTokens.map(({ t }) => ({
        address: rewardAddress!,
        abi: RewardABI as Abi,
        functionName: 'voucherRedeemValue' as const,
        args: [t.tokenId] as const,
        ...(chainId != null ? { chainId } : {}),
      })),
    [rewardAddress, voucherHeldTokens, chainId]
  );

  const voucherInfoRes = useReadContracts({
    contracts: voucherInfoCalls,
    query: { enabled: voucherHeldTokens.length > 0 && !!rewardAddress },
  });

  const myVouchers: MergedVoucherRow[] = useMemo(() => {
    return (
      voucherInfoRes.data
        ?.map((res, i) => {
          if (res?.status !== 'success') return null;
          const { t, balance } = voucherHeldTokens[i]!;
          return {
            tokenId: t.tokenId,
            value: formatUnits(res.result as bigint, 18),
            heldBy: t.holder,
            balance,
          };
        })
        .filter((v): v is MergedVoucherRow => v != null) ?? []
    );
  }, [voucherInfoRes.data, voucherHeldTokens]);

  const isLoadingPerks =
    (tokenCalls.length > 0 && tokenRes.isPending) ||
    (balanceCalls.length > 0 && balanceRes.isPending) ||
    (collectibleBalances.length > 0 && infoRes.isPending);

  const isLoadingVouchers =
    (tokenCalls.length > 0 && tokenRes.isPending) ||
    (balanceCalls.length > 0 && balanceRes.isPending) ||
    (voucherHeldTokens.length > 0 && voucherInfoRes.isPending);

  const refetchVouchers = async () => {
    await Promise.all([tokenRes.refetch(), balanceRes.refetch(), voucherInfoRes.refetch()]);
  };

  return {
    holders,
    ownedCollectibles,
    totalCollectibleBalance,
    myVouchers,
    isLoadingPerks,
    isLoadingVouchers,
    refetchVouchers,
  };
}
