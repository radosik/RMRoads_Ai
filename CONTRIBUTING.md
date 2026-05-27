# Contributing to RMRoads AI

Thanks for your interest! This project is open source under MIT, self-hosted, with no commercial roadmap. The bar for contribution is "does it make the workbench better for a planner running it themselves." That's the only filter.

## Quick orientation

- **Product surface:** [`app/src/rmroads/`](app/src/rmroads/) — dashboard, settings, invitations, pilot form, operations.
- **Architecture:** Wasp DSL ([`app/main.wasp`](app/main.wasp)) generates the React + Node + Prisma app. Database in PostgreSQL via Prisma. i18next for client-side i18n in en/de/fr/es.
- **AI agent guide:** [`app/AGENTS.md`](app/AGENTS.md) — read this first. It covers the hard rules (tenant scoping, `entities: [...]` lists, locales-as-TS, no Claude attribution, commit style). Applies to any AI coding agent (Claude Code, Cursor, Cline, Aider, Continue) or human driving one.

## Local setup

See the [README Quick start](README.md#quick-start). TL;DR:

```sh
cd app
cp .env.server.example .env.server
wasp start db
wasp db migrate-dev
wasp start
```

Mailpit on `localhost:1025` covers email in dev.

## Hard rules (the ones that actually matter)

1. **Every Prisma write on RMRoads entities must be org-scoped.** Resolve the user's active organization via `OrganizationMember`, pass `organizationId` in every `where` / `data`. Never trust client-supplied org ids. The codebase is multi-tenant by design and this is the load-bearing invariant.
2. **List every entity an action touches in `entities: [...]` in `main.wasp`.** Including ones touched by transitive helpers. Skip this and you get `Cannot read properties of undefined` at runtime.
3. **Locales are TypeScript modules (`.ts`), not JSON.** Wasp's SDK build doesn't enable `resolveJsonModule`. Add new keys to all four files in `app/src/i18n/locales/`.
4. **No `Co-Authored-By: Claude` (or any AI attribution) in commits or PRs.** Contributions land as the contributor's own work.

## Commit + PR style

- **Conventional Commits** prefix where it fits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- **Subject ≤ 50 chars**, imperative mood, lowercase after the colon.
- **One concern per commit.** Don't bundle "feature X" with "i18n sweep" — they review differently.
- **Body explains *why***, not *what*. The diff covers the what.
- **Banned vocab:** "comprehensive, robust, elegant, significantly improve". They're filler.

For a PR:
- Open against `main`. We don't have a develop branch.
- Title follows the same Conventional Commits rule as commits.
- Description has a short summary + a test plan (manual checks you ran).
- For UI changes, include before/after screenshots.

## What "done" looks like

Before opening the PR, verify:

- [ ] `npm exec tsc -- --noEmit` passes in `app/`.
- [ ] `wasp start` runs without runtime errors.
- [ ] New strings exist in **all four** locale files (`en.ts`, `de.ts`, `fr.ts`, `es.ts`). Keep translations concise — buttons and table cells don't auto-resize.
- [ ] DB changes have a Prisma migration in `app/migrations/` and the action's `entities: [...]` is updated.
- [ ] Multi-tenant scoping is preserved on every new query/action (see Hard rules #1).
- [ ] Commit messages follow the style above.

## Issue triage

- Bugs need reproduction steps. "It doesn't work" is not actionable.
- Feature requests need a use case. "I want X" is less useful than "as a planner doing Y, I'd benefit from X because Z."
- Security issues: see [`SECURITY.md`](SECURITY.md) — please don't open public issues for them.

## Out of scope (please don't propose)

These keep getting suggested and don't belong on this project:

- **Native mobile clients** — the workbench is desktop-only by design.
- **Multi-tenant SaaS admin** (managing other operators' RMRoads installs) — meta-product.
- **SOC 2 / enterprise audit log** — separate compliance slice, not in OSS scope.
- **A fourth payment provider** — the three OpenSaaS providers cover the realistic options. Payments are opt-in anyway; see [`app/src/payment/README.md`](app/src/payment/README.md).

## Questions

Open a Discussion (preferred) or a low-priority issue. The repo's [`docs/`](docs/) directory is gitignored and contains the maintainer's local planning notes — don't expect those to be a reference.
