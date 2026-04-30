# Design system — visual and copy consistency

Use these conventions so the app feels like one product.

## Terminology

- **Perk Shop** — The place where users buy perks (and bundles). Use "Perk Shop" in:
  - Nav link label
  - Page title
  - Empty states and CTAs (e.g. "Visit Perk Shop")
  - In-game modal/sheet title (e.g. "Perk Shop" when opening from My Perks)
- **My Perks** — In-game panel for owned perks and quick access to Perk Shop.
- **Shop** — Avoid as a standalone label; use "Perk Shop" for clarity.

## Button hierarchy

- **Primary** — Main action (e.g. Buy, Join, Create, Save):
  - Filled cyan: `bg-gradient-to-r from-[#00F0FF] to-[#0DD6E0]` or `from-[#00F0FF] to-cyan-400`, text black, rounded-xl.
- **Secondary** — Cancel, Back, or alternative actions:
  - Outline or muted: `border border-[#003B3E] bg-[#0E1415]/60` or `bg-white/10`, text slate/white.
- **Destructive** — Disconnect, Remove, Delete:
  - Red: `bg-red-900/40` or `bg-red-950/50`, `border-red-500/40` or `border-red-600/40`, `text-red-400`.

## Spacing and typography

- **Page title:** `text-3xl` or `text-4xl md:text-5xl` + `font-bold` (e.g. Perk Shop, Profile).
- **Section heading:** `text-lg` or `text-xl` + `font-bold`; section labels can use `text-sm font-medium text-slate-500 uppercase tracking-widest`.
- **Body:** `text-sm` or `text-base`.
- **Captions / hints:** `text-xs text-slate-500`.
- **Vertical rhythm:** Use consistent gaps — e.g. `mb-6` between sections, `gap-4` or `gap-6` in grids.

## Accent color

- Primary accent: cyan/teal `#00F0FF` (and gradients to `#0DD6E0` / `cyan-400`).
- Use for links, primary buttons, focus rings, and key icons.
