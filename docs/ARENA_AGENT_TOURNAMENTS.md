# Arena ↔ agent tournaments (recommended design)

This document is the **product + technical decision** for “tournaments in Arena”: bracket play, optional USDC pool, and **agents** as the actors for matches. It intentionally **reuses** what already exists in the repo instead of inventing a second escrow or second bracket engine.

## What we reuse (already shipped)

| Piece | Role |
|--------|------|
| **`TycoonTournamentEscrow`** (`contract/src/legacy/TycoonTournamentEscrow.sol`) | On-chain tournament id = DB `tournaments.id`. `createTournament`, optional `fundPrizePool`, `registerForTournament` (USDC) or `registerForTournamentFor` (free, backend), `lockTournament`, `finalizeTournament`, `cancelTournament`. |
| **`backend/services/tournamentEscrow.js`** | Backend wallet calls the escrow (same tx queue discipline as Tycoon game txs). |
| **`backend/services/tournamentService.js`** | DB tournament lifecycle, bracket generation, **match → game** creation (`T{id}-R{r}-M{m}` codes), hooks on game finished. |
| **`tournament_entry_agents`** | Links a **tournament entry** to the **`user_agent_id`** that should play that seat. |
| **`agent_tournament_permissions`** | User opts in: max entry fee, optional daily cap, chain; PIN to enable. |
| **`POST /api/agents/:agentId/auto-join-tournament`** | Registers **you** for a tournament, pays entry from **smart wallet** → escrow when needed, inserts `tournament_entry_agents`. |
| **`ENABLE_AGENT_TOURNAMENT_RUNNER`** | Optional poller: auto-register permitted agents into open tournaments; can auto nudge match start windows (see `agentTournamentRunner.js`). |
| **Frontend** `/tournaments`, `/tournaments/create`, `/tournaments/[id]` | Full UX for list, create, register, bracket, start match. |

**No new tournament contract is required** for the first Arena-branded release: the escrow already supports **no pool**, **entry-fee pool**, and **creator-funded** prize (`prize_source` in DB maps to how you use `fundPrizePool` + `entry_fee_wei`).

---

## Recommended flow (decision)

### 1) Creating a tournament (contract + DB)

1. **Organizer** (logged-in user) calls **`POST /api/tournaments`** with `name`, `chain`, `prize_source`, `max_players`, `min_players`, `entry_fee_wei` (if applicable), etc.
2. **`tournamentService.createTournament`**:
   - Inserts **`tournaments`** row (`status = REGISTRATION_OPEN`).
   - Calls **`createTournamentOnChain(tournamentId, entryFeeWei, creatorAddress, chain)`** so **`TycoonTournamentEscrow.createTournament`** opens that id on-chain.
3. **Optional prize top-up**: creator (or sponsor) calls **`fundPrizePool`** on the escrow with USDC allowance (today often done via existing ops / future “fund pool” button wired to the same contract).

**Why this shape:** One canonical `tournamentId` on-chain and in DB avoids sync bugs; backend remains source of truth for bracket; escrow holds funds only.

### 2) Registering an **agent** (user intent)

Players are still **`users`** in DB; the **agent** is which bot plays for that entry.

**Path A — Manual (explicit)**  
1. User opens **`/tournaments/[id]`** and registers (wallet tx to escrow if paid, or backend `registerForTournamentFor` if free).  
2. User calls **`POST /api/agents/:agentId/auto-join-tournament`** *or* a future “bind agent to my entry” endpoint if you split registration and binding. Today **auto-join** both registers (if not already) and inserts **`tournament_entry_agents`**.

**Path B — Permissioned automation**  
1. User enables **`agent_tournament_permissions`** for an agent (PIN, max fee, daily cap).  
2. With **`ENABLE_AGENT_TOURNAMENT_RUNNER=true`**, the runner can auto-register + bind when a tournament is open and fee ≤ cap.

**Path C — Creator fills bots**  
**`POST /api/tournaments/:id/auto-fill-agents`** registers eligible permitted accounts (used on create flow today).

### 3) Closing registration and bracket

1. **`POST /api/tournaments/:id/close-registration`** → generates bracket (single elim / format in DB), updates statuses.  
2. Backend should call **`lockTournament`** on escrow when you want **no more deposits** (wire this if not already chained in `closeRegistration` — verify `tournamentService` / controller).

### 4) Match → game (“games go on”)

1. **`tournamentService.createMatchGame`** creates a **DB game** +, when both users have backend contract auth, **on-chain create + joins** (same pattern as normal PvP), with code **`T{tournamentId}-R{round}-M{match}`**.  
2. **Agent play**: register agents on the game via **`agentRegistry`** (same as arena / agent battles) so **`agentGameRunner`** or the **3D board client automation** can advance turns.  
3. On **game finished**, existing tournament hooks advance **winner** to next round (see `tournamentService` `onGameFinished` / bracket updates).

### 5) Payout

After finals, backend computes recipients and calls **`finalizeTournament(tournamentId, recipients[], amounts[])`** on the escrow (USDC out). **Cancel** path uses **`cancelTournament`** + **`refundPrizeToCreator`** as needed.

---

## Arena UI (this repo)

The **Arena** page adds a **Tournaments** tab that:

- Explains that bracket tournaments use **`TycoonTournamentEscrow`** (pool optional).
- Lists **open** tournaments and links to **`/tournaments/...`** for full bracket + register + agent bind.
- Points creators to **`/tournaments/create`** and agents to **Profile → agent tournament permissions** + auto-join API.

This keeps Arena as the **discovery hub** without duplicating the whole bracket UI.

---

## Optional follow-ups (not required for v1)

- **Single action** “Register + bind this agent” on tournament detail page (wrapper over existing APIs).  
- **Auto `lockTournament`** in escrow when registration closes (if missing).  
- **Arena-only** tournament flag (`tournaments.kind = 'ARENA'`) for filtered lists — cosmetic unless you want separate leaderboards.

---

## Env checklist

- **`TOURNAMENT_ESCROW_ADDRESS_<CHAIN>`** (per `backend/config/chains.js`)  
- Escrow **`backend`** address = your backend signer  
- **`ENABLE_AGENT_TOURNAMENT_RUNNER=true`** only if you want passive auto-register / match nudges  

---

## Summary

| Question | Answer |
|----------|--------|
| New contract? | **No** — use **`TycoonTournamentEscrow`**. |
| Pool or not? | **`prize_source`**: `NO_POOL`, `ENTRY_FEE_POOL`, or `CREATOR_FUNDED`. |
| Who “joins” on-chain for the tournament? | **User addresses** (or smart wallet) via escrow **`registerForTournament`** / backend **`registerForTournamentFor`**. |
| How do agents participate? | **`tournament_entry_agents`** + game **`agentRegistry`** for each match game. |
| Where do games run? | Same as today: **Tycoon game contract** + DB game for each bracket match. |

This is the architecture Tycoon already implements; Arena tournaments are **positioning + navigation + copy**, not a parallel system.
