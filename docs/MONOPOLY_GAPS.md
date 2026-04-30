# Monopoly-related gaps and differences

Compared to classic Monopoly rules and common digital implementations, here’s what is **missing** or **intentionally different** in Tycoon.

---

## Implemented (previously missing)

### 1. **Repair cards (per house/hotel)** — implemented

- **Cards:** “Make general repairs” (Chance: $25 per house, $100 per hotel) and “Street repairs” (Community Chest: $40 per house, $115 per hotel).
- **Status:** In `gamePlayerController.js` inside `handleCard`, when `extra.per_house` or `extra.per_hotel` is present, the backend sums the drawing player's houses (development 1–4) and hotels (development 5) and debits the total.

### 2. **House/hotel shortage** — implemented

- **Classic rule:** The bank has 32 houses and 12 hotels. If there are none left, no one can build until someone sells.
- **Status:** In `gamePropertyController.js` (develop endpoint), the backend enforces max 32 houses and 12 hotels per game and returns a clear error when at limit.

---

## Intentional differences

- **Unmortgage:** Cost is **full price** (100%), not 110% as in classic Monopoly. Documented in `GAME_MECHANICS.md` §8.
- **Income Tax:** Fixed amount (e.g. `property.price` / $100), not “$200 or 10% of total assets”.
- **Free Parking:** No “jackpot” (tax money in the middle). Position 20 has no effect except the **Free Parking Bonus** perk ($500 when you land there). Design choice.
- **Double 6:** Total 12 is treated as invalid and the player rolls again (no move). Your variant, not classic “doubles = roll again” (which you do have for 2–10).

---

## Implemented and aligned

- 40-space board, Go, Jail, Go to Jail, Chance, Community Chest, Income Tax, Luxury Tax, Free Parking (space).
- Rent by development level; railroads (1–4); utilities (dice × 4 or 10).
- Houses and hotels, even build, mortgage/unmortgage, sell buildings.
- Auction when player declines (if setting enabled).
- Get Out of Jail Free (draw and use); jail: pay $50, use card, roll for doubles, or stay 3 turns.
- Three doubles in a row → Go to Jail.
- Doubles = roll again (accumulate move); three doubles → jail.
- Bankruptcy, last player wins; time-based net-worth win (AI).
- Trading (properties + cash).
- Perks (e.g. Double Rent, Jail Free, Free Parking Bonus) are your extension, not classic.

---

**Summary:** Repair cards and house/hotel shortage are now implemented. The rest are intentional simplifications/variants.
