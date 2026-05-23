# RMRoads AI OpenSaaS App

Built with [Wasp](https://wasp.sh), based on the [Open Saas](https://opensaas.sh) template.

## RMRoads AI Migration

The RMRoads AI product workspace starts at `/rmroads` after login. The first
migration slice ports the static MVP domain logic into `src/rmroads/domain` and
adds initial Prisma models for organization-scoped shipment imports,
disruption events, exceptions, decisions, and critical alerts.

The `/rmroads` route can now seed demo data and import shipment CSV files
through authenticated Wasp operations backed by Postgres.

## Development

### Running locally

- Make sure you have the `.env.client` and `.env.server` files with correct dev values in the root of the project.
- Run the database with `wasp start db` and leave it running.
- Run `wasp start` and leave it running.
- [OPTIONAL]: If this is the first time starting the app, or you've just made changes to your entities/prisma schema, also run `wasp db migrate-dev`.
