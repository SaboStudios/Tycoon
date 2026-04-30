# Perk Bundles & Daily Login Rewards

## Perk bundles

- **Backend:** Table `perk_bundles` stores bundle definitions (name, description, `token_ids`, `amounts`, `price_tyc`, `price_usdc`). Seeded with placeholder bundles (Starter Pack, Lucky Bundle).  
- **API:** `GET /api/shop/bundles` returns active bundles. No auth required.
- **Frontend:** Shop (desktop + mobile) fetches and shows a “Perk bundles” section with name, description, price, and a **Coming soon** button. Purchase is not implemented until the contract supports a single payment for multiple items.
- **Contract (future):** To enable bundle purchase, add e.g. `buyBundle(uint256[] tokenIds, uint256[] amounts, uint256 totalPrice, bool useUsdc)` on the reward contract that charges `totalPrice` once and transfers each `tokenIds[i]` in quantity `amounts[i]` to the buyer. Backend/frontend can then call this and remove “Coming soon”.

## Daily login rewards

### How users access daily login (claim points)

1. **Go to Profile** — From the main nav or menu, open **Profile**.
2. **Open the Stats tab** — On desktop and mobile, the profile has a **Stats** (or similar) tab.
3. **Daily login reward card** — The **Daily login reward** block shows:
   - Current streak (e.g. “X day streak”).
   - Button: **“Claim today’s reward”** (if they haven’t claimed today) or **“Come back tomorrow”** (if already claimed).
4. **Claim** — User taps “Claim today’s reward”. The app calls `POST /api/rewards/daily-claim` with the user’s JWT. On success, they receive a TYC voucher (minted to their wallet when the reward contract is configured) and the streak updates.

The UI component is `DailyClaim` (`frontend/components/rewards/DailyClaim.tsx`), used in both `profile.tsx` and `profile-mobile.tsx`.

### Backend

- **Backend:** `users.last_daily_claim_at` and `users.login_streak` track claims.  
  - `GET /api/rewards/daily-claim/status` (auth required): returns `can_claim`, `streak`, `last_claim_at`.  
  - `POST /api/rewards/daily-claim` (auth required): if not already claimed today, increments streak (or resets to 1 if they missed a day), then mints a TYC voucher to the user’s wallet via the reward contract’s `mintVoucher(to, tycValue)`.  
  - Base reward: 10 TYC. Streak bonus: +5 TYC per day (capped at 7 extra days → max 45 TYC bonus).  
  - If the reward contract is not configured for the user’s chain, the endpoint still updates the streak but does not mint (returns success and message).
- **Auth:** Both endpoints use `requireAuth`; the frontend sends the JWT in `Authorization: Bearer <token>` (from `localStorage.token`).

## Reward contract mint (backend)

- `mintVoucherTo(toAddress, tycValueWei, chain)` in `backend/services/tycoonContract.js` gets the reward system address from the main Tycoon contract’s `rewardSystem()`, then calls `mintVoucher(to, tycValue)` on that contract using the same backend wallet. The backend wallet must be set as `backendMinter` on the reward contract.
