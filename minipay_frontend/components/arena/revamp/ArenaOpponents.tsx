"use client";

import { useMemo } from "react";
import { Shuffle, Users } from "lucide-react";
import type { DiscoverAgent } from "./map-api-agents";
import styles from "./arena-revamp.module.css";

type Props = {
  discoverAgents: DiscoverAgent[];
  loading?: boolean;
  selectedIds: number[];
  maxSlots: number;
  onToggle: (id: number) => void;
  onReplace: (ids: number[]) => void;
  /** When true, show 1v1 stake hint and keep Quick match at 1 pick. */
  stakedOneVOne?: boolean;
};

function winRate(wins: number, losses: number): number | null {
  const total = wins + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 100);
}

export function ArenaOpponents({
  discoverAgents,
  loading,
  selectedIds,
  maxSlots,
  onToggle,
  onReplace,
  stakedOneVOne = false,
}: Props) {
  const selectedCount = selectedIds.length;
  const atMax = selectedCount >= maxSlots;
  const singleSelect = maxSlots === 1;

  // Always pick exactly 1 opponent for Quick match (Free + staked).
  const quickMatch = useMemo(() => {
    return () => {
      if (discoverAgents.length === 0) return;
      const pool = [...discoverAgents];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      onReplace([pool[0].id]);
    };
  }, [discoverAgents, onReplace]);

  return (
    <section className={styles.sectionCard} aria-labelledby="opponents-heading">
      <div className={styles.sectionHead}>
        <h2 id="opponents-heading" className={styles.sectionTitle}>Opponents</h2>
        <span className={styles.sectionStep}>2 of 3</span>
      </div>

      {(stakedOneVOne || singleSelect) && (
        <p className={styles.inlineEmpty} style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          {stakedOneVOne ? "Staked matches are 1v1" : "Pick one opponent"}
        </p>
      )}

      <div className={styles.opponentsBar}>
        <span className={styles.opponentsCount}>
          <Users aria-hidden className={styles.opponentsCountIcon} />
          {selectedCount}/{maxSlots} selected
        </span>
        <button
          type="button"
          className={styles.quickMatchBtn}
          onClick={quickMatch}
          disabled={loading || discoverAgents.length === 0}
        >
          <Shuffle aria-hidden className={styles.quickMatchIcon} />
          Quick match
        </button>
      </div>

      {loading ? (
        <p className={styles.inlineEmpty}>Loading opponents…</p>
      ) : discoverAgents.length === 0 ? (
        <p className={styles.inlineEmpty}>No public opponents yet. Check back soon.</p>
      ) : (
        <ul className={styles.opponentList}>
          {discoverAgents.map((agent) => {
            const selected = selectedIds.includes(agent.id);
            const disabled = !selected && atMax && !singleSelect;
            const wr = winRate(agent.wins, agent.losses);
            return (
              <li key={agent.id}>
                <button
                  type="button"
                  className={selected ? styles.opponentRowSelected : styles.opponentRow}
                  onClick={() => onToggle(agent.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                >
                  <span className={styles.opponentRowMain}>
                    <span className={styles.opponentName}>{agent.name}</span>
                    <span className={styles.opponentMeta}>
                      @{agent.username} · {agent.wins}–{agent.losses}
                      {wr != null ? ` · ${wr}%` : ""}
                      {agent.tierLabel ? ` · ${agent.tierLabel}` : ""}
                    </span>
                  </span>
                  <span className={selected ? styles.opponentCheckOn : styles.opponentCheckOff} aria-hidden>
                    {selected ? "✓" : disabled ? "–" : "+"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
