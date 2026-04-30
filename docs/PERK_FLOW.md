# Unified Perk Flow

All perk effects (from collectibles or from pre-activated `active_perks`) go through the same backend APIs. This gives one code path, consistent logging, and optional future burn verification.

## Backend API

| Endpoint | Body | Use |
|----------|------|-----|
| `POST /api/perks/activate` | `game_id`, `perk_id` | Add perk to `active_perks` (ids 1,2,3,4,7,8,9). Game logic or special endpoints consume it later. |
| `POST /api/perks/use-jail-free` | `game_id`, optional `from_collectible` | Set `in_jail: false`. If not `from_collectible`, requires perk 2 in `active_perks` and consumes it. |
| `POST /api/perks/teleport` | `game_id`, `target_position` (0–39), optional `from_collectible` | Move player to position. If not `from_collectible`, requires Teleport (6) in `active_perks` and consumes it. |
| `POST /api/perks/exact-roll` | `game_id`, `chosen_total` (2–12), optional `from_collectible` | Set `pending_exact_roll`. If not `from_collectible`, requires Exact Roll (10) in `active_perks` and consumes it. |
| `POST /api/perks/burn-cash` | `game_id`, optional `from_collectible`, optional `amount` | Add TYC to balance. If `from_collectible` and `amount` provided, use that; else random tier. If not `from_collectible`, requires Instant Cash (5) in `active_perks` and consumes it. |
| `POST /api/perks/apply-cash` | `game_id`, `perk_id` (8 or 9), `amount`, optional `from_collectible` | Add `amount` to balance (Property Discount or Tax Refund). If not `from_collectible`, requires that perk in `active_perks` and consumes it. |

## When to use `from_collectible: true`

- **Collectibles flow:** User burns an NFT on-chain, then the frontend calls the same endpoints with `from_collectible: true`. Backend applies the effect without requiring the perk in `active_perks` and logs that the use was from a collectible.
- **Dev tools / pre-activated perks:** No `from_collectible`; backend requires the perk in `active_perks` and consumes it.

## Perk IDs

| ID | Name | Activation | Special endpoint |
|----|------|------------|------------------|
| 1 | Extra Turn | activate (frontend triggers roll again) | — |
| 2 | Jail Free | activate or use-jail-free | `use-jail-free` |
| 3 | Double Rent | activate (consumed on rent) | — |
| 4 | Roll Boost | activate (consumed on roll) | — |
| 5 | Instant Cash | — | `burn-cash` |
| 6 | Teleport | — | `teleport` |
| 7 | Shield | activate (consumed on rent) | — |
| 8 | Property Discount | activate or one-shot | `apply-cash` |
| 9 | Tax Refund | activate or one-shot | `apply-cash` |
| 10 | Exact Roll | — | `exact-roll` |
| 11 | Rent Cashback | activate (consumed when you receive rent) | — (passive: +25% on next rent received) |
| 12 | Interest | activate (consumed at start of your turn) | — (passive: +$200 at turn start) |
| 13 | Lucky 7 | activate (one-shot: sets next roll to 7) | — |
| 14 | Free Parking Bonus | activate (consumed when you land on position 20) | — (passive: +$500 when landing on Free Parking) |

## Frontend

- **Collectibles (burn → apply):** After burn, call the appropriate endpoint with `game_id` and `from_collectible: true` (and any extra params: `target_position`, `chosen_total`, `amount`).
- **3D board / PerksBar:** Same; all use the same perk APIs so game state and history stay consistent.
