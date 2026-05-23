const assert = require("node:assert/strict");
const {
  buildDecisionCsv,
  buildWorkspaceSnapshot,
  escapeCsvCell,
  parseWorkspaceSnapshot,
  toCsv,
  workspaceSchemaVersion,
} = require("../src/export-utils.js");

assert.equal(escapeCsvCell("plain"), "plain");
assert.equal(escapeCsvCell("Acme, Inc."), '"Acme, Inc."');
assert.equal(escapeCsvCell('North "A"'), '"North ""A"""');

const csv = toCsv(
  [
    {
      id: "RM-1",
      customer: "Acme, Inc.",
    },
  ],
  [
    { key: "id", label: "id" },
    { key: "customer", label: "customer" },
  ],
);
assert.equal(csv, 'id,customer\nRM-1,"Acme, Inc."');

const decisionCsv = buildDecisionCsv([
  {
    exceptionId: "EX-RM-1",
    shipmentId: "RM-1",
    customer: "Northstar Retail",
    lane: "Shenzhen CN → Los Angeles CA",
    status: "approved",
    scenarioAction: "expedite",
    owner: "Maya Chen",
    decidedBy: "Maya Chen",
    riskLevel: "critical",
    riskScore: 82,
    estimatedProtectedValue: 8000,
    note: "Protect top customer.",
    decidedAt: "2026-05-23T10:00:00.000Z",
  },
]);
assert.match(decisionCsv, /exception_id,shipment_id,customer/);
assert.match(decisionCsv, /Maya Chen/);
assert.match(decisionCsv, /8000/);

const snapshot = buildWorkspaceSnapshot({
  shipments: [
    {
      id: "RM-1",
      customer: "Northstar Retail",
      origin: "Shenzhen CN",
      destination: "Los Angeles CA",
      mode: "Ocean",
      carrier: "Maersk",
      plannedShipDate: "2026-05-10",
      eta: "2026-06-03",
      priority: "critical",
      value: 128000,
      skuGroup: "Electronics",
      destinationLocation: "LA DC",
    },
  ],
  importErrors: [],
  disruptionEvents: [
    {
      id: "EVT-001",
      type: "Port congestion",
      severity: "high",
      affectedText: "Los Angeles CA",
      mode: "Ocean",
      carrier: "",
      confidence: 82,
      source: "Manual pilot signal",
      status: "active",
    },
  ],
  exceptionDecisions: {
    "EX-RM-1": {
      status: "approved",
      scenarioAction: "expedite",
      note: "Protect top customer.",
      decidedAt: "2026-05-23T10:00:00.000Z",
    },
  },
  exceptionAssignments: { "EX-RM-1": "Maya Chen" },
  importHistory: [],
  alertLog: [],
});
assert.equal(snapshot.schemaVersion, workspaceSchemaVersion);
assert.equal(snapshot.shipments.length, 1);

const parsed = parseWorkspaceSnapshot(JSON.stringify(snapshot));
assert.deepEqual(parsed.shipments, snapshot.shipments);
assert.deepEqual(parsed.exceptionAssignments, snapshot.exceptionAssignments);
assert.deepEqual(parsed.importHistory, []);
assert.deepEqual(parsed.alertLog, []);

assert.throws(() => parseWorkspaceSnapshot("{}"), /Unsupported workspace schema version/);

console.log("export-utils tests passed");
