"use client";

import { useEffect, useState, useCallback } from "react";
import { socketService } from "@/lib/socket";
import { apiClient } from "@/lib/api";

export type OnlineUser = { userId?: number; username?: string | null; address?: string | null };

function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "")
    );
  } catch {
    return "";
  }
}

export interface UseOnlineUsersOptions {
  /** When false, skips API fetch and socket subscription (e.g. until client mounted). Default true. */
  enabled?: boolean;
  /** Optional identity for presence when username/id are already known (guest session). */
  userId?: number;
  username?: string | null;
}

export function useOnlineUsers(
  address: string | undefined,
  options: UseOnlineUsersOptions = {}
) {
  const { enabled = true, userId, username } = options;
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  const fetchOnlineFromApi = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiClient.get<{ users: OnlineUser[]; count: number } | { success?: boolean; data?: { users: OnlineUser[]; count: number } }>("/users/online");
      // apiClient wraps axios body as res.data; backend body is { success, data: { users, count } }
      const body = res?.data as { success?: boolean; data?: { users?: OnlineUser[]; count?: number }; users?: OnlineUser[]; count?: number } | undefined;
      const payload = body?.data ?? body;
      const users = payload?.users;
      const count = payload?.count;
      if (Array.isArray(users)) {
        setOnlineUsers(users);
        setOnlineCount(typeof count === "number" ? count : users.length);
      }
    } catch {
      // ignore
    }
  }, [enabled]);

  // Register presence when we have any identity and socket is ready
  useEffect(() => {
    if (!enabled) return;
    if (!address && userId == null && !username) return;
    const SOCKET_URL = getSocketUrl();
    if (!SOCKET_URL) return;
    try {
      const socket = socketService.connect(SOCKET_URL);
      const register = () => {
        const emitKnown = () => {
          socketService.registerLobbyPresence({
            userId: typeof userId === "number" ? userId : undefined,
            username: username?.trim() || undefined,
            address,
          });
        };

        if (address && userId == null && !username) {
          apiClient
            .get<{ id: number; username?: string }>(`/users/by-address/${address}?chain=Celo`)
            .then((res) => {
              const user = (res as { data?: { id?: number; username?: string } })?.data;
              socketService.registerLobbyPresence({
                userId: typeof user?.id === "number" ? user.id : undefined,
                username: user?.username ?? undefined,
                address,
              });
            })
            .catch(() => {
              socketService.registerLobbyPresence({ address });
            });
        } else {
          emitKnown();
        }
      };
      if (socket.connected) register();
      else socket.once("connect", register);
    } catch {
      // ignore socket errors (e.g. on mobile when not ready)
    }
  }, [enabled, address, userId, username]);

  // Subscribe to online-users and fetch once from API (only when enabled)
  useEffect(() => {
    if (!enabled) return;
    fetchOnlineFromApi();
    const handler = (data: { users?: OnlineUser[]; count?: number }) => {
      setOnlineUsers(Array.isArray(data?.users) ? data.users : []);
      setOnlineCount(typeof data?.count === "number" ? data.count : 0);
    };
    try {
      socketService.onOnlineUsers(handler);
    } catch {
      // ignore
    }
    return () => {
      try {
        socketService.removeListener("online-users", handler);
      } catch {
        // ignore
      }
    };
  }, [enabled, fetchOnlineFromApi]);

  return { onlineUsers, onlineCount };
}
