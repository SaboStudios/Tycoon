# Agents for Tournament Payouts & Perk Payments

Strategy for using agents to **payout tournaments** and **receive payment for perks**, aligned with Celo/Synthesis “agents that pay” and your existing escrow/contracts.

---

## 1. Current state

| Area | Status |
|------|--------|
| **Tournament payouts** | `tournamentPayoutService.computePayouts()` works; `executePayouts()` is a stub (logs only, no USDC send). |
| **Tournament escrow** | Backend can create tournaments and register players on-chain; no contract path yet to **distribute** prize pool to winners. |
| **Perks** | In-game only: collectibles burned for effects (activate, teleport, exact-roll, burn-for-cash). No “pay USDC to unlock perk” flow. |

---

## 2. Option A: Payout agent for tournaments (recommended)

**Idea:** A backend **payout agent** (service wallet + job) that, when a tournament is COMPLETED, sends USDC to winners.

### 2a. Where the money lives

- **ENTRY_FEE_POOL:** Entry fees are either (1) held in your existing **TycoonTournamentEscrow** contract, or (2) in a **treasury wallet** your backend controls.  
- **CREATOR_FUNDED:** Prize pool is already deposited (e.g. into escrow or a dedicated treasury).

You need one of:

- Escrow contract that has a **payout** function, e.g.  
  `payoutWinners(tournamentId, address[] winners, uint256[] amounts)`  
  and holds USDC for that tournament, **or**
- A **treasury wallet** (agent wallet) that holds USDC and is used only for payouts.

### 2b. Payout agent flow

1. **Trigger:** When a tournament is marked COMPLETED (e.g. last match resolved), enqueue a job or call a “finalize tournament” endpoint.
2. **Compute:** Use existing `computePayouts(tournamentId)` → list of `{ entry_id, rank, amount_wei }`.
3. **Resolve addresses:** For each `entry_id`, get `TournamentEntry` → user → wallet `address`.
4. **Execute:**
   - **If escrow has a payout function:** Backend (or an agent wallet) calls  
     `escrow.payoutWinners(tournamentId, [addresses], [amounts])` (or one transfer per winner, depending on contract).
   - **If using a treasury wallet:** Backend uses the **payout agent wallet** (same pattern as `tycoonContract` / `tournamentEscrow`: ethers Wallet + tx queue) to send USDC to each winner via ERC20 `transfer`.
5. **Idempotency:** Store `tournament_payouts` (e.g. `tournament_id`, `entry_id`, `amount_wei`, `tx_hash`, `paid_at`) so you never pay twice.

### 2c. Implementation sketch (backend)

- **New (or extend):** `tournamentPayoutService.executePayouts(tournamentId)`:
  - Load tournament; require `status === 'COMPLETED'`.
  - Call `computePayouts(tournamentId)`.
  - For each payout, get address from `TournamentEntry` + User.
  - If escrow has `payoutWinners`: single contract call.  
  - Else: for each winner, call existing USDC transfer helper (same as your other backend-triggered transfers) from the **payout agent wallet**.
- **Agent identity:** The “agent” is the backend service + the wallet that holds and sends USDC (and optionally an ERC-8004 identity for that wallet so it’s visible as “Tycoon Payout Agent”).

---

## 3. Option B: Receive payment for perks

Two concrete patterns:

### 3a. x402 (pay-per-call API) — best for “agents that pay” narrative

- **Flow:**  
  1. Client (or another agent) calls your API, e.g. `POST /game-perks/premium-activate` with `game_id`, `perk_id`, etc.  
  2. Your API responds with **HTTP 402 Payment Required** and a body (or headers) describing: amount, token (e.g. USDC), chain, recipient address.  
  3. Client (or agent) pays on-chain (e.g. USDC transfer to your agent wallet), then retries the request with a **payment proof** (e.g. in `PAYMENT-SIGNATURE` or similar header).  
  4. Your API verifies the payment (on-chain or via indexer), then grants the perk (e.g. mints a collectible, or sets a “premium perk” flag for that game/player).

- **Fits hackathon:** “Agents that pay” = an AI or another service pays your API via x402 to unlock a perk; your backend (or an agent wallet) **receives** the payment.

- **Implementation:**  
  - Add a route, e.g. `POST /game-perks/premium-activate` (or `/perks/purchase`).  
  - If no valid payment proof: return 402 + payment spec (amount, token, chain, your wallet).  
  - If payment proof present: verify; then call existing perk logic (or a new “grant premium perk” path) and return 200.

### 3b. Simple “pay then grant” (no x402)

- **Flow:**  
  1. Frontend shows “Unlock this perk for X USDC.”  
  2. User (or agent) sends USDC to a designated **perk treasury** wallet (or a small contract that forwards to that wallet).  
  3. Backend either:  
     - **Poll/listen** for incoming USDC to that wallet (amount + reference, e.g. `game_id` in memo or a separate “payment intents” table), or  
     - Uses a **webhook / indexer** that notifies when a payment is received.  
  4. When payment is confirmed, backend grants the perk (e.g. insert into collectibles or mark “premium perk purchased” for that game/player).

- **Pros:** Simpler than x402; works with any wallet.  
- **Cons:** Less “agent-native” than x402; no standard payment-proof header.

---

## 4. Suggested roadmap

| Priority | What | Why |
|----------|------|-----|
| **High** | Implement **tournament payout agent** (execute USDC to winners when tournament completes) | You already compute payouts; only execution is missing. Directly “agent pays out” and unblocks real prize tournaments. |
| **High** | Decide where prize pool lives | Either add `payoutWinners` to escrow (and fund it from entry fees / creator) or use a dedicated treasury wallet for the payout agent. |
| **High** | **Extend narrative to staked games** | In submission + video: “Agents that pay = contract pays staked games by rank; payout agent pays tournaments.” No new code; stronger story. |
| **Medium** | **x402 for premium perks** (one endpoint: 402 → pay → proof → grant perk; works in staked games too) | Strong “agents that pay” story; one clear endpoint is enough for a demo. |
| **Low** | Optional: frame backend as **referee agent** for staked games (vote-out / timeout → contract pays) | Makes “agent enforces rules, contract pays” explicit. |
| **Low** | Simple “pay USDC to this address → we grant perk” as fallback | If x402 is too much for the deadline, this still shows “receive payment for perks.” |

---

## 5. Extending to staked games

Your **staked games** (USDC stake per player, pot split by rank on exit) already implement “agents that pay” on-chain. You can extend the **narrative** and optionally add a **referee agent** so the hackathon story covers both staked games and tournaments.

### 5a. Staked games: contract as payout agent (already live)

- Players stake USDC when joining; the **Tycoon contract** holds the pot.
- When a player exits (voluntary `exitGame` or backend `removePlayerFromGame`), the contract runs `_payoutReward`: USDC by rank (1st 50%, 2nd 30%, 3rd 20%), 5% house, plus vouchers/collectibles.
- **No backend payout agent is required** for staked games — the contract is the automated “payout agent.”

**For the submission:** Say explicitly that “agents that pay” includes **staked games**: “The Tycoon contract acts as the payout agent for staked games: it holds the pot and distributes USDC by rank when players exit. We extend this to **tournaments** with a backend payout agent that sends prizes when a tournament completes.”

### 5b. Backend as referee agent for staked games (optional)

- The backend is already `backendGameController`: it can call `removePlayerFromGame(gameId, player, turnCount)` for vote-out or timeout.
- When it does, the **contract** still performs the actual USDC payout; the backend only triggers the exit (and thus the payout path).
- You can frame this as a **referee agent**: “Our backend agent enforces rules (timeouts, vote-out); when it removes a player, the on-chain payout agent (the contract) pays them by rank.”

No new payout logic is needed for staked games; this is narrative + optional ERC-8004 identity for the backend wallet.

### 5c. Perks and x402 in staked games

- **Pay-for-perks** (x402 or “pay to address”) can apply to **any** game, including staked games: “Pay X USDC to unlock this perk in your current (staked) game.”
- Same flows as in §3; only ensure the perk-grant path accepts `game_id` for staked games and that the UI offers the option in staked lobbies.

### 5d. One “agents that pay” story across both

| Context | Who pays | How |
|--------|----------|-----|
| **Staked games** | Tycoon contract | On-chain: `exitGame` / `removePlayerFromGame` → `_payoutReward` (USDC by rank + house 5%). |
| **Tournaments** | Payout agent (backend + wallet or escrow) | When tournament is COMPLETED: `executePayouts` sends USDC to winners (to implement). |
| **Perks** | User/agent pays you | x402 or transfer to perk treasury; you grant perk (any game, including staked). |

So you **extend** the agent narrative to staked games by (1) naming the contract as the staked-game payout agent, (2) optionally naming the backend as referee agent, and (3) allowing pay-for-perks in staked games as well.

### 5e. Would it look better if the contract doesn’t hold funds and the agent handles it?

**Short answer:** For the hackathon, “agent holds and pays” can *look* stronger because it’s literally a wallet/process sending money. But for **staked games** you should keep the **contract** holding the pot; use **agent holds and pays** for **tournaments** so you get both stories without weakening security.

**Why contract-holds is better for staked games**

| Contract holds (current) | Agent holds (alternative) |
|--------------------------|----------------------------|
| Trustless: no one can take the pot; logic is on-chain. | Players must trust the agent (or escrow); custody is off-chain. |
| Standard in DeFi; auditors and users expect it. | Big redesign: who receives stake on join? How do you lock funds per game? |
| One flow: join → contract; exit → contract pays. | You’d need: join → send to agent? Contract forwards to agent? Agent pays on game end? More moving parts and failure modes. |

So for **staked games**, keeping the contract as custodian is the right call. You can still say “agents that pay” by (1) calling the contract an automated payout agent, and (2) having the **referee agent** (backend) trigger payouts when it calls `removePlayerFromGame`.

**Where “agent holds and pays” looks best: tournaments**

- For **tournaments**, the prize pool is already a natural fit for an **agent**: entry fees or creator funding go to a treasury or escrow, and a **payout agent** (backend + wallet) sends USDC to winners when the tournament completes.
- That gives you a clear, judge-friendly “agent has a bank account and pays out” story **without** changing staked games.

**Optional: make the agent more visible for staked games (without moving custody)**

If you want the “agent handles it” feel for staked games too, without the contract giving up custody:

- **Relayer / facilitator agent:** The contract still holds USDC. A backend **agent** (with its own wallet) **submits** every exit or removal transaction (e.g. gasless for users, or batch payouts). So “the agent handles every payout” in the sense of triggering and paying gas; the contract still does the USDC transfer. You can say: “Our payout agent facilitates all staked-game exits; the contract holds funds and executes the transfer when the agent submits the tx.” That keeps trust and security and still highlights the agent.

**Recommendation**

- **Staked games:** Contract keeps holding the pot; narrative = “contract is the payout agent” + optional “referee agent triggers” or “relayer agent submits tx.”
- **Tournaments:** Agent (backend + wallet or escrow) holds the prize pool and pays winners = clear “agent holds and pays” story.
- Result: You have both “trustless contract pays” and “agent holds and pays” (tournaments), which looks strong without redesigning staked games.

---

## 6. Summary

- **Tournament payouts:** Use a **payout agent** (backend + dedicated wallet or escrow payout function) to send USDC to winners when a tournament is COMPLETED, using your existing `computePayouts()`.  
- **Staked games:** Already covered by the **Tycoon contract** as the on-chain payout agent; extend the narrative so “agents that pay” explicitly includes staked games. Optionally frame the backend as referee agent.
- **Perk payments:** Prefer **x402** for one pay-per-call “premium perk” endpoint (works in staked and non-staked games); alternatively “pay to this address → we grant perk.”  
All of the above align with “agents that pay” and work with Celo/USDC and your current contracts and backend.

---

For more agent ideas (pay / trust / cooperate / discoverability) to qualify very strongly, see **AGENTS_USE_CASES.md**.
