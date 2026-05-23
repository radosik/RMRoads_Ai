# RMRoads AI OpenSaaS Migration Slice

This folder is the first OpenSaaS implementation slice for the static MVP in
`/app`.

## What Is Included

- `RMRoadsDashboardPage.tsx`: authenticated `/rmroads` workspace preview.
- `domain/`: typed TypeScript port of the reusable MVP logic:
  - CSV parsing and shipment validation
  - risk scoring
  - exception queue generation
  - recommendation scenario generation
  - sample shipment data
- `schema.prisma`: initial persistence model for organizations, imports,
  shipments, disruption events, exceptions, decisions, and critical alerts.

## Next Migration Step

Continue replacing the prototype UI with Wasp actions and queries:

1. Add disruption event create/edit/archive actions.
2. Generate and store `ShipmentException` records instead of deriving them only in the query.
3. Store planner recommendation decisions in `ExceptionDecision`.
4. Trigger real email delivery for `CriticalAlert`.
5. Replace the preview tables with the full static MVP workflow.
