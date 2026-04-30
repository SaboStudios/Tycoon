# Redeploy & env checklist (PIN, daily cap, recreate wallet)

## 1. What to redeploy

### Contracts (no proxy – new deployment)

- **TycoonUserRegistry**  
  Deploy a **new** registry (same constructor; bytecode includes daily cap, withdrawal authority, `recreateWalletForUser`).  
  TycoonUserWallet is created by the registry; no separate wallet deployment.

**One script: deploy + configure**

Use `DeployAndConfigureUserRegistry.s.sol` to deploy the new registry, set it on the game proxy, and configure operator, withdrawal authority, Naira vault, and daily cap in one go.

**1) Add to `contract/.env` (or set in shell):**

```bash
# Already in .env: TYCOON_OWNER, TYCOON_PROXY_ADDRESS, TYCOON_REWARDS_FAUCET_ADDRESS, TYCOON_NAIRA_VAULT_ADDRESS

# Required for the script (addresses, not keys):
OPERATOR_ADDRESS=0x...              # Address from SMART_WALLET_OPERATOR_PRIVATE_KEY (e.g. cast wallet address --private-key <key>)
WITHDRAWAL_AUTHORITY_ADDRESS=0x...  # Can be same as OPERATOR_ADDRESS (backend uses same key for both)

# Optional (defaults: $100/day, $2.50/CELO):
# DEFAULT_DAILY_CAP_USD6=100000000
# DEFAULT_PRICE_CELO_USD6=2500000
```

**2) Run the script (broadcast to Celo mainnet):**

Use `--rpc-url` (not `--fork-url`). Load env and run:

```bash
cd contract
source .env 2>/dev/null || true
forge script script/DeployAndConfigureUserRegistry.s.sol:DeployAndConfigureUserRegistryScript \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --private-key "${PRIVATE_KEY}"
```

If your shell doesn’t export from `.env`, pass values explicitly:

```bash
cd contract
forge script script/DeployAndConfigureUserRegistry.s.sol:DeployAndConfigureUserRegistryScript \
  --rpc-url "https://rpc.ankr.com/celo" \
  --broadcast \
  --private-key "0x..."
```

Or with `--verify` for block explorer verification:

```bash
forge script script/DeployAndConfigureUserRegistry.s.sol:DeployAndConfigureUserRegistryScript \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --verify \
  --private-key "${PRIVATE_KEY}"
```

**3) Copy the logged registry address** into backend and frontend env (see sections 2 and 3 below).

**Existing users:**  
After switching the game to the new registry, the backend can call the **game** contract’s `createWalletForExistingUser(playerAddress)` for each existing player. That will create a profile + new wallet on the **new** registry (they have no profile there yet). So they get a new wallet with the new features.

---

## 1b. How a user who had the previous wallet gets a new one

- **To get a wallet on the new registry (they only had one on the old registry):**
  1. User must be **registered on the game** (same EOA as before).
  2. Backend must have **`TYCOON_OWNER_PRIVATE_KEY`** in `.env` (same key as contract deployer / game owner).
  3. User goes to **Profile** and clicks **“Create smart wallet”** (or the app calls `POST /auth/create-smart-wallet`). The backend calls the game’s `createWalletForExistingUser(playerAddress)`, which uses the **current** (new) registry and creates a profile + wallet there. Backend then updates the user’s `smart_wallet_address` in the DB.
  4. If the user is **connected** with the same EOA, the app reads the new registry; it sees no profile until step 3 is done, so they see “You don’t have a smart wallet yet” and are directed to Profile to create one.

- **To replace their wallet with another new one** (they already have a profile on the new registry):  
  On **Profile → Manage smart wallet**, they click **“Create new smart wallet”**. That calls the registry’s `recreateWalletForUser()` from their connected wallet (profile owner). The registry creates a new wallet and updates their profile to point to it. The old wallet is unchanged (they can move funds from it manually if needed).

---

## 2. Backend env

In `.env` (or your backend env):

| Variable | Required | Notes |
|----------|----------|--------|
| `TYCOON_USER_REGISTRY_CELO` | Yes | **New registry address** after redeploy. |
| `WITHDRAWAL_AUTHORITY_PRIVATE_KEY` | No (optional) | If unset, backend uses `SMART_WALLET_OPERATOR_PRIVATE_KEY` or game-controller key. Use only if you want a separate key for signing. |
| `SMART_WALLET_OPERATOR_PRIVATE_KEY` | Yes (for managed withdrawals) | Backend operator; must match registry’s operator. |
| `TYCOON_NAIRA_VAULT_CELO` | If using Naira | Naira vault contract. |
| `CELO_USDC_ADDRESS` | If using USDC withdraw | USDC on Celo. |
| `TYCOON_OWNER_PRIVATE_KEY` | For createWalletForExistingUser | Same owner as registry/game. |
| `BACKEND_GAME_CONTROLLER_*` / `CELO_RPC_URL` | Already there | No change. |

**Optional:** `WITHDRAWAL_AUTHORITY_PRIVATE_KEY` — only if you want a separate key for signing. If unset, the backend uses the same key as the operator/game controller. Frontend still needs `NEXT_PUBLIC_WITHDRAWAL_AUTHORITY_ADDRESS` (same as operator address when using one key).

---

## 3. Frontend env

In `.env.local` (or Next env):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_CELO_USER_REGISTRY` | Yes | **New registry address** (same as backend `TYCOON_USER_REGISTRY_CELO`). |
| `NEXT_PUBLIC_WITHDRAWAL_AUTHORITY_ADDRESS` | Yes (for PIN withdrawals) | Same as operator/game-controller address when using one key. |
| `NEXT_PUBLIC_SMART_WALLET_OPERATOR_ADDRESS` | Yes (for managed withdrawals) | Address of operator key (must match registry operator). |
| `NEXT_PUBLIC_CELO_NAIRA_VAULT` | If using Naira | Same as backend Naira vault. |

---

## 4. Database

Run migrations so withdrawal PIN is stored:

```bash
cd backend && npx knex migrate:latest
```

Adds `withdrawal_pin_hash` to `users` (for 2FA on withdrawals).

---

## 5. One-time: set registry’s gameContract (if needed)

If you deploy the registry with a script that only does `new TycoonUserRegistry(proxy, faucet, owner)` and `proxy.setUserRegistry(registry)`, the **registry** already has `gameContract = proxy` from the constructor. No extra step.

If you use a different flow, ensure the **new** registry’s `gameContract` is set to your Tycoon proxy so that `createWalletForUser` and `createWalletForExistingUser` are allowed.

---

## 6. Quick reference

**Redeploy:** New TycoonUserRegistry → set on game via `setUserRegistry` → configure new registry (operator, withdrawal authority, Naira vault, default daily cap).

**Backend env:** `TYCOON_USER_REGISTRY_CELO` (new). No new key needed if you use the same key as operator/game controller for withdrawal signing.

**Frontend env:** `NEXT_PUBLIC_CELO_USER_REGISTRY` (new), `NEXT_PUBLIC_WITHDRAWAL_AUTHORITY_ADDRESS` (new).

**DB:** `knex migrate:latest` for `withdrawal_pin_hash`.

**Existing users:** Call game’s `createWalletForExistingUser(ownerAddress)` per user (or batch) so they get a profile + new wallet on the new registry.

---

## 7. Buy CELO with Naira & funding Tycoon

### How to pay Naira for CELO (two ways)

**Option 1 – External on-ramps (no backend needed)**  
User pays Naira on a third-party platform and sends CELO to their own smart wallet:

- Use any CELO on-ramp that supports **Naira** and a **custom destination address**.
- When asked for “wallet address”, use the **smart wallet address** (Profile → Manage smart wallet → copy address).
- Examples: **Transak** (transak.com), **Valora**, **MoonPay**, or local exchanges (Quidax, Luno, etc.) – buy CELO with Naira, then withdraw to the **smart wallet address**.

**Option 2 – Your own flow (pay Naira → you credit CELO from the vault)** — **automated**  
User pays Naira via Flutterwave; when Flutterwave confirms payment, the backend **automatically** credits their smart wallet with CELO from the Naira vault:

1. **You fund the Naira vault with CELO** (send CELO to the vault address so it has a balance).
2. User (or your frontend) calls **`POST /api/auth/celo-purchase/initialize`** with `{ amount_ngn: number }` (min 200 NGN). Backend computes CELO from NGN (using `CELO_TO_NGN_RATE` or live rates), creates a Flutterwave payment, and stores the pending purchase (`celo_purchase_ngn_pending` table).
3. User is redirected to Flutterwave checkout and pays the Naira amount.
4. **Flutterwave sends a webhook** to `POST /api/shop/flutterwave/webhook`. The same webhook handler checks `celo_purchase_ngn_pending`; if the `tx_ref` matches and amount is correct, it calls **`creditCeloFromVault(smart_wallet_address, amount_celo_wei)`** (vault’s `creditCelo`). CELO is sent from the vault to the user’s smart wallet and the row is marked completed.
5. User is redirected back to your app (e.g. `/profile/smart-wallet?celo_purchase=1&tx_ref=...`). You can poll a status endpoint or show “CELO will arrive shortly”.

**Requirements:** Naira vault address and controller key configured; Flutterwave configured; run **`npx knex migrate:latest`** so the `celo_purchase_ngn_pending` table exists. Ensure your Flutterwave dashboard **webhook URL** is set to `https://<your-backend>/api/shop/flutterwave/webhook` (same as for perk bundles). The vault contract also has **`creditUsdc(recipient, amount)`**; the backend exposes **`creditUsdcFromVault`** for manual or future “Buy USDC with Naira” automation (only the CELO flow is wired to the Flutterwave webhook today).

### Where Tycoon gets CELO (how you fund it)

- **Naira vault (for Naira → CELO credits)**  
  When users “buy CELO with Naira” via your flow, the backend credits their **smart wallet** by calling the Naira vault’s `creditCelo(recipient, amount)`. The vault must hold CELO for that.  
  **Fund this address with CELO:**  
  **Tycoon Naira Vault** = `TYCOON_NAIRA_VAULT_ADDRESS` (e.g. in your `contract/.env`: `0xF02c1d2bc3D4A4bCa624De4eEA77ACDEd41dC5e5`).  
  Send CELO to the vault (it has `receive()`). Then when a user pays Naira, the backend calls `creditCelo(userSmartWallet, amount)` and the vault sends CELO to their smart wallet.

  **Withdrawing your funds:**  
  The vault has no separate “withdraw” function, but the **owner** (or controller) can send CELO out by calling `creditCelo(recipient, amount)`. To pull your CELO back, call `creditCelo(yourOwnerAddress, amount)` (or the full vault balance). Only the owner or controller can call `creditCelo`, so your funds are recoverable.

- **Rewards faucet**  
  TycoonRewardsFaucet gives **TYC / vouchers / collectibles**, not native CELO. No need to fund it with CELO for rewards.

- **User smart wallets**  
  Users can also receive CELO by: (1) buying CELO with Naira and using the smart wallet as destination (above), or (2) anyone sending CELO to their smart wallet address.

**Vault liquidity checks and race conditions**

- Before a user can start "Buy CELO with Naira", the backend checks that the vault has enough CELO: it reads the vault’s **balanceCelo()** and subtracts the sum of all **pending** CELO purchases (rows in `celo_purchase_ngn_pending` with `status = 'pending'`). If **available CELO < amount** for the new purchase, the backend returns **503** and does not create a Flutterwave payment, so the user cannot pay.
- When Flutterwave sends the webhook after a successful payment, the backend **re-checks** the vault balance before calling **creditCeloFromVault**. If the vault no longer has enough CELO (e.g. another payment was credited first), the webhook marks that purchase as **failed** and does not credit, avoiding overdraw and race conditions.
- The frontend can call **GET /api/auth/vault-balances** to show "Vault liquidity: X CELO available" and to disable the "Pay Naira → Get CELO" button when the vault has zero CELO.

**Swapping CELO for USDC in the vault**

The vault holds both CELO and USDC. It does not perform swaps on-chain. To **convert vault CELO into USDC** (e.g. after users have paid Naira and you want to credit USDC, or to rebalance):

1. **Withdraw CELO from the vault**  
   As vault **owner or controller**, call **creditCelo(yourAddress, amount)** (e.g. from Rewards → Naira Vault → Withdraw CELO, with recipient = your wallet). The CELO leaves the vault and goes to your EOA.

2. **Swap CELO → USDC**  
   Use a Celo DEX or aggregator (e.g. **Ubeswap**, **Uniswap on Celo**, **1inch**, **Jupiter**) to swap that CELO for USDC in your wallet.

3. **Send USDC back to the vault**  
   Transfer the USDC to the **vault contract address**. The vault is an ERC20 receiver: it will hold the USDC and **balanceUsdc()** will increase. You can then use **creditUsdc(recipient, amount)** (via backend **creditUsdcFromVault**) to credit users when you add a "Buy USDC with Naira" flow.

Alternatively, use a DEX that supports "swap and send to address" so the USDC is sent directly to the vault in one step.

**If your USDC is the other Celo token (0xcebA...)**  
On Celo there are two common USDC token addresses: `0x765DE816845861e75A25fCA122bb6898B8B1282a` and `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`. The Naira vault’s USDC is set at deploy time and is **immutable**. If your funds are in `0xcebA...` but the existing vault was deployed with `0x765...`, the vault’s USDC balance will show 0. **Fix:** deploy a new Naira vault that uses your USDC token, then point the app to it:

1. In `contract/.env` set `USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C` (and `TYCOON_OWNER`, `PRIVATE_KEY`, `RPC_URL`).
2. Run: `./run-deploy-naira-vault.sh` (from the `contract/` directory).
3. Set **NEXT_PUBLIC_CELO_NAIRA_VAULT** (frontend) and any backend/env that reference the vault to the **new** vault address printed by the script.
4. If your user registry (or app) config points to the old vault, update it to the new vault address (e.g. call `setNairaVault(newVaultAddress)` on the registry if you use one).

Then transfer your USDC (0xcebA...) to the **new** vault address; the app will show the correct balance.

**In-wallet swap: CELO → USDC (same smart wallet)**

Users can swap CELO in their **smart wallet** for USDC, with USDC credited back to the same wallet. Flow:

1. **Deploy CeloSwapExecutor** (once) on Celo:
   - From `contract/`:  
     `forge script script/DeployCeloSwapExecutor.s.sol:DeployCeloSwapExecutorScript --rpc-url <CELO_RPC> --broadcast --private-key <DEPLOYER_KEY>`
   - Defaults: Ubeswap Router V2 `0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121`, WCELO `0x471EcE3750Da237f93B8E339c536989b8978a438`, USDC `0x765DE816845861e75A25fCA122bb6898B8B1282a`. Override with `SWAP_EXECUTOR_ROUTER`, `SWAP_EXECUTOR_WCELO`, `SWAP_EXECUTOR_USDC` if needed.
   - Log the deployed **CeloSwapExecutor** address.
2. **Frontend:** Set `NEXT_PUBLIC_CELO_SWAP_EXECUTOR_ADDRESS` in `.env.local` to that address.
3. **User flow:** On Profile → Manage smart wallet, when connected as **owner**, a "Swap CELO → USDC" section appears. User enters CELO amount and clicks "Swap to USDC". The app calls `withdrawNative(swapExecutorAddress, amount)`; the executor receives CELO, swaps via Ubeswap, and sends USDC to `msg.sender` (the smart wallet). One tx, USDC ends up in the same wallet.

### How you give them Naira (CELO/USDC → NGN)

When a user withdraws CELO to Naira, the flow is:

1. **On-chain:** User calls `POST /auth/naira-withdraw` with `{ amountCelo: "0.5" }`. The backend pulls that CELO from the user’s smart wallet into the **Naira vault** (vault controller calls `processNairaWithdrawalCelo(smartWallet, amount)`).
2. **Off-chain:** To actually send Naira to the user, the backend must transfer NGN to their **bank account**. That is done via a payout provider (e.g. **Flutterwave Transfers** or Paystack Transfer).

**Where Flutterwave gets the funds**

The NGN sent to the user’s bank is debited from **your Flutterwave wallet balance** (the merchant account linked to `FLW_SECRET_KEY`). Flutterwave does not pull from your Naira vault or from the user’s CELO; it only sends from the NGN balance in your Flutterwave dashboard.

You fund that balance by:

1. **Collections** – When users pay you in Naira via Flutterwave (e.g. perk bundles, credits), the NGN lands in your Flutterwave balance.
2. **Top-up** – You transfer NGN from your bank (or another source) into your Flutterwave account via the Flutterwave dashboard or their supported funding methods.

So: **on-chain** you receive CELO (in the Naira vault); **off-chain** you pay out NGN from your Flutterwave balance. You need enough NGN in Flutterwave to cover withdrawals; the CELO in the vault is separate (you can sell/convert it and top up Flutterwave with the NGN, or fund Flutterwave from other revenue).

**What you need:**

- **User bank details** – Account number and bank code (e.g. stored in `users.bank_account_number`, `users.bank_code`). The user provides these once in Profile or at first withdrawal.
- **CELO → NGN rate** – Set `CELO_TO_NGN_RATE` in backend `.env` (e.g. `2500` = 1 CELO = 2,500 NGN), or use live rates from APIs.
- **Flutterwave balance funded** – Your **Flutterwave wallet** (dashboard balance) must hold enough NGN to cover payouts. Fund it via collections (users paying in NGN) and/or by topping up from your bank.

**Backend flow (after the contract call):**

1. Compute NGN amount: `amountNgn = amountCelo * CELO_TO_NGN_RATE`.
2. Fetch user’s `bank_account_number` and `bank_code` (from DB or request body).
3. Call Flutterwave “create transfer” (or Paystack transfer) with recipient bank details and `amountNgn`.
4. Optionally store the withdrawal in a `naira_withdrawals` table (user_id, amount_celo, amount_ngn, reference, status) for audit.

If Flutterwave transfer is not configured or the user has no bank details, the backend still completes the on-chain pull; you then process the Naira payout manually or via a separate admin step.

**Rates (CELO → $ → NGN):**  
The backend can use **live rates** from public APIs so you don’t have to set a fixed rate:

- **CELO/USD:** [CoinGecko](https://www.coingecko.com/en/coins/celo) – `api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd` (no key; cache 5 min).
- **USD/NGN:** [ExchangeRate-API](https://www.exchangerate-api.com) (open endpoint) – `open.er-api.com/v6/latest/USD` → `rates.NGN` (no key; cache 5 min).

Conversion: **NGN = amountCelo × CELO_USD × USD_NGN**. If `CELO_TO_NGN_RATE` is set in env, that fixed rate is used instead of live rates.

**Backend env (for automatic Naira payout):**

| Variable | Required | Notes |
|----------|----------|--------|
| `CELO_TO_NGN_RATE` | Optional | If set, overrides live rates (e.g. `2500` = 1 CELO = 2,500 NGN). If unset, CELO→NGN uses CoinGecko + ExchangeRate-API. |
| `FLW_SECRET_KEY` | For Flutterwave | Already used for NGN collections; same key is used for transfers. Flutterwave balance must be funded for payouts. |

**User flow:** User sets bank details once via `POST /auth/set-bank-details` (body: `bank_account_number`, `bank_code`). Bank code is the Flutterwave bank code (e.g. `044` for Access Bank). When they request CELO→Naira withdrawal, the backend pulls CELO to the vault then, if bank details and rate are set, sends NGN to their bank via Flutterwave. Run migration `20260317100000_add_bank_details_to_users.js` to add `bank_account_number` and `bank_code` to `users`.

---

## 8. How to test: Pay Naira → get CELO, and CELO → Naira

### A. Pay Naira to get CELO (two ways to test)

**Option 1 – External on-ramp (no Tycoon backend)**  
1. In the app, go to **Profile → Manage smart wallet** and copy your **smart wallet address**.  
2. On an external platform (e.g. **Transak**, **Valora**, **MoonPay**, or an exchange like Quidax/Luno), buy CELO with Naira and set the **withdrawal/destination address** to that smart wallet address.  
3. After the purchase, CELO will appear in your Tycoon smart wallet.

**Option 2 – Automated “Buy CELO with Naira” (Flutterwave → credit CELO)**  
The app has this flow built in:

1. **Fund the Naira vault** with CELO (vault address from `TYCOON_NAIRA_VAULT_CELO`).
2. **Start a purchase:** Call **`POST /api/auth/celo-purchase/initialize`** (authenticated) with body `{ "amount_ngn": 5000 }` (or any amount ≥ 200 NGN). Response: `{ "success": true, "link": "https://...", "tx_ref": "celo_..." }`.
3. **User pays:** Redirect the user to `link`; they complete payment on Flutterwave.
4. **Automatic credit:** When Flutterwave sends the webhook to your backend, the handler credits the user’s smart wallet with the CELO amount (computed at init time from NGN using your rate). No manual step.

Your frontend can add a “Buy CELO with Naira” button that calls this endpoint and redirects to `link`. After payment, user lands back on the URL you set (e.g. `/profile/smart-wallet?celo_purchase=1&tx_ref=...`).

**Manual fallback:** You can still credit a user manually from **Rewards → Naira Vault → Withdraw CELO** (recipient = their smart wallet, amount = CELO). Same `creditCelo` call; useful for manual or support flows.

**Note:** The vault can send USDC too (it has **`creditUsdc(recipient, amount)`**). The backend has **`creditUsdcFromVault`** so you can credit USDC manually (e.g. from Rewards or a script). A full “Buy USDC with Naira” flow (initialize + webhook) could be added the same way as CELO; only the CELO purchase is wired to the webhook for now.

---

### B. CELO → Naira (withdraw CELO and get Naira in your bank)

1. **Have CELO in your smart wallet**  
   (e.g. from Option 1 or 2 above, or from someone sending CELO to your smart wallet address.)

2. **Set your bank details (once)**  
   Call the backend:  
   `POST /auth/set-bank-details`  
   Body: `{ "bank_account_number": "your 10-digit NUBAN", "bank_code": "044" }`  
   (Use the Flutterwave bank code for your bank, e.g. `044` for Access Bank.)  
   You must be logged in (session/JWT). There may be a UI for this in Profile; if not, use the API (e.g. Postman or curl).

3. **Request Naira in the app**  
   - Go to **Profile → Manage smart wallet**.  
   - In **“Naira ↔ CELO”**, under **“Withdraw to Naira (CELO → Naira)”**, enter the CELO amount and click **Request Naira**.  
   - Backend pulls that CELO from your smart wallet into the Naira vault, then (if Flutterwave and rate are configured) sends the equivalent NGN to your bank.

4. **Backend requirements for NGN payout**  
   - `FLW_SECRET_KEY` set; Flutterwave balance funded with NGN.  
   - Either `CELO_TO_NGN_RATE` in backend `.env` or live rates (CoinGecko + ExchangeRate-API) working.  
   - Your user record has `bank_account_number` and `bank_code` (from step 2).  
   If any of these are missing, the on-chain pull still happens (CELO moves to the vault) but the NGN transfer is skipped; you can pay the user manually or fix config and retry.
