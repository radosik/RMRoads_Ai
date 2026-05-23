const assert = require("node:assert/strict");
const { scoreShipments, buildExceptionQueue, matchShipmentToEvent } = require("../src/risk-utils.js");

const shipments = [
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
  {
    id: "RM-2",
    customer: "Evergreen Home",
    origin: "Savannah GA",
    destination: "Dallas TX",
    mode: "Truck",
    carrier: "JB Hunt",
    plannedShipDate: "2026-05-20",
    eta: "2026-05-25",
    priority: "standard",
    value: 18500,
    skuGroup: "Furniture",
    destinationLocation: "Dallas DC",
  },
];

const events = [
  {
    id: "EVT-001",
    type: "Port congestion",
    severity: "critical",
    affectedText: "Los Angeles CA",
    mode: "Ocean",
    carrier: "",
    confidence: 82,
    source: "Manual pilot signal",
    status: "active",
  },
];

const match = matchShipmentToEvent(shipments[0], events[0]);
assert.equal(match.score > 0.8, true);
assert.match(match.reason, /Lane matches/);

const scored = scoreShipments(shipments, events);
assert.equal(scored.length, 2);
assert.equal(scored[0].riskLevel, "critical");
assert.equal(scored[0].matchedEvents.length, 1);
assert.equal(scored[1].riskLevel, "low");

const exceptions = buildExceptionQueue(scored);
assert.equal(exceptions.length, 1);
assert.equal(exceptions[0].shipmentId, "RM-1");
assert.equal(exceptions[0].status, "new");

const archived = scoreShipments(shipments, [{ ...events[0], status: "archived" }]);
assert.equal(archived[0].matchedEvents.length, 0);

console.log("risk-utils tests passed");
