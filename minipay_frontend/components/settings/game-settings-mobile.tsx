"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock3,
  Gamepad2,
  Gavel,
  Info,
  Landmark,
  LockOpen,
  Users,
  Wallet,
} from "lucide-react";
import { GiPrisoner } from "react-icons/gi";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { resolveChainForBackend } from "@/lib/utils/chain";
import { toast } from "react-toastify";
import { generateGameCode } from "@/lib/utils/games";
import { GamePieces } from "@/lib/constants/games";
import { apiClient } from "@/lib/api";
import Erc20Abi from "@/context/abi/ERC20abi.json";
import {
  useIsRegistered,
  useGetUsername,
  useCreateGame,
  useApprove,
  useStakeTokenAddress,
} from "@/context/ContractProvider";
import { useGuestAuthOptional } from "@/context/GuestAuthContext";
import { TYCOON_CONTRACT_ADDRESSES, MINIPAY_CHAIN_IDS } from "@/constants/contracts";
import { shouldUseBackendGuestGameFlow, ensureMiniPayWalletReady } from "@/lib/minipayGuestFlow";
import { Address, parseUnits } from "viem";
import { getContractErrorMessage } from "@/lib/utils/contractErrors";
import { usePreventDoubleSubmit } from "@/hooks/usePreventDoubleSubmit";

interface GameCreateResponse {
  data?: {
    data?: { id: string | number };
    id?: string | number;
  };
  id?: string | number;
}

const USDC_DECIMALS = 6;
const stakePresets = [1, 5, 10, 25, 50, 100];

const PIECE_EMOJI: Record<string, string> = {
  hat: "🎩",
  car: "🚗",
  dog: "🐕",
  thimble: "🔧",
  wheelbarrow: "🛒",
  battleship: "🚢",
  boot: "👢",
  iron: "♨️",
  top_hat: "🎩",
};

const STEPS = [
  { id: 1, label: "Loadout" },
  { id: 2, label: "Stakes" },
  { id: 3, label: "Rules" },
] as const;

const HOUSE_RULES = [
  {
    key: "auction" as const,
    label: "Auction unsold",
    hint: "If a player declines to buy, the property goes to auction among everyone else.",
    Icon: Gavel,
  },
  {
    key: "rentInPrison" as const,
    label: "Rent in jail",
    hint: "Players still collect rent from their properties while in jail.",
    Icon: GiPrisoner,
  },
  {
    key: "mortgage" as const,
    label: "Allow mortgages",
    hint: "Owners can mortgage properties for cash and unmortgage later with interest.",
    Icon: Landmark,
  },
  {
    key: "evenBuild" as const,
    label: "Even building",
    hint: "Houses must be built evenly across a color set — no stacking one tile first.",
    Icon: Building2,
  },
];

function CornerBrackets({ active }: { active?: boolean }) {
  const c = active ? "border-[#00D4FF]" : "border-[#00D4FF]/25";
  return (
    <>
      <span className={`pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 ${c}`} />
      <span className={`pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2 ${c}`} />
      <span className={`pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 ${c}`} />
      <span className={`pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 ${c}`} />
    </>
  );
}

function HudPanel({
  children,
  className = "",
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-[linear-gradient(160deg,rgba(8,24,40,0.95),rgba(4,12,22,0.92))] ${
        active
          ? "border-[#00D4FF]/55 shadow-[0_0_24px_rgba(0,212,255,0.18)]"
          : "border-[#00D4FF]/18"
      } ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.35) 3px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.12),transparent_55%)]" />
      <CornerBrackets active={active} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 font-orbitron text-[11px] font-bold uppercase tracking-[0.18em] text-[#00D4FF]/75">
      {children}
    </p>
  );
}

interface GameSettingsMobileProps {
  redirectToWaitingRoom?: string;
}

export default function CreateGameMobile({
  redirectToWaitingRoom = "/game-waiting-3d",
}: GameSettingsMobileProps = {}) {
  const router = useRouter();
  const { address } = useAccount();
  const wagmiChainId = useChainId();
  const guestAuth = useGuestAuthOptional();
  const isGuest = shouldUseBackendGuestGameFlow(guestAuth?.guestUser ?? null, address, wagmiChainId);

  const { data: username } = useGetUsername(address);
  const { data: isUserRegistered } = useIsRegistered(address);

  const isMiniPay = MINIPAY_CHAIN_IDS.includes(wagmiChainId);
  const chainName = resolveChainForBackend(wagmiChainId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isFreeGame, setIsFreeGame] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [hintKey, setHintKey] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    symbol: "hat",
    maxPlayers: 2,
    auction: true,
    rentInPrison: false,
    mortgage: true,
    evenBuild: true,
    startingCash: 1500,
    stake: 5,
    duration: 30,
  });

  const [customStake, setCustomStake] = useState<string>("");
  const [gameCode] = useState(() => generateGameCode());

  const contractAddress = TYCOON_CONTRACT_ADDRESSES[
    wagmiChainId as keyof typeof TYCOON_CONTRACT_ADDRESSES
  ] as Address | undefined;
  const { stakeTokenAddress, isLoading: stakeTokenLoading } = useStakeTokenAddress();

  const { data: stakeAllowance, refetch: refetchAllowance } = useReadContract({
    address: stakeTokenAddress,
    abi: Erc20Abi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: { enabled: !!address && !!stakeTokenAddress && !!contractAddress && !isFreeGame },
  });

  const gameType = "PUBLIC";

  const {
    approve: approveUSDC,
    isPending: approvePending,
    isConfirming: approveConfirming,
  } = useApprove();

  const finalStake = isFreeGame ? 0 : settings.stake;
  const stakeAmount = parseUnits(finalStake.toString(), USDC_DECIMALS);

  const { write: createGame, isPending: isCreatePending } = useCreateGame(
    username || "",
    gameType,
    settings.symbol,
    settings.maxPlayers,
    gameCode,
    BigInt(settings.startingCash),
    stakeAmount
  );

  const playGuard = usePreventDoubleSubmit();

  const handleStakeSelect = (value: number) => {
    if (isFreeGame) return;
    setSettings((prev) => ({ ...prev, stake: value }));
    setCustomStake("");
  };

  const handleCustomStake = (value: string) => {
    if (isFreeGame) return;
    setCustomStake(value);
    const num = Number(value);
    if (!Number.isNaN(num) && num >= 0.01) {
      setSettings((prev) => ({ ...prev, stake: num }));
    }
  };

  const extractGameId = (response: unknown): string | number | undefined => {
    if (typeof response === "string" || typeof response === "number") return response;
    const r = response as GameCreateResponse & {
      gameId?: string | number;
      data?: { game?: { id?: string | number } };
    };
    return (
      r?.data?.data?.id ?? r?.data?.id ?? r?.id ?? r?.gameId ?? r?.data?.game?.id
    );
  };

  const handlePlay = async () => {
    if (isStarting) return;
    setIsStarting(true);
    const toastId = toast.loading("Creating game...");

    try {
      await ensureMiniPayWalletReady();
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Connect your wallet in MiniPay, then try again.";
      toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 8000 });
      setIsStarting(false);
      return;
    }

    if (isGuest) {
      try {
        toast.update(toastId, { render: "Creating game (guest)..." });
        const res = await apiClient.post<GameCreateResponse>("/games/create-as-guest", {
          code: gameCode,
          mode: gameType,
          symbol: settings.symbol,
          number_of_players: settings.maxPlayers,
          stake: 0,
          starting_cash: settings.startingCash,
          is_ai: false,
          is_minipay: isMiniPay,
          chain: chainName,
          duration: settings.duration,
          use_usdc: false,
          settings: {
            auction: settings.auction,
            rent_in_prison: settings.rentInPrison,
            mortgage: settings.mortgage,
            even_build: settings.evenBuild,
            starting_cash: settings.startingCash,
          },
        });
        const dbGameId = extractGameId(res);
        if (!dbGameId) throw new Error("Backend did not return game ID");
        toast.update(toastId, {
          render: `Game created! Code: ${gameCode}`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
          onClose: () => router.push(`${redirectToWaitingRoom}?gameCode=${gameCode}`),
        });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
            ?.message ??
          (err as Error)?.message ??
          "Failed to create game.";
        toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 8000 });
      }
      setIsStarting(false);
      return;
    }

    if (!address || !username || !isUserRegistered) {
      toast.update(toastId, {
        render:
          "Connect your wallet and complete on-chain registration on the home page, then try again.",
        type: "error",
        isLoading: false,
        autoClose: 8000,
      });
      setIsStarting(false);
      return;
    }

    if (!contractAddress) {
      toast.update(toastId, {
        render: "Game contract not available on this network.",
        type: "error",
        isLoading: false,
      });
      setIsStarting(false);
      return;
    }

    if (!isFreeGame && (stakeTokenLoading || !stakeTokenAddress)) {
      toast.update(toastId, {
        render: "USDT not supported on current network.",
        type: "error",
        isLoading: false,
      });
      setIsStarting(false);
      return;
    }

    try {
      if (!isFreeGame) {
        toast.update(toastId, { render: "Checking USDT allowance..." });
        const allowanceResult = await refetchAllowance();
        const allowance = allowanceResult.data
          ? BigInt(allowanceResult.data.toString())
          : stakeAllowance
            ? BigInt(stakeAllowance.toString())
            : 0n;
        if (allowance < stakeAmount) {
          toast.update(toastId, { render: "Approving USDT (one-time)..." });
          await approveUSDC(stakeTokenAddress!, contractAddress, stakeAmount);
          await new Promise((r) => setTimeout(r, 4000));
          await refetchAllowance();
        }
      }

      toast.update(toastId, { render: "Creating game on-chain (sign in wallet)..." });
      const onChainGameId = await createGame();
      if (onChainGameId == null) throw new Error("Failed to create game on-chain");

      toast.update(toastId, { render: "Saving game to server..." });

      const saveRes = await apiClient.post<GameCreateResponse>("/games", {
        id: onChainGameId.toString(),
        code: gameCode,
        mode: gameType,
        address,
        symbol: settings.symbol,
        number_of_players: settings.maxPlayers,
        stake: finalStake,
        starting_cash: settings.startingCash,
        is_ai: false,
        is_minipay: isMiniPay,
        chain: chainName,
        duration: settings.duration,
        use_usdc: !isFreeGame,
        settings: {
          auction: settings.auction,
          rent_in_prison: settings.rentInPrison,
          mortgage: settings.mortgage,
          even_build: settings.evenBuild,
          starting_cash: settings.startingCash,
        },
      });

      const dbGameId = extractGameId(saveRes);
      if (!dbGameId) throw new Error("Backend did not return game ID");

      toast.update(toastId, {
        render: `Game created! Code: ${gameCode}`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        onClose: () => router.push(`${redirectToWaitingRoom}?gameCode=${gameCode}`),
      });
    } catch (err: unknown) {
      const message = getContractErrorMessage(err, "Failed to create game. Please try again.");
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 8000,
      });
    }
    setIsStarting(false);
  };

  const canCreate = isGuest || (address && username && isUserRegistered);
  const isLaunching =
    playGuard.isSubmitting || isStarting || approvePending || approveConfirming || (!isGuest && isCreatePending);

  const selectedPiece = GamePieces.find((p) => p.id === settings.symbol);
  const durationLabel =
    settings.duration === 0 ? "No limit" : `${settings.duration}m`;
  const stakeLabel = isGuest || isFreeGame ? "Free" : `${finalStake} USDT`;

  const summaryChips = useMemo(
    () => [
      {
        show: true,
        icon: PIECE_EMOJI[settings.symbol] ?? "🎲",
        text: selectedPiece?.name ?? settings.symbol,
      },
      { show: true, icon: <Users className="h-3 w-3" />, text: `${settings.maxPlayers}p` },
      {
        show: step >= 2,
        icon: <Wallet className="h-3 w-3" />,
        text: stakeLabel,
      },
      {
        show: step >= 2,
        icon: <Clock3 className="h-3 w-3" />,
        text: durationLabel,
      },
    ],
    [settings.symbol, settings.maxPlayers, settings.duration, selectedPiece, stakeLabel, durationLabel, step]
  );

  const canAdvanceStep2 = isGuest || isFreeGame || settings.stake >= 0.01;

  return (
    <div className="relative flex min-h-below-mobile-nav flex-col overflow-hidden bg-[#060d16]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(0,212,255,0.14),transparent_45%),radial-gradient(ellipse_at_90%_20%,rgba(30,90,180,0.12),transparent_40%),linear-gradient(180deg,#07111c_0%,#040a12_55%,#02060c_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.5) 4px)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-3">
        {/* Header + stepper */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => (step === 1 ? router.push("/") : setStep((s) => (s === 3 ? 2 : 1)))}
            className="mb-3 inline-flex min-h-11 items-center gap-2 font-dmSans text-sm text-[#7ec8d4] transition hover:text-[#00D4FF]"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Back to base" : "Previous step"}
          </button>

          <h1 className="font-orbitron text-2xl font-black uppercase tracking-wide text-white">
            <span className="bg-gradient-to-r from-[#00D4FF] via-[#6ec8ff] to-[#00D4FF] bg-clip-text text-transparent">
              Create Game
            </span>
          </h1>
          <p className="mt-1 font-dmSans text-xs text-[#8aa4b0]">
            Configure your on-chain match, then invite friends with a code.
          </p>

          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const current = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    disabled={s.id > step}
                    onClick={() => s.id < step && setStep(s.id)}
                    className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-1.5 transition ${
                      current
                        ? "border-[#00D4FF]/60 bg-[#00D4FF]/15 text-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.2)]"
                        : done
                          ? "border-[#00D4FF]/30 bg-[#00D4FF]/8 text-[#9ad8e4]"
                          : "border-white/10 bg-white/[0.03] text-[#5a7380]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-orbitron font-bold ${
                        current || done ? "bg-[#00D4FF] text-[#041018]" : "bg-white/10 text-[#7a93a0]"
                      }`}
                    >
                      {done ? "✓" : s.id}
                    </span>
                    <span className="truncate font-orbitron text-[10px] font-bold uppercase tracking-wider">
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px w-2 shrink-0 ${done || current ? "bg-[#00D4FF]/50" : "bg-white/10"}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Sticky summary */}
        <div className="sticky top-[var(--mobile-nav-offset)] z-20 -mx-1 mb-4 rounded-xl border border-[#00D4FF]/20 bg-[#07131c]/92 px-2 py-2 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5">
            {summaryChips
              .filter((c) => c.show)
              .map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#00D4FF]/20 bg-[#0a1a26]/80 px-2 font-dmSans text-[11px] text-[#c5e8ef]"
                >
                  <span className="opacity-90">{chip.icon}</span>
                  {chip.text}
                </span>
              ))}
            {step < 2 && (
              <span className="font-dmSans text-[10px] text-[#5a7380]">Stakes unlock on step 2</span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              <div>
                <SectionLabel>Your piece</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  {GamePieces.slice(0, 6).map((piece) => {
                    const selected = settings.symbol === piece.id;
                    return (
                      <motion.button
                        key={piece.id}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, symbol: piece.id }))}
                        whileTap={{ scale: 0.96 }}
                        className={`relative flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition ${
                          selected
                            ? "border-[#00D4FF] bg-[#00D4FF]/12 shadow-[0_0_20px_rgba(0,212,255,0.25)]"
                            : "border-[#00D4FF]/15 bg-[#0a1520]/70 hover:border-[#00D4FF]/35"
                        }`}
                      >
                        <CornerBrackets active={selected} />
                        <motion.span
                          animate={
                            selected
                              ? { scale: [1, 1.18, 1], y: [0, -3, 0] }
                              : { scale: 1, y: 0 }
                          }
                          transition={
                            selected
                              ? { duration: 0.55, repeat: Infinity, repeatDelay: 1.4 }
                              : { duration: 0.2 }
                          }
                          className="text-2xl drop-shadow-[0_0_8px_rgba(0,212,255,0.45)]"
                        >
                          {PIECE_EMOJI[piece.id]}
                        </motion.span>
                        <span className="font-dmSans text-[11px] font-medium capitalize text-[#c8e6ec]">
                          {piece.name.toLowerCase()}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {GamePieces.length > 6 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {GamePieces.slice(6).map((piece) => {
                      const selected = settings.symbol === piece.id;
                      return (
                        <button
                          key={piece.id}
                          type="button"
                          onClick={() => setSettings((p) => ({ ...p, symbol: piece.id }))}
                          className={`relative flex min-h-14 min-w-[72px] flex-col items-center justify-center rounded-lg border px-2 ${
                            selected
                              ? "border-[#00D4FF] bg-[#00D4FF]/12"
                              : "border-[#00D4FF]/15 bg-[#0a1520]/70"
                          }`}
                        >
                          <span className="text-lg">{PIECE_EMOJI[piece.id]}</span>
                          <span className="font-dmSans text-[10px] capitalize text-[#9ab8c0]">
                            {piece.name.toLowerCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Max players</SectionLabel>
                <HudPanel>
                  <div className="grid grid-cols-6 gap-1.5 p-3">
                    {[2, 3, 4, 5, 6, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, maxPlayers: num }))}
                        className={`relative flex min-h-11 items-center justify-center rounded-lg border font-orbitron text-sm font-bold transition ${
                          settings.maxPlayers === num
                            ? "border-[#00D4FF] bg-[#00D4FF]/20 text-[#00D4FF]"
                            : "border-white/10 bg-black/20 text-[#7a93a0]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1.5 px-3 pb-3">
                    {[...Array(7)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                          idx < settings.maxPlayers
                            ? "border-[#00D4FF]/50 bg-[#00D4FF]/10 text-[#00D4FF]"
                            : "border-white/5 bg-black/20 text-white/15"
                        }`}
                      >
                        👤
                      </div>
                    ))}
                  </div>
                </HudPanel>
              </div>

              <div>
                <SectionLabel>Starting cash</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[500, 1000, 1500, 2000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSettings((p) => ({ ...p, startingCash: amount }))}
                      className={`relative flex min-h-12 items-center justify-center gap-1.5 rounded-xl border font-dmSans text-sm font-semibold transition ${
                        settings.startingCash === amount
                          ? "border-[#00D4FF] bg-[#00D4FF]/15 text-[#e8fbff]"
                          : "border-[#00D4FF]/15 bg-[#0a1520]/70 text-[#8aa4b0]"
                      }`}
                    >
                      <CornerBrackets active={settings.startingCash === amount} />
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              <div>
                <SectionLabel>Game duration</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 30, label: "30 min" },
                    { value: 45, label: "45 min" },
                    { value: 60, label: "60 min" },
                    { value: 90, label: "90 min" },
                    { value: 0, label: "No limit" },
                  ].map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSettings((p) => ({ ...p, duration: d.value }))}
                      className={`relative flex min-h-11 items-center rounded-xl border px-3.5 font-dmSans text-sm transition ${
                        settings.duration === d.value
                          ? "border-[#00D4FF] bg-[#00D4FF]/15 text-[#00D4FF]"
                          : "border-[#00D4FF]/15 bg-[#0a1520]/70 text-[#8aa4b0]"
                      }`}
                    >
                      <CornerBrackets active={settings.duration === d.value} />
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Room access</SectionLabel>
                <HudPanel>
                  <div className="flex min-h-14 items-center gap-3 px-3.5 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/10 text-[#00D4FF]">
                      <LockOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-orbitron text-xs font-bold uppercase tracking-wider text-white">
                        Public
                      </p>
                      <p className="font-dmSans text-xs text-[#8aa4b0]">
                        Anyone with the invite code can join.
                      </p>
                    </div>
                  </div>
                </HudPanel>
              </div>

              {/* Free / Staked + inline stake */}
              <div>
                <SectionLabel>Entry & stake</SectionLabel>
                {isGuest ? (
                  <HudPanel active>
                    <div className="flex items-start gap-3 p-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-orbitron text-xs font-bold uppercase tracking-wider text-amber-200">
                          Guest games are free
                        </p>
                        <p className="mt-0.5 font-dmSans text-xs text-[#8aa4b0]">
                          Connect a wallet later if you want to host staked matches.
                        </p>
                      </div>
                    </div>
                  </HudPanel>
                ) : (
                  <HudPanel active={!isFreeGame}>
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFreeGame(true);
                            setCustomStake("");
                          }}
                          className={`relative flex min-h-12 flex-col items-center justify-center rounded-lg border transition ${
                            isFreeGame
                              ? "border-[#00D4FF] bg-[#00D4FF]/15 text-[#00D4FF]"
                              : "border-white/10 bg-black/25 text-[#7a93a0]"
                          }`}
                        >
                          <CornerBrackets active={isFreeGame} />
                          <span className="font-orbitron text-[11px] font-bold uppercase">Free</span>
                          <span className="font-dmSans text-[10px] opacity-80">No entry fee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFreeGame(false);
                            if (settings.stake < 0.01) {
                              setSettings((p) => ({ ...p, stake: 5 }));
                            }
                          }}
                          className={`relative flex min-h-12 flex-col items-center justify-center rounded-lg border transition ${
                            !isFreeGame
                              ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-300"
                              : "border-white/10 bg-black/25 text-[#7a93a0]"
                          }`}
                        >
                          <CornerBrackets active={!isFreeGame} />
                          <span className="font-orbitron text-[11px] font-bold uppercase">Staked</span>
                          <span className="font-dmSans text-[10px] opacity-80">USDT entry</span>
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isFreeGame ? (
                          <motion.p
                            key="free-note"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden text-center font-dmSans text-[11px] text-[#5a7380]"
                          >
                            No entry fee — play for fun.
                          </motion.p>
                        ) : (
                          <motion.div
                            key="stake-opts"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 grid grid-cols-3 gap-1.5">
                              {stakePresets.map((amount) => (
                                <button
                                  key={amount}
                                  type="button"
                                  onClick={() => handleStakeSelect(amount)}
                                  className={`flex min-h-11 items-center justify-center rounded-lg border font-orbitron text-sm font-bold transition ${
                                    settings.stake === amount && !customStake
                                      ? "border-amber-300 bg-gradient-to-br from-amber-300 to-amber-500 text-[#1a1200]"
                                      : "border-white/10 bg-black/30 text-[#c5d8e0]"
                                  }`}
                                >
                                  {amount}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Custom USDT"
                              value={customStake}
                              onChange={(e) => handleCustomStake(e.target.value)}
                              className="mt-2 min-h-11 w-full rounded-lg border border-emerald-500/40 bg-black/40 px-3 text-center font-dmSans text-sm text-white outline-none placeholder:text-[#5a7380] focus:border-emerald-400"
                            />
                            <p className="mt-1.5 text-center font-dmSans text-xs text-emerald-300/90">
                              Each player stakes {settings.stake} USDT
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </HudPanel>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.18em] text-[#00D4FF]/75">
                    House rules
                  </p>
                  <span className="inline-flex items-center gap-1 font-dmSans text-[10px] text-[#5a7380]">
                    <Info className="h-3 w-3" />
                    Tap (i) for details
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {HOUSE_RULES.map((rule) => {
                    const active = Boolean(settings[rule.key]);
                    const Icon = rule.Icon;
                    const open = hintKey === rule.key;
                    return (
                      <HudPanel key={rule.key} active={active}>
                        <div className="flex items-center gap-3 p-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg ${
                              active
                                ? "border-[#00D4FF]/40 bg-[#00D4FF]/15 text-[#00D4FF]"
                                : "border-white/10 bg-black/25 text-[#6a8490]"
                            }`}
                          >
                            {/* react-icons + lucide share className */}
                            <Icon className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-dmSans text-sm font-semibold text-[#e8f4f7]">
                                {rule.label}
                              </p>
                              <button
                                type="button"
                                aria-label={`About ${rule.label}`}
                                onClick={() => setHintKey(open ? null : rule.key)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#00D4FF]/25 text-[#00D4FF]/80"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <AnimatePresence>
                              {open && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-1 overflow-hidden font-dmSans text-[11px] leading-snug text-[#8aa4b0]"
                                >
                                  {rule.hint}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            onClick={() =>
                              setSettings((p) => ({ ...p, [rule.key]: !p[rule.key] }))
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition ${
                              active
                                ? "border-[#00D4FF] bg-gradient-to-r from-cyan-600 to-cyan-400"
                                : "border-white/15 bg-[#1a2430]"
                            }`}
                          >
                            <motion.span
                              animate={{ x: active ? 22 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 28 }}
                              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                            />
                          </button>
                        </div>
                      </HudPanel>
                    );
                  })}
                </div>
              </div>

              <HudPanel active>
                <div className="space-y-1.5 p-3.5 font-dmSans text-xs text-[#9ab8c0]">
                  <p className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-[#00D4FF]/80">
                    Match briefing
                  </p>
                  <p>
                    {selectedPiece?.name} · {settings.maxPlayers} players · ${settings.startingCash}{" "}
                    start · {durationLabel} · {stakeLabel} · Public room
                  </p>
                </div>
              </HudPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#00D4FF]/15 bg-[#060d16]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md gap-2">
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 2 && !canAdvanceStep2}
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#00D4FF]/50 bg-gradient-to-r from-[#00D4FF] to-[#3aa8ff] font-orbitron text-sm font-bold uppercase tracking-wide text-[#041018] shadow-[0_0_24px_rgba(0,212,255,0.35)] transition enabled:active:scale-[0.98] disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canCreate || isLaunching}
              onClick={() => playGuard.submit(() => handlePlay())}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#00D4FF]/60 bg-gradient-to-r from-[#00D4FF] to-[#3aa8ff] font-orbitron text-sm font-bold uppercase tracking-wide text-[#041018] shadow-[0_0_28px_rgba(0,212,255,0.4)] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLaunching ? "Loading…" : "Initiate Match"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
