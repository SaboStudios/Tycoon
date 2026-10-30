"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Gamepad2,
  Zap,
  Trophy,
  Target,
  Bot,
  Sparkles,
  X,
  Info,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { celo } from "wagmi/chains";
import { USDC_TOKEN_ADDRESS } from "@/constants/contracts";
import styles from "./arena-revamp.module.css";
import type { DiscoverAgent } from "./map-api-agents";
import { ArenaYourAgent } from "./ArenaYourAgent";
import { ArenaOpponents } from "./ArenaOpponents";
import { ArenaMatchSettings, stakeIsInsufficient } from "./ArenaMatchSettings";

export type ArenaTab = "discover" | "challenges" | "leaderboard" | "tournaments" | "my-agents";
export type MatchType = "agentVsAi" | "agentVsAgent";

export interface ArenaRevampAgent {
  id: number;
  name: string;
  username?: string;
}

export interface ArenaRevampPageProps {
  activeTab: ArenaTab;
  onTabChange: (tab: ArenaTab) => void;
  isAuthed: boolean;
  /** True while we're resolving the backend session. UI shows a skeleton (never a sign-in CTA). */
  authLoading?: boolean;
  myAgents: ArenaRevampAgent[];
  discoverAgents: DiscoverAgent[];
  selectedOpponentIds: number[];
  onToggleOpponent: (id: number) => void;
  onReplaceOpponents: (ids: number[]) => void;
  maxOpponentSlots: number;
  /** Staked matches force 1v1 selection + hint in opponents panel. */
  stakedOneVOne?: boolean;
  challengerAgentId: number | null;
  onChallengerChange: (id: number) => void;
  stakeAmount: string;
  onStakeChange: (v: string) => void;
  matchType: MatchType;
  onMatchTypeChange: (t: MatchType) => void;
  onLaunch: () => void;
  isLaunching: boolean;
  loading?: boolean;
  tabPanels?: Partial<Record<ArenaTab, React.ReactNode>>;
  error?: string | null;
  onDismissError?: () => void;
  onAgentCreated?: (agent: { id: number; name: string }) => void;
  onRefreshMyAgents?: () => void;
  playerUsername?: string | null;
}

const TABS: {
  id: ArenaTab;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: "discover", label: "Play", description: "Pick your agent, choose opponents, start a match.", icon: Gamepad2 },
  { id: "my-agents", label: "My Agents", description: "Create agents and set how they play.", icon: Bot },
  { id: "challenges", label: "Spend", description: "Advanced: agents that approved your wallet to spend USDC.", icon: Zap },
  { id: "leaderboard", label: "Rankings", description: "See which agents win the most arena matches.", icon: Trophy },
  { id: "tournaments", label: "Tournaments", description: "Bracket events with USDC prizes (when available).", icon: Target },
];

const TIP_KEY = "tycoon-arena-tip-dismissed";

function stepPills(step1Done: boolean, step2Done: boolean) {
  const current = !step1Done ? 1 : !step2Done ? 2 : 3;
  return [1, 2, 3].map((n) => ({ n, state: n < current ? "done" : n === current ? "current" : "todo" }));
}

export function ArenaRevampPage({
  activeTab,
  onTabChange,
  isAuthed,
  authLoading = false,
  myAgents,
  discoverAgents,
  selectedOpponentIds,
  onToggleOpponent,
  onReplaceOpponents,
  maxOpponentSlots,
  stakedOneVOne = false,
  challengerAgentId,
  onChallengerChange,
  stakeAmount,
  onStakeChange,
  matchType,
  onMatchTypeChange,
  onLaunch,
  isLaunching,
  loading,
  tabPanels,
  error,
  onDismissError,
  onAgentCreated,
  onRefreshMyAgents,
  playerUsername,
}: ArenaRevampPageProps) {
  const [tipDismissed, setTipDismissed] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      setTipDismissed(localStorage.getItem(TIP_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const dismissTip = useCallback(() => {
    setTipDismissed(true);
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const playingAsOptions = useMemo(
    () => myAgents.map((a) => ({ id: a.id, label: a.name })),
    [myAgents]
  );

  useEffect(() => {
    if (challengerAgentId == null && playingAsOptions.length > 0) {
      onChallengerChange(playingAsOptions[0].id);
    }
  }, [challengerAgentId, playingAsOptions, onChallengerChange]);

  const hasAgent = myAgents.length > 0;
  const hasOpponents = selectedOpponentIds.length > 0;

  const { address } = useAccount();
  const usdcAddress = USDC_TOKEN_ADDRESS[celo.id];
  const balance = useBalance({
    address: address as `0x${string}` | undefined,
    token: usdcAddress as `0x${string}` | undefined,
    chainId: celo.id,
    query: { enabled: !!address && !!usdcAddress && activeTab === "discover" },
  });
  const balanceNum = balance.data ? Number(balance.data.value) / 10 ** balance.data.decimals : null;
  const stakeInsufficient = stakeIsInsufficient(stakeAmount, balanceNum);

  const canLaunch = hasAgent && hasOpponents && !isLaunching && !stakeInsufficient;
  const step1Done = hasAgent;
  const step2Done = hasOpponents;

  const launchHint =
    !hasAgent
      ? "Create an agent to continue"
      : !hasOpponents
        ? "Pick at least one opponent"
        : stakeInsufficient
          ? "Not enough USDC for this stake"
          : null;

  const launchLabel = isLaunching
    ? "Starting match…"
    : !hasAgent
      ? "Create an agent"
      : !hasOpponents
        ? "Pick an opponent"
        : stakeInsufficient
          ? "Top up USDC"
          : "Start match →";

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;
  const pageRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback(
    (tab: ArenaTab) => {
      onTabChange(tab);
      pageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onTabChange]
  );

  const openConfirm = useCallback(() => {
    if (!canLaunch) return;
    setConfirmOpen(true);
  }, [canLaunch]);

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const confirmLaunch = useCallback(() => {
    setConfirmOpen(false);
    onLaunch();
  }, [onLaunch]);

  const pills = stepPills(step1Done, step2Done);
  const stakeNum = stakeAmount.trim() ? parseFloat(stakeAmount) : 0;
  const stakeDisplay = stakeNum > 0 ? `$${stakeNum} USDC` : "Free";
  const challengerName = myAgents.find((a) => a.id === challengerAgentId)?.name;
  const opponentNames = discoverAgents
    .filter((a) => selectedOpponentIds.includes(a.id))
    .map((a) => a.name);

  return (
    <div className={[styles.shell, activeTab === "discover" ? styles.shellWithDock : ""].filter(Boolean).join(" ")}>
      <div className={styles.page} ref={pageRef}>
        <header className={styles.header}>
          <h1 className={styles.title}>Agent Arena</h1>
          <p className={styles.subtitle}>Your AI agents battle other agents in Monopoly-style matches on Celo.</p>
        </header>

        {!tipDismissed && activeTab === "discover" ? (
          <div className={styles.tipRow} role="note">
            <Info aria-hidden className={styles.tipIcon} />
            <span className={styles.tipText}>New here? Pick your agent, choose opponents, start a match — all on this screen.</span>
            <button type="button" onClick={dismissTip} className={styles.tipDismiss} aria-label="Dismiss tip">
              <X aria-hidden />
            </button>
          </div>
        ) : null}

        <nav className={styles.navSticky} aria-label="Arena navigation">
          <div className={styles.tabs} role="tablist" aria-label="Arena sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`arena-panel-${t.id}`}
                  id={`arena-tab-${t.id}`}
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => handleTabChange(t.id)}
                >
                  <Icon className={styles.tabIcon} aria-hidden />
                  <span className={styles.tabLabel}>{t.label}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.tabDescription}>{activeTabMeta.description}</p>
        </nav>

        <div className={styles.body}>
          {error ? (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle aria-hidden className={styles.errorIcon} />
              <span className={styles.errorMessage}>{error}</span>
              {onDismissError ? (
                <button type="button" onClick={onDismissError} className={styles.errorDismiss} aria-label="Dismiss">
                  <X aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "discover" ? (
            authLoading && !hasAgent ? (
              <div className={styles.skeletonStack}>
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
              </div>
            ) : (
              <>
                <ArenaYourAgent
                  agents={playingAsOptions}
                  challengerAgentId={challengerAgentId}
                  onChallengerChange={onChallengerChange}
                  playerUsername={playerUsername}
                  matchType={matchType}
                  onCreated={(agent) => {
                    onAgentCreated?.(agent);
                    onRefreshMyAgents?.();
                  }}
                />

                {hasAgent ? (
                  <>
                    {/* Mode first — buried under opponents, users missed "You vs Agent" and rolled themselves */}
                    <ArenaMatchSettings
                      matchType={matchType}
                      onMatchTypeChange={onMatchTypeChange}
                      stake={stakeAmount}
                      onStakeChange={onStakeChange}
                    />
                    <ArenaOpponents
                      discoverAgents={discoverAgents}
                      loading={loading}
                      selectedIds={selectedOpponentIds}
                      maxSlots={maxOpponentSlots}
                      onToggle={onToggleOpponent}
                      onReplace={onReplaceOpponents}
                      stakedOneVOne={stakedOneVOne}
                    />
                  </>
                ) : null}
              </>
            )
          ) : (
            <section
              id={`arena-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`arena-tab-${activeTab}`}
              className={styles.panel}
            >
              {tabPanels?.[activeTab] ?? <p className={styles.inlineEmpty}>Nothing here yet.</p>}
            </section>
          )}
        </div>
      </div>

      {activeTab === "discover" ? (
        <div className={styles.launchDock} role="region" aria-label="Start match">
          <div className={styles.launchDockInner}>
            <ol className={styles.pillTrack} aria-label="Progress">
              {pills.map((p) => (
                <li
                  key={p.n}
                  className={
                    p.state === "done" ? styles.pillDone : p.state === "current" ? styles.pillCurrent : styles.pill
                  }
                  aria-current={p.state === "current" ? "step" : undefined}
                >
                  {p.n}
                </li>
              ))}
            </ol>
            <div className={styles.launchDockText}>
              {launchHint ? (
                <span className={styles.launchDockHint}>{launchHint}</span>
              ) : (
                <span className={styles.launchDockHint}>
                  {matchType === "agentVsAgent" ? "Agents auto-play" : "You roll"} ·{" "}
                  {selectedOpponentIds.length} opponent{selectedOpponentIds.length !== 1 ? "s" : ""} · {stakeDisplay}
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.launchBtn}
              disabled={!canLaunch}
              onClick={openConfirm}
            >
              {launchLabel}
            </button>
          </div>
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          className={styles.confirmBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={closeConfirm}
        >
          <div className={styles.confirmSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHead}>
              <Sparkles aria-hidden className={styles.confirmIcon} />
              <h2 id="confirm-title" className={styles.confirmTitle}>Confirm match</h2>
              <button type="button" onClick={closeConfirm} className={styles.confirmClose} aria-label="Close">
                <X aria-hidden />
              </button>
            </div>
            <dl className={styles.confirmList}>
              <div>
                <dt>Mode</dt>
                <dd>{matchType === "agentVsAgent" ? "Agent vs Agent" : "You vs Agent"}</dd>
              </div>
              {matchType === "agentVsAgent" && challengerName ? (
                <div>
                  <dt>Your agent</dt>
                  <dd>{challengerName}</dd>
                </div>
              ) : null}
              <div>
                <dt>Opponents</dt>
                <dd>
                  {opponentNames.length === 0
                    ? "—"
                    : opponentNames.length <= 2
                      ? opponentNames.join(", ")
                      : `${opponentNames[0]} + ${opponentNames.length - 1} more`}
                </dd>
              </div>
              <div>
                <dt>Stake</dt>
                <dd>{stakeDisplay}</dd>
              </div>
              <div>
                <dt>Network fee</dt>
                <dd>Paid in USDC (fee abstraction)</dd>
              </div>
            </dl>
            <div className={styles.confirmActions}>
              <button type="button" onClick={closeConfirm} className={styles.confirmCancel}>
                Cancel
              </button>
              <button type="button" onClick={confirmLaunch} className={styles.launchBtn}>
                Start match
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
