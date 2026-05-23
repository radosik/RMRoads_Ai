# RMRoads AI OpenSaaS

This repository root is the active RMRoads AI OpenSaaS project.

The app is based on OpenSaaS and Wasp. The current MVP focuses on a planner
workflow for supply chain disruption response:

- authenticated organization workspace
- shipment CSV import and validation
- manual disruption event management
- deterministic risk scoring
- exception queue
- recommendation review and scenario comparison
- approve, defer, and reject decisions with audit history
- critical alert settings and alert log
- basic pilot value metrics

## Project Layout

- `app/` - Wasp web app and server code
- `app/src/rmroads/` - RMRoads AI domain logic, operations, and dashboard UI
- `app/schema.prisma` - OpenSaaS plus RMRoads persistence models
- `app/migrations/` - Prisma migrations managed through Wasp
- `blog/` - OpenSaaS blog/docs site
- `e2e-tests/` - Playwright end-to-end test workspace
- `docs/` - local planning docs and manual CSV test files, ignored by git

## Run Locally

From this directory:

```sh
cd app
wasp start db
wasp start
```

Open:

```text
http://localhost:3000/rmroads
```

## Useful Commands

```sh
cd app
npm exec tsc -- --noEmit
wasp db migrate-dev
```

For direct Prisma validation against the default Wasp dev database:

```sh
DATABASE_URL=postgresql://postgresWaspDevUser:postgresWaspDevPass@localhost:5432/OpenSaaS-5799490bc2 npm exec prisma -- validate --schema schema.prisma
```

## Current Development Notes

Use `app/src/rmroads/README.md` for implementation notes around the migration
slice. Planning material can stay in `docs/`, but it is intentionally excluded
from git so the repository remains focused on the product code.
