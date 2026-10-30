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
