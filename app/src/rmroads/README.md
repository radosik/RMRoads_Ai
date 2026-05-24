# RMRoads AI OpenSaaS App Notes

This folder contains the active RMRoads AI OpenSaaS implementation.

## What Is Included

- `RMRoadsDashboardPage.tsx`: authenticated `/rmroads` disruption response workspace.
- `RMRoadsPilotPage.tsx`: public pilot lead capture page.
- `leadOperations.ts`: pilot lead submission, admin listing, and status updates.
- `operations.ts`: workspace queries and actions for imports, events, exceptions, decisions, alerts, and metrics.
- `domain/`: typed TypeScript port of the reusable MVP logic:
  - CSV parsing and shipment validation
  - risk scoring
  - exception queue generation
  - recommendation scenario generation
  - sample shipment data
- `schema.prisma`: persistence model for organizations, imports,
  shipments, disruption events, exceptions, decisions, and critical alerts.

## Current MVP Surface

- Authenticated organization workspace.
- Shipment CSV template download, upload, validation, and import history.
- Manual disruption event create, edit, activate, and archive flow.
- Deterministic risk scoring with shipment detail explanations.
- Persisted exception queue with owner assignment.
- Recommendation scenario comparison with approve, defer, and reject decisions.
- Decision history and pilot value metrics.
- Critical alert settings and alert log.
- Public pilot request form and internal admin lead review.

## Next Implementation Step

The next highest-value step is improving tenant/workspace readiness:

1. Add a workspace settings page for organization name, alert recipients, and pilot configuration.
2. Add basic team invitation or manual member assignment.
3. Add admin tenant health reporting across pilot workspaces.
