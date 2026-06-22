import { apiClient } from "@/lib/api";
import { User } from "@/lib/types/users";
import { ApiResponse } from "@/types/api";

type ApiLikeError = {
  status?: number;
  response?: { status?: number; data?: { message?: string; error?: string } };
  message?: string;
};

export type RegistrationConflictKind = "username-taken" | "finish-on-chain" | "generic";

const FINISH_ON_CHAIN_MSG =
  "Sign the registration transaction in your wallet to finish on-chain setup.";
const USERNAME_TAKEN_MSG = "This username is already taken. Please choose another one.";

function getErrorText(err: unknown): string {
  const e = err as ApiLikeError;
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    ""
  ).trim();
}

export function isRegistrationConflictError(err: unknown): boolean {
  const e = err as ApiLikeError;
  const msg = getErrorText(err);
  return (
    e?.status === 409 ||
    e?.response?.status === 409 ||
    /already exists|already registered|username.*taken|user.*exists/i.test(msg)
  );
}

function isUsernameConflictMessage(msg: string): boolean {
  return /username.*(taken|exists|already|in use)|taken.*username/i.test(msg);
}

function isAddressConflictMessage(msg: string): boolean {
  return /address.*(exists|already|registered)|wallet.*(exists|already|registered)/i.test(msg);
}

function addressesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function usernamesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Disambiguate 409 / conflict errors during wallet registration. */
export async function resolveRegistrationConflict(
  address: string,
  username: string,
  err: unknown,
  currentUser: User | null
): Promise<{ kind: RegistrationConflictKind; message: string }> {
  const errText = getErrorText(err);

  if (currentUser?.username && usernamesMatch(currentUser.username, username)) {
    return { kind: "finish-on-chain", message: FINISH_ON_CHAIN_MSG };
  }

  if (isUsernameConflictMessage(errText) && !isAddressConflictMessage(errText)) {
    try {
      const res = await apiClient.get<ApiResponse>(
        `/users/by-username/${encodeURIComponent(username)}?chain=Celo`
      );
      const owner = res?.data as User | undefined;
      if (owner && addressesMatch(owner.address, address)) {
        return { kind: "finish-on-chain", message: FINISH_ON_CHAIN_MSG };
      }
    } catch {
      // username lookup failed — still likely taken by someone else
    }
    return { kind: "username-taken", message: USERNAME_TAKEN_MSG };
  }

  if (isAddressConflictMessage(errText)) {
    return { kind: "finish-on-chain", message: FINISH_ON_CHAIN_MSG };
  }

  try {
    const [byAddr, byName] = await Promise.allSettled([
      apiClient.get<ApiResponse>(`/users/by-address/${address}?chain=Celo`),
      apiClient.get<ApiResponse>(
        `/users/by-username/${encodeURIComponent(username)}?chain=Celo`
      ),
    ]);

    const addrUser =
      byAddr.status === "fulfilled" && byAddr.value?.data
        ? (byAddr.value.data as User)
        : null;
    const nameUser =
      byName.status === "fulfilled" && byName.value?.data
        ? (byName.value.data as User)
        : null;

    if (nameUser && !addressesMatch(nameUser.address, address)) {
      return { kind: "username-taken", message: USERNAME_TAKEN_MSG };
    }

    if (addrUser) {
      if (!username || usernamesMatch(addrUser.username, username)) {
        return { kind: "finish-on-chain", message: FINISH_ON_CHAIN_MSG };
      }
      if (nameUser && !addressesMatch(nameUser.address, address)) {
        return { kind: "username-taken", message: USERNAME_TAKEN_MSG };
      }
    }
  } catch {
    // fall through
  }

  if (errText && !/^(already exists|already registered)$/i.test(errText)) {
    return { kind: "generic", message: errText };
  }

  return { kind: "finish-on-chain", message: FINISH_ON_CHAIN_MSG };
}
