# Guest “smart account” — rewards balance, perk purchases, withdraw

Goal: give every **guest user** a balance that can hold rewards, be spent on perks, and be withdrawn at will.

---

## Current state

- Guests get a **custodial address** at sign-up (random wallet; private key is not stored; we only have `address` + `password_hash` for contract auth).
- Rewards today: daily claim mints TYC to that address; game/tournament payouts go on-chain to that address.
- Perks: wallet users pay with USDC (or NGN via Paystack); guests have no in-app “balance” to spend.

---

## Concept: one balance per guest

- **Credit**: When a guest earns (daily claim, game win, promo), add to their balance (instead of or in addition to on-chain mint).
- **Spend**: Let them buy perks with this balance (same UX as “Pay with USDC” but deduct from balance).
- **Withdraw**: When they want to cash out, we send funds from a treasury/vault to their address (or linked wallet) and deduct the balance.

Two main implementation levels:

---

## Option A — Ledger only (fastest)

No new contract. All balance is off-chain.

### Data

- **`users.guest_rewards_balance`** (decimal, default 0) — USDC-sized units (e.g. 2.50 = $2.50).
- Optional: **`guest_balance_transactions`** — id, user_id, amount (+/-), type (credit | spend | withdraw), reference (e.g. daily_claim_id, bundle_id, withdrawal_id), created_at.

### Flows

1. **Credit**
   - Daily claim (guest): instead of (or in addition to) minting TYC, add e.g. $0.10 to `guest_rewards_balance`.
   - Game/tournament win (guest): add payout amount to `guest_rewards_balance`.
   - Promo: admin or backend credits balance.

2. **Spend (perks)**
   - Guest chooses “Pay with balance” in shop.
   - Backend checks `guest_rewards_balance >= bundle_price_usdc`, then:
     - Deduct balance.
     - Fulfill bundle (same as NGN: insert `user_bundle_purchases`, source e.g. `guest_balance`).
   - No on-chain tx for the “payment”; only fulfillment (e.g. grant perks).

3. **Withdraw**
   - Guest (or after they link wallet) requests withdrawal to an address.
   - Backend:
     - Ensures `is_guest`, balance >= amount, optional min/max.
     - Deducts `guest_rewards_balance`.
     - Sends USDC from a **backend treasury wallet** to the requested address (or linked_wallet_address).
   - Optional: queue withdrawals and process in batch to save gas.

### Pros

- No new contract; ship quickly.
- Full control and simple logic (credits, spend, withdraw) in one place.

### Cons

- Balance is not on-chain (trust backend).
- Treasury wallet must hold enough USDC to cover all guest balances and withdrawals.

---

## Option B — On-chain vault (one contract for all guests)

One **GuestVault** (or “guest treasury”) contract holds USDC and tracks per-guest balance on-chain.

### Contract (sketch)

- Holds USDC (transfer in from admin/treasury).
- Mapping: `guestUserId (uint256) → balance`.
- Only a backend **operator** role can:
  - `credit(guestUserId, amount)` — add to balance (e.g. when we’ve validated a reward).
  - `spend(guestUserId, amount)` — deduct (e.g. when they buy a perk; we still grant the perk in backend).
  - `withdraw(guestUserId, toAddress, amount)` — deduct and `USDC.transfer(to, amount)`.
- Optional: events for Credit, Spend, Withdraw for indexing and support.

### Backend

- **Credit**: When guest earns, backend calls `vault.credit(userId, amount)` (after transferring USDC into the vault if needed).
- **Spend**: When guest buys a perk with balance, backend calls `vault.spend(userId, price)` then fulfills the bundle (same as today).
- **Withdraw**: Guest requests withdrawal; backend calls `vault.withdraw(userId, to, amount)` (to = their address or linked wallet).

### Pros

- Balances and movements are on-chain and auditable.
- Single contract, no per-guest deployment.

### Cons

- Requires deploying and maintaining the vault, operator key security, and USDC in the vault.

---

## Option C — True smart account per guest (ERC-4337, later)

Each guest gets their own **smart account** (e.g. ERC-4337). Rewards are sent to that account; they sign **UserOperations** to pay for perks or to withdraw to an EOA.

- More complex: account factory, bundler, paymaster, and flows for “pay with my account” and “withdraw”.
- Best if you want full self-custody and no backend custody of their balance.

Can be a Phase 3 after A or B is live.

---

## Recommended path

1. **Phase 1 — Option A (ledger)**  
   - Add `guest_rewards_balance` (and optional tx log).  
   - Credit guests on daily claim / game win (and any promo).  
   - Add “Pay with balance” in shop for guests; deduct and fulfill same as NGN.  
   - Add “Withdraw” (to custodial or linked address); backend sends USDC from treasury and deducts balance.

2. **Phase 2 (optional) — Option B (vault)**  
   - Deploy GuestVault, move logic to `credit` / `spend` / `withdraw` on-chain.  
   - Keep same UX; backend drives vault calls and perk fulfillment.

3. **Phase 3 (optional) — Option C**  
   - Introduce per-guest smart accounts when you want to move to non-custodial, sign-to-spend/withdraw flows.

---

## API sketch (Phase 1)

- `GET /api/rewards/guest-balance` — auth; for guests return `{ balance_usdc }`.
- `POST /api/shop/pay-with-balance` — body `{ bundle_id }`; auth; guest only; deduct balance, fulfill bundle.
- `POST /api/rewards/withdraw` — body `{ amount, to_address? }`; auth; guest only; optional `to_address` (default custodial or linked); queue or send USDC, deduct balance.

---

## Security / ops

- **Withdraw**: Require KYC or linked wallet if you want to limit abuse; optional min/max and rate limits.
- **Treasury**: For Option A, a dedicated hot wallet with USDC; monitor and top up so withdrawals can always be satisfied.
- **Credits**: Only backend (and optionally admin) can credit; daily claim / game payouts use existing auth and game state so only legitimate rewards are credited.

This gives you a clear way to “create a smart account for all guest users” in practice: start with a ledger (and optional tx log), then optionally move to an on-chain vault and later to per-guest smart accounts if you want full self-custody.
