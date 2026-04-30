# Contract Upgrades: On-Signup On-Chain Registration + Smart Wallet, Then Link EOA

## Goal

- **On signup**: User is registered on-chain and gets a smart wallet; they are identified by that **smart wallet** (no EOA yet).
- **When they link an external wallet**: On-chain identity is updated so the **EOA** becomes the profile owner; the same smart wallet and the linked EOA both refer to the same user.

---

## Contracts You Need to Upgrade

You will need to upgrade **two** contracts (and optionally extend a third):

| Contract | Role | Upgrade needed? |
|----------|------|-------------------|
| **TycoonUserRegistry** | Creates smart wallets, maps owner ↔ wallet, supports transfer of profile to new EOA | **Yes** – add “wallet-first” creation and EOA linking |
| **TycoonUserWallet** | Smart wallet; has `owner` and `transferOwnershipViaRegistry` | **No** (recommended: use registry as temporary owner, then transfer to wallet in same tx) |
| **TycoonUpgradeable** (game proxy) | Registers player by address, calls registry to create wallet | **Optional** – registry idempotence is enough |

The **Tycoon** (game) contract already supports using a **smart wallet address** as `playerAddress` (e.g. `registerPlayerFor(smartWallet, username, hash)`). The missing piece is the **registry** (and wallet) supporting “create wallet first, no EOA; later bind EOA.”

---

## Impact on already registered users

**No.** Already registered users (EOA-first: signed up with a connected wallet or were registered with an EOA via `registerPlayerFor`) are **not affected**.

| Change | Effect on existing users |
|--------|--------------------------|
| **createWalletForUserByBackend** | New function; only creates *new* wallet-first profiles. Never touches existing EOA-keyed profiles. |
| **createWalletForUser** (idempotent check) | The early return only runs when `ownerAddress` is a **wallet** with a self-owned profile (`profileByAddress[owner].wallet == owner`). For existing users, `ownerAddress` is their **EOA**, and `profileByAddress[EOA].wallet` is their smart wallet (≠ EOA), so the condition is false. They still hit the existing `if (profileByAddress[ownerAddress].exists) revert AlreadyRegistered();` — behavior unchanged. |
| **linkEOAToProfile(wallet, eoa)** | Only applies when `profileByAddress[wallet].owner == wallet` (wallet-first profile). Existing users' profiles are keyed by EOA and have `owner = EOA`; the profile is not keyed by the wallet. So this path is never used for them. |
| **transferProfileTo** | Unchanged. Existing users continue to use it to link a new EOA (e.g. "Transfer profile to address"). |

Existing users keep: profile keyed by their EOA, smart wallet owned by that EOA, same gameplay and withdrawals. New code paths only apply to **new** wallet-first signups and to linking an EOA to those wallet-first profiles.

---

## 1. TycoonUserRegistry (`contract/src/legacy/TycoonUserRegistry.sol`)

**Current behavior**

- Identity is **EOA-first**: `createWalletForUser(ownerAddress, username)` requires an EOA as `ownerAddress`; that EOA owns the profile and the created wallet.
- “Link external wallet” is done by the **current EOA** calling `transferProfileTo(newOwner)` so the new EOA becomes owner.

**Required changes**

1. **Create wallet at signup without an EOA (“wallet-first”)**
   - Add a function callable only by the game (or backend) that creates a smart wallet and a profile where the **wallet is the owner** (no EOA yet).
   - Example: `createWalletForUserByBackend(string calldata username) external onlyGame returns (address wallet)`.
   - Flow:
     - Deploy `TycoonUserWallet` with a **temporary** owner (e.g. registry or a designated custodian).
     - Call `wallet.transferOwnershipViaRegistry(wallet)` so the **wallet owns itself**.
     - Store profile with **owner = wallet**:  
       `profileByAddress[wallet] = UserProfile(owner: wallet, username, wallet, email)`,  
       `ownerByWallet[wallet] = wallet`,  
       `ownerByUsername[keccak256(username)] = wallet`.

2. **Allow “player” to be an existing wallet in `createWalletForUser`**
   - When the game (or backend) later calls `createWalletForUser(smartWallet, username)` (e.g. from `registerPlayerFor(smartWallet, username, hash)`), the registry must **not** create a second wallet.
   - At the start of `createWalletForUser(ownerAddress, username)`:
     - If `profileByAddress[ownerAddress].exists && profileByAddress[ownerAddress].wallet == ownerAddress`, **return** `ownerAddress` (idempotent: “this address is already a wallet-first profile”).
   - So: one wallet per user; game can call `createWalletForUser(smartWallet, username)` after that wallet was created by `createWalletForUserByBackend`.

3. **Link EOA to an existing wallet-first profile**
   - Add a function that binds a linked EOA to an existing profile whose owner is currently the **smart wallet** (no EOA yet).
   - Example: `linkEOAToProfile(address wallet, address eoa) external onlyGame` (or `onlyOwner` / a dedicated role).
   - Preconditions:
     - `profileByAddress[wallet].owner == wallet` (wallet is self-owned).
     - `profileByAddress[wallet].exists`.
     - `!profileByAddress[eoa].exists` (EOA doesn’t already have a profile).
   - Then:
     - Move the profile from “owner = wallet” to “owner = eoa” (same `username`, same `wallet` address).
     - Update `ownerByUsername`, `ownerByWallet`, and any other mappings so both the smart wallet and the EOA resolve to the **same** user.
     - Call `TycoonUserWallet(payable(wallet)).transferOwnershipViaRegistry(eoa)` so the wallet’s `owner` becomes the EOA.
   - After this, the same user is identified by both the smart wallet (e.g. for holding assets / game state) and the EOA (for signing and “profile owner”).

**Summary for TycoonUserRegistry**

- Add: **createWalletForUserByBackend(username)** → create wallet, wallet as owner, store profile by wallet.
- Add: **linkEOAToProfile(wallet, eoa)** → when current owner is the wallet, reassign profile and wallet ownership to `eoa`.
- Change: **createWalletForUser(ownerAddress, username)** → if `ownerAddress` is already a wallet-first profile (owner == wallet), return that wallet and do not create another.

---

## 2. TycoonUserWallet (`contract/src/legacy/TycoonUserWallet.sol`)

**Current behavior**

- Constructor: `if (_owner == address(0)) revert InvalidAddress();` — owner must be non-zero (typically an EOA).
- `transferOwnershipViaRegistry(newOwner)` is used when linking an EOA: registry moves ownership from current owner to the new EOA.

**Two ways to get “wallet as owner” (no EOA yet)**

- **Option A (recommended):** Deploy the wallet with **registry as temporary owner**, then in the same transaction call `wallet.transferOwnershipViaRegistry(wallet)` so the wallet becomes its own owner. **No change to TycoonUserWallet** — it already allows any non-zero address as owner (including the wallet’s own address).
- **Option B:** Allow `_owner == address(0)` and add a one-time `setInitialOwnerByRegistry(address)` so the registry sets owner after deployment. Requires changing the wallet contract (constructor + new function + handling uninitialized state in `onlyOwner`).

### Recommended: Option A

| | Option A (registry → wallet) | Option B (0 → setInitialOwner) |
|--|------------------------------|---------------------------------|
| **TycoonUserWallet** | No code change, no redeploy | Constructor + new function + modifier guards |
| **Risk** | Lower: don’t touch the contract that holds user funds | Higher: new code paths in the wallet |
| **Temporary owner** | Registry, for one atomic tx then wallet | None (0 until set) |
| **Audit surface** | Registry only | Registry + wallet |

**Best option: Option A.** Only upgrade **TycoonUserRegistry**. Deploy each new wallet as `new TycoonUserWallet(address(registry), registry, nairaVault, ...)` then immediately call `wallet.transferOwnershipViaRegistry(wallet)`. The wallet never needs to allow `owner == 0` or new initializer logic.

---

## 3. TycoonUpgradeable / TycoonUpgradeableLogic (game contract)

**Current behavior**

- `registerPlayerFor(playerAddress, username, passwordHash)` registers `playerAddress` (any address) and then calls:
  - `ITycoonUserRegistry(userRegistry).createWalletForUser(playerAddress, username)`.
- So the game can already register a **smart wallet** as the player; the only risk is the registry creating a **second** wallet when `playerAddress` is already a wallet-first profile.

**Required change (in Registry, not necessarily in Tycoon)**

- In **TycoonUserRegistry.createWalletForUser**, when `ownerAddress` is already a wallet with a self-owned profile, **return the existing wallet** and do not create a new one (as in section 1 above). Then no change is required in the game contract.

If you prefer the game to “know” about wallet-first users, you could add a view or a guard so it only calls `createWalletForUser` when the player is not already a wallet (e.g. call `getWallet(playerAddress)` and skip if it returns non-zero). That’s **optional** if the registry is idempotent.

---

## Flow After Upgrades

1. **Signup (no wallet connected)**  
   - Backend creates user in DB (e.g. Privy + username).  
   - Backend (as game controller) calls **TycoonUserRegistry.createWalletForUserByBackend(username)** → one smart wallet created, profile keyed by that wallet.  
   - Backend calls **Tycoon.registerPlayerFor(smartWallet, username, passwordHash)** → game registers the **smart wallet** as the player; registry’s `createWalletForUser(smartWallet, username)` is a no-op (wallet already exists).  
   - User is identified on-chain by the **smart wallet**; they can play (e.g. create/join games) via backend signing with their password hash; rewards/vouchers go to the smart wallet.

2. **User links external EOA**  
   - User proves ownership of EOA (e.g. sign message); backend updates DB (linked_wallet_address).  
   - Backend (or a dedicated “linker” role) calls **TycoonUserRegistry.linkEOAToProfile(smartWallet, eoa)**.  
   - Registry moves the profile from “owner = smartWallet” to “owner = eoa” and calls **TycoonUserWallet(wallet).transferOwnershipViaRegistry(eoa)**.  
   - Same user is now identified by both the smart wallet (assets, game state) and the EOA (owner of the profile and of the wallet).  
   - Optional: if you want the **game** to also treat the EOA as the same identity (e.g. for display or future EOA-signed actions), you can add a mapping in the game contract “EOA → canonical player address (smart wallet)” and use it in logic; that would be an additional, optional game-contract upgrade.

---

## Summary Table

| Contract | Upgrade | Purpose |
|----------|---------|--------|
| **TycoonUserRegistry** | Yes | Add `createWalletForUserByBackend(username)`, `linkEOAToProfile(wallet, eoa)`, and idempotent `createWalletForUser` when owner is already a wallet. |
| **TycoonUserWallet** | No (with Option A) | Use registry as temporary owner, then `transferOwnershipViaRegistry(wallet)` in the same tx. No code change. |
| **TycoonUpgradeable** | Optional | Only if you want the game to explicitly skip wallet creation or to map EOA ↔ smart wallet; otherwise registry idempotence is enough. |

**Recommended:** Use **Option A** (registry as temporary owner). Then you only upgrade **TycoonUserRegistry**; the game contract can stay as-is.
