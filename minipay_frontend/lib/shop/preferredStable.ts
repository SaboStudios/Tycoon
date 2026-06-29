export type MinipayStableSymbol = 'USDT';

export type MinipayStableOption = {
  symbol: MinipayStableSymbol;
  tokenAddress?: `0x${string}`;
  paymentToken: number;
  balance: number;
};

const USDT_FALLBACK: MinipayStableOption = {
  symbol: 'USDT',
  tokenAddress: undefined,
  paymentToken: 3,
  balance: 0,
};

/** MiniPay game shop is USDT-only — no cUSD/USDC toggle in the UI. */
export function getMinipayShopStable(usdt?: MinipayStableOption): MinipayStableOption {
  if (usdt?.tokenAddress) return usdt;
  return USDT_FALLBACK;
}

/** @deprecated Use getMinipayShopStable — kept for any legacy callers. */
export function pickMinipayPreferredStable(options: MinipayStableOption[]): MinipayStableOption {
  const usdt = options.find((s) => s.symbol === 'USDT' && s.tokenAddress);
  return getMinipayShopStable(usdt);
}
