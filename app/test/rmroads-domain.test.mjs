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

test("disruption event scoring respects start and expiration dates", () => {
  const now = new Date("2026-05-25T12:00:00.000Z");
  const baseEvent = {
    id: "EVT-1",
    type: "Port congestion",
    severity: "high",
    affectedText: "Long Beach CA",
    mode: "Ocean",
    carrier: "",
    confidence: 80,
    source: "Planner report",
    status: "active",
  };

  assert.equal(domain.isEventActiveForScoring(baseEvent, now), true);
  assert.equal(domain.isEventActiveForScoring({ ...baseEvent, startsAt: "2026-05-26" }, now), false);
  assert.equal(domain.isEventActiveForScoring({ ...baseEvent, expiresAt: "2026-05-24" }, now), false);
  assert.equal(domain.isEventActiveForScoring({ ...baseEvent, status: "archived" }, now), false);
});

test("decision metrics calculate planner response time", () => {
  assert.equal(
    domain.calculateResponseHours("2026-05-25T08:00:00.000Z", "2026-05-25T13:30:00.000Z"),
    6,
  );

  const metrics = domain.calculateDecisionMetrics([
    {
      id: "D-1",
      exceptionId: "EX-1",
      shipmentId: "S-1",
      customer: "Acme",
      lane: "A -> B",
      status: "approved",
      scenarioAction: "expedite",
      owner: "Maya",
      decidedBy: "planner@example.com",
      decidedAt: "2026-05-25T13:30:00.000Z",
      responseHours: 6,
      riskLevel: "critical",
      riskScore: 90,
      estimatedProtectedValue: 10000,
      note: "",
      outcomeStatus: "pending",
      outcomeNote: "",
    },
    {
      id: "D-2",
      exceptionId: "EX-2",
      shipmentId: "S-2",
      customer: "Atlas",
      lane: "C -> D",
      status: "deferred",
      scenarioAction: "notify",
      owner: "Leo",
      decidedBy: "planner@example.com",
      decidedAt: "2026-05-25T15:00:00.000Z",
      responseHours: 2,
      riskLevel: "high",
      riskScore: 70,
      estimatedProtectedValue: 0,
      note: "",
      outcomeStatus: "monitoring",
      outcomeNote: "",
    },
  ]);

  assert.equal(metrics.averageResponseHours, 4);
});

test("workspace role helpers separate admin, planner, and viewer permissions", () => {
  assert.equal(domain.canManageWorkspace("admin"), true);
  assert.equal(domain.canManageWorkspace("planner"), false);
  assert.equal(domain.canManageWorkspace("viewer"), false);
  assert.equal(domain.canMutateWorkspaceData("admin"), true);
  assert.equal(domain.canMutateWorkspaceData("planner"), true);
  assert.equal(domain.canMutateWorkspaceData("viewer"), false);
});

test("invitation acceptance blocks cross-company account attachment", () => {
  assert.equal(
    domain.evaluateInvitationAcceptance({
      existingOrganizationId: null,
      invitationOrganizationId: "company-b",
    }),
    "can_accept",
  );
  assert.equal(
    domain.evaluateInvitationAcceptance({
      existingOrganizationId: "company-b",
      invitationOrganizationId: "company-b",
    }),
    "already_member_of_invited_workspace",
  );
  assert.equal(
    domain.evaluateInvitationAcceptance({
      existingOrganizationId: "company-a",
      invitationOrganizationId: "company-b",
    }),
    "blocked_by_existing_workspace",
  );
});

test("tenant readiness issues expose blockers before pilot data import", () => {
  assert.deepEqual(
    domain.buildTenantReadinessIssues({
      alertEmailsEnabled: true,
      alertRecipientCount: 0,
      decisionCount: 0,
      importCount: 0,
      pendingInvitationCount: 1,
      securityReviewCompleted: false,
      shipmentCount: 0,
    }),
    [
      "Security review pending",
      "No shipment import validated",
      "No planner decision recorded",
      "Alerts enabled without recipients",
      "Pending team invitations",
    ],
  );

  assert.deepEqual(
    domain.buildTenantReadinessIssues({
      alertEmailsEnabled: true,
      alertRecipientCount: 2,
      decisionCount: 3,
      importCount: 1,
      pendingInvitationCount: 0,
      securityReviewCompleted: true,
      shipmentCount: 10,
    }),
    [],
  );
});

test("pilot lead notification recipients normalize and drop invalid emails", () => {
  assert.deepEqual(
    domain.parseNotificationRecipients("Ops@RMRoads.ai, bad; sales@rmroads.ai\nops@rmroads.ai"),
    ["ops@rmroads.ai", "sales@rmroads.ai"],
  );
});

test("pilot lead notification email escapes submitted lead content", () => {
  const email = domain.buildPilotLeadEmail({
    name: "Ava <Planner>",
    workEmail: "ava@example.com",
    company: "Acme & Sons",
    role: "Logistics Lead",
    shipmentVolume: "500/month",
    currentTools: "Sheets",
    disruptionPain: "<script>alert(1)</script>",
    pilotGoal: "Reduce customer escalations",
    adminUrl: "https://app.example.com/admin/pilot-leads",
  });

  assert.match(email.subject, /Acme & Sons/);
  assert.match(email.text, /Ava <Planner>/);
  assert.match(email.html, /Ava &lt;Planner&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
});

test("pilot summary rows include weekly review metrics and top risks", () => {
  const rows = domain.buildPilotSummaryRows(
    {
      organizationName: "Northwind Supply",
      shipmentCount: 12,
      eventCount: 3,
      exceptionCount: 2,
      criticalExceptionCount: 1,
      totalValue: 450000,
      reviewedCount: 4,
      approvedCount: 2,
      deferredCount: 1,
      rejectedCount: 1,
      averageRiskScore: 82,
      estimatedProtectedValue: 18000,
      averageResponseHours: 4,
      shipments: [],
      exceptions: [
        {
          id: "EX-1",
          shipmentId: "S-1",
          customer: "Atlas",
          lane: "Shanghai CN -> Long Beach CA",
          eta: "2026-06-08",
          priority: "critical",
          value: 125000,
          riskScore: 95,
          riskLevel: "critical",
          reason: "Port congestion",
          status: "new",
        },
      ],
      decisions: [
        {
          id: "D-1",
          exceptionId: "EX-1",
          shipmentId: "S-1",
          customer: "Atlas",
          lane: "Shanghai CN -> Long Beach CA",
          status: "approved",
          scenarioAction: "expedite",
          owner: "Maya",
          decidedBy: "planner@example.com",
          decidedAt: "2026-05-24T12:00:00.000Z",
          responseHours: 4,
          riskLevel: "critical",
          riskScore: 95,
          estimatedProtectedValue: 10000,
          note: "Protect priority customer",
          outcomeStatus: "successful",
          outcomeNote: "Arrived before customer escalation",
        },
      ],
      alerts: [
        {
          id: "A-1",
          createdAt: "2026-05-24T12:00:00.000Z",
          sentAt: "",
          deliveryStatus: "Failed",
          exceptionId: "EX-1",
          shipmentId: "S-1",
          customer: "Atlas",
          riskLevel: "critical",
          riskScore: 95,
          message: "Critical shipment risk",
        },
      ],
      importHistory: [
        {
          id: "I-1",
          importedAt: "2026-05-24T12:00:00.000Z",
          sourceName: "pilot.csv",
          acceptedCount: 12,
          rejectedCount: 0,
          duplicateCount: 0,
        },
      ],
    },
    new Date("2026-05-25T08:00:00.000Z"),
  );

  assert.deepEqual(rows[0], ["Section", "Metric", "Value"]);
  assert.ok(rows.some((row) => row[1] === "Organization" && row[2] === "Northwind Supply"));
  assert.ok(rows.some((row) => row[1] === "Average response hours" && row[2] === 4));
  assert.ok(rows.some((row) => row[1] === "Top risk shipments" && String(row[2]).includes("S-1 Atlas 95/100")));
  assert.ok(rows.some((row) => row[1] === "Successful outcomes" && row[2] === 1));
  assert.ok(rows.some((row) => row[1] === "Critical alert failures" && row[2] === 1));
});

test("weekly pilot summary email formats metrics and escapes top risks", () => {
  const email = domain.buildPilotSummaryEmail({
    organizationName: "Northwind <Supply>",
    shipmentCount: 4,
    eventCount: 2,
    exceptionCount: 1,
    criticalExceptionCount: 1,
    totalValue: 200000,
    reviewedCount: 1,
    approvedCount: 1,
    deferredCount: 0,
    rejectedCount: 0,
    averageRiskScore: 91,
    estimatedProtectedValue: 10000,
    averageResponseHours: 5,
    shipments: [],
    exceptions: [
      {
        id: "EX-1",
        shipmentId: "S-1",
        customer: "Acme <Retail>",
        lane: "A -> B",
        eta: "2026-06-01",
        priority: "critical",
        value: 200000,
        riskScore: 91,
        riskLevel: "critical",
        reason: "Port <delay>",
        status: "new",
      },
    ],
    decisions: [],
    alerts: [],
    importHistory: [],
  }, new Date("2026-05-25T09:00:00.000Z"));

  assert.match(email.subject, /Northwind <Supply>/);
  assert.match(email.text, /Shipments monitored: 4/);
  assert.match(email.html, /Northwind &lt;Supply&gt;/);
  assert.match(email.html, /Acme &lt;Retail&gt;/);
  assert.doesNotMatch(email.html, /Port <delay>/);
});

test("weekly summary send guard prevents duplicate sends in the same UTC week", () => {
  assert.equal(domain.shouldSendWeeklySummary(null, new Date("2026-05-25T09:00:00.000Z")), true);
  assert.equal(
    domain.shouldSendWeeklySummary(
      new Date("2026-05-25T08:00:00.000Z"),
      new Date("2026-05-25T09:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    domain.shouldSendWeeklySummary(
      new Date("2026-05-24T09:00:00.000Z"),
      new Date("2026-05-25T09:00:00.000Z"),
    ),
    true,
  );
});

const sampleLlmInput = {
  shipmentExternalId: "S-1",
  customer: "Northstar Retail",
  lane: "Veracruz MX -> Atlanta GA",
  priority: "critical",
  value: 185000,
  riskLevel: "critical",
  riskScore: 95,
  riskReason: "Port congestion",
};

test("LLM recommendation prompt includes shipment context and response schema", () => {
  const prompt = domain.buildLlmRecommendationPrompt(sampleLlmInput);
  assert.match(prompt.system, /decision support/i);
  assert.match(prompt.user, /S-1/);
  assert.match(prompt.user, /Northstar Retail/);
  assert.match(prompt.user, /Port congestion/);
  assert.match(prompt.user, /primaryAction/);
  assert.match(prompt.user, /expedite/);
});

test("dummy LLM recommendation produces a valid, plausible output", () => {
  const output = domain.generateDummyLlmRecommendation(sampleLlmInput);
  assert.equal(domain.isLlmRecommendationOutput(output), true);
  assert.equal(output.primaryAction, "expedite");
  assert.equal(output.confidence, "High");
  assert.ok(output.assumptions.length >= 2);
  assert.ok(output.alternatives.length >= 1);
});

test("dummy LLM recommendation picks safer actions for lower-risk shipments", () => {
  const lowRiskInput = {
    ...sampleLlmInput,
    riskLevel: "high",
    riskScore: 72,
    priority: "standard",
    value: 25000,
  };
  const output = domain.generateDummyLlmRecommendation(lowRiskInput);
  assert.equal(output.primaryAction, "notify");
  assert.equal(output.confidence, "Medium");
});

test("LLM output validator rejects malformed shapes", () => {
  assert.equal(domain.isLlmRecommendationOutput(null), false);
  assert.equal(domain.isLlmRecommendationOutput({ primaryAction: "teleport" }), false);
  assert.equal(
    domain.isLlmRecommendationOutput({
      primaryAction: "reroute",
      confidence: "Maybe",
      summary: "x",
      rationale: "y",
      assumptions: [],
      alternatives: [],
    }),
    false,
  );
});

test("tokenize produces stable, label-prefixed tokens", () => {
  const a = domain.tokenize("Customer", "Northstar Retail");
  const b = domain.tokenize("Customer", "Northstar Retail");
  const c = domain.tokenize("Customer", "northstar retail");
  const d = domain.tokenize("Customer", "Atlas Medical");
  assert.equal(a, b, "same label+value must produce same token");
  assert.equal(a, c, "casing differences must not change the token");
  assert.notEqual(a, d, "different values must produce different tokens");
  assert.match(a, /^Customer-[0-9a-f]{6}$/);
  assert.equal(domain.tokenize("Lane", ""), "Lane-empty");
});

test("withRetryAndTimeout returns the first successful attempt without retrying", async () => {
  let calls = 0;
  const result = await domain.withRetryAndTimeout(
    async () => {
      calls += 1;
      return "ok";
    },
    { timeoutMs: 200, maxAttempts: 3, backoffMs: 0 },
  );
  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("withRetryAndTimeout retries transient failures and surfaces last error after the budget", async () => {
  let calls = 0;
  await assert.rejects(
    domain.withRetryAndTimeout(
      async () => {
        calls += 1;
        throw new Error(`attempt ${calls} failed`);
      },
      { timeoutMs: 200, maxAttempts: 3, backoffMs: 0 },
    ),
    /attempt 3 failed/,
  );
  assert.equal(calls, 3);
});

test("withRetryAndTimeout enforces a per-attempt timeout", async () => {
  let calls = 0;
  await assert.rejects(
    domain.withRetryAndTimeout(
      async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 80));
        return "late";
      },
      { timeoutMs: 20, maxAttempts: 2, backoffMs: 0 },
    ),
    /exceeded 20ms/,
  );
  assert.equal(calls, 2);
});

test("anonymizeLlmInput strips customer name and lane endpoints, preserves operational fields", () => {
  const raw = {
    shipmentExternalId: "S-1",
    customer: "Northstar Retail",
    lane: "Veracruz MX -> Atlanta GA",
    priority: "critical",
    value: 185000,
    riskLevel: "critical",
    riskScore: 95,
    riskReason: "Port congestion",
  };
  const anon = domain.anonymizeLlmInput(raw);
  assert.match(anon.customer, /^Customer-[0-9a-f]{6}$/);
  assert.doesNotMatch(anon.customer, /Northstar/i);
  assert.match(anon.lane, /^Origin-[0-9a-f]{6} -> Destination-[0-9a-f]{6}$/);
  assert.doesNotMatch(anon.lane, /Veracruz|Atlanta/i);
  // operational signal must pass through untouched
  assert.equal(anon.shipmentExternalId, "S-1");
  assert.equal(anon.value, 185000);
  assert.equal(anon.priority, "critical");
  assert.equal(anon.riskLevel, "critical");
  assert.equal(anon.riskReason, "Port congestion");
});
