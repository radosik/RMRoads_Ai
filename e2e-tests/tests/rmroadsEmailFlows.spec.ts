import { expect, test, type Page } from "@playwright/test";
import { createRandomUser, type User } from "./utils";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";
const SERVER_URL = process.env.REACT_APP_API_URL ?? "http://localhost:3001";
const DEFAULT_PASSWORD = "password123";

type MailpitMessage = {
  ID: string;
  Subject: string;
  To: Array<{ Address: string; Name?: string }>;
};

async function mailpitReachable(): Promise<boolean> {
  try {
    const resp = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=1`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

async function listMailpitMessages(): Promise<MailpitMessage[]> {
  const resp = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`);
  if (!resp.ok) return [];
  const body = (await resp.json()) as { messages?: MailpitMessage[] };
  return body.messages ?? [];
}

async function waitForMessageMatching(
  predicate: (m: MailpitMessage) => boolean,
  timeoutMs = 15_000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  let lastSeen: MailpitMessage[] = [];
  while (Date.now() < deadline) {
    lastSeen = await listMailpitMessages();
    const hit = lastSeen.find(predicate);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 400));
  }
  const subjects = lastSeen.map((m) => m.Subject).join(" | ");
  throw new Error(`timed out waiting for matching Mailpit message. saw: [${subjects}]`);
}

async function goToAuthPage(page: Page, path: "/login" | "/signup") {
  await page.goto(path, { waitUntil: "load" });
  try {
    await page.waitForSelector('input[name="email"]', { state: "visible", timeout: 5000 });
  } catch {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector('input[name="email"]', { state: "visible", timeout: 15000 });
  }
}

async function signUp(page: Page, user: User) {
  await goToAuthPage(page, "/signup");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', DEFAULT_PASSWORD);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/email/signup") && r.status() === 200),
    page.click('button:has-text("Sign up")'),
  ]);
}

async function signIn(page: Page, user: User) {
  await goToAuthPage(page, "/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', DEFAULT_PASSWORD);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/email/login") && r.status() === 200),
    page.click('button:has-text("Log in")'),
  ]);
}

function operationPath(name: string): string {
  return `/operations/${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}

async function getSessionId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("wasp:sessionId");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  });
}

async function callOperationAs(page: Page, name: string, args: unknown) {
  const sessionId = await getSessionId(page);
  return page.request.post(`${SERVER_URL}${operationPath(name)}`, {
    headers: {
      Authorization: `Bearer ${sessionId ?? ""}`,
      "Content-Type": "application/json",
    },
    data: { json: args },
    failOnStatusCode: false,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("RMRoads email flows via Mailpit", () => {
  test.beforeAll(async () => {
    if (!(await mailpitReachable())) {
      throw new Error(
        `Mailpit not reachable at ${MAILPIT_URL}. Start with: docker run -p 1025:1025 -p 8025:8025 axllent/mailpit  (or 'brew install mailpit && mailpit')`,
      );
    }
    await clearMailpit();
  });

  test("workspace invitation email lands in Mailpit", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const admin = createRandomUser();
      await signUp(page, admin);
      await signIn(page, admin);
      await page.goto("/rmroads", { waitUntil: "load" });
      await page.waitForURL("**/rmroads");

      const recipient = `teammate-${Date.now()}@mailpit.local`;
      const resp = await callOperationAs(page, "createRMRoadsWorkspaceInvitation", {
        email: recipient,
        role: "planner",
      });
      expect(resp.ok(), "createRMRoadsWorkspaceInvitation must succeed").toBe(true);

      const message = await waitForMessageMatching(
        (m) =>
          m.Subject.includes("RMRoads AI workspace invitation") &&
          m.To.some((t) => t.Address.toLowerCase() === recipient.toLowerCase()),
      );
      expect(message.Subject).toMatch(/workspace invitation/i);
    } finally {
      await context.close();
    }
  });

  test("pilot lead notification email lands in Mailpit", async () => {
    // Drives the operation directly rather than via the /pilot form to keep
    // this spec focused on the email path. UI-level validation of the form
    // belongs in a separate spec.
    const companyTag = `Mailpit Probe ${Date.now()}`;
    const resp = await fetch(`${SERVER_URL}/operations/submit-rmroads-pilot-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          name: "Probe Planner",
          workEmail: `probe-${Date.now()}@mailpit.local`,
          company: companyTag,
          role: "Logistics Lead",
          shipmentVolume: "500/month",
          currentTools: "Sheets and SAP",
          disruptionPain: "Port congestion creates weekly customer escalations.",
          pilotGoal: "Reduce time-to-decision on critical exceptions during disruption events.",
        },
      }),
    });
    expect(resp.ok, `submit-rmroads-pilot-lead returned ${resp.status}`).toBe(true);

    const message = await waitForMessageMatching((m) => m.Subject.includes(companyTag));
    expect(message.Subject).toMatch(/pilot request/i);
  });

  test("critical alert email lands in Mailpit after seeding demo data", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const admin = createRandomUser();
      await signUp(page, admin);
      await signIn(page, admin);
      await page.goto("/rmroads", { waitUntil: "load" });
      await page.waitForURL("**/rmroads");

      // Enable critical alerts with a Mailpit-bound recipient via the
      // workspace-settings action. Includes the full required-field set per
      // the schema; defaults match what a fresh workspace would hold.
      const recipient = `alerts-${Date.now()}@mailpit.local`;
      const settingsResp = await callOperationAs(page, "updateRMRoadsWorkspaceSettings", {
        name: `Mailpit Probe ${Date.now()}`,
        alertEmailsEnabled: true,
        alertRecipients: recipient,
        weeklySummaryEmailsEnabled: false,
        weeklySummaryRecipients: "",
        pilotMode: "demo",
        pilotSuccessMetric: "Verify critical alert email lands in Mailpit",
        pilotTargetDecisionHours: 4,
        securityReviewCompleted: false,
      });
      expect(settingsResp.ok(), "updateRMRoadsWorkspaceSettings must succeed").toBe(true);

      // Seed demo data — the sample disruption + critical shipment will produce
      // a critical exception, which syncCriticalAlerts will email out.
      const seedResp = await callOperationAs(page, "seedRMRoadsDemoData", {});
      if (!seedResp.ok()) {
        const body = await seedResp.text();
        throw new Error(`seedRMRoadsDemoData failed ${seedResp.status()}: ${body.slice(0, 400)}`);
      }

      // Force one more dashboard fetch so syncCriticalAlerts runs (it executes
      // during getRMRoadsDashboard once a critical exception is persisted).
      await callOperationAs(page, "getRMRoadsDashboard", {});

      const message = await waitForMessageMatching(
        (m) =>
          m.Subject.toLowerCase().includes("critical") &&
          m.To.some((t) => t.Address.toLowerCase() === recipient.toLowerCase()),
        25_000,
      );
      expect(message.Subject).toMatch(/Critical RMRoads AI alert/i);
    } finally {
      await context.close();
    }
  });
});
