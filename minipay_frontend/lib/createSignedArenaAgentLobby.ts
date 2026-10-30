"use client";

import { parseEventLogs, type Address, type PublicClient } from "viem";
import { generateGameCode } from "@/lib/utils/games";
import { TYCOON_CONTRACT_ADDRESSES } from "@/constants/contracts";
import { sendMinipayAwareContractTx } from "@/lib/minipayContractWrite";
import { ensureMiniPayWalletReady } from "@/lib/minipayGuestFlow";
import TycoonABI from "@/context/abi/tycoonabi.json";

const STARTING_CASH = 1500n;
/** Must match backend ARENA_ONCHAIN_SLOT_SYMBOLS[0] */
const CHALLENGER_SYMBOL = "car";

function parseGameCreatedIdFromReceipt(
  logs: Parameters<typeof parseEventLogs>[0]["logs"]
): bigint | null {
  const parsed = parseEventLogs({
    abi: TycoonABI as never,
    logs,
    eventName: "GameCreated",
  });
  const gameId = (parsed[0] as { args?: { gameId?: bigint } } | undefined)?.args?.gameId;
  return gameId != null ? BigInt(gameId) : null;
}

type WriteContractAsync = (args: {
  address: Address;
  abi: typeof TycoonABI;
  functionName: "createGame";
  args: [string, string, string, number, string, bigint, bigint];
}) => Promise<`0x${string}`>;

/**
 * Challenger pays CELO for createGame (Agent vs Agent). Backend only joins opponents.
 */
export async function createSignedArenaAgentLobby(opts: {
  username: string;
  chainId: number;
  /** Total seats = 1 challenger + opponents */
  numberOfPlayers: number;
  publicClient: PublicClient;
  writeContractAsync: WriteContractAsync;
}): Promise<{ code: string; contractGameId: string }> {
  const { username, chainId, numberOfPlayers, publicClient, writeContractAsync } = opts;
  const n = Math.max(2, Math.min(8, Math.floor(Number(numberOfPlayers) || 2)));
  const contractAddress = TYCOON_CONTRACT_ADDRESSES[chainId as keyof typeof TYCOON_CONTRACT_ADDRESSES];
  if (!contractAddress) throw new Error("Game contract not available on this network");
  if (!username?.trim()) {
    throw new Error("Register your username on-chain (Home → Register) before starting Agent Arena");
  }

  await ensureMiniPayWalletReady();

  const code = generateGameCode();
  const hash = await sendMinipayAwareContractTx({
    to: contractAddress,
    abi: TycoonABI,
    functionName: "createGame",
    args: [username.trim(), "PRIVATE", CHALLENGER_SYMBOL, n, code, STARTING_CASH, 0n],
    writeContractAsync: writeContractAsync as never,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  const onChainGameId = parseGameCreatedIdFromReceipt(receipt.logs);
  if (onChainGameId == null) throw new Error("GameCreated event not found — check MiniPay CELO for gas");

  return { code, contractGameId: onChainGameId.toString() };
}
