# Contract Backing Tracker

**Purpose:** Track what needs smart contract support vs off-chain (Flutterwave, etc.). You intend to build an **upgradable** smart contract — use this doc to log features that require on-chain backing.

---

## Payment flows

| Flow | Backing | Notes |
|------|---------|-------|
| **USDC** (staked games, entry stake, payouts) | Smart contract | On-chain USDC transfers; game contract holds/stakes/releases. |
| **Naira (NGN)** | Flutterwave (off-chain) | Perk bundles, daily rewards; no contract needed. |
| **Perk purchases (USDC)** | Smart contract | When perks require on-chain payment. |
| **Perk purchases (NGN)** | Flutterwave + backend | Paystack/Flutterwave; backend fulfills bundle. |
| **Hosted agent credits (USDC)** | Verify tx | User sends $1 USDC to HOSTED_AGENT_CREDITS_USDC_RECIPIENT; backend verifies and credits. |
| **Hosted agent credits (NGN)** | Flutterwave | Same flow as perk bundles; webhook credits user. |

---

## Agent / AI — what needs contract backing?

| Item | Needs contract? | Notes |
|------|-----------------|-------|
| **ERC-8004 Identity** | Yes (external) | Celo ERC-8004 Identity Registry — user owns NFT, pays gas. |
| **ERC-8004 Reputation** | Yes (external) | Celo Reputation Registry — feedback after games. |
| **Agent slot assignments** | No | Backend DB (`agent_slot_assignments`); no contract. |
| **Tycoon-hosted credits** | Hybrid | Balance + daily cap in DB. Purchase: USDC (verify tx on-chain) or NGN (Flutterwave). No contract for credits bookkeeping. |
| **Agent payouts** | Maybe | If agents receive USDC (e.g. revenue share) — would need contract. |

---

## Planned: upgradable smart contract

- **Goal:** One upgradable contract (or proxy pattern) for game logic, USDC handling, perks, etc.
- **Use for:** USDC flows, staked games, entry stake, payouts, optional agent revenue.
- **NGN:** Stay off-chain (Flutterwave / Paystack).

---

## Items to add (contract-backed)

*Add below as you identify features that need on-chain support:*

- [ ] USDC entry stake (create game, join game)
- [ ] Staked game payouts (USDC by rank on exit)
- [ ] Perk purchases (USDC) — if sold on-chain
- [ ] Agent revenue share (USDC to agent wallet) — optional
- [ ] *(Add more as needed)*

---

## Items that stay off-chain

- Agent slot registry (DB)
- Tycoon-hosted credits balance + daily cap (DB)
- NGN payments (Flutterwave, Paystack)
- Game state (DB + optional on-chain sync)
- ERC-8004 (external Celo registries; we call them, don’t deploy)

---

## Notes

- **ERC-8004:** We integrate with Celo’s existing Identity + Reputation registries; no custom contract.
- **Upgradable contract:** When built, migrate USDC logic here; keep NGN and agent DB logic off-chain.
- **AI/agent:** Slot assignments, credits, skill/config — all backend. Only on-chain piece is ERC-8004 (user registers, we use it).
