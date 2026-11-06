/** Viewport breakpoint for MiniPay board routing (matches main app). */
export const BOARD_MOBILE_BREAKPOINT_PX = 768;

export function isMobileBoardViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth <= BOARD_MOBILE_BREAKPOINT_PX;
}

/** Solo / AI / Arena board path for the current viewport. */
export function soloBoardPath(gameCode: string, extra = ""): string {
  const q = `gameCode=${encodeURIComponent(gameCode)}${extra}`;
  return isMobileBoardViewport() ? `/board-3d-mobile?${q}` : `/board-3d?${q}`;
}

/** Multiplayer board path for the current viewport. */
export function multiBoardPath(gameCode: string, extra = ""): string {
  const q = `gameCode=${encodeURIComponent(gameCode)}${extra}`;
  return isMobileBoardViewport() ? `/board-3d-multi-mobile?${q}` : `/board-3d-multi?${q}`;
}

export const SOLO_BOARD_DESKTOP = "/board-3d";
export const SOLO_BOARD_MOBILE = "/board-3d-mobile";
export const MULTI_BOARD_DESKTOP = "/board-3d-multi";
export const MULTI_BOARD_MOBILE = "/board-3d-multi-mobile";
