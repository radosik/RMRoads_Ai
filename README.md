# RMRoads AI

RMRoads AI is an MVP prototype for autonomous supply chain disruption response. The current version focuses on validating the core workflow before moving into a full OpenSaaS implementation.

## Current Prototype

The app is a static browser prototype that runs without a build step. It supports:

- Shipment CSV import and validation
- Row-level import error reporting
- Manual disruption event creation and archiving
- Deterministic shipment risk scoring
- Exception queue generation
- Exception owner assignment
- Recommendation review with response scenarios
- Human decision workflow: approve, defer, or reject
- Pilot value dashboard and decision log
- Local browser persistence
- Workspace JSON export/import
- Decision log CSV export

## Run Locally

Open `app/index.html` directly in a browser.

For local HTTP testing:

```sh
python3 -m http.server 4173 --directory app
```

Then open:

```text
http://localhost:4173
```

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

## Next Step

The next major step is moving the validated workflow into OpenSaaS with authentication, organization workspaces, Prisma persistence, server-side CSV import, and database-backed exception/decision workflows.
