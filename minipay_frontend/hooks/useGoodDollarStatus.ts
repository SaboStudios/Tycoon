"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface GoodDollarStatus {
  enabled: boolean;
  verified: boolean;
  checkedAddresses: string[];
  verifyUrl: string;
}

interface RawResponse {
  data?: {
    success?: boolean;
    enabled?: boolean;
    verified?: boolean;
    checkedAddresses?: unknown;
    verifyUrl?: string;
  };
}

function parse(res: unknown): GoodDollarStatus {
  const d = (res as RawResponse)?.data ?? {};
  const checked = Array.isArray(d.checkedAddresses)
    ? d.checkedAddresses.filter((a): a is string => typeof a === "string")
    : [];
  return {
    enabled: Boolean(d.enabled),
    verified: Boolean(d.verified),
    checkedAddresses: checked,
    verifyUrl: typeof d.verifyUrl === "string" ? d.verifyUrl : "https://goodid.gooddollar.org/",
  };
}

/** Server caches identity reads for 60s, so matching the query stale-time avoids redundant RPC hits. */
export function useGoodDollarStatus(enabled: boolean = true) {
  const query = useQuery({
    queryKey: ["gooddollar", "status"],
    queryFn: async () => parse(await apiClient.get<unknown>("/gooddollar/status")),
    staleTime: 60_000,
    enabled,
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
