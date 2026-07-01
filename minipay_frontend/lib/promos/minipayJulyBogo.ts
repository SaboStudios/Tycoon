/** MiniPay July 2026 — buy one perk, get one free (backend BOGO). */

export const MINIPAY_JULY_BOGO_MONTH_KEY = '2026-07';

export const MINIPAY_JULY_BOGO_HEADLINE = 'July bonus';
export const MINIPAY_JULY_BOGO_MESSAGE = 'Buy one perk, get one free';
export const MINIPAY_JULY_BOGO_SUBLINE = 'Every perk purchase this month — USDT or Naira.';
export const MINIPAY_JULY_BOGO_CTA = 'Shop perks';
export const MINIPAY_JULY_BOGO_SHOP_HREF = '/game-shop';

export const MINIPAY_JULY_BOGO_DISMISS_KEY = 'tycoon_minipay_july_bogo_promo_dismissed';

/** Set false after July 2026 to hide promo UI (BOGO backend can be disabled separately). */
export const MINIPAY_JULY_BOGO_PROMO_UI_ENABLED = true;

export function isMinipayJulyBogoPromoActive(now = new Date()): boolean {
  if (!MINIPAY_JULY_BOGO_PROMO_UI_ENABLED) return false;
  return (
    now.getUTCFullYear() === 2026 &&
    now.getUTCMonth() === 6 // July (0-indexed)
  );
}
