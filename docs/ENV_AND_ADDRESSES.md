# Tycoon: Env vars and contract addresses (real values)

Single reference with **real Celo mainnet addresses** used in this repo. The app is Celo-first; other chains are optional.

---

## Frontend (`.env.local`)

Only **NEXT_PUBLIC_*** variables are read by the frontend.

### Required for Celo

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `NEXT_PUBLIC_CELO` | Tycoon game **proxy** (use this). | `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e` |
| `NEXT_PUBLIC_CELO_UPGRADEABLE` | **(Optional)** If set, used instead of `NEXT_PUBLIC_CELO`. Use only if you have a different proxy; do not set to the implementation address `0xC2da...`. | — |
| `NEXT_PUBLIC_CELO_REWARD` | TycoonRewardSystem (shop, vouchers, collectibles). | `0x89Ec427de89008f198a6Efe5b893b50bDC8BF39e` |
| `NEXT_PUBLIC_CELO_TYC` or `NEXT_PUBLIC_CELO_TOKEN` | TYC ERC20 token. | `0x7b1bef6B8d836FEb5d545D3a9F0D966a28A63259` |
| `NEXT_PUBLIC_CELO_USDC` | USDC on Celo mainnet. | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL. | `https://base-monopoly-production.up.railway.app/api` (prod) or `http://localhost:3001/api` (local) |

Copy-paste (required Celo frontend):

```bash
NEXT_PUBLIC_CELO=0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e
NEXT_PUBLIC_CELO_REWARD=0x89Ec427de89008f198a6Efe5b893b50bDC8BF39e
NEXT_PUBLIC_CELO_TYC=0x7b1bef6B8d836FEb5d545D3a9F0D966a28A63259
NEXT_PUBLIC_CELO_USDC=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_API_URL=https://base-monopoly-production.up.railway.app/api
```

### Optional (Celo)

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `NEXT_PUBLIC_CELO_AI_REGISTRY` | AI agent registry contract. | `0x73183cDD20fc3247686CFcF970A956a91561FAE2` |
| `NEXT_PUBLIC_CELO_USER_REGISTRY` | User registry (smart wallets per player). | `0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1` |
| `NEXT_PUBLIC_CELO_TOURNAMENT_ESCROW` or `NEXT_PUBLIC_CELO_TOURNAMENT_ESCROW_ADDRESS` | Tournament escrow. | `0xd1B710e781a8aF0b4D5facf0f35384ACFB5FDabE` |
| `NEXT_PUBLIC_ERC8004_REPUTATION` | ERC-8004 reputation registry (optional; has default). | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| `NEXT_PUBLIC_ERC8004_AGENT_ID` | Your registered AI agent ID. | `187` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket URL for multiplayer (defaults from `NEXT_PUBLIC_API_URL`). | (derived from API URL) |

Copy-paste (optional Celo frontend):

```bash
NEXT_PUBLIC_CELO_AI_REGISTRY=0x73183cDD20fc3247686CFcF970A956a91561FAE2
NEXT_PUBLIC_CELO_USER_REGISTRY=0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1
NEXT_PUBLIC_CELO_TOURNAMENT_ESCROW_ADDRESS=0xd1B710e781a8aF0b4D5facf0f35384ACFB5FDabE
NEXT_PUBLIC_ERC8004_REPUTATION=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
NEXT_PUBLIC_ERC8004_AGENT_ID=187
```

### Other frontend (not addresses)

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id (auth). | `cmm9kscwq03zy0cjoycdpqh9z` |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Optional Privy client id. | `client-WY6WjKW8CJKLrgGMNLxXmGCiLn35pkQg3QpbFwt8PfuH3` |
| `NEXT_PUBLIC_PROJECT_ID` | WalletConnect/AppKit project id. | `912f9a3279905a7dd417a7bf68e04209` |

Copy-paste (other frontend):

```bash
NEXT_PUBLIC_PRIVY_APP_ID=cmm9kscwq03zy0cjoycdpqh9z
NEXT_PUBLIC_PRIVY_CLIENT_ID=client-WY6WjKW8CJKLrgGMNLxXmGCiLn35pkQg3QpbFwt8PfuH3
NEXT_PUBLIC_PROJECT_ID=912f9a3279905a7dd417a7bf68e04209
```

---

## Backend (`.env` – server only; never commit secrets)

### Required for Celo (game + auth)

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `CELO_RPC_URL` | Celo RPC. | `https://rpc.ankr.com/celo` or `https://1rpc.io/celo` |
| `TYCOON_CELO_CONTRACT_ADDRESS` | Same as frontend: the **proxy** address. | `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e` |
| `BACKEND_GAME_CONTROLLER_PRIVATE_KEY` | Private key of the wallet set as `backendGameController` on the Tycoon contract. | (set in env; address: `0xFb0331d4F586D38Df611E34b9bC77a99F96f09ee`) |

### Database (required for backend to run)

| Variable | Meaning |
|----------|--------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection. |

### Auth (Privy)

| Variable | Meaning |
|----------|--------|
| `PRIVY_APP_ID` | Same as frontend `NEXT_PUBLIC_PRIVY_APP_ID`. |
| `PRIVY_APP_SECRET` | From Privy dashboard. |
| `JWT_SECRET` | Used for guest/session JWTs. |

### Optional Celo (backend)

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `CELO_CHAIN_ID` | Celo mainnet. | `42220` |
| `TOURNAMENT_ESCROW_ADDRESS_CELO` or `TOURNAMENT_ESCROW_CELO` | Tournament escrow (backend operations). | `0xd1B710e781a8aF0b4D5facf0f35384ACFB5FDabE` |
| `TYCOON_USER_REGISTRY_CELO` or `TYCOON_USER_REGISTRY_ADDRESS` | User registry. | `0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1` |
| `CELO_USDC_ADDRESS` | USDC on Celo (same as frontend). | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| `HOSTED_AGENT_CREDITS_USDC_RECIPIENT` | Where to receive USDC for hosted agent credits. | (your wallet) |
| `ERC8004_AGENT_ID` | Same as frontend. | `187` |
| `ERC8004_REPUTATION_REGISTRY_ADDRESS` | Optional override. | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| `ERC8004_FEEDBACK_PRIVATE_KEY` | Optional; for reputation feedback (different wallet from agent owner). | (set in env) |

### Other backend

| Variable | Meaning |
|----------|--------|
| `PORT` | Default 3001. |
| `FRONTEND_URL` or `APP_URL` or `PUBLIC_APP_URL` | Frontend origin (for redirects, links). |
| `REDIS_URL`, `SKIP_REDIS` | Optional Redis. |
| `ANTHROPIC_API_KEY` | For internal AI agent. |

---

## Contract deployment (`contract/.env`)

For reference; used by Forge scripts.

| Variable | Meaning | Value (real) |
|----------|---------|--------------|
| `RPC_URL` | Celo RPC. | `https://rpc.ankr.com/celo` |
| `PRIVATE_KEY` | Deployer key (do not commit). | (set in env) |
| `TYCOON_OWNER` | Contract owner. | `0xE870b4814Ec306B88F77833cd6c98Eb388A30cbc` |
| `TYCOON_REWARD_SYSTEM` | TycoonRewardSystem. | `0x89Ec427de89008f198a6Efe5b893b50bDC8BF39e` |
| `USDC_ADDRESS` | USDC on Celo. | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| `GAME_CONTROLLER` | Backend game controller address. | `0xFb0331d4F586D38Df611E34b9bC77a99F96f09ee` |
| `TYC_ADDRESS` | TYC token. | `0x7b1bef6B8d836FEb5d545D3a9F0D966a28A63259` |
| `TYCOON_PROXY_ADDRESS` | Legacy Tycoon proxy. | `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e` |
| `TYCOON_LOGIC_ADDRESS` | TycoonUpgradeableLogic. | `0xB60E1bcb68393101810ba8843d6780635CAbDCC9` |
| `TYCOON_IMPL_ADDRESS` | Tycoon implementation. | `0x35c27A251cffDfA7dbeBD6BA7dee731Ac587496B` |
| `TYCOON_USER_REGISTRY_ADDRESS` | User registry. | `0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1` |
| `TYCOON_REWARDS_FAUCET_ADDRESS` | Rewards faucet. | `0x0C0E049d639fA0A6C357cefE364530F0f19C5A88` |
| `TYCOON_GAME_FAUCET_ADDRESS` | Game faucet. | `0xa52d8fCCCAfDc96EC1b0fd8339c3313424CF96F0` |

Proxy (use in env): `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e`. Implementation (do not use): `0xC2dab89236Bd015D41bF0dEEA0a6D314a49ff42c`.

**Current proxy state (from Reads):** owner `0xE870b4814Ec306B88F77833cd6c98Eb388A30cbc` · backendGameController `0xFb0331d4F586D38Df611E34b9bC77a99F96f09ee` · logicContract `0x4D0Eb7A0f154D387a826f761E641eDa607CB310B` · userRegistry `0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1` · gameFaucet `0xa52d8fCCCAfDc96EC1b0fd8339c3313424CF96F0` · rewardSystem `0x80171fB7b08559E2843503DB4e5cCbD255FD4015`.

---

## Tycoon: use the proxy, not the implementation

If the **Reads** page shows **owner** = `0x0000...0001` and **rewardSystem** / **logicContract** = `0x0000...0000`, you are reading the **implementation** (or an uninitialized proxy). Game state lives in the **proxy**.

- **Proxy (use this in env):** `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e`
- **Implementation (do not use in env):** `0xC2dab89236Bd015D41bF0dEEA0a6D314a49ff42c`

Set **Frontend** `NEXT_PUBLIC_CELO` and **Backend** `TYCOON_CELO_CONTRACT_ADDRESS` to the **proxy** address above.

**Frontend safeguard:** In `frontend/constants/contracts.ts`, the Tycoon address used for game creation (and reads) never uses the implementation address. If `NEXT_PUBLIC_CELO_UPGRADEABLE` or `NEXT_PUBLIC_CELO` is set to the implementation `0xC2da...`, the app falls back to the known proxy so create/join still hit the proxy.

---

## "Not registered" when creating a game

The contract reverts with **`Not registered`** when the **creator’s address** is not in the Tycoon contract’s `registered` mapping. The backend calls `createGameByBackend(forPlayer, ...)`; `forPlayer` is the user’s address (from DB). That address must be registered on-chain **before** creating a game.

**Ways to be registered:**

1. **Wallet user:** They must have called **`registerPlayer(username)`** from the frontend at least once (e.g. from the guest hero / onboarding flow that uses the Tycoon contract).
2. **Guest user:** They are registered when the backend calls **`registerPlayerFor(playerAddress, username, passwordHash)`** during sign-up (guest auth or ensureContractAuth). If that tx never ran or failed, the guest’s address is not registered.

**What to do:**

- For **wallet users:** Ensure they complete a flow that calls `registerPlayer(username)` on the Tycoon contract (e.g. “Register” / onboarding) before they can create a game.
- For **guests:** Ensure sign-up or first use calls `registerPlayerFor` for their custodial address. If you have old guests created before that flow, they need to be registered once (e.g. backend script or support calling `registerPlayerFor` for their address).
- **Quick check:** The 2 addresses in `totalUsers` are the only ones that can create/join games. The address that is trying to create the game must be one of them.

---

## Keep these in sync

- **Game contract**  
  Frontend: `NEXT_PUBLIC_CELO` or `NEXT_PUBLIC_CELO_UPGRADEABLE`  
  Backend: `TYCOON_CELO_CONTRACT_ADDRESS`  
  → Use the **proxy** address in both: `0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e`.

- **Reward contract**  
  Frontend only: `NEXT_PUBLIC_CELO_REWARD` = `0x89Ec427de89008f198a6Efe5b893b50bDC8BF39e`.

---

## Minimal Celo checklist (copy-paste)

**Frontend (`.env.local`):**

```bash
# Game: use proxy (not implementation)
NEXT_PUBLIC_CELO=0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e
NEXT_PUBLIC_CELO_REWARD=0x89Ec427de89008f198a6Efe5b893b50bDC8BF39e
NEXT_PUBLIC_CELO_TYC=0x7b1bef6B8d836FEb5d545D3a9F0D966a28A63259
NEXT_PUBLIC_CELO_USDC=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_API_URL=https://base-monopoly-production.up.railway.app/api

# Optional
NEXT_PUBLIC_CELO_AI_REGISTRY=0x73183cDD20fc3247686CFcF970A956a91561FAE2
NEXT_PUBLIC_CELO_USER_REGISTRY=0x202Af6823a39CE08630485dcD9B07aB15f8Ba2c1
NEXT_PUBLIC_CELO_TOURNAMENT_ESCROW_ADDRESS=0xd1B710e781a8aF0b4D5facf0f35384ACFB5FDabE
NEXT_PUBLIC_ERC8004_AGENT_ID=187
```

**Backend (`.env`):**

```bash
CELO_RPC_URL=https://rpc.ankr.com/celo
TYCOON_CELO_CONTRACT_ADDRESS=0xA97fC9666a41cDAE3EFb74A4CaC87B9d33A16F0e
BACKEND_GAME_CONTROLLER_PRIVATE_KEY=0x...
# + DB_*, PRIVY_APP_ID, PRIVY_APP_SECRET, JWT_SECRET
```

That’s **5 addresses + 1 URL** for the frontend and **1 address + RPC + key** for the backend.
