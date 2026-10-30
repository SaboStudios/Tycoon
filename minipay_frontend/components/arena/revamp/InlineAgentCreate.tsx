"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Sparkles, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient, ApiError } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import styles from "./arena-revamp.module.css";

type CreatedAgent = { id: number; name: string };

type Props = {
  /** Player username — preferred default is `${username} Agent`. */
  defaultName?: string;
  playerUsername?: string | null;
  onCreated: (agent: CreatedAgent) => void;
};

function agentNameFromUsername(username: string | null | undefined): string {
  const u = (username || "").trim();
  if (!u) return "";
  return `${u} Agent`;
}

const STRATEGY_PROMPT_LIMIT = 500;

const DEFAULT_STRATEGY_SUMMARY = "Balanced build — grabs properties, trades fairly, holds enough cash to survive.";
const DEFAULT_STRATEGY_PROMPT =
  'You are an autonomous Tycoon (Monopoly-style) agent. Play to win with balanced risk, acquire properties aggressively but keep enough cash to survive rent, and trade when it clearly helps you.';

const EXAMPLES: { label: string; text: string }[] = [
  {
    label: "Aggressive buyer",
    text: "Buy every property you land on, build quickly, take trades that give you a full color group.",
  },
  {
    label: "Cash-safe",
    text: "Keep at least 25% of your cash in reserve, avoid mortgaging, build only after a monopoly is secured.",
  },
  {
    label: "Trade heavy",
    text: "Prioritize trading to complete color groups, offer small cash sweeteners, never trade railroads cheaply.",
  },
];

function buildCustomPrompt(name: string, custom: string): string {
  return [
    `You are "${name}" — an autonomous Tycoon (Monopoly-style) agent.`,
    "",
    "## Strategy from the player",
    custom.trim(),
  ].join("\n");
}

export function InlineAgentCreate({ defaultName, playerUsername, onCreated }: Props) {
  const suggestedName = useMemo(() => {
    if (defaultName && defaultName.trim()) return defaultName.trim();
    return agentNameFromUsername(playerUsername);
  }, [defaultName, playerUsername]);
  const [name, setName] = useState(suggestedName);
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touchedName, setTouchedName] = useState(false);

  // When username loads after mount, fill only if the player hasn't edited the field.
  useEffect(() => {
    if (touchedName) return;
    if (!suggestedName) return;
    setName(suggestedName);
  }, [suggestedName, touchedName]);

  const customOverLimit = custom.length > STRATEGY_PROMPT_LIMIT;
  const customTooShort = mode === "custom" && custom.trim().length < 10;
  const nameTooShort = name.trim().length < 1;
  const canSubmit = !submitting && !nameTooShort && !customOverLimit && !customTooShort;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const trimmedName = name.trim();
      const prompt =
        mode === "custom" ? buildCustomPrompt(trimmedName, custom) : DEFAULT_STRATEGY_PROMPT.replace(/^You are/, `You are "${trimmedName}" —`);
      const config: Record<string, unknown> = {
        behavior_prompt: prompt,
        skill: prompt,
        behavior_profile: {
          goal: "win",
          risk: "medium",
          liquidity: "balanced",
          property_focus: "balanced",
          trade_behavior: "smart",
          buy_style: "balanced",
          build_style: "balanced",
          notes: mode === "custom" ? custom.trim() : "",
        },
      };
      const res = await apiClient.post<ApiResponse<{ id: number; name: string }>>("/agents", {
        name: trimmedName,
        callback_url: null,
        erc8004_agent_id: null,
        provider: "anthropic",
        use_tycoon_key: true,
        chain_id: 42220,
        config,
      });
      const created = res.data?.data;
      if (!created?.id) throw new Error("No agent returned");
      toast.success("Agent created — ready to battle");
      onCreated({ id: created.id, name: created.name ?? trimmedName });
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as Error).message)
            : "Could not create agent";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineCreateCard} aria-label="Create your first agent">
      <div className={styles.inlineCreateHead}>
        <Bot aria-hidden className={styles.inlineCreateIcon} />
        <div>
          <h2 className={styles.inlineCreateTitle}>Create your agent</h2>
          <p className={styles.inlineCreateSubtitle}>Name it, pick a strategy, start a match.</p>
        </div>
      </div>

      <div className={styles.inlineCreateField}>
        <label htmlFor="agent-name" className={styles.fieldLabel}>Agent name</label>
        <input
          id="agent-name"
          type="text"
          className={styles.input}
          value={name}
          onChange={(e) => {
            setTouchedName(true);
            setName(e.target.value);
          }}
          placeholder={suggestedName || undefined}
          maxLength={48}
          autoComplete="off"
        />
      </div>

      <div className={styles.inlineCreateField}>
        <span className={styles.fieldLabel}>Strategy</span>
        <div className={styles.strategyChoice}>
          <button
            type="button"
            onClick={() => setMode("default")}
            className={mode === "default" ? styles.strategyOptActive : styles.strategyOpt}
            aria-pressed={mode === "default"}
          >
            <span className={styles.strategyOptTitle}>Default strategy</span>
            <span className={styles.strategyOptHint}>{DEFAULT_STRATEGY_SUMMARY}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={mode === "custom" ? styles.strategyOptActive : styles.strategyOpt}
            aria-pressed={mode === "custom"}
          >
            <span className={styles.strategyOptTitle}>Write your own</span>
            <span className={styles.strategyOptHint}>Short prompt — a sentence or two.</span>
          </button>
        </div>
      </div>

      {mode === "custom" ? (
        <div className={styles.inlineCreateField}>
          <div className={styles.strategyChipRow}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className={styles.strategyChip}
                onClick={() => setCustom(ex.text)}
              >
                {ex.label}
              </button>
            ))}
          </div>
          <textarea
            className={styles.textarea}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={4}
            placeholder="How should this agent play?"
            maxLength={STRATEGY_PROMPT_LIMIT + 100}
            aria-describedby="strategy-count"
          />
          <p id="strategy-count" className={customOverLimit ? styles.fieldHelpError : styles.fieldHelp}>
            {custom.length}/{STRATEGY_PROMPT_LIMIT}
            {customOverLimit ? " · too long" : customTooShort ? " · a sentence or two" : ""}
          </p>
        </div>
      ) : null}

      <button type="submit" className={styles.launchBtn} disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 aria-hidden className={styles.spin} />
            Creating…
          </>
        ) : (
          <>
            <Sparkles aria-hidden className={styles.btnIcon} />
            Save &amp; use this agent
          </>
        )}
      </button>
    </form>
  );
}
