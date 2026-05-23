# RMRoads AI App Prototype

This is the first development step from the roadmap: **CSV import to shipment dashboard**.

## What Works

- Static browser app with no build step.
- CSV upload from local file.
- Required header validation.
- Row-level validation for missing required values and non-numeric shipment value.
- Duplicate shipment IDs in the same import are rejected and shown as import errors.
- Import history shows accepted rows, rejected rows, and duplicate counts.
- Valid shipments render in a dashboard table.
- Shipment detail view shows lane, impact, risk reasons, and matched disruption events.
- Summary metrics update after import.
- Priority and mode filters.
- Built-in sample data via the "Load Sample Data" button.
- Manual disruption event creation and archiving.
- Manual disruption event editing.
- Deterministic shipment risk scoring.
- Generated exception queue for medium, high, and critical shipment risk.
- Exception queue filters by owner, decision status, and risk level.
- Recommendation review panel with response scenarios.
- Human decision workflow: approve, defer, or reject with a note.
- Decision notes are required for deferred and rejected recommendations.
- Exception owner assignment for planner accountability.
- Critical alert log previews the email alert behavior planned for OpenSaaS.
- Browser localStorage persistence for shipments, disruption events, and decisions.
- Workspace reset button for manual testing.
- Pilot value dashboard with reviewed/approved/deferred/rejected counts.
- Decision log with estimated protected value.
- Workspace JSON export/import for prototype handoff and migration prep.
- Decision log CSV export for pilot reporting.

## Required CSV Columns

```csv
shipment_id,customer,origin,destination,mode,carrier,planned_ship_date,eta,priority,value,sku_group,destination_location
```

## Run

Open `app/index.html` in a browser.

No package install is required for this prototype.

For local HTTP testing:

```sh
python3 -m http.server 4173 --directory app
```

Then open `http://localhost:4173`.

## Test

```sh
node --check app/src/app.js
node --check app/src/csv-utils.js
node --check app/src/risk-utils.js
node --check app/src/recommendation-utils.js
node --check app/src/storage-utils.js
node --check app/src/metrics-utils.js
node --check app/src/domain-contract.js
node --check app/src/export-utils.js
node app/test/csv-utils.test.cjs
node app/test/risk-utils.test.cjs
node app/test/recommendation-utils.test.cjs
node app/test/storage-utils.test.cjs
node app/test/metrics-utils.test.cjs
node app/test/domain-contract.test.cjs
node app/test/export-utils.test.cjs
```

## Next Development Step

Move this static workflow into the OpenSaaS app foundation, then add:

1. Organization workspace and authenticated users.
2. Server-side CSV import persistence to replace browser localStorage.
3. Shipment database model.
4. Persistent disruption event model.
5. Team workspace, authenticated ownership, and server-persisted approval workflow.
