/** In-game cash granted per Instant Cash perk strength (index = strength). */
export const INSTANT_CASH_TIER_AMOUNTS = [0, 100, 250, 500, 700, 1000] as const;

export function getInstantCashAmount(strength: number): number {
  const idx = Math.min(Math.max(1, strength), INSTANT_CASH_TIER_AMOUNTS.length - 1);
  return INSTANT_CASH_TIER_AMOUNTS[idx];
}

export function formatInstantCashUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function instantCashShopName(strength: number): string {
  return `Instant Cash — ${formatInstantCashUsd(getInstantCashAmount(strength))}`;
}

export function instantCashShopDescription(strength: number): string {
  const amount = formatInstantCashUsd(getInstantCashAmount(strength));
  return `Use on your turn in a game to add ${amount} to your balance right away. Single use — removed after you activate it.`;
}

/** Fallback when strength is unknown (e.g. static perk list). */
export const INSTANT_CASH_SHOP_SUMMARY =
  'Use on your turn in a game for an instant cash boost. Tiers pay $100, $250, $500, $700, or $1,000. Single use per perk.';

export function instantCashTierBadge(strength: number): string {
  return formatInstantCashUsd(getInstantCashAmount(strength));
}
