# Admin Dashboard — Implementation Plan (Local)

This file is listed in `.gitignore` and must not be committed. It describes how to implement the admin dashboard layout, features, analytics, and the referral system step by step.

---

## Implementation status (living)

_Last updated: player profile referral card + ?ref= capture for Privy sign-in._

### Done

| Area | What shipped |
|------|----------------|
| **Admin auth** | Optional shared secret: backend `TYCOON_ADMIN_SECRET`, header `x-tycoon-admin-secret`; frontend `NEXT_PUBLIC_TYCOON_ADMIN_SECRET` via `adminApi`. Same pattern as shop admin. Middleware: `backend/middleware/dashboardAdminAuth.js`. |
| **API mount** | `app.use("/api/admin", requireAdminIpAllowlist, adminApiRateLimiter, adminDashboardRoutes)` in `server.js`. Config: `backend/config/adminDashboardSecurity.js`, middleware `adminDashboardGate.js`. |
| **Phase 0 — shell** | `frontend/app/admin/layout.tsx` + `AdminDashboardLayout.tsx`: top bar, left nav, main workspace, right alerts panel (xl+), mobile nav strip. Main site navbar hidden on `/admin`; `AuthGuard` allows `/admin` without wallet. **Top search:** `GET /api/admin/search` + `AdminGlobalSearch` (players + game rooms). |
| **Phase 2 — overview (partial)** | `GET /api/admin/overview` → `adminDashboardController.getOverview` (DB aggregates). **Not done:** charts, leaderboard preview endpoint, live alerts API. |
| **Phase 3 — players (read-only)** | `GET /api/admin/players` (pagination, `q`, `sort`, `chain`), `GET /api/admin/players/:id` (sanitized profile, **referral** block, property stats, recent games). UI: `/admin/players`, `/admin/players/[id]`. **Not done:** suspend/ban/reward adjust, quest summary. |
| **Phase 4 — game rooms** | `GET /api/admin/rooms`, `GET /api/admin/rooms/:id`, `POST /api/admin/rooms/:id/cancel`, **`POST /api/admin/rooms/bulk-cancel`** (`dryRun` + `confirm` + optional `statuses`). UI: `/admin/game-rooms` includes **bulk cancel** panel (preview + cancel pending/running/in-progress/awaiting). **Not done:** pause/resume, remove single player, restart room, on-chain teardown. |
| **Phase 5 — properties** | `GET /api/admin/properties` (pagination, search), `GET /api/admin/properties/:id`, `PATCH /api/admin/properties/:id` (whitelisted fields). Invalidates Redis `property:{id}` + `properties`. UI: `/admin/properties`, `/admin/properties/[id]`. **Not done:** disable flag, rarity/reward columns, holder drill-down. |
| **Phase 6 — token/rewards (partial)** | `GET /api/admin/economy/overview`, `GET /api/admin/economy/config`, `POST /api/admin/economy/grant-voucher` (TYC voucher mint via `mintVoucherTo`). UI: `/admin/token-rewards`. **Not done:** DB-backed economy config, burn/rollback, game-win reward tuning UI. |
| **Phase 8 — leaderboard (partial)** | `GET /api/admin/leaderboard` — `period=daily|weekly|monthly|all`, `chain`, `limit`, `source=games|profile` (profile only with `period=all`), `includeNullChain` for legacy rows. UI: `/admin/leaderboard`. **Not done:** reset leaderboard, exclude accounts, property column. |
| **Phase 12 — analytics (partial)** | `GET /api/admin/analytics/dashboard` (`startDate`, `endDate`), `GET /api/admin/activity` → **`/api/admin/analytics/activity`** (`limit`). Reuses `services/analytics.js` (no `ANALYTICS_API_KEY`; admin secret only). UI: `/admin/analytics`. **Not done:** cohorts, revenue, RUM, ETL rollups. |
| **Phase 9 — wallet monitor (partial)** | `GET /api/admin/wallets` (pagination, search, chain, sort). UI `/admin/wallet-monitor`. **No** on-chain balances; **no** freeze flag yet. |
| **Phase 11 — system settings (partial)** | `GET /api/admin/settings/summary` — runtime + **admin API security** (allowlist on/off, effective rate limit) + integration booleans + EVM chain readiness (no secrets). UI `/admin/settings`. **Not done:** maintenance mode, DB-backed config, health probes. |
| **Phase 10 — moderation (partial)** | Migration `moderation_reports`. `GET/POST /api/admin/moderation/reports`, `GET/PATCH /api/admin/moderation/reports/:id`. Overview `flaggedReports` = open count (best-effort if table missing). UI `/admin/moderation` (queue, status actions, admin note, manual file). **Not done:** chat moderation, mute/kick/ban wiring, public in-game report endpoint with user auth. |
| **Audit log (partial)** | Table `admin_audit_log`; `appendAdminAuditLog` in `services/adminAuditLog.js` (IP + UA from request). Logged: `rooms.cancel`, `rooms.bulk_cancel`, `economy.grant_voucher`, `properties.patch`, `moderation.report_create`, `moderation.report_patch`. `GET /api/admin/audit-log` (pagination, `action`, `q`, optional `targetType`, `startDate`/`endDate`). UI `/admin/audit-log`. **Not done:** named admin actor (still shared secret only), export, retention job. |
| **Phase 13 — referrals (partial)** | Same as prior row + **player UI:** `ProfileReferralCard` on profile **Game stats** (desktop + mobile); `ReferralCapture` + `sessionStorage` `tycoon_pending_referral_code` from `?ref=`; `PrivyBackendSync` sends `referralCode` on `privy-signin` and clears pending code after JWT. **Not done:** `referral_events` / rewards / fraud caps; JWT users who skip Privy must `POST /api/referral/attach` manually if they only have a code. |
| **Stub routes** | **Quests** only. Other admin nav routes implemented. |

### Not started (high level)

- Audit log: per-admin identity, export, retention policy  
- Charts / `GET /admin/metrics/...` naming alignment with plan  
- Quests, leaderboard admin _(partially shipped)_, system settings _(partially shipped)_; referral **rewards** / events / anti-abuse not built; moderation queue shipped, actions on players not wired  
- **Admin hardening:** CIDR allowlist, per-route limits, WAF — _(basic per-IP limit + optional exact IP list done via `TYCOON_ADMIN_*`)_

---

## Guiding principles

1. **Auth & roles**: Separate admin authentication from player auth (e.g. server-side allowlist, signed JWT with `role: admin`, or existing shop-admin pattern extended). All admin API routes require middleware.
2. **API first**: Define REST (or RPC) contracts for each domain; build the UI against stable endpoints.
3. **Incremental delivery**: Ship a shell layout, then Dashboard → Players → Rooms → Economy → Moderation → Settings → Analytics → Referrals.
4. **Observability**: Log admin actions (audit trail) for suspend, ban, token adjust, room kill, config changes.

---

## Phase 0 — Foundation

| Step | Task |
|------|------|
| 0.1 | Add admin role model in backend (DB flag, env allowlist, or dedicated `admins` table). **Partial:** shared-secret env only (`TYCOON_ADMIN_SECRET`); no `admins` table. |
| 0.2 | Middleware: `requireAdmin` (reuse patterns from `shopAdminAuth` as suitable). **Implemented** as `requireDashboardAdminSecret`. |
| 0.3 | Frontend route group `app/(admin)/...` or `app/admin/...` with layout that does not expose to non-admins. **Implemented** `app/admin/*`; `/admin` allowed past `AuthGuard` (secret still required for API when set). |
| 0.4 | Admin layout shell: **Top bar**, **left nav**, **main workspace**, **right alerts panel** (responsive: collapse nav + alerts on small screens). **Implemented.** |
| 0.5 | Shared UI: search input, notification bell (stub), wallet monitor link, profile menu. **Partial** (search disabled stub; bell disabled; wallet link + “Dashboard” label). |
| 0.6 | **Audit log** table: `admin_id`, `action`, `target_type`, `target_id`, `payload_json`, `created_at`. **Partial:** `admin_audit_log` without `admin_id`; IP/UA stored; see `/api/admin/audit-log`. Analytics `recordEvent` still used in parallel. |

---

## Phase 1 — Top bar & navigation

| Step | Task |
|------|------|
| 1.1 | Top bar: Logo → app home or admin home; **Search** (global admin search: players by wallet/username/id, rooms by code/id — debounced `GET /api/admin/search`). **Implemented** (`AdminGlobalSearch`, sm+ header). **Not done:** properties/moderation in search. |
| 1.2 | **Notifications**: endpoint `GET /admin/notifications` (aggregated flags, errors); mark read. **Not implemented.** |
| 1.3 | **Wallet monitor**: link to `/admin/wallet-monitor` (or embed summary badge: connected wallets count / last error). **Link only** (page still stub). |
| 1.4 | **Admin profile**: display admin identity + sign out. **Not implemented** (static “Dashboard” label). |
| 1.5 | Left nav items (routes): Dashboard, Players, Game Rooms, Properties, Token Rewards, Quests, Leaderboard, Analytics, Wallet Monitor, Moderation, System Settings. Highlight active route. **Implemented** (`adminNav.ts`; **Quests** nav still placeholder page). |

---

## Phase 2 — Dashboard overview

| Step | Task |
|------|------|
| 2.1 | Backend aggregations (cached, e.g. Redis or materialized counters refreshed periodically): total players, active today, total games, running now, tokens distributed, tx count, properties owned, open flagged reports. **Implemented** (live SQL, no Redis cache yet). |
| 2.2 | `GET /admin/metrics/overview` returning the above. **Implemented** as `GET /api/admin/overview` (name differs from this row; UI on `/admin`). |
| 2.3 | Charts (use existing chart lib or add one): DAU, games created/day, token distribution, revenue from fees (needs fee events in DB or indexer). **Not implemented.** |
| 2.4 | **Leaderboard preview**: `GET /admin/leaderboard?limit=10&period=all` — columns Rank, Player, Wallet, Score, Games Won. **Not implemented.** |
| 2.5 | **Right alerts panel**: subscribe to `GET /admin/alerts` — sections Flagged Players, Suspicious Wallets, Game Errors (map to real data sources as they exist). **UI placeholder only; no API.** |

---

## Phase 3 — Player management

| Step | Task |
|------|------|
| 3.1 | `GET /admin/players` with pagination, filters (status, wallet, username), sort. **Implemented** (`/api/admin/players`, search `q`, `sort`, `chain`). |
| 3.2 | Table: Player, Wallet, Games Played, Tokens, Status, Actions. **Implemented** in `/admin/players` (status always `active` until moderation exists). |
| 3.3 | `GET /admin/players/:id` — profile: username, wallet, join date, total games, token balance, quest progress summary. **Implemented** (profile + property stats; **no** quest block yet). |
| 3.4 | **Activity**: game history, properties owned, token transactions (reuse existing game/user/ledger queries). **Partial:** recent games + property/trade counters; **no** dedicated token tx feed. |
| 3.5 | **Actions** (each writes audit log): Suspend, Ban, Reset account (define semantics), Adjust rewards (calls internal ledger), View transaction history. **Not implemented.** |
| 3.6 | Confirm legal/product policy for ban/suspend before exposing destructive actions. |

---

## Phase 4 — Game room management

| Step | Task |
|------|------|
| 4.1 | `GET /admin/rooms?status=active` — room id, players, status, duration. **Implemented** as `GET /api/admin/rooms` (`status`: `active` \| `all` \| `pending` \| `running` \| `finished` \| `cancelled`, `q`, pagination). |
| 4.2 | `GET /admin/rooms/:id` — board state summary, player list, property ownership snapshot, game log tail. **Implemented** as `GET /api/admin/rooms/:id` (players, properties join, last 40 history rows; `placements` stripped from game blob). |
| 4.3 | **Actions**: Pause, End, Remove player, Restart room — wire to game server / contract state as applicable; document idempotency. **Partial:** `POST /api/admin/rooms/:id/cancel` and **`POST /api/admin/rooms/bulk-cancel`** (chunked SQL `CANCELLED`, per-game cache + socket); **does not** unwind chain. Pause / remove-player / restart still TODO. |

---

## Phase 5 — Property management

| Step | Task |
|------|------|
| 5.1 | CRUD or patch API for property templates: name, price, rent, image URL, rarity, reward tokens. **Partial:** `GET/PATCH /api/admin/properties`, `GET /api/admin/properties/:id` — patch whitelist matches DB template (no rarity/reward-token columns on `properties` yet). |
| 5.2 | Admin table: Property, Price, Rent, Owner count, Status. **Implemented** as list with **ownership rows** count (`game_properties`); no separate “disabled” status column. |
| 5.3 | **Actions**: Edit, Disable, Adjust value, Track ownership (drill-down to holders). **Partial:** edit via `/admin/properties/[id]`; **no** disable flag or per-game holder drill-down. |

---

## Phase 6 — Token & reward management

| Step | Task |
|------|------|
| 6.1 | Config store (DB or config service): game win reward, quest reward, daily reward cap, emission rate. **Partial:** daily claim base/bonus documented via `GET /api/admin/economy/config` (env-backed; same keys as `dailyClaimController`). |
| 6.2 | `PATCH /admin/economy/config` with validation and audit. **Not implemented** (env-only today). |
| 6.3 | Manual distribution: `POST /admin/economy/grant` — body: player_id, amount, reason; idempotency key. **Implemented** as `POST /api/admin/economy/grant-voucher` (`userId`, `tycAmount`, `chain`, `reason`) — on-chain voucher mint, not idempotent. |
| 6.4 | **Actions**: Adjust tokens, burn (if on-chain/off-chain defined), reward rollback (compensating ledger entry). **Not implemented.** |

---

## Phase 7 — Quest management

| Step | Task |
|------|------|
| 7.1 | Quest model: requirement JSON, reward, status, completion conditions (evaluated server-side). |
| 7.2 | `GET/POST/PATCH /admin/quests`. |
| 7.3 | Table: Quest, Requirement summary, Reward, Status, Actions. |
| 7.4 | Seed examples: Win 5 games, Own 3 properties, Trade with 2 players (implement condition evaluators). |

---

## Phase 8 — Leaderboard management

| Step | Task |
|------|------|
| 8.1 | Tabs: Daily / Weekly / Monthly / All-time — query param drives time window. **Implemented** via `GET /api/admin/leaderboard` + `/admin/leaderboard` (games finished in window by `updated_at`). |
| 8.2 | Table: Rank, Player, Score, Games Won, Properties. **Partial:** Rank, player link, wallet short, wins; optional games played when `source=profile`. |
| 8.3 | **Actions**: Reset period, remove suspicious accounts (soft-delete or exclude flag), manual rank adjust (only if product requires; prefer automated recompute). **Not implemented.** |

---

## Phase 9 — Wallet & blockchain monitor

| Step | Task |
|------|------|
| 9.1 | Index or query: connected wallets, recent token txs, NFT mints (depends on chain indexer or subgraph). **Partial:** DB wallet list via `/api/admin/wallets`. |
| 9.2 | Table: Wallet, Tokens, Games, Status. **Partial:** user primary + smart + linked, games played/won, total_earned; **no** token columns. |
| 9.3 | **Actions**: Freeze wallet (internal flag + block gameplay), link to full tx logs. **Not implemented.** |

---

## Phase 10 — Moderation

| Step | Task |
|------|------|
| 10.1 | Reports model: reporter, reported player, reason, status, timestamps. **Partial:** `moderation_reports` (`reporter_user_id`, `target_user_id`, `target_type`/`target_ref`, `category`, `details`, `status`, `admin_note`, `resolved_at`). |
| 10.2 | `GET /admin/reports` with workflow states (open, reviewing, closed). **Implemented** as `GET /api/admin/moderation/reports` (+ `POST` create, `PATCH` update); states: open, reviewing, resolved, dismissed. |
| 10.3 | Tools: player reports UI, chat moderation (if chat exists), fraud/cheat logs ingestion. **Partial:** admin queue + manual file; no chat tools. |
| 10.4 | **Actions**: Mute, Kick from room, Ban (ties to player admin actions). **Not implemented.** |

---

## Phase 11 — System configuration

| Step | Task |
|------|------|
| 11.1 | Game config: dice probability (document as server-authoritative randomness), entry fee, max players per room, reward multiplier. **Not implemented** in admin UI. |
| 11.2 | Maintenance mode flag + banner for clients; `GET /health` for server monitor. **Not implemented** (summary page notes future DB flags). |
| 11.3 | Expose read-only **server health** in admin (CPU/memory optional; at minimum DB + game service pings). **Partial:** `/api/admin/settings/summary` for env/integration readiness only. |

---

## Phase 12 — Analytics & reports

| Step | Task |
|------|------|
| 12.1 | **User growth**: registered total, DAU, MAU, new users/day, growth rate, wallet connection rate, traffic sources (requires analytics pixel or server logs). **Not implemented** (see `/admin` overview for coarse DB totals only). |
| 12.2 | **Retention**: D1/D7/D30, churn, repeat players — needs daily cohort snapshots (batch job). **Not implemented.** |
| 12.3 | **Revenue**: total, ARPU, ARPPU, conversion to paying, CAC, LTV — needs payment/fee events. **Not implemented.** |
| 12.4 | **Gameplay**: completion rate, avg match duration, hot properties, token circulation. **Partial:** games by status, started/finished per day via `getDashboard`; use `/admin/analytics`. |
| 12.5 | **Technical**: uptime, error rate, page load (RUM), game load time, cost/scalability notes (link to cloud billing exports). **Not implemented** (filter `event_type=error` in activity table as a rough signal). |
| 12.6 | **Business health**: MAP trend, satisfaction (surveys/NPS if collected), funnel: Landing → Sign in → Wallet connect → First game → Repeat (event tracking). **Not implemented.** |
| 12.7 | Implement ETL or incremental rollups to avoid heavy live queries on production. **Not implemented.** |
| **Admin slice** | **Implemented:** `GET /api/admin/analytics/dashboard` + `GET /api/admin/analytics/activity`, UI `/admin/analytics` (reuses existing analytics service + `analytics_events` tail). Public `/api/analytics/*` remains separately keyed by `ANALYTICS_API_KEY` when set. |

---

## Phase 13 — Referral program (full vertical slice)

### 13.1 Product rules (decide and document)

- Referral code format (e.g. short code vs wallet-derived).
- Attribution window (e.g. 30 days from first landing with `?ref=`).
- Reward for **referrer** and/or **referee** (tokens, cosmetic, fee discount).
- Anti-abuse: one account per device/IP heuristics, cap rewards per referrer per day, block self-referral.

### 13.2 Data model

| Table / collection | Fields (conceptual) |
|--------------------|---------------------|
| `users` (extend) | `referral_code` (unique), `referred_by_user_id` (nullable), `referred_at`, `first_qualified_action_at` |
| `referral_events` | `id`, `referrer_user_id`, `referee_user_id`, `event_type` (signup, wallet_connect, first_game, …), `metadata`, `created_at` |
| `referral_rewards` | `id`, `user_id`, `amount`, `reason`, `referral_event_id`, `status` (pending/paid/revoked) |

### 13.3 Backend APIs

| Step | Endpoint / job | Purpose |
|------|----------------|---------|
| 13.3.1 | `GET /referral/me` (player) | Current user’s code, link, counts, pending rewards. |
| 13.3.2 | `POST /referral/attach` | On signup or first session: accept `ref` code; set `referred_by` if allowed. |
| 13.3.3 | Internal hooks | On wallet connect / first game completed, emit `referral_events` and trigger reward rules. |
| 13.3.4 | `GET /admin/referrals/overview` | Totals: signups via referral, qualified referrals, rewards paid, fraud flags. |
| 13.3.5 | `GET /admin/referrals/players` | Per-player: **referral count** (total signups), **qualified count**, rewards earned, referred users list (paginated). |
| 13.3.6 | `GET /admin/referrals/players/:id` | Full tree: who referred them, whom they referred, timeline of events. |
| 13.3.7 | `POST /admin/referrals/adjust` | Manual correction with audit (rare). |

### 13.4 Frontend (player-facing)

- Settings or profile: “Your referral link”, copy button, share text. **Partial:** Profile → Game stats → `ProfileReferralCard` (code, copy link, invite count, referred-by line). `?ref=` captured app-wide via `ReferralCapture`.
- Optional dashboard card: referrals count, rewards earned. **Rewards not implemented.**

### 13.5 Frontend (admin)

- Under **Players** profile: section **Referrals** — counts + list + event log.
- Dedicated **Referrals** nav item (optional) or sub-page under Analytics: funnel from referral link → signup → qualified.

### 13.6 Implementation order for referrals

1. Schema migration + backfill `referral_code` for existing users. **Done** (+ `User.create` assigns codes).
2. Landing/signup: capture `ref` query param → session → persist on account creation. **Partial:** client sends `referralCode`/`ref` on `POST /auth/privy-signin` or calls `POST /api/referral/attach` after JWT.
3. Idempotent `attach` logic (no overwrite of `referred_by` if already set). **Done** (`POST /api/referral/attach` + Privy body hook).
4. Event emitters at key lifecycle points; reward job or synchronous grant per policy. **Not done.**
5. Admin read APIs + UI tables; then fraud rules and caps. **Partial:** `GET /api/admin/referrals/overview` + `/admin/referrals` + player detail referral block; no per-player list endpoint or rewards.

---

## Phase 14 — Hardening & launch

| Step | Task |
|------|------|
| 14.1 | Rate limits on all admin routes; IP allowlist optional. **Partial:** `/api/admin` uses `express-rate-limit` (env `TYCOON_ADMIN_RATE_LIMIT_*`, default 200/min) plus optional `TYCOON_ADMIN_IP_ALLOWLIST` (exact IPs, first `X-Forwarded-For` hop when behind proxy). |
| 14.2 | Pagination everywhere; no unbounded exports without auth. |
| 14.3 | Feature flags for destructive actions in staging. |
| 14.4 | E2E tests for critical paths (login, view player, grant tokens). |
| 14.5 | Runbook for moderation and economy incidents. |

---

## Suggested tech mapping (Tycoon repo)

- **Backend**: Extend existing Express routes; new `routes/admin-*.js` + controllers; align with current DB (Postgres/Mongo per project).
- **Frontend**: Next.js app router; admin layout in `frontend/app/admin/`; reuse component library and `EscrowAdminSection`-style patterns where applicable.
- **Charts**: Add lightweight dependency or server-render sparkline SVGs for v1.
- **Referrals**: Same API server as game; store events next to user records for join simplicity.

---

## Checklist summary

- [x] Admin auth + layout shell  
- [ ] Overview metrics + charts + alerts _(metrics only, no charts/alerts API)_  
- [ ] Players CRUD-lite + moderation actions _(list + detail only)_  
- [x] Rooms monitor + controls _(list + detail + cancel non-terminal games)_  
- [ ] Properties + economy + quests _(properties + economy overview/grant done; quests TODO)_  
- [x] Leaderboard admin _(read-only; reset/exclude TODO)_  
- [ ] Wallet monitor _(DB list only; no freeze / on-chain)_  
- [ ] System settings + maintenance _(read-only summary only)_  
- [ ] Analytics rollups + funnels _(admin dashboard + activity feed done)_  
- [ ] Moderation _(reports queue + admin API/UI; no mute/ban/kick)_  
- [ ] Audit log _(append + list UI; no per-admin id / export / retention)_  
- [ ] Admin hardening _(dedicated /api/admin rate limit + optional IP list; no CIDR/WAF)_  
- [ ] Referrals _(schema + attach + admin overview + player detail; no events/rewards/fraud)_  

_End of plan._
