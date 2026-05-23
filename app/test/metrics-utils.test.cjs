const assert = require("node:assert/strict");
const {
  calculatePilotMetrics,
  buildDecisionLog,
  estimateProtectedValue,
} = require("../src/metrics-utils.js");

const shipments = [
  {
    id: "RM-1",
    customer: "Northstar Retail",
    origin: "Shenzhen CN",
    destination: "Los Angeles CA",
    value: 100000,
  },
  {
    id: "RM-2",
    customer: "Helio Parts",
    origin: "Hamburg DE",
    destination: "Chicago IL",
    value: 50000,
  },
];

const exceptionQueue = [
  {
    id: "EX-RM-1",
    shipmentId: "RM-1",
    customer: "Northstar Retail",
    lane: "Shenzhen CN → Los Angeles CA",
    riskScore: 82,
    riskLevel: "critical",
    value: 100000,
  },
  {
    id: "EX-RM-2",
    shipmentId: "RM-2",
    customer: "Helio Parts",
    lane: "Hamburg DE → Chicago IL",
    riskScore: 58,
    riskLevel: "high",
    value: 50000,
  },
];

const exceptionDecisions = {
  "EX-RM-1": {
    status: "approved",
    scenarioAction: "expedite",
    note: "Protect top customer.",
    decidedAt: "2026-05-23T10:00:00.000Z",
  },
  "EX-RM-2": {
    status: "deferred",
    scenarioAction: "notify",
    note: "Wait for carrier update.",
    decidedAt: "2026-05-23T11:00:00.000Z",
  },
};
const exceptionAssignments = {
  "EX-RM-1": "Maya Chen",
};

assert.equal(estimateProtectedValue(100000, "expedite", "approved"), 8000);
assert.equal(estimateProtectedValue(100000, "expedite", "rejected"), 0);

const decisions = buildDecisionLog({ shipments, exceptionQueue, exceptionDecisions, exceptionAssignments });
assert.equal(decisions.length, 2);
assert.equal(decisions[0].exceptionId, "EX-RM-2");
assert.equal(decisions[1].estimatedProtectedValue, 8000);
assert.equal(decisions[1].owner, "Maya Chen");

const metrics = calculatePilotMetrics({ shipments, exceptionQueue, exceptionDecisions, exceptionAssignments });
assert.equal(metrics.reviewedCount, 2);
assert.equal(metrics.approvedCount, 1);
assert.equal(metrics.deferredCount, 1);
assert.equal(metrics.rejectedCount, 0);
assert.equal(metrics.estimatedProtectedValue, 8000);
assert.equal(metrics.averageRiskScore, 70);

console.log("metrics-utils tests passed");
