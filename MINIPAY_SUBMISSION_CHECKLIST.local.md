# MiniPay / Discover readiness checklist (local)

Use this when preparing [MiniPay Mini Apps](https://docs.minipay.xyz/) listing and review. Track owners and dates in your own notes; this file is not committed.

Reference: [Submit your MiniApp](https://docs.minipay.xyz/getting-started/submit-your-miniapp.md), [Best practices](https://docs.minipay.xyz/getting-started/best-practices.md), [Wallet connection](https://docs.minipay.xyz/getting-started/wallet-connection.md).

---

## Answers log (fill as you go)

### 1. Terms of Service — answered

| Question | Your answer |
|----------|-------------|
| Production / canonical app URLs | Primary: [https://www.tycoonworld.xyz/](https://www.tycoonworld.xyz/) · Alternate deploy: [https://base-monopoly.vercel.app/](https://base-monopoly.vercel.app/) |
| Lawyer-approved text | **No** — still placeholder until legal review |

**Still to do for item 1 (MiniPay “done” bar):** Host **Terms** at a **stable path** (e.g. `https://www.tycoonworld.xyz/terms` or an external HTTPS doc), put **draft** language + “not legal advice / subject to change” until counsel signs off, then add an **in-app link** (footer / menu). Homepage URL alone is not a substitute for a Terms document.

### 2. Privacy Policy — answered (hosting)

| Question | Your answer |
|----------|-------------|
| Where Privacy lives | **Same domain** as the app — e.g. `https://www.tycoonworld.xyz/privacy` (implement `/privacy` in the app or equivalent static route). |
| Lawyer-approved text | **Assumed same as Terms** — placeholder until legal review (say explicitly if that’s wrong). |

**Still to do for item 2:** Write draft Privacy copy (wallet, email/Privy, game data, analytics, third parties), add the route on production, and an **in-app link** next to Terms.

### 3. Support URL — answered

| Question | Your answer |
|----------|-------------|
| Channel | **Telegram** (“any works” — using the link already shipped in the app.) |
| Primary support URL | [https://t.me/+xJLEjw9tbyQwMGVk](https://t.me/+xJLEjw9tbyQwMGVk) *(same as `Footer.tsx` and `JoinOurCommunity.tsx`)* |

**Still to do for item 3:** Confirm that link is **obvious in-app on mobile** (MiniPay); add a “Support” or “Help” row in the hamburger / profile if the footer is not always visible.

### 4. Production `metadata.url` (Reown / AppKit) — answered + implemented

| Decision | Choice |
|----------|--------|
| Canonical production origin | **`https://www.tycoonworld.xyz`** (stable, branded; better than `*.vercel.app` for wallet metadata and listing). |
| Override | Set **`NEXT_PUBLIC_URL`** (or `NEXT_PUBLIC_SITE_URL`) on each deploy — e.g. preview can use its own origin; prod should use `https://www.tycoonworld.xyz`. |
| Code | `frontend/components/AppKitProviderWrapper.tsx` now derives `metadata.url` and icon from `siteUrl` (env → dev localhost → prod canonical). |

**Ops:** In Vercel **production**, set `NEXT_PUBLIC_URL=https://www.tycoonworld.xyz` so metadata always matches the live domain even if build defaults change.

### 5. Frame / miniapp URLs (`minikit.config.ts`) — same as §4

| Decision | Same as item 4: **`NEXT_PUBLIC_URL`** / **`NEXT_PUBLIC_SITE_URL`**, dev → localhost, prod fallback → **`https://www.tycoonworld.xyz`**. |
| Code | `frontend/minikit.config.ts` `ROOT_URL` aligned with `AppKitProviderWrapper` `siteUrl`. |

### 6. Auto-connect (MiniPay) — confirmed existing

| Status | **`navbar-mobile.tsx`** already sets MiniPay when `window.ethereum?.isMiniPay`, then `connect({ connector: injected() })` if not connected; connect/disconnect UI hidden in MiniPay path. |
| Optional later | `hasAttempted` guard (Strict Mode / duplicate attempts) and a dedicated “Open this app from MiniPay” line when `window.ethereum` is missing — not required if you’re happy with current behavior. |

### 7. Signing story — confirmed (product + MiniPay alignment)

| Access | **`AuthGuard`**: wallet **address** or **guest** — no `signMessage` required just to use protected routes after MiniPay auto-connect. |
| Signatures | **`useSignMessage`** only for **specific** flows (e.g. wallet↔backend proof, tournaments, link wallet) — not a global “sign to enter the app” gate. |
| Reviewer story | Auto wallet in MiniPay → play; sign only when a screen explains **why** (that action). |

### 8. Mobile pass — user verified

| Result | **Passes** — ~360×720 (and/or MiniPay), safe areas, no blocking horizontal scroll per [UI & container](https://docs.minipay.xyz/getting-started/ui-and-container.md). |

### 9. PageSpeed Insights — recorded (mobile, prod)

| Metric | Score |
|--------|------:|
| **Performance** | **43** |
| Accessibility | 86 |
| Best Practices | 100 |
| SEO | 96 |

| Report URL | *(paste full PSI report URL when you submit — from browser after Analyze)* |

**Follow-up:** **Performance 43** is the risk area; MiniPay calls out strong performance for listing. Re-run [PageSpeed Insights](https://pagespeed.web.dev/) after fixes; use the report’s **Opportunities** / **Diagnostics** (LCP, unused JS, images, fonts, TBT) to push Performance up.

### 10. Network manifest — draft (reconcile with Chrome → Network on prod)

**Your app & deploys**

- `https://www.tycoonworld.xyz` — primary frontend
- `https://base-monopoly.vercel.app` — alternate Vercel deploy (still referenced in some metadata / `.well-known` helpers)
- `http://localhost:3000` — local dev only

**Your backend API** (`NEXT_PUBLIC_API_URL` or default in code)

- `https://base-monopoly-production.up.railway.app` — REST API (`/api` path)

**Celo RPC** (`NEXT_PUBLIC_CELO_RPC_URL` / `NEXT_PUBLIC_ALFAJORES_RPC_URL` or defaults in `lib/utils/erc8004InjectedEoa.ts`)

- `https://forno.celo.org`
- `https://alfajores-forno.celo-testnet.org`

**Wallet / auth (SDKs load extra subdomains at runtime — list parent + verify in DevTools)**

- **Privy** — `privy.io` and subdomains (e.g. auth, embedded wallet); OAuth flows may hit `accounts.google.com`, `twitter.com`, etc. when Google/Twitter login enabled
- **Reown (AppKit) / WalletConnect** — `walletconnect.com`, `walletconnect.org`, `web3modal.com`, `reown.com` (and WSS relays — capture exact hosts from Network tab when opening connect modal)
- **MiniPay** — in-wallet browser only; no separate origin beyond user’s RPC calls

**Farcaster / Mini Apps**

- `https://api.farcaster.xyz` — hosted manifest redirect target (`next.config.mjs`)
- `https://farcaster.xyz` — miniapp share URLs (`useWaitingRoom`)
- `https://warpcast.com` — compose links

**Block explorers & tooling (links from UI)**

- `https://celoscan.io`
- `https://www.8004scan.io`
- `https://basescan.org`, `https://polygonscan.com` — tournament tx links by chain

**Social / support (outbound links)**

- `https://t.me` — Telegram (invite + share)
- `https://x.com` — X / Twitter
- `https://facebook.com`, `https://github.com` — footer

**Observability**

- **Sentry** — `@sentry/nextjs` → your configured Sentry ingest host(s) (`*.sentry.io` or region-specific); confirm in Sentry project settings / runtime requests

**Before submit:** Open prod in Chrome → **Network** → full user journey (home, sign-in, shop, game, wallet modal) → **add any host not listed above** (CDN, fonts, analytics, IPFS, payment provider if used).

### 11. Contracts & on-chain testing — user verified

| Celoscan | **All** user-facing contracts **deployed, verified** on [Celoscan](https://celoscan.io/), and **tested** (your confirmation). |
| Sample transactions | For the Google form, still **paste representative `https://celoscan.io/tx/...` links** per major user action if reviewers ask for specifics. |
| Celo | Production targets **mainnet (42220)**; testnet only if you ship Alfajores / Sepolia flows. |

### 12. Listing assets (MiniPay / Discover Google form) — draft answers

| Field | Suggested value (edit for legal name / final copy) |
|--------|------------------------------------------------------|
| **App name** | **Tycoon** |
| **Tagline** | Short: *Monopoly-style strategy on Celo — play, trade, and compete on-chain.* (Or reuse your hero one-liner.) |
| **Publisher** | **Tycoon** — replace with your **registered legal name / entity** on the form if required. |
| **Category** | **games** (`minikitConfig.miniapp.primaryCategory`) |
| **App URL (`linkUrl`)** | **`https://www.tycoonworld.xyz`** |
| **Icon** | **`https://www.tycoonworld.xyz/logo.png`** — if the file is small, export a **~512×512** PNG for the form asset. |
| **HTTPS** | **Yes** in production. |

### 13. Legal & support — implemented (draft copy)

| Item | Where |
|------|--------|
| **Terms** | `frontend/app/terms/page.tsx` — **`/terms`** (draft; prominent disclaimer). Linked from **Footer**, **mobile menu**, **desktop More menu**. |
| **Privacy** | `frontend/app/privacy/page.tsx` — **`/privacy`** (draft). Same links as Terms. |
| **Support** | **Telegram** `https://t.me/+xJLEjw9tbyQwMGVk` — labeled **Support** in footer; **Support (Telegram)** in nav menus. |
| **Auth** | `/terms` and `/privacy` added to **`AuthGuard`** public paths so anyone can open them. |

**Still:** Replace draft text with **lawyer-approved** Terms & Privacy when ready.

### 14. MiniPay developer mode — user verified

| Result | **Works** — tested end-to-end in MiniPay **developer mode** (connect, flows you exercised). |

### 15. Critical-issue SLA (submission expectation)

| Commitment | Treat **Telegram** ([support link](https://t.me/+xJLEjw9tbyQwMGVk)) as the intake for production emergencies; **aim to acknowledge critical issues within 24 hours** (MiniPay listing expectation). Assign who is on-call in your team notes. |

---

## Legal and support (in-app)

- [x] **Terms of Service** — **`/terms`** + in-app links *(draft — legal review pending)*.
- [x] **Privacy Policy** — **`/privacy`** + in-app links *(draft — legal review pending)*.
- [x] **Support URL** — Telegram in footer + nav *(§13)*.

## Wallet / MiniPay UX

- [x] **Production `metadata.url`** — `AppKitProviderWrapper` uses env → **`https://www.tycoonworld.xyz`** fallback in prod; set `NEXT_PUBLIC_URL` on Vercel prod to match.
- [x] **Frame / miniapp URLs** — `minikit.config.ts` `ROOT_URL` matches AppKit (env → dev localhost → `https://www.tycoonworld.xyz`).
- [x] **Auto-connect** — Confirmed: MiniPay → injected connect on load in `navbar-mobile.tsx` *(optional: `hasAttempted` + no-provider copy per [wallet connection](https://docs.minipay.xyz/getting-started/wallet-connection.md))*.
- [x] **Signing story** — Confirmed: access via connect / guest; `signMessage` only for scoped features *(keep per-screen copy clear for reviewers)*.

## Mobile and performance

- [x] **Mobile pass** — Verified by you: passes small viewport / MiniPay checks ([UI & container](https://docs.minipay.xyz/getting-started/ui-and-container.md)).
- [x] **PageSpeed Insights** — Mobile scores recorded: Perf **43**, A11y 86, BP 100, SEO 96 *(add report URL for form; improve Performance if reviewers push)*.
- [x] **Network manifest** — Draft list in **§10**; merge with **Chrome → Network** on production before pasting into the form.

## Contracts and chain

- [x] **Celoscan** — You confirmed: deployed, **verified**, tested ([MiniPay — smart contracts](https://docs.minipay.xyz/getting-started/smart-contracts.md)).
- [x] **Sample transactions** — Behavior tested; **keep a short list of example tx URLs** handy for the submission form (§11).
- [x] **Celo networks** — Production **42220**; testnet documented only if you actively support it ([best practices](https://docs.minipay.xyz/getting-started/best-practices.md)).

## Listing assets (Google form)

- [x] **App name, tagline, publisher** — Draft in **§12** *(set publisher to legal entity if the form requires it)*.
- [x] **Category** — **games** (§12).
- [x] **App URL** — **`https://www.tycoonworld.xyz`** (§12).
- [x] **Icon** — **`/logo.png`** via full URL in §12; upgrade to **~512×512** asset if needed for the form.
- [x] **HTTPS** — Production served over HTTPS.

## Testing before submit

- [x] **Test inside MiniPay** — **Confirmed:** developer mode E2E works ([Test in MiniPay](https://docs.minipay.xyz/getting-started/test-in-minipay.md)) — §14.
- [x] **Critical-issue SLA** — **§15:** Telegram intake + under **24h** target for critical issues; name on-call internally.

## Optional cleanup

- [ ] Resolve duplicate / legacy AppKit setup if both `frontend/context/index.tsx` and `AppKitProviderWrapper` are active — single source of truth for metadata and networks.
