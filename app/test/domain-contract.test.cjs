const assert = require("node:assert/strict");
const { validateWorkspaceSnapshot, workspaceSchemaVersion } = require("../src/domain-contract.js");

const validSnapshot = {
  schemaVersion: workspaceSchemaVersion,
  exportedAt: "2026-05-23T10:00:00.000Z",
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
  exceptionAssignments: {
    "EX-RM-1": "Maya Chen",
  },
};

assert.deepEqual(validateWorkspaceSnapshot(validSnapshot), []);

const invalidSnapshot = {
  ...validSnapshot,
  shipments: [{ id: "RM-1", value: "128000" }],
};
const errors = validateWorkspaceSnapshot(invalidSnapshot);
assert.equal(errors.some((error) => error.includes("customer is required")), true);
assert.equal(errors.some((error) => error.includes("value must be a number")), true);

assert.deepEqual(validateWorkspaceSnapshot(null), ["Workspace import must be a JSON object."]);

console.log("domain-contract tests passed");
