const assert = require("node:assert/strict");
const { parseCsv, validateRows } = require("../src/csv-utils.js");

const validCsv = `shipment_id,customer,origin,destination,mode,carrier,planned_ship_date,eta,priority,value,sku_group,destination_location
RM-1,"Acme, Inc.",Shenzhen CN,Los Angeles CA,Ocean,Maersk,2026-05-10,2026-06-03,critical,128000,Electronics,LA DC`;

const parsed = parseCsv(validCsv);
assert.deepEqual(parsed.headers, [
  "shipment_id",
  "customer",
  "origin",
  "destination",
  "mode",
  "carrier",
  "planned_ship_date",
  "eta",
  "priority",
  "value",
  "sku_group",
  "destination_location",
]);

const validResult = validateRows(parsed.headers, parsed.rows);
assert.equal(validResult.errors.length, 0);
assert.equal(validResult.validRows.length, 1);
assert.equal(validResult.validRows[0].customer, "Acme, Inc.");
assert.equal(validResult.validRows[0].priority, "critical");
assert.equal(validResult.validRows[0].value, 128000);

const invalidCsv = `shipment_id,customer,origin,destination,mode,carrier,planned_ship_date,eta,priority,value,sku_group,destination_location
RM-2,,Hamburg DE,Chicago IL,Ocean+Rail,Hapag-Lloyd,2026-05-11,2026-06-08,high,not-a-number,Industrial Components,Chicago Hub`;

const invalidParsed = parseCsv(invalidCsv);
const invalidResult = validateRows(invalidParsed.headers, invalidParsed.rows);
assert.equal(invalidResult.validRows.length, 0);
assert.equal(invalidResult.errors.length, 1);
assert.match(invalidResult.errors[0].message, /Missing customer/);
assert.match(invalidResult.errors[0].message, /Value must be numeric/);

const missingHeaderCsv = `shipment_id,customer
RM-3,Northstar Retail`;
const missingHeaderParsed = parseCsv(missingHeaderCsv);
const missingHeaderResult = validateRows(missingHeaderParsed.headers, missingHeaderParsed.rows);
assert.equal(missingHeaderResult.errors.length, 1);
assert.match(missingHeaderResult.errors[0].message, /Missing required columns/);

console.log("csv-utils tests passed");
