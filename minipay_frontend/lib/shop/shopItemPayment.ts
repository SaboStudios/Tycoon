import { formatUnits } from 'viem';

export type ShopUsdtPurchase = {
  /** Shown on the perk card (USDT). */
  displayPrice: number;
  /** Exact wei the contract charges for PaymentToken.USDT (3). */
  purchasePriceWei: bigint | null;
  /** True when collectibleUsdtPrice on-chain is set. */
  usdtPriceOnChain: boolean;
  blockReason?: string;
};

export function resolveShopUsdtPurchase(options: {
  onChainUsdtPriceWei: bigint;
  onChainUsdcPriceWei: bigint;
  catalogUsdcPrice?: string;
}): ShopUsdtPurchase {
  const { onChainUsdtPriceWei, onChainUsdcPriceWei, catalogUsdcPrice } = options;

  if (onChainUsdtPriceWei > 0n) {
    const displayPrice = Number(formatUnits(onChainUsdtPriceWei, 6));
    return {
      displayPrice: Number.isFinite(displayPrice) ? displayPrice : 0,
      purchasePriceWei: onChainUsdtPriceWei,
      usdtPriceOnChain: true,
    };
  }

  const fallbackStr =
    catalogUsdcPrice && Number(catalogUsdcPrice) > 0
      ? catalogUsdcPrice
      : onChainUsdcPriceWei > 0n
        ? formatUnits(onChainUsdcPriceWei, 6)
        : '0';
  const displayPrice = Number(fallbackStr);

  return {
    displayPrice: Number.isFinite(displayPrice) ? displayPrice : 0,
    purchasePriceWei: null,
    usdtPriceOnChain: false,
    blockReason:
      'USDT price is not set on-chain for this perk yet. On tycoonworld.xyz/rewards, run “Sync USDT/cUSD prices from catalog”, then try again.',
  };
}
