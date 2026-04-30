# New Perks (11–14) — Contract Update Guide

Four new Monopoly-style perks are implemented in the **backend** and **frontend**. When you update the contract, add the following enum values and wire them to the same perk IDs.

## Perk summary

| ID | Name | Effect |
|----|------|--------|
| 11 | Rent Cashback | Next rent the player *receives* is +25% (owner bonus). Consumed when they receive rent. |
| 12 | Interest | At the start of the player’s next turn, they receive $200. Consumed when their turn starts. |
| 13 | Lucky 7 | One-shot: sets `pending_exact_roll = 7` so their next roll is 7. |
| 14 | Free Parking Bonus | Next time the player lands on Free Parking (position 20), they receive $500. Consumed when they land there. |

## Contract enum (TycoonLib.sol)

Add to `CollectiblePerk`:

```solidity
RENT_CASHBACK,   // 11
INTEREST,        // 12
LUCKY_7,         // 13
FREE_PARKING_BONUS  // 14
```

So the full enum becomes:

```solidity
enum CollectiblePerk {
    NONE,
    EXTRA_TURN,
    JAIL_FREE,
    DOUBLE_RENT,
    ROLL_BOOST,
    CASH_TIERED,
    TELEPORT,
    SHIELD,
    PROPERTY_DISCOUNT,
    TAX_REFUND,
    ROLL_EXACT,
    RENT_CASHBACK,      // 11
    INTEREST,           // 12
    LUCKY_7,            // 13
    FREE_PARKING_BONUS  // 14
}
```

## Backend / frontend status

- **Backend:** Perk names, `activate` (including 11–14), Rent Cashback and Free Parking in `payRent`, Interest on turn start via `applyTurnStartPerks`, Lucky 7 as one-shot in `activatePerk`.
- **Frontend:** Perk names and icons in PerksBar, shop, collectibles; activate flow for 11–14 after burn; `rewardsConstants` and PerksBar support IDs 1–14.
- **Contract:** Add the enum values above and re-deploy. After that, you can stock and mint collectibles for perks 11–14 like the existing ones.
