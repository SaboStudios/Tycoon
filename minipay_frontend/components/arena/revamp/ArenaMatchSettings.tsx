"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { celo } from "wagmi/chains";
import { USDC_TOKEN_ADDRESS } from "@/constants/contracts";
import type { MatchType } from "./ArenaRevampPage";
import styles from "./arena-revamp.module.css";

/** Agent-vs-agent USDC stakes paused until escrow / G$ path is ready. */
export const AGENT_VS_AGENT_STAKES_ENABLED = false;

type Props = {
  matchType: MatchType;
  onMatchTypeChange: (t: MatchType) => void;
  stake: string;
  onStakeChange: (v: string) => void;
};

const STAKE_PRESETS: { value: string; label: string }[] = [
  { value: "", label: "Free" },
  { value: "0.5", label: "$0.5" },
  { value: "1", label: "$1" },
  { value: "5", label: "$5" },
  { value: "10", label: "$10" },
];

function stakeLabel(v: string): string {
  const n = v.trim() ? parseFloat(v) : 0;
  if (!Number.isFinite(n) || n <= 0) return "Free";
  return `$${n} USDC`;
}

function fmtBalance(raw: bigint | undefined, decimals: number | undefined): string {
  if (raw == null || decimals == null) return "—";
  const d = BigInt(10) ** BigInt(decimals);
  const whole = raw / d;
  const frac = raw % d;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export function ArenaMatchSettings({ matchType, onMatchTypeChange, stake, onStakeChange }: Props) {
  /** Open by default so match type (agent auto-play vs you roll) is obvious. */
  const [open, setOpen] = useState(true);
  const { address } = useAccount();
  const usdc = USDC_TOKEN_ADDRESS[celo.id];
  const balance = useBalance({
    address: address as `0x${string}` | undefined,
    token: usdc as `0x${string}` | undefined,
    chainId: celo.id,
    query: { enabled: !!address && !!usdc },
  });

  /** Free-only for both modes while controller-sponsored stakes/create are paused. */
  const agentStakeBlocked =
    !AGENT_VS_AGENT_STAKES_ENABLED &&
    (matchType === "agentVsAgent" || matchType === "agentVsAi");

  useEffect(() => {
    if (agentStakeBlocked && stake.trim()) onStakeChange("");
  }, [agentStakeBlocked, stake, onStakeChange]);

  const stakeNum = stake.trim() ? parseFloat(stake) : 0;
  const balanceDisplay = balance.data ? fmtBalance(balance.data.value, balance.data.decimals) : null;
  const balanceNum = balance.data ? Number(balance.data.value) / 10 ** balance.data.decimals : null;
  const insufficient = stakeNum > 0 && balanceNum != null && stakeNum > balanceNum;

  const summary = useMemo(() => {
    const mode = matchType === "agentVsAgent" ? "Agent vs Agent" : "You vs Agent";
    const stakePart = agentStakeBlocked ? "Free (stakes paused)" : stakeLabel(stake);
    return `${mode} · ${stakePart}`;
  }, [matchType, stake, agentStakeBlocked]);

  return (
    <section className={styles.sectionCard} aria-labelledby="match-settings-heading">
      <div className={styles.sectionHead}>
        <h2 id="match-settings-heading" className={styles.sectionTitle}>Match settings</h2>
        <span className={styles.sectionStep}>2 of 3 · Mode</span>
      </div>

      <button
        type="button"
        className={styles.settingsSummaryRow}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.settingsSummaryText}>{summary}</span>
        <span className={styles.settingsSummaryEdit}>
          {open ? "Hide" : "Edit"}
          {open ? <ChevronUp aria-hidden className={styles.settingsSummaryIcon} /> : <ChevronDown aria-hidden className={styles.settingsSummaryIcon} />}
        </span>
      </button>

      {open ? (
        <div className={styles.settingsBody}>
          <div className={styles.settingsField}>
            <span className={styles.fieldLabel}>Match type</span>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.modeBtn} ${matchType === "agentVsAgent" ? styles.modeBtnActive : ""}`}
                onClick={() => onMatchTypeChange("agentVsAgent")}
              >
                <span className={styles.modeBtnTitle}>Agent vs Agent</span>
                <span className={styles.modeBtnHint}>Your agent plays automatically</span>
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${matchType === "agentVsAi" ? styles.modeBtnActive : ""}`}
                onClick={() => onMatchTypeChange("agentVsAi")}
              >
                <span className={styles.modeBtnTitle}>You vs Agent</span>
                <span className={styles.modeBtnHint}>You roll; opponent is AI</span>
              </button>
            </div>
          </div>

          <div className={styles.settingsField}>
            <div className={styles.stakeHeader}>
              <span className={styles.fieldLabel}>Stake (USDC)</span>
              {address && !agentStakeBlocked ? (
                <span className={styles.balanceChip}>
                  <Wallet aria-hidden className={styles.balanceIcon} />
                  {balance.isLoading ? "…" : balanceDisplay != null ? `${balanceDisplay} USDC` : "—"}
                </span>
              ) : null}
            </div>
            {agentStakeBlocked ? (
              <p className={styles.fieldHelp}>
                Stakes are paused for now — Free matches only (you sign createGame in MiniPay).
              </p>
            ) : (
              <>
                <div className={styles.stakeChips}>
                  {STAKE_PRESETS.map((p) => (
                    <button
                      key={p.value || "free"}
                      type="button"
                      className={stake === p.value ? styles.stakeChipActive : styles.stakeChip}
                      onClick={() => onStakeChange(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className={`${styles.input} ${styles.mono}`}
                  placeholder="Custom amount"
                  value={stake}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") return onStakeChange("");
                    // Strip non-numeric except a single dot; cap at 2 decimals; drop leading minus.
                    const cleaned = raw.replace(/[^0-9.]/g, "");
                    const firstDot = cleaned.indexOf(".");
                    const normalized =
                      firstDot === -1
                        ? cleaned
                        : cleaned.slice(0, firstDot + 1) +
                          cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
                    onStakeChange(normalized);
                  }}
                />
                {insufficient ? (
                  <p className={styles.fieldHelpError}>
                    Not enough USDC — top up or pick a smaller stake.
                  </p>
                ) : (
                  <p className={styles.fieldHelp}>Free = practice match, no USDC moved.</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function stakeIsInsufficient(stake: string, balance: number | null): boolean {
  if (balance == null) return false;
  const n = stake.trim() ? parseFloat(stake) : 0;
  if (!Number.isFinite(n) || n <= 0) return false;
  return n > balance;
}
