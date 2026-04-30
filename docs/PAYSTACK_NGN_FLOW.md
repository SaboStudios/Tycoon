# Paystack NGN flow for perk bundle purchases

Players can buy perk bundles with Nigerian Naira (NGN). Paystack processes the payment; we use **webhooks** as the source of truth for success (recommended over redirect/callback).

## Flow overview

1. **Initialize** (auth required): Frontend calls `POST /api/shop/paystack/initialize` with `{ bundle_id }`. Backend creates a Paystack transaction with `metadata: { user_id, bundle_id }`, stores a pending record, returns `authorization_url` and `reference`.
2. **User pays**: Frontend redirects the user to `authorization_url`. User completes payment on Paystack (card, bank, etc.).
3. **Webhook** (source of truth): Paystack sends `charge.success` to `POST /api/shop/paystack/webhook`. Backend verifies the `x-paystack-signature` (HMAC SHA512), then marks the payment complete and **fulfills** the bundle (e.g. record in `user_bundle_purchases`). Respond with `200` immediately; do heavy work async if needed.
4. **Redirect (UX only)**: Paystack redirects the user to your `callback_url` (e.g. `/shop?paystack=success&reference=xxx`). Frontend can show “Payment successful” and optionally call `GET /api/shop/paystack/verify?reference=xxx` to confirm and refresh state. Do **not** rely on the redirect to grant the bundle; use the webhook.

## Why webhook-first

- Redirect can fail (user closes tab, network issues). Paystack retries webhooks for 72 hours.
- Avoids race conditions: only the webhook updates “payment completed” and triggers fulfillment.
- Idempotency: webhook handler checks by `reference` and only fulfills once.

## Backend pieces

- **Env**: `PAYSTACK_SECRET_KEY` — your Paystack secret key (starts with `sk_`). Optional: `PAYSTACK_PUBLIC_KEY` for frontend if you use the inline popup. Webhook URL must be publicly reachable (e.g. `https://your-api.com/api/shop/paystack/webhook`); set it in [Paystack Dashboard → Settings → Developer](https://dashboard.paystack.com/#/settings/developer).
- **Tables**:
  - `perk_bundles.price_ngn` – NGN price in kobo (integer).
  - `paystack_payments` – `reference` (unique), `user_id`, `bundle_id`, `amount_kobo`, `status` (pending | completed | failed), `fulfilled_at`, timestamps.
  - `user_bundle_purchases` – fulfilled NGN purchases: `user_id`, `bundle_id`, `payment_reference`, `source: 'ngn'`, `created_at`. Used to grant perks (in-game or future contract mint).
- **Endpoints**:
  - `POST /api/shop/paystack/initialize` – auth required; create Paystack transaction, return `authorization_url`, `reference`.
  - `POST /api/shop/paystack/webhook` – no auth; verify signature, on `charge.success` update `paystack_payments` and insert into `user_bundle_purchases`, set `fulfilled_at`. Return 200 immediately.
  - `GET /api/shop/paystack/verify?reference=xxx` – auth optional; return payment + fulfillment status for the given reference (for frontend polling/redirect page).

## Fulfillment (delivering the bundle)

- **Current**: On webhook success we insert into `user_bundle_purchases`. Game logic can treat this as “user has this bundle from NGN” and grant the bundle’s perks when they join a game or from a “My bundles” screen.
- **Future**: If the reward contract supports backend-mint of bundle collectibles, we can call that from the webhook (or a job) and mint to `user.address` or `user.linked_wallet_address`; still record in `user_bundle_purchases` for history.

## Security

- Always verify `x-paystack-signature` in the webhook (HMAC SHA512 of raw body with `PAYSTACK_SECRET_KEY`).
- Use `reference` as idempotency key so duplicate webhook deliveries don’t double-fulfill.
- In initialize, validate `bundle_id` and that the bundle has `price_ngn` and is active.
