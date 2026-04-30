# More Agent Use Cases — Qualify Very Strongly

Ideas beyond payout + perk payments so Tycoon scores highly on **pay**, **trust**, and **cooperate** (Synthesis) and **real-world utility** (Celo Build Agents). Pick 2–4 that fit your timeline.

---

## Already in place or planned

| Use case | Status | Doc |
|----------|--------|-----|
| In-game AI agents (decide buy/trade/build) | Done | INTERNAL_AI_AGENT.md, agentRegistry |
| External agent via callback (tycoon-celo-agent) | Done | tycoon-celo-agent/README.md |
| ERC-8004 identity + reputation after games | Done | ERC8004_INTEGRATION.md |
| **Staked games: contract as payout agent** (USDC by rank on exit) | Done | Contract; narrative in AGENTS_PAYOUT_AND_PERK_PAYMENTS.md §5 |
| Tournament payout agent (send USDC to winners) | Planned | AGENTS_PAYOUT_AND_PERK_PAYMENTS.md |
| x402 / pay-for-perks (agents pay to unlock; works in staked games too) | Planned | AGENTS_PAYOUT_AND_PERK_PAYMENTS.md |

---

## Pay — “Agents that pay / get paid”

| Idea | What | Why it helps |
|------|------|----------------|
| **Escrow / treasury agent** | One wallet (or contract) that **holds** entry fees and prize pools; only a backend “agent” (or contract) can move funds (payouts, refunds). | Clear “agent controls money” story; fits Celo + real-world utility. |
| **Agent receives tips** | Let players send USDC/cUSD to an “AI tip jar” (agent wallet) after a game; optional: show “Support the AI” in UI. | Agents that **receive** payment; good one-liner for judges. |
| **Pay-to-play agent** | External agents (or users) pay a small fee (x402 or transfer) to **join a tournament** or **create a premium game**; agent wallet receives the fee. | Same “agents that pay” + you monetize. |
| **Revenue-share agent** | Agent wallet gets a % of house cut (e.g. 5% of staked games); backend sends that % to the agent wallet periodically. | “Agent earns from the economy.” |

---

## Trust — “Agents that trust / are trusted”

| Idea | What | Why it helps |
|------|------|--------------|
| **Reputation in UI** | One screen or tooltip: “This AI has agentId X, N games, win rate Y” from ERC-8004 (or your backend cache). | Makes “identity without a face” and “reputation without a human” obvious (Synthesis trust theme). |
| **Multiple ERC-8004 agents** | Register 2–4 different AI slots as separate agent IDs in the Identity Registry (e.g. Tycoon-Aggressive, Tycoon-Defensive). | Shows “multiple agents with reputation” and trust at scale. |
| **Attestation agent** | When a game ends fairly (no cheat detected), backend (or a small contract) emits an attestation: “Agent X completed game Y.” Optional: store on-chain or in a registry. | “Agents that can be verified” = trust. |
| **Vouch / endorse** | Let one agent (or the platform) “endorse” another (e.g. “This agent plays fair”); store in reputation or a simple table and show in UI. | Cooperate + trust. |

---

## Cooperate — “Agents that cooperate”

| Idea | What | Why it helps |
|------|------|--------------|
| **Spell out existing cooperation** | In submission + video: “Agents **negotiate** (trades), **commit** (on-chain moves), **follow through** (no backsies).” Add 1–2 UI labels, e.g. “AI proposed trade” / “AI accepted.” | No new backend; strong narrative. |
| **Tournament bracket agent** | Backend “agent” that: when a round ends, advances winners, creates next matches, optionally notifies (email/push) or posts to a channel. | “Agent runs the tournament” = cooperate at scale. |
| **Matchmaking agent** | Service that suggests games or opponents by skill / reputation (e.g. “Players like you” or “Open games for your level”). Could be an API other agents call. | “Agent helps humans and agents find games.” |
| **Multi-agent negotiation** | In games with 2+ AI slots, have them **trade with each other** (you may already support this); highlight in demo: “Agents negotiate with each other, not only with the human.” | Direct “agents cooperate” moment. |
| **Mediator agent** | For vote-to-remove or disputes: neutral “referee” agent that proposes or enforces rules (e.g. timeouts, forfeits). Backend logic + optional ERC-8004 identity. | “Agents that enforce fairness.” |

---

## Discoverability & skills (both hackathons)

| Idea | What | Why it helps |
|------|------|--------------|
| **Agent Skill / skill.md** | Publish a **skill** (e.g. `GET /skill.md` or `/.well-known/skill.md`) that describes: “Tycoon: create game, join game, get state, submit move.” Link from repo + submission. | Agent Skills / discoverability; other agents can “play Tycoon.” |
| **Query API for agents** | Read-only endpoints agents can call: e.g. `GET /games/open`, `GET /games/:id/state`, `GET /leaderboard`, `GET /tournaments/upcoming`. Optional: require x402 or API key. | “Agents that read the world” and can automate play or analytics. |
| **“For judges” doc** | Short README or `/docs/JUDGES.md`: stack (Celo, ERC-8004, agent registry), how to run a game, where to see reputation on-chain, link to skill. | Makes judging and agent evaluation easy. |

---

## Quick wins (low effort, high impact)

1. **Reputation in UI** — One component: “Agent profile: id, games, win rate” (from ERC-8004 or backend).
2. **Narrative + labels** — Submission + video: “Agents pay (payout + x402), trust (ERC-8004), cooperate (multi-agent game, trades, bracket).” Add 1–2 in-app labels for “AI proposed/accepted trade.”
3. **Skill + query API** — One `skill.md` + 1–2 read-only routes (e.g. open games, game state) so agents can discover and interact.
4. **Tournament payout agent** — Implement `executePayouts` with a treasury wallet (see AGENTS_PAYOUT_AND_PERK_PAYMENTS.md).

---

## Summary

- **Pay:** Payout agent, x402 perks, escrow/treasury agent, tips, pay-to-play, revenue-share.
- **Trust:** Reputation in UI, multiple agent IDs, attestation, vouch/endorse.
- **Cooperate:** Narrative + labels, bracket agent, matchmaking, multi-agent trades, mediator.
- **Discoverability:** skill.md, query API for agents, judges doc.

Prioritize: **reputation in UI**, **tournament payout agent**, **skill + one query route**, and **clear narrative (pay / trust / cooperate)** so you qualify very strongly with minimal new surface area.
