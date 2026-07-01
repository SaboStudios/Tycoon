import type { Abi, Address } from 'viem';

/**
 * TycoonRewardSystem stores owner token types in _ownedIds[]. `ownedTokenCount(owner)` counts only
 * ids with balance &gt; 0, but `tokenOfOwnerByIndex(owner, i)` indexes the full array. After burns,
 * zero-balance ids could remain in older deployments, so count &lt; length and the UI would miss
 * later perks. Scanning slots until the first revert fixes reads without an upgraded contract.
 *
 * Each slot is one token *type*; ERC-1155 `balanceOf` can be &gt; 1 when the same shop stock id was
 * bought or delivered multiple times. UIs must read balances, not just slot count.
 */
export const REWARD_OWNED_SLOT_SCAN_CAP = 96;

type ReadContractResult = { status: string; result?: unknown };

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export type HeldTokenRef = { holder: Address; tokenId: bigint };

/** Dedupe holder addresses (connected, guest, linked, etc.) for reward inventory reads. */
export function collectRewardHolderAddresses(
  ...candidates: (Address | string | null | undefined)[]
): Address[] {
  const out: Address[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    if (!raw) continue;
    const trimmed = String(raw).trim();
    if (!trimmed || trimmed.toLowerCase() === ZERO_ADDR) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed as Address);
  }
  return out;
}

/** One entry per (holder, tokenId) from a slot scan (duplicate slots from merge are dropped). */
export function uniqueHeldTokensFromSlotScan(
  tokenIds: bigint[],
  heldBy: Address[]
): HeldTokenRef[] {
  const out: HeldTokenRef[] = [];
  const seen = new Set<string>();
  tokenIds.forEach((tokenId, i) => {
    const holder = heldBy[i];
    if (!holder) return;
    const key = `${holder.toLowerCase()}-${tokenId.toString()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ holder, tokenId });
  });
  return out;
}

export function buildBalanceOfCallsForHeldTokens(
  rewardAddress: Address,
  abi: Abi,
  heldTokens: HeldTokenRef[],
  chainId: number | undefined
) {
  return heldTokens.map(({ holder, tokenId }) => ({
    address: rewardAddress,
    abi,
    functionName: 'balanceOf' as const,
    args: [holder, tokenId] as const,
    ...(chainId != null ? { chainId } : {}),
  }));
}

export function balancesFromReadResults(results: ReadContractResult[] | undefined): number[] {
  if (!results) return [];
  return results.map((r) => {
    if (r?.status !== 'success') return 0;
    const n = Number(r.result as bigint);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
}

export function sumBalances(balances: number[]): number {
  return balances.reduce((sum, n) => sum + n, 0);
}

export function takeTokenIdsUntilFirstFailure(results: ReadContractResult[] | undefined): bigint[] {
  const out: bigint[] = [];
  if (!results) return out;
  for (const r of results) {
    if (r.status !== 'success') break;
    out.push(r.result as bigint);
  }
  return out;
}

export function buildTokenOfOwnerByIndexSlotCalls(
  rewardAddress: Address,
  abi: Abi,
  owner: Address,
  chainId: number | undefined,
  slotCap = REWARD_OWNED_SLOT_SCAN_CAP
) {
  const calls = [];
  for (let i = 0; i < slotCap; i++) {
    calls.push({
      address: rewardAddress,
      abi,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [owner, BigInt(i)] as const,
      ...(chainId != null ? { chainId } : {}),
    });
  }
  return calls;
}

/** One contiguous block of slot-scan results per holder, in holder order. */
export function mergeSlotScanResultsForHolders(
  holders: Address[],
  batchResults: ReadContractResult[] | undefined,
  slotCap = REWARD_OWNED_SLOT_SCAN_CAP
): { tokenIds: bigint[]; heldBy: Address[] } {
  const tokenIds: bigint[] = [];
  const heldBy: Address[] = [];
  if (!batchResults?.length || holders.length === 0) return { tokenIds, heldBy };

  let offset = 0;
  for (const owner of holders) {
    for (let i = 0; i < slotCap; i++) {
      const r = batchResults[offset + i];
      if (!r || r.status !== 'success') break;
      tokenIds.push(r.result as bigint);
      heldBy.push(owner);
    }
    offset += slotCap;
  }
  return { tokenIds, heldBy };
}

export function buildMergedHolderSlotCalls(
  rewardAddress: Address,
  abi: Abi,
  holders: Address[],
  chainId: number | undefined,
  slotCap = REWARD_OWNED_SLOT_SCAN_CAP
) {
  const calls = [];
  for (const owner of holders) {
    for (let i = 0; i < slotCap; i++) {
      calls.push({
        address: rewardAddress,
        abi,
        functionName: 'tokenOfOwnerByIndex' as const,
        args: [owner, BigInt(i)] as const,
        ...(chainId != null ? { chainId } : {}),
      });
    }
  }
  return calls;
}
