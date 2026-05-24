import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(testDir, "..");
const outDir = join(appRoot, "node_modules", ".cache", "rmroads-domain-tests");
const outFile = join(outDir, "domain-test-entry.mjs");

mkdirSync(outDir, { recursive: true });
execFileSync(
  join(appRoot, "node_modules", ".bin", "esbuild"),
  [
    "test/domain-test-entry.ts",
    "--bundle",
    "--platform=node",
    "--format=esm",
    `--outfile=${outFile}`,
  ],
  { cwd: appRoot, stdio: "pipe" },
);

const domain = await import(pathToFileURL(outFile).href);

test("alert recipient parsing normalizes, deduplicates, and drops invalid values", () => {
  assert.deepEqual(
    domain.parseAlertRecipients("Ops@Example.com, bad-value; logistics@example.com\nops@example.com"),
    ["ops@example.com", "logistics@example.com"],
  );
});

test("critical email alerts require at least one valid recipient", () => {
  assert.equal(domain.canEnableCriticalAlerts(false, []), true);
  assert.equal(domain.canEnableCriticalAlerts(true, []), false);
  assert.equal(domain.canEnableCriticalAlerts(true, ["ops@example.com"]), true);
});

test("invitation emails are normalized and validated", () => {
  assert.equal(domain.normalizeInviteEmail(" Planner@Example.COM "), "planner@example.com");
  assert.equal(domain.isValidInviteEmail("planner@example.com"), true);
  assert.equal(domain.isValidInviteEmail("not-an-email"), false);
});

test("CSV parser supports quoted comma fields and normalized headers", () => {
  const csv = [
    domain.requiredShipmentCsvFields.join(","),
    'S-1,"Acme, Inc.",Veracruz MX,Atlanta GA,Ocean,Maersk,2026-05-20,2026-05-25,critical,125000,Electronics,Atlanta DC',
  ].join("\n");
  const parsed = domain.parseCsv(csv);
  const validation = domain.validateShipmentRows(parsed.headers, parsed.rows);

  assert.equal(validation.errors.length, 0);
  assert.equal(validation.validRows[0].customer, "Acme, Inc.");
  assert.equal(validation.validRows[0].priority, "critical");
});

test("CSV validation rejects missing required headers", () => {
  const parsed = domain.parseCsv("shipment_id,customer\nS-1,Acme");
  const validation = domain.validateShipmentRows(parsed.headers, parsed.rows);

  assert.equal(validation.validRows.length, 0);
  assert.equal(validation.errors[0].rowNumber, "Header");
  assert.match(validation.errors[0].message, /Missing required columns/);
});

test("scenario action selection keeps critical high-value shipments on expedite", () => {
  const exception = {
    riskLevel: "critical",
    riskScore: 95,
    shipmentId: "S-1",
    reason: "Port congestion",
  };
  const shipment = {
    value: 125000,
    priority: "critical",
  };

  assert.equal(domain.choosePrimaryAction(exception, shipment), "expedite");
});
