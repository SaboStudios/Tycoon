/** MiniPay — apology banner after Jul 4 2026 roll / server outage (resolved). */

export const MINIPAY_SERVICE_RESTORED_DISMISS_KEY =
  "tycoon_minipay_service_restored_banner_dismissed";

export const MINIPAY_SERVICE_RESTORED_HEADLINE = "We're back on track";
export const MINIPAY_SERVICE_RESTORED_MESSAGE =
  "Sorry — some of you hit roll and game errors earlier today.";
export const MINIPAY_SERVICE_RESTORED_SUBLINE =
  "Everything is fixed now. Thanks for sticking with us!";

/** Hide automatically after this date (UTC). */
const SHOW_UNTIL_UTC = new Date("2026-07-11T23:59:59Z");

export const MINIPAY_SERVICE_RESTORED_UI_ENABLED = true;

export function isMinipayServiceRestoredBannerActive(now = new Date()): boolean {
  if (!MINIPAY_SERVICE_RESTORED_UI_ENABLED) return false;
  return now.getTime() <= SHOW_UNTIL_UTC.getTime();
}
