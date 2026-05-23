const assert = require("node:assert/strict");
const { generateRecommendation, choosePrimaryAction } = require("../src/recommendation-utils.js");

const shipment = {
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
};

const criticalException = {
  id: "EX-RM-1",
  shipmentId: "RM-1",
  customer: "Northstar Retail",
  lane: "Shenzhen CN → Los Angeles CA",
  eta: "2026-06-03",
  priority: "critical",
  value: 128000,
  riskScore: 82,
  riskLevel: "critical",
  reason: "Port congestion: Lane matches Los Angeles CA",
  status: "new",
};

assert.equal(choosePrimaryAction(criticalException, shipment), "expedite");

const recommendation = generateRecommendation(criticalException, shipment);
assert.equal(recommendation.primaryAction, "expedite");
assert.equal(recommendation.confidence, "High");
assert.equal(recommendation.scenarios.length, 5);
assert.equal(recommendation.scenarios[0].action, "expedite");
assert.equal(recommendation.scenarios[0].recommended, true);
assert.match(recommendation.summary, /Expedite is recommended/);
assert.equal(recommendation.assumptions.length, 3);

const highException = { ...criticalException, riskLevel: "high", riskScore: 61 };
assert.equal(choosePrimaryAction(highException, { ...shipment, priority: "high", value: 60000 }), "split");
assert.equal(choosePrimaryAction(highException, { ...shipment, priority: "standard", value: 60000 }), "notify");

console.log("recommendation-utils tests passed");
