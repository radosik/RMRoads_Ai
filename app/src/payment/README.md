# Payments (optional, opt-in)

This directory ships the OpenSaaS payment scaffolding intact: **Stripe**, **Lemon Squeezy**, and **Polar** processors, a `/pricing` page, a `/checkout` result page, a webhook endpoint, and the subscription/credits accounting that goes with them.

**It is wired up but disabled by default.** RMRoads AI is positioned as a free, open-source workbench — no hosted billing, no commercial plan. The payment code stays in the repo so a fork that wants to monetize doesn't have to re-implement everything from scratch.

## What ships

| Piece | Purpose |
|---|---|
| `plans.ts` | Plan catalog (`Hobby`, `Pro`, `Credits10`) + plan-id parsing. Edit this to add/remove plans. |
| `paymentProcessor.ts` | Abstracts over Stripe / Lemon Squeezy / Polar. Picks one based on env vars. |
| `stripe/` `lemonSqueezy/` `polar/` | Provider-specific clients, checkout-session builders, webhook handlers. |
| `operations.ts` | `generateCheckoutSession`, `getCustomerPortalUrl`. |
| `webhook.ts` | The single `/payments-webhook` endpoint that dispatches to the right provider. |
| `PricingPage.tsx` | `/pricing` — three plan cards and a "Buy now" / "Manage subscription" button. |
| `CheckoutResultPage.tsx` | `/checkout` — post-checkout success/cancel landing. |
| `paymentProcessorPlans.ts` | Maps plan ids to provider-specific product/price ids. |

The relevant Prisma fields on `User`:

```prisma
paymentProcessorUserId        String?  @unique
lemonSqueezyCustomerPortalUrl String?
subscriptionStatus            String?   // 'active', 'cancel_at_period_end', 'past_due', 'deleted'
subscriptionPlan              String?   // 'hobby', 'pro'
datePaid                      DateTime?
credits                       Int       @default(3)
```

## How to enable it

1. Pick **one** provider (Stripe, Lemon Squeezy, or Polar). Don't run two at once — the webhook router picks the first one with valid env vars, the rest sit idle.
2. Set the provider's env vars in `app/.env.server`. See `app/.env.server.example` for the full list. At minimum each provider needs:
   - API key / secret
   - Webhook secret
   - Product/price ids for each plan in `plans.ts`
3. Add a link to `/pricing` from somewhere users will see it (it's not linked from the public nav by default).
4. Decide whether your free tier needs `credits` — the default seed gives every new user 3 credits. The demo-ai-app that consumed credits was removed in this fork; if you re-add a credits-gated feature, decrement `User.credits` in the action that uses it.
5. Configure your webhook endpoint at `https://<your-domain>/payments-webhook` in the provider's dashboard.
6. Drop the providers you don't use. Remove their folder (`stripe/`, `lemonSqueezy/`, `polar/`), their env-schema import from `src/env.ts`, and their `.merge()` call. Keeps the build lean.

## Why we don't ship it enabled

- This repo's stated direction (see [`../../AGENTS.md`](../AGENTS.md)) is open source, no commercial roadmap, no hosted service.
- Three payment providers side-by-side, all reading env vars, are a maintenance burden if no one uses them.
- A half-wired checkout flow is a worse first impression than no checkout flow.

So the routes exist but `/pricing` shows an opt-in banner until you set the env vars, and the navigation doesn't surface it.

## Related

- Account page (`src/user/AccountPage.tsx`) — the OSS build shows profile + preferences only. Add a "Billing" tab here if you enable payments. The original template tab is git-blame-able if you want a starting point.
- `dbSeeds.ts` still seeds `credits`, `subscriptionStatus`, `paymentProcessorUserId`, `datePaid` on mock users so the admin Users table looks realistic in development. Trim it if you removed those columns.
- Admin Users table (`src/admin/dashboards/users/UsersTable.tsx`) still filters/displays subscription status. Useful when payments are on, harmless when they're off (all rows just show empty).
