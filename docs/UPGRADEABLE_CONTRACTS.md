# Upgradable contracts — are they valid?

**Yes.** Upgradable (proxy-based) contracts are a standard, well-understood pattern on Ethereum and EVM chains (including Celo). Many production systems use them.

---

## How it works (short)

- **Proxy:** Users interact with a single address (the proxy). The proxy holds state (storage) and **delegatecalls** into an **implementation** contract that holds the code.
- **Upgrade:** You deploy a new implementation and point the proxy at it. Same address, same state, new logic.
- **Initialization:** Implementation contracts use an `initializer` (or `initialize`) instead of a `constructor`, so the proxy can set up state once.

Common patterns:

| Pattern | Who can upgrade | Notes |
|--------|------------------|--------|
| **Transparent proxy** | Admin (ProxyAdmin) only; admin cannot call implementation. | OpenZeppelin `TransparentUpgradeableProxy` + `ProxyAdmin`. |
| **UUPS** (EIP-1822) | Upgrade logic lives in the implementation; you override `_authorizeUpgrade`. | Gas-cheaper; implementation must include upgrade logic. |
| **Beacon proxy** | Upgrade the “beacon”; all proxies share one implementation. | Good for many identical proxies (e.g. per-user). |

Your repo already has OpenZeppelin’s upgradeable contracts in `contract/lib/openzeppelin-contracts/` (e.g. `UUPSUpgradeable`, `Initializable`, `TransparentUpgradeableProxy`).

---

## Tradeoffs

| Upgradable | Non-upgradable (current Tycoon) |
|------------|----------------------------------|
| Fix bugs, add features, adjust parameters without migrating users/funds. | Immutable: no change after deploy; “set in stone.” |
| Requires care: storage layout, initializers, who can upgrade. | Simpler mental model; what you deploy is what runs. |
| Some users/auditors prefer immutability. | Strong “trustless” narrative. |
| Need to manage upgrade authority (timelock, multisig). | No upgrade key. |

So upgradable contracts are **valid and useful** when you want to evolve logic over time; they’re a deliberate design choice, not a hack.

---

## Tycoon today

Your **Tycoon** and **TycoonRewardSystem** contracts are **not** upgradeable: they use constructors and are deployed as normal contracts. That’s a valid choice (simplicity, immutability).

If you ever want to make them upgradable:

1. Use a **proxy** (e.g. ERC1967Proxy or TransparentUpgradeableProxy) and deploy the current logic as the first implementation.
2. Replace **constructors** with **initializers** (and run the initializer once via the proxy).
3. Keep **storage layout** stable across upgrades (don’t remove/reorder state variables; only append or use OZ’s storage gaps).
4. Restrict **who can upgrade** (e.g. `_authorizeUpgrade` in UUPS to owner or timelock).

For a hackathon, staying non-upgradable is fine; you can mention in the narrative that “the core game contract is immutable for trust.” If you later need to fix or extend logic without migrating, then consider an upgradeable design (often with a new proxy + implementation and, if needed, migration of funds/state).

**Implementation steps:** See **UPGRADEABLE_IMPLEMENTATION_STEPS.md** for an ordered checklist (scope, refactor, deploy, upgrade, backend/frontend).
