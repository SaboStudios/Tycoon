# User-Created Agents — What We Need in Place

This doc outlines what’s needed so **users can create their own agents** and use them to play Tycoon (and later other use cases). It supports both: (1) **bring your agent** (connect a URL), and (2) **create & deploy** (we host or guide deployment).

---

## 1. Data model: store “my agents” per user

We need a place to store each user’s agents so they can list, edit, and assign them to games.

### 1.1 New table: `user_agents`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | PK | Primary key |
| `user_id` | FK → users.id | Owner |
| `name` | string | Display name (e.g. "My Tycoon Bot") |
| `callback_url` | string, nullable | User’s own agent URL (bring-your-own) |
| `config` | JSON, nullable | For created agents: template, system_prompt, llm_provider, etc. |
| `status` | enum | e.g. `draft`, `active`, `hosted`, `error` |
| `hosted_url` | string, nullable | If we host: URL we give back after deploy |
| `erc8004_agent_id` | string, nullable | On-chain agent id (for agentscan / Celo) |
| `chain_id` | int, default 42220 | Celo mainnet etc. |
| `created_at` / `updated_at` | timestamps | |

- **Bring-your-own:** user sets `callback_url`, we don’t host. No `hosted_url` needed.
- **Create & we host:** we create a record with `config`, deploy, then set `hosted_url` and `status = 'hosted'`. Optionally set `erc8004_agent_id` after registration.

### 1.2 Migration

- Add migration that creates `user_agents` with the columns above and index on `user_id`.

---

## 2. Backend: Agent CRUD and “use in game”

### 2.1 Model: `UserAgent` (or `Agent`)

- `create(userId, data)` — insert row, return agent.
- `findByUser(userId)` — list agents for a user.
- `findById(id)` and `findByIdAndUser(id, userId)` — for get/update/delete.
- `update(id, userId, data)` — update name, callback_url, config, etc.
- `delete(id, userId)` — soft-delete or hard delete.

### 2.2 Routes (under e.g. `/api/agents` or `/api/user-agents`)

All must be **authenticated** (resolve `user_id` from session/wallet/JWT).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List current user’s agents |
| POST | `/` | Create agent (body: name, callback_url **or** config for “create & deploy”) |
| GET | `/:id` | Get one agent (must belong to user) |
| PATCH | `/:id` | Update agent |
| DELETE | `/:id` | Delete agent |
| POST | `/:id/deploy` | Optional: trigger “deploy” for config-based agents (see §4) |
| POST | `/:id/register-erc8004` | Optional: one-time ERC-8004 registration, store `erc8004_agent_id` |

### 2.3 Linking “my agent” to Tycoon (slot / game)

Today the **agent registry** is in-memory: slot → `{ callbackUrl, agentId, … }`. To support “use my agent in this game” we need one of:

- **Option A — Game-scoped registration:** When user creates or joins a game, they pick “use my agent” and choose which of their agents and which slot (2–8). Backend then:
  - Resolves that agent’s `callback_url` (or `hosted_url` if we host).
  - Calls existing `POST /api/agent-registry/register` with `{ slot, gameId, callbackUrl, agentId: erc8004_agent_id or agent.id, name }` so the game uses that agent for that slot.
- **Option B — Global slot:** User assigns “my agent” to a slot globally; any game they’re in uses that agent for that slot. Same `register` call but without `gameId`.

We need:

- **API:** e.g. `POST /api/games/:gameId/assign-agent` or `POST /api/agent-registry/register` (extend body) with `user_id` and `user_agent_id` so backend can look up `callback_url` / `hosted_url` and optionally `erc8004_agent_id` from `user_agents`.
- **Persistence:** The current registry is in-memory, so after server restart assignments are lost. For user-created agents we can either:
  - Keep in-memory but re-populate from DB on startup (e.g. “active” assignments in a new table `agent_slot_assignments`), or
  - Add a small table `agent_slot_assignments (user_id, game_id?, slot, user_agent_id, created_at)` and resolve `callback_url` at request time from `user_agents`. Then `agentRegistry.getAgentForSlot(gameId, slot)` (or a wrapper) consults this table and `user_agents` to get the URL.

Recommendation: add `agent_slot_assignments` (or equivalent) and resolve callback URL from `user_agents` so “use my agent” survives restarts and is clearly owned by the user.

---

## 3. Frontend: “My agents” and “Use in game”

### 3.1 My Agents

- **List:** Call `GET /api/agents` and show name, status, type (bring-your-own vs hosted), last used, etc.
- **Create flow:**
  - **Bring your agent:** Form: name + callback URL. On submit → `POST /api/agents` with `{ name, callback_url }`.
  - **Create & deploy (if we support it):** Form: name, template (e.g. “Tycoon player”), optional system prompt / LLM key. Submit → `POST /api/agents` with `{ name, config: { template, … } }` then optional “Deploy” → `POST /api/agents/:id/deploy`.
- **Edit / Delete:** Use `PATCH` and `DELETE` on `/api/agents/:id`.

### 3.2 Use in game

- When creating a game (or in lobby): if “vs AI” or “add AI players”, show “Use my agent” and a dropdown of the user’s agents and slot (e.g. “AI_2 → My Tycoon Bot”).
- On confirm, frontend calls the new “assign agent” API; backend registers that agent’s URL for the chosen slot (for that game or globally, per product choice).

---

## 4. Optional: “We host your agent” (create & deploy)

To let users **create** an agent (no URL yet) and have the platform **host** it:

### 4.1 Runtime

- **Option A — Shared runner:** One long-running service that accepts “agent id” + “decision request” and runs the right config (e.g. same decision logic as `tycoon-celo-agent` but with per-agent config loaded from DB). No separate process per user. Easiest to start.
- **Option B — Instance per agent:** For each “hosted” agent we run a real instance (e.g. container or serverless) of a small server that exposes `POST /decision` (like `tycoon-celo-agent`). We assign a URL (e.g. `https://agents.tycoon.xyz/run/{agentId}`) and store it in `user_agents.hosted_url`.

### 4.2 Deploy flow

- User clicks “Create agent” and chooses template “Tycoon player”, optionally adds system prompt or API key.
- Backend creates `user_agents` row with `status = 'draft'` and `config = { template: 'tycoon', system_prompt?, llm_key_encrypted? }`.
- User clicks “Deploy”. Backend:
  - **If shared runner:** Mark `status = 'active'`, set `hosted_url` to e.g. `https://agents.tycoon.xyz/run/{id}`. Runner uses `id` to load config and answer `POST /run/:id/decision` (or similar).
  - **If per-instance:** Start container/function, get URL, set `hosted_url` and `status = 'hosted'`.
- When Tycoon needs a decision for that agent, it uses `hosted_url` as the callback (same as bring-your-own).

### 4.3 Security and limits

- **Secrets:** Store LLM keys encrypted; inject at runtime. Never log or expose to frontend.
- **Rate limits / quotas:** Per-user or per-agent request limits so one user can’t overload the system.
- **Validation:** For bring-your-own, optional HEAD/GET check that `callback_url` returns 200 or that `POST /decision` exists (with a small test payload).

---

## 5. ERC-8004 and Celo (optional but recommended)

- **Bring-your-own:** User can paste their existing `erc8004_agent_id` when creating the agent; we store it and send it in `agent-registry/register` so reputation/agentscan works.
- **We host:** After deploy we can call the same registration script you have (`register-erc8004-agent.js`) with a manifest URL for this agent, get back `agentId`, and set `user_agents.erc8004_agent_id`. Then use that in feedback after games.

---

## 6. Checklist summary

| # | What | Status / Notes |
|---|------|----------------|
| 1 | DB: `user_agents` table + migration | To do |
| 2 | Model: UserAgent (create, findByUser, findById, update, delete) | To do |
| 3 | Routes: GET/POST /api/agents, GET/PATCH/DELETE /api/agents/:id | To do |
| 4 | Auth: ensure routes resolve user_id (session/wallet/JWT) | To do |
| 5 | Assign agent to game/slot: new API + persistence (e.g. `agent_slot_assignments`) | To do |
| 6 | agentRegistry: resolve slot from DB when no in-memory match (user agent) | To do |
| 7 | Frontend: “My agents” list + create (name + callback_url) | To do |
| 8 | Frontend: “Use my agent” when creating/joining game (pick agent + slot) | To do |
| 9 | Optional: deploy endpoint + shared runner or per-instance hosting | Later |
| 10 | Optional: ERC-8004 registration from UI and store agent_id | Later |

Starting with **1–8** gives you “users can create (define) an agent by URL and assign it to play Tycoon.” Adding **9–10** gives “users can create an agent we host and optionally register on Celo.”
