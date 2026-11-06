"use client";

/**
 * Backend returns 403 { success: false, code: "GOODID_REQUIRED", message, verifyUrl }
 * when a MiniPay play action hits the GoodDollar humanity gate. This helper
 * detects that shape across axios/ApiError/plain-object error flavours and
 * surfaces the Verify modal via a window event, so hooks don't need to import
 * UI code directly.
 */

export const GOODDOLLAR_VERIFY_EVENT = "tycoon:gooddollar-verify-required";

export interface GoodDollarVerifyDetail {
  verifyUrl: string;
  message?: string;
}

interface MaybeGoodIdError {
  status?: number;
  data?: { code?: string; message?: string; verifyUrl?: string };
  response?: { status?: number; data?: { code?: string; message?: string; verifyUrl?: string } };
  code?: string;
  verifyUrl?: string;
  message?: string;
}

export function extractGoodDollarVerify(err: unknown): GoodDollarVerifyDetail | null {
  if (!err || typeof err !== "object") return null;
  const e = err as MaybeGoodIdError;
  const status = e.status ?? e.response?.status;
  const data = e.response?.data ?? e.data ?? null;
  const code = data?.code ?? e.code;
  if (status !== 403 || code !== "GOODID_REQUIRED") return null;
  const verifyUrl = data?.verifyUrl || e.verifyUrl || "https://goodid.gooddollar.org/";
  const message = data?.message || e.message;
  return { verifyUrl, message };
}

export function promptGoodDollarVerify(detail: GoodDollarVerifyDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GoodDollarVerifyDetail>(GOODDOLLAR_VERIFY_EVENT, { detail }));
}

/** Convenience: if the error is a GOODID_REQUIRED 403, open the modal and return true. */
export function handleGoodDollarVerifyError(err: unknown): boolean {
  const detail = extractGoodDollarVerify(err);
  if (!detail) return false;
  promptGoodDollarVerify(detail);
  return true;
}

/** Shape of GET /gooddollar/status used by create-game / Arena pre-checks. */
export type GoodDollarPlayStatus = {
  enabled?: boolean;
  verified?: boolean;
  play_gate_exempt?: boolean;
  /** Admin System Settings: open play without Face Verification. */
  play_open_to_all?: boolean;
  verifyUrl?: string;
  message?: string;
};

/**
 * True when MiniPay may create games / Arena matches without prompting Verify.
 * Allowlisted ops wallets return play_gate_exempt; admin can set play_open_to_all.
 */
export function canCreateWithoutGoodDollar(gd: GoodDollarPlayStatus | null | undefined): boolean {
  if (!gd) return false;
  if (gd.enabled === false) return true;
  if (gd.play_open_to_all === true) return true;
  if (gd.verified === true) return true;
  if (gd.play_gate_exempt === true) return true;
  return false;
}
