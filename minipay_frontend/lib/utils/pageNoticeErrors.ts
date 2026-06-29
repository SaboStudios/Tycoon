import { showBoardNotice, type BoardNoticeSeverity } from "@/lib/boardNotice";
import { getContractErrorMessage, isUserRejectedTransaction } from "./contractErrors";

export const CANCELLED_TX_NOTICE = "You cancelled the transaction.";

type PageNoticeOptions = { severity?: BoardNoticeSeverity };

function showPageNotice(message: string, severity: BoardNoticeSeverity) {
  const msg = message.trim();
  if (!msg) return;
  console.warn("[page-notice]", msg);
  showBoardNotice(msg, severity);
}

/** Error feedback: notice strip (no error toasts). */
export function pageToastError(message: string, options?: PageNoticeOptions): void {
  showPageNotice(message, options?.severity ?? "error");
}

/** Info / guidance: notice strip. */
export function pageToastInfo(message: string): void {
  showPageNotice(message, "info");
}

/** Warnings: notice strip. */
export function pageToastWarning(message: string): void {
  showPageNotice(message, "warning");
}

/** Contract/API errors: notice strip. */
export function pageContractError(error: unknown, fallback: string): void {
  const msg = getContractErrorMessage(error, fallback).trim();
  if (!msg) return;
  console.warn("[page-notice]", error);
  showPageNotice(msg, "error");
}

/** Wallet cancel → info notice; real failures → error notice. */
export function pageTransactionOutcome(error: unknown, fallback: string): void {
  if (isUserRejectedTransaction(error)) {
    pageToastInfo(CANCELLED_TX_NOTICE);
    return;
  }
  const msg = getContractErrorMessage(error, fallback).trim();
  if (msg === CANCELLED_TX_NOTICE) {
    pageToastInfo(CANCELLED_TX_NOTICE);
    return;
  }
  pageContractError(error, fallback);
}
