# Security policy

## Supported versions

RMRoads AI is a self-hosted, open-source codebase. The supported version is whatever's on `main`. There are no LTS branches.

## Reporting a vulnerability

**Please don't open public issues for security problems.** Use one of:

1. **GitHub private security advisory** (preferred) — go to the repo's **Security** tab → "Report a vulnerability." This creates a private channel between you and the maintainers.
2. **Email** — open an issue asking the maintainer how to reach them privately if the security advisory flow isn't available.

Include:
- A description of the issue.
- Reproduction steps or a proof-of-concept.
- The version (commit SHA) you tested against.
- Your assessment of impact (data exposure, privilege escalation, denial-of-service, etc.).

## What to expect

This is a small OSS project, not an enterprise vendor. Expect:

- An acknowledgement within a few days.
- A patch timeline that depends on severity (days to weeks).
- A coordinated disclosure once the fix is in `main`. Credit in the release notes if you'd like.

## Out of scope

- Findings against forks that have modified the code (report to the fork maintainer).
- Issues in upstream dependencies — report to **Wasp** ([wasp-lang/wasp](https://github.com/wasp-lang/wasp)) or **OpenSaaS** ([wasp-lang/open-saas](https://github.com/wasp-lang/open-saas)) directly.
- Misconfiguration in self-hosted installs (e.g. exposing `.env.server`, leaving `ADMIN_EMAILS` as `me@example.com`). Those are operational concerns documented in the README.

## Multi-tenant note

RMRoads is multi-tenant by design. Every Prisma write on RMRoads entities is org-scoped (see [`app/AGENTS.md`](app/AGENTS.md) "Hard rules" #1). **Cross-tenant data exposure is the highest-severity class of bug for this project.** If you find one, please report it through the private channel above.
