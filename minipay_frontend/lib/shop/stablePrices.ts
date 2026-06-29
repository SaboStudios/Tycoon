import type { MinipayStableSymbol } from '@/lib/shop/preferredStable';

/** When cUSD/USDT prices were not set at stock time, mirror the USDC list price for display. */
export function normalizeShopStablePrices(usdcPrice: string, cusdcPrice: string, usdtPrice: string) {
  const base = usdcPrice || '0';
  const usdcNum = Number(base);
  const cusdc = Number(cusdcPrice) > 0 ? cusdcPrice : base;
  const usdt = Number(usdtPrice) > 0 ? usdtPrice : base;
  return { usdcPrice: base, cusdcPrice: cusdc, usdtPrice: usdt, hasUsdcListPrice: Number.isFinite(usdcNum) && usdcNum > 0 };
}

export function shopPriceForStable(
  item: { usdcPrice: string; cusdcPrice: string; usdtPrice: string },
  symbol: MinipayStableSymbol | 'USDC'
): number {
  const norm = normalizeShopStablePrices(item.usdcPrice, item.cusdcPrice, item.usdtPrice);
  const raw =
    symbol === 'CUSDC' ? norm.cusdcPrice : symbol === 'USDT' ? norm.usdtPrice : norm.usdcPrice;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
