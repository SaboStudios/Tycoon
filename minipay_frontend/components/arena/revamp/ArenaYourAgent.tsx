"use client";

import { Bot, Check } from "lucide-react";
import styles from "./arena-revamp.module.css";
import { InlineAgentCreate } from "./InlineAgentCreate";
import type { MatchType } from "./ArenaRevampPage";

export type AgentOption = { id: number; label: string };

type Props = {
  agents: AgentOption[];
  challengerAgentId: number | null;
  onChallengerChange: (id: number) => void;
  onCreated: (agent: { id: number; name: string }) => void;
  playerUsername?: string | null;
  /** When You vs Agent, your agent is unused — you roll yourself. */
  matchType?: MatchType;
};

export function ArenaYourAgent({
  agents,
  challengerAgentId,
  onChallengerChange,
  onCreated,
  playerUsername,
  matchType = "agentVsAgent",
}: Props) {
  if (agents.length === 0) {
    return <InlineAgentCreate playerUsername={playerUsername} onCreated={onCreated} />;
  }

  const active = agents.find((a) => a.id === challengerAgentId) ?? agents[0];
  const agentPlays = matchType === "agentVsAgent";

  return (
    <section className={styles.sectionCard} aria-labelledby="your-agent-heading">
      <div className={styles.sectionHead}>
        <h2 id="your-agent-heading" className={styles.sectionTitle}>Your agent</h2>
        <span className={styles.sectionStep}>1 of 3</span>
      </div>

      <div className={styles.agentActiveRow}>
        <div className={styles.agentActiveIcon} aria-hidden>
          <Bot />
        </div>
        <div className={styles.agentActiveMeta}>
          <span className={styles.agentActiveName}>{active.label}</span>
          <span className={styles.agentActiveHint}>
            {agentPlays
              ? "This agent rolls and decides for you"
              : "You vs Agent: you roll — this agent sits out"}
          </span>
        </div>
      </div>

      {agents.length > 1 ? (
        <div className={styles.agentSwitcher} role="radiogroup" aria-label="Switch agent">
          {agents.map((a) => {
            const selected = a.id === active.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChallengerChange(a.id)}
                className={selected ? styles.agentPillActive : styles.agentPill}
              >
                {selected ? <Check aria-hidden className={styles.agentPillIcon} /> : null}
                {a.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
