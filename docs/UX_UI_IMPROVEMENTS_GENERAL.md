# General UX/UI improvements

A prioritized list of UX/UI improvements across the Tycoon frontend. Use as a backlog; implement in order of impact and effort.

---

## 1. Loading and skeleton states

**Current:** Many screens use a single spinner (`Loader2`) or full-page loading (e.g. `GameRoomLoading`, "Checking registration..."). Lists (shop perks, profile collectibles, join-room recent games) often show nothing or a spinner until data loads.

**Improvements:**
- **Skeleton loaders** for list-heavy views: Shop (perks grid), Profile (perks/vouchers), Join room (recent/pending games). Show 4–6 skeleton cards so layout is stable and users see that content is loading.
- **Inline loading** instead of full-page where possible: e.g. "Loading perks..." inside the panel rather than blocking the whole screen.
- **Stale-while-revalidate:** Keep previous data visible when refetching (e.g. after buying a perk) and show a small "Updating…" or refresh indicator.
- **Consistent loading component:** Reuse one `LoadingSpinner` or `PageLoading` for full-page and one `SkeletonCard` for lists so the experience is consistent.

---

## 2. Empty states

**Current:** Trade section, shop, and profile have empty states (e.g. "No active trades", "No perks yet — visit the shop"). Some screens show a bare "No items" with no next step.

**Improvements:**
- **Friendly copy + CTA:** Every empty list should have a short explanation and one clear action (e.g. "No games yet — Create a game" with a button).
- **Illustration or icon:** Optional small illustration or icon so the state feels intentional, not broken.
- **Standardize pattern:** Same structure everywhere: icon/illustration → title → short description → primary button/link.

---

## 3. Error handling and feedback

**Current:** Many flows use `toast.error()` / `toast.success()`. Some API errors surface only as a generic toast; forms may not show inline validation.

**Improvements:**
- **Actionable error messages:** Replace "Something went wrong" with specific text (e.g. "Not enough USDC", "Game not found", "Connection failed — check network").
- **Retry where useful:** On fetch/load errors, show a "Try again" button instead of only a toast.
- **Inline form errors:** For join-room code, create game, etc., show the error under the field or above the submit button and keep it until the user fixes or resubmits.
- **Optimistic updates:** You already do this in chat; consider for other quick actions (e.g. trade accept) so the UI feels instant, with rollback + toast on failure.

---

## 4. Navigation and back behavior

**Current:** Shop has "Back to Game" but goes to `/`; some modals close without restoring focus; 3D boards have "Go home" and various links.

**Improvements:**
- **Contextual back:** From shop opened during a game, "Back" could return to the game (e.g. `router.back()` or pass return URL) instead of always going home.
- **Focus trap in modals:** When opening My Perks, Quick Perk Shop, or other modals, trap focus inside and return focus to the trigger on close (helps keyboard and screen readers).
- **Breadcrumbs or context:** On deep flows (e.g. Tournament → Create → Success), a breadcrumb or "You're here" line reduces confusion.

---

## 5. Forms and inputs

**Current:** Join room, game settings, and other forms use local state and toasts. Some buttons stay disabled without explanation.

**Improvements:**
- **Disabled state explanation:** If "Join game" is disabled, show a tooltip or short line (e.g. "Enter a 6-character code" or "Connect wallet to join").
- **Loading state on submit:** Disable the submit button and show "Joining…" / "Creating…" so users don’t double-submit.
- **Clear on success:** After a successful submit (e.g. join game), clear the code input and show success state so the next action is obvious.

---

## 6. Accessibility

**Current:** Some `aria-` and `role` usage exists; many interactive elements rely on color and icon only.

**Improvements:**
- **Focus visible:** Ensure buttons and links have a visible focus ring (e.g. `focus:ring-2 focus:ring-cyan-500 focus:outline-none`) and avoid `outline: none` without a replacement.
- **aria-labels:** Add `aria-label` to icon-only buttons (e.g. close, sound toggle, "My Perks").
- **Modal semantics:** Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` for modals and sheets.
- **Color + text:** Don’t rely only on color for status (e.g. "Your turn" — use icon or label too so it’s clear for color-blind users).

---

## 7. Mobile-specific

**Current:** Mobile variants exist for board, shop, profile, and settings; bottom nav and safe areas are used in places.

**Improvements:**
- **Touch targets:** Ensure primary actions are at least 44×44 px; add padding to small links (e.g. "Visit the shop").
- **Safe area:** Use `pb-safe` / `env(safe-area-inset-bottom)` consistently on bottom nav and sticky bars so content isn’t hidden by notches/home indicators.
- **Pull to refresh:** On Join room (recent games) and Profile (perks), optional pull-to-refresh so users can refresh without hunting for a button.
- **Swipe or tap to dismiss:** For bottom sheets (e.g. Perk Shop, My Perks), a drag handle and swipe-down-to-close (you have a handle; ensure gesture is obvious).

---

## 8. Visual and copy consistency

**Current:** Cyan/teal (`#00F0FF`) is the main accent; copy varies ("Back to Game", "Go home", "Visit the shop", "No perks yet").

**Improvements:**
- **Terminology:** Pick one convention (e.g. "Perk Shop" vs "Shop") and use it in nav, profile, and in-game.
- **Button hierarchy:** Primary = filled cyan; secondary = outline or muted; destructive = red. Apply consistently so users recognize actions.
- **Spacing and typography:** Reuse a small set of spacing tokens and type scale (e.g. headings, body, captions) so pages feel part of one product.

---

## 9. Onboarding and discoverability

**Current:** New users may not know about daily claim, in-game shop, or how to start a game.

**Improvements:**
- **First-time hints:** Optional one-time tooltips or short messages (e.g. "Claim daily rewards in Profile → Stats", "Buy perks during a game from My Perks").
- **Empty-state education:** In empty perks: "Perks give you in-game advantages. Buy them here or in the Perk Shop during a game."
- **How to Play:** Ensure "How to Play" is easy to find from the main nav and from the game (e.g. a small "?" in the HUD).

---

## 10. Performance and perceived speed

**Improvements:**
- **Route prefetch:** Prefetch `/game-shop`, `/profile`, `/leaderboard` on hover or when the app is idle so navigation feels instant.
- **Image optimization:** Use Next.js `Image` with proper `sizes` for perk images and avatars so they load quickly on mobile.
- **Reduce layout shift:** Reserve space for images (aspect-ratio or min-height) so the page doesn’t jump when they load.

---

## Quick wins (low effort, high impact)

1. Add `aria-label` to icon-only buttons in navbar and game HUD.
2. Add a "Try again" button on join-room and game-load errors.
3. Standardize "Back" / "Go home" copy and behavior (document in one place).
4. Show "Joining…" / "Creating…" on form submit and disable the button.
5. Add one skeleton loader to the Shop perks grid (or profile perks) as a pattern to reuse.

---

## Already in good shape

- **Toasts** used for success and error in many flows.
- **Empty states** present in trade, shop, and profile (with CTAs).
- **Loading** present (GameRoomLoading, Loader2) — next step is skeletons and consistency.
- **Mobile variants** for main flows (board, shop, profile, settings).
- **In-game perk shop** documented and labeled ("Buy perks", "Without leaving the game").

Use this doc alongside `UX_UI_AND_IN_GAME_SHOP.md` for shop/perk-specific improvements.
