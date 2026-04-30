# Steps to implement upgradable contracts

Ordered steps to make Tycoon (and optionally TycoonRewardSystem) upgradeable using a proxy. No code here—only the sequence of tasks.

---

## 1. Decide scope and pattern

1. **Which contracts to make upgradeable**
   - **Tycoon** (main game logic, state, payouts) — primary candidate.
   - **TycoonRewardSystem** (ERC1155, vouchers, collectibles) — if you want to change reward/perk logic later without redeploying.
   - TycoonToken, TycoonNFT, TycoonTournamentEscrow — usually left non-upgradeable unless you have a clear need.

2. **Choose proxy pattern**
   - **UUPS:** Upgrade logic in the implementation; override `_authorizeUpgrade` (e.g. onlyOwner). Slightly cheaper gas; implementation must stay upgradeable.
   - **Transparent proxy:** Upgrade logic in ProxyAdmin; admin cannot call implementation. Simpler implementation contract; you manage ProxyAdmin.
   - Recommendation: UUPS if you want upgrade in the implementation; Transparent if you want a separate admin contract.

3. **Dependency order**
   - Tycoon depends on TycoonRewardSystem (address). If both are upgradeable, deploy RewardSystem proxy first, then Tycoon implementation that receives the RewardSystem proxy address in `initialize`.

---

## 2. Prepare the implementation contract(s)

**For each contract you want behind a proxy (e.g. Tycoon, then TycoonRewardSystem):**

1. **Replace constructor with initializer**
   - Remove the `constructor(...)`.
   - Add an `initialize(...)` (or `initializer` with a different name) that performs the same setup (owner, stored addresses, etc.).
   - Inherit OpenZeppelin’s `Initializable` and call `_disableInitializers()` in the constructor of the **implementation** contract so the implementation cannot be initialized (only the proxy should run `initialize` once).

2. **Use upgradeable base contracts**
   - Replace OZ base contracts with their upgradeable versions where they exist (e.g. `OwnableUpgradeable`, `ReentrancyGuardUpgradeable`, `PausableUpgradeable`, `ERC1155Upgradeable`).
   - In Solidity, use imports from `@openzeppelin/contracts-upgradeable` if you add that package, or keep non-upgradeable bases and only add `Initializable` + initializer; the latter can work but OZ recommends upgradeable bases for storage consistency.

3. **Add upgrade mechanism (if UUPS)**
   - Inherit `UUPSUpgradeable`.
   - Override `_authorizeUpgrade(address newImplementation)` to restrict to owner (or timelock/multisig).

4. **Preserve storage layout**
   - Do not remove or reorder existing state variables.
   - New state: only append at the end, or use OpenZeppelin’s storage gap (e.g. `uint256[50] __gap`) in base contracts to reserve slots for future variables.
   - Document the current storage layout (or run a storage layout diff tool before/after upgrades).

5. **TycoonRewardSystem specifics**
   - If it stays in the same file as Tycoon, both need initializer + upgrade pattern.
   - RewardSystem has `immutable` (e.g. `tycToken`, `usdc`). In upgradeable contracts, immutables are set in the implementation; they are not stored in the proxy’s storage. That’s fine for token addresses that never change. If you need them to be upgradeable later, use regular state variables and set them in `initialize`.

6. **Tycoon constructor → initializer**
   - Current: `constructor(initialOwner, _rewardSystem)`. Becomes `initialize(initialOwner, _rewardSystem)` (or a single `initialize` that the proxy calls with `data`). Set `rewardSystem` in storage in `initialize`.

---

## 3. Deployment flow

1. **Deploy implementation(s)**
   - Deploy TycoonRewardSystem implementation (no need to call `initialize` on the implementation contract).
   - Deploy Tycoon implementation (same: no `initialize` on the implementation).

2. **Deploy proxy (or proxy + admin)**
   - **UUPS:** Deploy ERC1967Proxy (or the proxy that uses ERC1967) with: (implementation address, optional owner/admin, encoded `initialize(...)` call).
   - **Transparent:** Deploy TransparentUpgradeableProxy with (implementation, initialOwner, encoded `initialize(...)`). ProxyAdmin is often deployed automatically by the proxy constructor.

3. **Run initializer through the proxy**
   - If you did not pass `initialize` in the proxy constructor, call it once from your deployer script: `Tycoon(proxyAddress).initialize(owner, rewardSystemProxyAddress)`.
   - Ensure `initialize` is only callable once (use `initializer` modifier from Initializable).

4. **Verify**
   - Check that the proxy address is the one that holds state (e.g. games, balances).
   - Check that calls to the proxy behave like the old Tycoon (e.g. createGame, joinGame, exitGame).

5. **Update config**
   - Replace the old Tycoon (and RewardSystem) address with the **proxy** address in:
     - Backend env / config (e.g. `TYCOON_CONTRACT_ADDRESS`, reward system address).
     - Frontend / constants (contract addresses per chain).
   - Do not point frontend/backend at the implementation address for normal use.

---

## 4. Upgrade flow (for later upgrades)

1. **Deploy new implementation**
   - Compile the new Tycoon (or RewardSystem) with the same storage layout (no removals/reorders; only append or use gaps).
   - Deploy the new implementation contract (no `initialize` call on it).

2. **Point proxy to new implementation**
   - **UUPS:** Call `upgradeToAndCall(newImplementation, data)` on the proxy (or on the implementation through the proxy, depending on how OZ sets it up). If you need a post-upgrade hook, pass `data` as the encoded call to a `reinitialize` or migration function.
   - **Transparent:** Call `upgradeToAndCall` from the ProxyAdmin (not from the proxy as a normal user).

3. **Optional: migration function**
   - If the upgrade requires one-time state changes, add a function (e.g. `reinitializeV2()`) that runs once (e.g. guarded by a version flag) and call it via `upgradeToAndCall(impl, abi.encodeCall(Contract.reinitializeV2, ()))`.

4. **Re-verify**
   - Run tests or a short script that the upgraded contract still behaves correctly (existing state + new logic).

---

## 5. Backend and frontend

1. **Backend**
   - Use the **proxy** address for all reads/writes (tycoonContract, reward system).
   - No change to ABI for existing functions; only the deployment address changes to the proxy.

2. **Frontend**
   - Update contract addresses (per chain) to the proxy address.
   - Same ABIs; no change to how you call the contract.

3. **Existing deployments**
   - If Tycoon is already deployed and holds state (e.g. on Celo testnet/mainnet), you cannot “turn it into” a proxy without migrating: you would deploy a new proxy + implementation and, if needed, migrate funds/state from the old contract (if that’s even possible). So “implement upgradable” usually means: **new deployment** as proxy + implementation; existing deployments stay as-is unless you run a migration.

---

## 6. Safety and governance (optional but recommended)

1. **Restrict upgrade rights**
   - UUPS: `_authorizeUpgrade` only allows owner (or timelock/multisig).
   - Transparent: ProxyAdmin owner = multisig or timelock.

2. **Storage layout checks**
   - Before each upgrade, generate storage layout (e.g. `forge inspect Contract storageLayout` or OpenZeppelin’s upgrade plugin) and compare to previous implementation. No removals or reorders.

3. **Testing**
   - Add tests: deploy proxy, initialize, run main flows (create game, join, exit, payouts).
   - Add an upgrade test: deploy V2 implementation, upgrade proxy, run same flows again.

---

## 7. Summary checklist

- [ ] Choose contracts to upgrade (Tycoon, optionally TycoonRewardSystem).
- [ ] Choose pattern (UUPS or Transparent).
- [ ] Replace constructor with initializer; add `Initializable` and, for UUPS, `UUPSUpgradeable` + `_authorizeUpgrade`.
- [ ] Use upgradeable OZ bases where applicable; preserve storage layout; add `__gap` if needed.
- [ ] Deploy implementation(s), then proxy with initializer call (or call initializer right after).
- [ ] Point backend and frontend to proxy address(es).
- [ ] Document proxy and implementation addresses per chain.
- [ ] For upgrades: deploy new implementation, call upgrade on proxy (and optional migration), re-verify.

For more context, see **UPGRADEABLE_CONTRACTS.md**.
