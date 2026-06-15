import { type Address, type Hash, type PublicClient } from 'viem';
import Erc20Abi from '@/context/abi/ERC20abi.json';

/** Max ERC-20 approval for perk shop flows — $10 at 6 decimals (USDC / cUSD / USDT). */
export const SHOP_APPROVAL_CAP = 10_000_000n;

export async function readErc20Allowance(
  publicClient: PublicClient,
  token: Address,
  owner: Address,
  spender: Address,
): Promise<bigint> {
  return publicClient.readContract({
    address: token,
    abi: Erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  }) as Promise<bigint>;
}

export async function waitForTxConfirmed(publicClient: PublicClient, hash: Hash): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted on-chain');
  }
}

type ApproveFn = (token: Address, spender: Address, amount: bigint) => Promise<Hash | void | undefined>;

/**
 * Reads allowance on-chain (not from React cache), approves if needed, and waits for confirmation.
 * Pass `approvalCap` for shop flows — approves up to the cap so users can buy multiple perks per session.
 */
export async function ensureErc20Allowance(options: {
  publicClient: PublicClient;
  token: Address;
  owner: Address;
  spender: Address;
  requiredAmount: bigint;
  approve: ApproveFn;
  /** Cap approval at this amount (e.g. SHOP_APPROVAL_CAP). Must be >= requiredAmount. */
  approvalCap?: bigint;
}): Promise<void> {
  const { publicClient, token, owner, spender, requiredAmount, approve, approvalCap } = options;

  const current = await readErc20Allowance(publicClient, token, owner, spender);
  if (current >= requiredAmount) return;

  let approveAmount = requiredAmount;
  if (approvalCap !== undefined) {
    if (requiredAmount > approvalCap) {
      throw new Error('Purchase exceeds the $10 approval limit. Buy in smaller amounts or approve again later.');
    }
    approveAmount = approvalCap;
  }

  const hash = await approve(token, spender, approveAmount);
  if (hash) {
    await waitForTxConfirmed(publicClient, hash);
  }
}
