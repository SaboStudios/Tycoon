# UX/UI and in-game perk shop

## Can perks be bought in-game without leaving the board?

**Yes.** Perks can be bought **during a game** without leaving the board. The in-game “mini” shop is available on both desktop and mobile.

### How players access it

1. **During a game** (multiplayer, AI, or 3D board): open the **My Perks** panel.
   - **Desktop:** Click the perks button (e.g. sparkles / “My Perks”) so the perks sidebar/modal opens.
   - **Mobile:** Open the **My Perks** bottom sheet / modal (e.g. from the game HUD).
2. In that panel you’ll see **Your Perks** (owned perks) and a **Shop** / **Open Shop** (or **Buy perks**) button.
3. Tapping that button opens the **Quick Perk Shop** (desktop modal or mobile bottom sheet) with the same perks and USDC (or TYC where still enabled) purchase flow as the main shop.
4. Buying happens in-place; the board stays visible and the game is not navigated away.

**Components:**  
- Desktop: `CollectibleInventoryBar` in `collectibles-invetory.tsx` (Shop button → “Quick Perk Shop” modal).  
- Mobile: `CollectibleInventoryBar` in `collectibles-invetory-mobile.tsx` (“Open Shop” → Perk Shop bottom sheet).  
Used from `game-board.tsx`, `board-mobile.tsx`, `BoardPerksModal.tsx`, `ai-board.tsx`, `board-3d/page.tsx`, `board-3d-multi/page.tsx`, `Mobile3DGameUI.tsx`, etc.

The **main Perk Shop** at **Profile → Shop** (or nav **Shop** → `/game-shop`) is the same catalog; the in-game flow is a convenience so players don’t leave the game.

---

## Suggested UX/UI improvements

- **Discoverability of in-game shop**  
  - Make the in-game “Shop” action clearer: e.g. label **“Buy perks”** and add a short line like “Buy without leaving the game” under or next to the button (desktop and mobile).
  - When the user has **no perks yet**, show a clear CTA in the My Perks panel: “You have no perks — Buy perks to use during the game” with the shop button prominent.

- **Consistency**  
  - Align in-game shop with main shop: same payment options (e.g. USDC-only if TYC is hidden on main shop), same copy and error messages.
  - Use the same “Perk Shop” / “Buy perks” naming in nav, profile, and in-game.

- **Empty and loading states**  
  - Perks panel: friendly empty state with one-tap access to the in-game shop (and optional link to full shop page).
  - Shop (in-game and main): clear “No items in stock” and loading skeletons so the user knows the list is loading vs empty.

- **Mobile**  
  - Ensure the **My Perks** entry point is obvious in the game HUD (e.g. icon + “Perks”).
  - Perk Shop bottom sheet: keep “Buy perks” primary; consider a sticky “Pay with USDC” or balance line at top.

- **Feedback**  
  - After a successful in-game purchase: toast + briefly highlight the new perk in “Your Perks” or refresh the list so the new count is visible.
  - On purchase failure: show a clear, actionable message (e.g. “Not enough USDC” or “Transaction failed”).

- **Navigation**  
  - In-game shop: optional “Full shop” link to `/game-shop` for users who want bundles or a bigger screen (especially on mobile).

- **Accessibility and clarity**  
  - Perk cards: ensure name + short description (or tooltip) so “Use during a game” is clear.
  - Buttons: sufficient contrast and touch targets (e.g. 44px) on mobile.

---

## Implemented (in-game shop discoverability)

- **Desktop** (`collectibles-invetory.tsx`): Button label is **“Buy perks”** with hint “Without leaving the game”; when the user has 0 perks, a line “Buy perks below to use during this game.” is shown.
- **Mobile** (`collectibles-invetory-mobile.tsx`): Same **“Buy perks”** label and “Without leaving the game” hint; when 0 perks, “Buy perks above to use during this game.”
- **Profile** (“No perks yet”): Copy still points to “visit the shop”; you can add “or buy during a game from My Perks → Buy perks” for consistency.
