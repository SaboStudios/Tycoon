"use client";

import type { Address } from "viem";
import { useChainId, useReadContract } from "wagmi";
import { TYCOON_CONTRACT_ADDRESSES } from "@/constants/contracts";
import TycoonABI from "@/context/abi/tycoonabi.json";

/** Lightweight on-chain username read — avoids importing the full ContractProvider bundle. */
export function useGetUsername(address?: Address) {
  const chainId = useChainId();
  const contractAddress = TYCOON_CONTRACT_ADDRESSES[chainId];

  const result = useReadContract({
    address: contractAddress,
    abi: TycoonABI,
    functionName: "addressToUsername",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  return {
    data: result.data as string | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
