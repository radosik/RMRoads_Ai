# Contributor guide for AI agents

This file follows the [agents.md](https://agents.md) convention. Read it before making changes to RMRoads AI — whether you're an AI coding agent (Claude Code, Cursor, Cline, Aider, Continue…) or a human using one.

[`CLAUDE.md`](./CLAUDE.md) in this directory is a thin pointer at this file.

## Project shape

RMRoads AI is an open-source, self-hosted **disruption response workbench** for supply-chain teams. Planners import shipments, signal active disruptions, and approve recovery scenarios. Decisions are audited; no autonomous execution.

- **Framework:** [Wasp](https://wasp.sh) (TS DSL that generates React + Node + Prisma)
- **Template base:** [OpenSaaS](https://opensaas.sh) — MIT-licensed
- **Data:** PostgreSQL via Prisma
- **i18n:** en / de / fr / es (i18next, TS-module locale files)
- **License:** MIT — see [`/LICENSE`](../LICENSE)

User-facing setup lives in [`/README.md`](../README.md). This file is for agents who need to *modify* the codebase.

## Where things live

| Path | Purpose |
|---|---|
| `main.wasp` | **Source of truth** for routes, pages, auth, email, jobs, queries, actions. Edit this when you add anything user-routable or DB-touching. |
| `schema.prisma` | Data model. Always followed by `wasp db migrate-dev` to generate a migration. |
| `migrations/` | Prisma migrations managed by Wasp. Don't hand-edit committed migrations. |
| `src/rmroads/` | Product domain — dashboard, settings, invitations, pilot, operations, recommendation logic, weekly summary job, email layout helper. |
| `src/rmroads/domain/` | Pure-TS helpers (CSV, pilot summary, recommendations, types, email layout). No Wasp/Prisma imports here. |
| `src/admin/` | Admin dashboards (`/admin`, `/admin/users`, etc.). Sidebar trimmed to RMRoads-relevant items only. |
| `src/auth/` | Login/signup/password-reset pages. Wraps Wasp's built-in `LoginForm` / `SignupForm`. |
| `src/legal/` | `/privacy`, `/terms`, `/cookies` stub pages. |
| `src/user/AccountPage.tsx` | Per-user preferences: language, theme, password reset, account delete (UI present, backend action not yet wired). |
| `src/payment/` | OpenSaaS payment scaffolding (Stripe + Lemon Squeezy + Polar). **Unused by default**; payments are opt-in for forks who want to commercialize. |
| `src/i18n/` | i18next setup + locales. Locales are **`.ts` modules** (`export default { ... }`), NOT `.json` — Wasp SDK build doesn't enable `resolveJsonModule`. |
| `src/client/` | Shared layout, navbar, theming, UI primitives (shadcn/Radix). |
| `e2e-tests/` | Playwright suite + the screenshot-capture utility used for the README hero. Separate npm project. |
| `screenshots/` | README assets. |
| `.wasp/out/` | **Generated** code. Never edit — regenerated on every `wasp start`. |

## Hard rules

Things that will break the app or the project if you ignore them:

1. **Tenant scoping is mandatory.** Every Prisma write on RMRoads entities (Shipment, ShipmentException, DisruptionEvent, ExceptionDecision, CriticalAlert, WorkspaceInvitation, OrganizationMember) MUST be scoped to the caller's `organizationId`. Pattern: resolve the user's active organization via `OrganizationMember`, then pass `organizationId` in every `where`/`data`. Never trust client-supplied org ids.

2. **List every entity an action might touch in `entities: [...]`** in `main.wasp` — including ones touched by transitive helpers. Wasp injects `context.entities.<Model>`; if you forget to list it, you get a runtime `Cannot read properties of undefined (reading 'findFirst')`. Audit the full call tree of helpers.

3. **Locales are TypeScript, not JSON.** Add new keys to all four files in `src/i18n/locales/` (`en.ts`, `de.ts`, `fr.ts`, `es.ts`). Keep DE/FR/ES translations concise — buttons, table cells, and the landing stat-card don't auto-resize.

4. **No `Co-Authored-By: Claude` in commits or PRs.** Drop it. Same for any "Generated with X" footers. The work should appear as the contributor's own.

5. **Commit style:** Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Subject ≤ 50 chars, imperative mood, one concern per commit. Body explains *why*, not *what* — the diff covers the what. Banned vocab in messages: "comprehensive, robust, elegant, significantly improve".

6. **Don't edit `.wasp/out/`.** It's regenerated on every dev-server start. If you're tempted to touch generated code, you're solving the wrong problem.

7. **Don't introduce mocks for DB tests.** Use a real Postgres instance (Wasp's `wasp start db` brings one up in Docker).

8. **LLM recommendations default off.** `RMROADS_LLM_RECOMMENDATIONS_MODE=off` is the default; `dummy` exercises the code path with zero tokens; `openai` is scaffolded but not yet wired. Don't accidentally flip it to `openai` without explicit user request — it would cost tokens on every exception decision.

## Common gotchas

These have all bitten the project at least once. Save yourself the round trip.

- **React `event.currentTarget.value` is nullified after the synthetic event returns.** Capture it synchronously before passing to `useState` updater: `const value = event.currentTarget.value; setForm((current) => ({ ...current, field: value }));`
- **`useColorMode` defaults to `"dark"`** in this fork (OpenSaaS default is `"light"`). The body class is toggled via `useEffect`.
- **`useRedirectIfLoggedIn` redirects to `/rmroads`** (OpenSaaS default was `/demo-app` — removed). If you re-add an auth-success redirect, update `main.wasp` `onAuthSucceededRedirectTo` too.
- **`useLocalStorage` JSON-encodes values.** Setting `localStorage.setItem("color-theme", "dark")` from a test silently falls through — the hook reads `JSON.parse(item)` and bare `"dark"` is invalid JSON. Use `JSON.stringify("dark")` or call the hook's setter.
- **`i18next-browser-languagedetector` stores the language as a raw string**, not JSON. Don't confuse with `useLocalStorage`.
- **`vanilla-cookieconsent` overlay intercepts clicks** until dismissed. Playwright probes need an explicit dismiss step before they can click any underlying element.
- **`wasp start` restarts on `package.json` change**, so `npm install` of new deps stops the dev server.
- **`.env.server` changes restart the server silently** — tail the wasp output before treating a new env var as confirmed.
- **Wasp operation URL conversion keeps acronyms together:** `decideRMRoadsException` → `/operations/decide-rmroads-exception` (not `/decide-r-m-roads-exception`). Auth header is `Bearer ${sessionId}` from `localStorage["wasp:sessionId"]` (note: stored as a JSON-stringified string).
- **Playwright + Vite + React preamble:** Playwright's Chromium throws "@vitejs/plugin-react can't detect preamble" against a dev server. The screenshot utility at `e2e-tests/tests/take-landing-screenshot.spec.ts` pre-seeds the refresh globals in `addInitScript` before navigation — copy that pattern if you write similar probes.

## Workflow

1. **Read [`/README.md`](../README.md)** for project intent and how to run locally.
2. **Check `main.wasp`** to understand the surface area before adding a new operation or route.
3. **Run the app**: `wasp start db` in one terminal, then `wasp start` in another. Open `http://localhost:3000`.
4. **Translate new strings in all four locales** before opening a PR. Don't add `t("foo.bar")` and only fill `en.ts`.
5. **Add `entities: [...]` to every action that touches Prisma**, including via helpers.
6. **Migrations:** after editing `schema.prisma`, run `wasp db migrate-dev` and commit the generated migration alongside the schema change.
7. **Commit in logical slices.** Don't bundle "i18n sweep" with "new feature" — they review differently.

## Source-of-truth docs to cross-check against

When in doubt, fetch and read these *before* asking the user. They're cheap and authoritative.

- **OpenSaaS docs map:** https://docs.opensaas.sh/llms.txt → fetch the raw GitHub URLs it points at
- **Wasp docs map:** https://wasp.sh/llms.txt (and version-pinned variants like `llms-0.23.txt`)
- **agents.md spec:** https://agents.md

Prefer the raw `raw.githubusercontent.com` URLs from the llms.txt indexes over the HTML doc site.

## What "done" looks like for a contribution

- Code compiles (`npm exec tsc -- --noEmit` in `app/`).
- Wasp dev server starts (`wasp start`) without runtime errors.
- New strings exist in all four locale files.
- New DB touches have a Prisma migration + the action's `entities: [...]` updated.
- Tenant scoping verified by inspection (or by an `e2e-tests/` cross-tenant probe if you're feeling thorough).
- Commit message is conventional-commits, imperative, ≤ 50 char subject, no Claude attribution.
- README is updated if user-facing behaviour changed.

## Out of scope (please don't add)

- Multi-workspace switching UI for one user (decision deferred; current policy is one active workspace per session).
- Native mobile clients (the workbench is desktop-only by design — see `MobileToolUnavailable` in `src/client/App.tsx`).
- New payment providers (the three OpenSaaS providers cover most cases; adding a fourth is template scope creep).
- Server-side i18n for emails (planned, but needs a `user.preferredLanguage` column first — open an issue if you want to take this on).
