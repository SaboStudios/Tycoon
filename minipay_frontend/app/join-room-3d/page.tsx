"use client";

import JoinRoomMobile from "@/components/settings/join-room-mobile";
import { isMobileBoardViewport, MULTI_BOARD_DESKTOP, MULTI_BOARD_MOBILE } from "@/lib/boardRoutes";

const REDIRECT_WAITING = "/game-waiting-3d";
const REDIRECT_CREATE = "/game-settings-3d";

/** Join room for multiplayer 3D — board target respects desktop vs mobile viewport. */
export default function JoinRoom3DPage() {
  const redirectToBoard = isMobileBoardViewport() ? MULTI_BOARD_MOBILE : MULTI_BOARD_DESKTOP;

  return (
    <main className="w-full">
      <JoinRoomMobile
        redirectToBoard={redirectToBoard}
        redirectToWaiting={REDIRECT_WAITING}
        redirectCreateNew={REDIRECT_CREATE}
      />
    </main>
  );
}
