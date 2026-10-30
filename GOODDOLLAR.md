# GoodDollar × Tycoon MiniPay — integration notes

Short reference for reviewers (GoodBuilders Season 4 retest) and future contributors.

## What's gated

**Primary core flow:** creating a solo game vs AI opponents and creating a
multiplayer lobby from inside MiniPay.

- `POST /games/create-ai-as-guest` — AI-only solo game
- `POST /games/create-as-guest` — human-lobby create (reached via the
  `create-multiplayer-as-guest` shim too)

Both are the single entry point MiniPay players hit to actually start a match.
If the gate rejects, no on-chain write happens — the DB game is never created
and nothing is paid.

Non-MiniPay (web/desktop) traffic is unaffected: the gate only triggers when
the request body carries `is_minipay: true` **and** the server-side flag
`GD_REQUIRE_FOR_MINIPAY_ACTIONS=true` is set.

## How it works (end to end)

1. Player taps **Play** in the MiniPay app.
2. Frontend hits `POST /games/create-ai-as-guest` with `is_minipay: true`.
3. Backend (`controllers/gameController.js`) checks
   `isUserGoodDollarVerified(user)` from `services/goodDollarIdentity.js`.
4. That helper calls `getWhitelistedRoot(address)` on GoodDollar's IdentityV2
   contract on Celo (`0xC361A6E67822a0EDc17D899227dd9FC50BD62F42`). A non-zero
   root means verified.
5. Verified → request proceeds, game is created, player goes to the board.
6. Not verified → backend returns:
   ```http
   HTTP/1.1 403 Forbidden
   { "success": false, "code": "GOODID_REQUIRED",
     "message": "Verify your humanity with GoodDollar to play on MiniPay.",
     "verifyUrl": "https://goodid.gooddollar.org/" }
   ```
7. `apiClient` (`lib/api.ts`) sees the 403+code, pops the
   `GoodDollarVerifyModal` globally — "Verify with GoodDollar" opens
   `verifyUrl` in a new tab. The player verifies, returns to MiniPay, taps
   Play again; this time the gate passes.

## Env flags

Set on the **Railway backend** (shared with the web app, so default off):

| Flag                              | Purpose                                                   | Example               |
| --------------------------------- | --------------------------------------------------------- | --------------------- |
| `GD_REQUIRE_FOR_MINIPAY_ACTIONS`  | Master on/off for the MiniPay gate                        | `true`                |
| `GD_IDENTITY_ENABLED`             | Enables the IdentityV2 read in `goodDollarIdentity.js`    | `true`                |
| `GD_ENV`                          | `production` or `staging`                                 | `production`          |
| `GD_IDENTITY_CONTRACT` (optional) | Override IdentityV2 address                               | `0xC361A6E6…62F42`    |
| `CELO_RPC_URL`                    | Celo RPC endpoint used for the identity read              | `https://forno.celo.org` |

The identity service fails open (returns `false`, but logs a warning) if any
of these are missing — the gate denies rather than crashing.

## Caching

`services/goodDollarIdentity.js` caches verification results for 60s per
address, so a verified reviewer who creates several games in a row only pays
one RPC round-trip.

## Reviewer test plan (Rael-style retest)

1. Open the MiniPay app with the test wallet.
2. Tap **Play vs AI** (or the multiplayer create flow).
3. **If the wallet is NOT GoodDollar-verified:**
   - Expect the Verify modal: "Verify with GoodDollar" / "I've verified —
     close and retry" / explainer text.
   - The game is NOT created, no on-chain tx happens, no funds move.
   - Tap **Verify with GoodDollar** → `goodid.gooddollar.org` opens in a new
     tab.
   - After completing GoodID verification on the same wallet, return to
     MiniPay, close the modal, tap Play again — the game creates and the
     board loads.
4. **If the wallet IS already verified:**
   - Tap Play — the game creates directly, no modal, no extra friction.
5. **On the web app (same backend):** create an AI game as usual — no modal,
   no gate (the body does not set `is_minipay: true`).

## How to see verification status (without triggering the play gate)

The Profile tab in the MiniPay app shows a GoodDollar status row backed by
the same `isUserGoodDollarVerified(user)` check the play gate uses.

- Endpoint: `GET /api/gooddollar/status` (auth required)
- Response: `{ success, enabled, verified, checkedAddresses, verifyUrl }`
- `checkedAddresses` lists every wallet the backend tested (linked →
  smart → primary → wallet), so a reviewer can confirm which account was
  checked — the Profile card displays the first one as the primary and
  mentions the count of extras.
- Query stale-time is 60s (matches the server identity cache). A small
  recheck icon on the card forces a refetch when a reviewer just finished
  verifying.
- If `GD_IDENTITY_ENABLED=false` or the identity env is missing, the card
  renders a muted "verification isn't available on this environment"
  rather than a misleading "Not verified" + CTA.

## Where to look in code

- Backend gate: `backend/controllers/gameController.js` — grep
  `GOODID_REQUIRED`.
- Backend status endpoint: `backend/controllers/goodDollarController.js`
  (`GET /api/gooddollar/status`, wired in `backend/server.js`).
- Identity read: `backend/services/goodDollarIdentity.js`
  (`getUserGoodDollarVerificationDetail` is the shared source of truth;
  `isUserGoodDollarVerified` is now a thin wrapper over it).
- Frontend modal: `minipay_frontend/components/gooddollar/GoodDollarVerifyModal.tsx`.
- Frontend status card: `minipay_frontend/components/gooddollar/GoodDollarStatusCard.tsx`
  (mounted in `components/profile/profile-mobile.tsx`).
- Frontend status hook: `minipay_frontend/hooks/useGoodDollarStatus.ts`.
- Error → event bridge: `minipay_frontend/lib/goodDollarVerifyPrompt.ts`.
- Central interceptor: `minipay_frontend/lib/api.ts`
  (`handleGoodDollarVerifyError` call).

## Scope / what's intentionally NOT gated

- Daily G$ UBI claim — bonus, not the headline integration.
- Tournament register / arena join — the current client path doesn't send
  `is_minipay`, so gating here would also hit web players. Can be added when
  the client is wired to tag the request.
- Agent create — reuses the game-create endpoints, so it inherits the gate.
