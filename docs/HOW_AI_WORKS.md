# How Tycoon AI Works — Step by Step

This doc explains how AI decisions are made in Tycoon: from setup to execution.

---

## 1. Overview

When a game needs an AI decision (buy/skip property, accept/decline trade, build, strategy), the system:

1. Checks if that slot has a **registered agent**
2. If yes → asks that agent for a decision
3. If no (or agent fails) → uses the **internal LLM** (Claude) for AI games, or **built-in rule-based logic** as fallback

**Decision sources (in priority order):**

| Priority | Source | When used |
|----------|--------|-----------|
| 1 | **User agent** (My agent plays for me) | Slot 1 has a registered user agent |
| 2 | **External agent** (callback URL) | Slot has a registered external endpoint |
| 3 | **Internal LLM** (Claude) | AI game, no external agent, `ANTHROPIC_API_KEY` set |
| 4 | **Built-in rules** | Fallback when none of the above |

---

## 2. Slots and Agents

- **Slot 1** = Human player’s seat. When “My agent plays for me” is on, a user agent is registered for this slot.
- **Slots 2–8** = AI seats in “Play vs AI” games. Each can be backed by an external agent or the internal LLM.

The **agent registry** stores: `gameId + slot → { callbackUrl?, user_agent_id?, agentId, name }`.
- **Persistence:** Assignments are saved to the `agent_slot_assignments` table and rehydrated on server startup (so “My agent” survives restarts).
- **Race safety:** Only one decision request runs at a time per (gameId, slot); concurrent requests for the same slot are serialized.
- **Cleanup:** When a game is marked FINISHED (via update, finish-by-time, or net-worth finish), all agent assignments for that game are removed.

---

## 3. Step-by-Step: User Agent (“My agent plays for me”)

### 3.1 Setup (before game)

1. User goes to **My Agents** (`/agents`).
2. User creates an agent with one of:
   - **Tycoon-hosted** — we run the AI with our API key (subject to daily credits cap).
   - **My API key** — user’s Anthropic key stored encrypted; we call Claude with it.
   - **My callback URL** — user’s server that exposes `POST /decision`.
3. User optionally adds a **skill** (text) to customize how the AI plays.
4. User optionally registers on **ERC-8004** (Celo) for identity/reputation.

### 3.2 Enable in game

1. User starts or joins a game.
2. User turns on **“My agent plays for me”** and selects an agent from the dropdown.
3. Frontend calls `POST /api/games/:id/use-my-agent` with `{ user_agent_id }`.
4. Backend loads the agent from `user_agents`, checks it has a callback URL, saved API key, or Tycoon hosting.
5. Backend calls `agentRegistry.registerAgent({ gameId, slot: 1, user_agent_id, callbackUrl?, ... })`.
6. The registry stores: `game_123_slot_1 → { user_agent_id: 5, callbackUrl?, ... }`.

### 3.3 When a decision is needed

1. It’s the human’s turn (slot 1); the board needs a decision (e.g. buy or skip property).
2. Frontend calls `POST /api/agent-registry/decision` with `{ gameId, slot: 1, decisionType: "property", context }`.
3. Backend (`agentRegistry.getAIDecision`) looks up `game_123_slot_1`.
4. It finds `user_agent_id: 5`, loads the full agent from DB.
5. **If Tycoon-hosted**:
   - Checks per-user daily credits cap (`hosted_agent_usage`).
   - If under cap → increments usage, calls `internalAgent.getDecision(..., { systemPrompt: agent.config.skill })`.
   - Uses Tycoon’s `ANTHROPIC_API_KEY`.
6. **If My API key**:
   - Decrypts the user’s stored API key.
   - Calls `internalAgent.getDecisionWithKey(userKey, ..., { systemPrompt })`.
7. **If My callback URL**:
   - POSTs to `{callbackUrl}/decision` with `{ requestId, gameId, slot, decisionType, context, deadline }`.
   - Waits for response (timeout ~8s), parses `{ action, propertyId?, reasoning?, confidence? }`.
8. Backend returns the decision to the frontend.
9. Frontend executes the action (e.g. call buy API or skip).

---

## 4. Step-by-Step: AI Game (slots 2–8)

### 4.1 Setup

- User creates an AI game (e.g. 1 human + 2 AI). Game has `is_ai: true`.
- Slots 2 and 3 are AI seats. No user agent by default.
- Optionally, an external agent (e.g. `tycoon-celo-agent`) registers for a slot via `POST /api/agent-registry/register` with `{ slot: 2, callbackUrl, agentId, gameId? }`.

### 4.2 When an AI decision is needed

1. It’s slot 2’s turn (e.g. buy or skip property after landing).
2. Frontend (e.g. `board-3d`, `ai-board`, `useAIAutoActions`) calls `POST /api/agent-registry/decision` with `{ gameId, slot: 2, decisionType: "property", context }`.
3. Backend (`agentRegistry.getAIDecision`):
   - Looks up agent for `game_123_slot_2`.
   - **If user_agent_id** (rare for slots 2–8) → same as §3.3.
   - **If callbackUrl** → POST to external agent, return response.
   - **If none** → loads game, checks `game.is_ai` and `USE_INTERNAL_AI_AGENT`.
   - If AI game and internal agent enabled → calls `internalAgent.getDecision(...)` with `ANTHROPIC_API_KEY`.
   - If that fails or is disabled → returns `null`.
4. If backend returns `{ useBuiltIn: true }` or `null` → frontend uses built-in rule-based logic (e.g. `calculateAiFavorability`, fixed rules).
5. Frontend executes the action via existing game APIs (buy, decline-buy, accept-trade, etc.).

---

## 5. Internal Agent (Claude)

**Location:** `backend/services/internalAgent.js`

### 5.1 Flow

1. Receives `(gameId, slot, decisionType, context)` and optional `{ systemPrompt }` (user’s skill).
2. Builds a prompt from `context` (e.g. `buildPropertyPrompt`, `buildTradePrompt`).
3. If `systemPrompt` is set → passes it as the **system** message to Claude.
4. Calls Anthropic API: `messages.create({ model, system?, messages: [{ role: "user", content: prompt }] })`.
5. Parses the JSON response (e.g. `{"action":"buy","reasoning":"...","confidence":85}`).
6. Returns `{ action, propertyId?, reasoning?, confidence?, counterOffer? }`.

### 5.2 Decision types

| decisionType | Purpose | Example action |
|--------------|---------|----------------|
| `property` | Buy or skip landed property | `buy`, `skip` |
| `trade` | Accept, decline, or counter trade offer | `accept`, `decline`, `counter` |
| `building` | Build houses or wait | `build`, `wait` (+ `propertyId`) |
| `strategy` | Pre-roll action (liquidate, unmortgage, build, trade, roll) | `liquidate`, `unmortgage`, `build`, `proposeTrade`, `roll` |
| `tip` | Short tip for human (e.g. after landing) | `ok` (+ `reasoning` as tip) |

### 5.3 Context shape

`context` includes: `myBalance`, `myProperties`, `opponents`, `landedProperty`, `tradeOffer`, `gameState`, `inDebt`, `hasMonopoly`, `canUnmortgage`, `canBuild`, `canSendTrade`, etc.

---

## 6. Hosted Endpoint (for external callers)

If a user agent has `hosted_url` (Tycoon-hosted or template), external systems can POST decisions directly:

`POST /api/agent-registry/hosted/:agentId/decision`

Body: `{ requestId, gameId, slot, decisionType, context }`

- Backend loads the agent, checks Tycoon-hosted or saved API key.
- Applies daily credits cap for Tycoon-hosted.
- Calls internal agent with optional skill.
- Returns `{ requestId, action, propertyId?, reasoning?, confidence? }`.

---

## 7. Fallback Chain (summary)

```
Request: POST /agent-registry/decision { gameId, slot, decisionType, context }
    │
    ▼
agentRegistry.getAIDecision(gameId, slot, decisionType, context)
    │
    ├─► Has user_agent_id?
    │       ├─► Tycoon-hosted? → Check credits → internalAgent.getDecision (with skill)
    │       ├─► Saved API key? → internalAgent.getDecisionWithKey (with skill)
    │       └─► Callback URL? → POST {callbackUrl}/decision
    │
    ├─► Has callbackUrl? (external agent)
    │       └─► POST {callbackUrl}/decision
    │
    ├─► AI game + internal agent enabled?
    │       └─► internalAgent.getDecision (no skill)
    │
    └─► Return null → Frontend uses built-in rules
```

---

## 8. Configuration

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Required for internal agent. If unset, internal agent is disabled. |
| `USE_INTERNAL_AI_AGENT` | Set to `"false"` to disable internal agent. Default: enabled. |
| `INTERNAL_AGENT_MODEL` | Claude model. Default: `claude-sonnet-4-20250514`. |
| `INTERNAL_AGENT_TIMEOUT_MS` | Request timeout. Default: `15000`. |
| `AGENT_DECISION_TIMEOUT_MS` | Timeout for external callback. Default: `8000`. |
| `HOSTED_AGENT_DAILY_CAP` | Per-user daily limit for Tycoon-hosted decisions. Default: `100`. |
| `AGENT_API_KEY_SECRET` | Encryption key for stored API keys (32 bytes hex). |

---

## 9. Key Files

| File | Role |
|------|------|
| `backend/services/agentRegistry.js` | Registry, `getAIDecision` routing |
| `backend/services/internalAgent.js` | Claude prompts and LLM calls |
| `backend/services/hostedAgentUsage.js` | Daily credits cap for Tycoon-hosted |
| `backend/routes/agent-registry.js` | `POST /decision`, hosted endpoint |
| `backend/controllers/gameController.js` | `useMyAgent`, `stopUsingMyAgent` |
| `backend/models/UserAgent.js` | Agent CRUD, encrypted API key |
