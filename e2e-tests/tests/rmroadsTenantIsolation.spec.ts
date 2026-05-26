import { expect, test, type Page } from "@playwright/test";
import { createRandomUser, type User } from "./utils";

const DEFAULT_PASSWORD = "password123";

// Reload-on-Vite-preamble-error: Wasp's dev server occasionally serves the
// React entry before Vite's HMR preamble registers, leaving the page in an
// error state where inputs never become interactable. A single page.reload()
// after the email input fails to appear reliably recovers.
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
  await page.evaluate(() => {
    try {
      localStorage.removeItem("wasp:sessionId");
    } catch {}
  });
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

async function openRMRoads(page: Page) {
  await page.goto("/rmroads");
  await page.waitForURL("**/rmroads");
  await expect(page.getByTestId("rmroads-shipment-count")).toBeVisible();
}

async function seedDemoData(page: Page) {
  await page.getByTestId("rmroads-seed-data-button").click();
  await expect(page.getByTestId("rmroads-shipment-count")).not.toHaveText(/Active nodes:\s*0\b/, {
    timeout: 15_000,
  });
}

async function readShipmentCount(page: Page): Promise<number> {
  const text = await page.getByTestId("rmroads-shipment-count").innerText();
  const match = text.match(/Active nodes:\s*(\d+)/);
  if (!match) throw new Error(`Unexpected shipment-count text: ${text}`);
  return Number(match[1]);
}

const SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Wasp's operation URL convention: camelCase → kebab-case, consecutive caps
// stay together (e.g. RMRoads → rmroads).
function operationPath(name: string): string {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `/operations/${kebab}`;
}

async function getSessionId(page: Page): Promise<string | null> {
  // Wasp stores the sessionId JSON-stringified under `wasp:sessionId`.
  return page.evaluate(() => {
    const raw = localStorage.getItem("wasp:sessionId");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  });
}

// Wasp client wraps args with superjson. For plain JSON args, the serialized
// form is just `{ json: <args> }` with no `meta` field.
async function callOperationAs(
  page: Page,
  operationName: string,
  args: unknown,
) {
  const sessionId = await getSessionId(page);
  return page.request.post(`${SERVER_URL}${operationPath(operationName)}`, {
    headers: {
      Authorization: `Bearer ${sessionId ?? ""}`,
      "Content-Type": "application/json",
    },
    data: { json: args },
    failOnStatusCode: false,
  });
}

async function fetchDashboardAs(page: Page): Promise<any> {
  const response = await callOperationAs(page, "getRMRoadsDashboard", {});
  if (!response.ok()) {
    throw new Error(`getRMRoadsDashboard failed: ${response.status()}`);
  }
  const body = await response.json();
  return body?.json ?? body;
}

test.describe.configure({ mode: "serial" });

test.describe("RMRoads tenant isolation", () => {
  test("two users with separate workspaces see only their own seeded data", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    try {
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const userA = createRandomUser();
      const userB = createRandomUser();

      await signUp(pageA, userA);
      await signUp(pageB, userB);

      await signIn(pageA, userA);
      await signIn(pageB, userB);

      await openRMRoads(pageA);
      await seedDemoData(pageA);
      const countA = await readShipmentCount(pageA);
      expect(countA).toBeGreaterThan(0);

      await openRMRoads(pageB);
      const countBBefore = await readShipmentCount(pageB);
      expect(countBBefore).toBe(0);

      await seedDemoData(pageB);
      const countBAfter = await readShipmentCount(pageB);
      expect(countBAfter).toBeGreaterThan(0);

      await pageA.reload();
      await expect(pageA.getByTestId("rmroads-shipment-count")).toBeVisible();
      const countAAfter = await readShipmentCount(pageA);
      expect(countAAfter).toBe(countA);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("user B cannot mutate user A's disruption events", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    try {
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const userA = createRandomUser();
      const userB = createRandomUser();

      await signUp(pageA, userA);
      await signUp(pageB, userB);
      await signIn(pageA, userA);
      await signIn(pageB, userB);

      await openRMRoads(pageA);
      await seedDemoData(pageA);
      await openRMRoads(pageB);
      await seedDemoData(pageB);

      const aDashboard = await fetchDashboardAs(pageA);
      const foreignEventId = aDashboard?.disruptionEvents?.[0]?.id;
      expect(foreignEventId, "user A must have at least one disruption event after seeding").toBeTruthy();

      const toggleResponse = await callOperationAs(pageB, "toggleRMRoadsDisruptionEventStatus", {
        id: foreignEventId,
      });
      expect(toggleResponse.status(), "user B toggle on user A's event must be rejected").toBe(404);

      const upsertResponse = await callOperationAs(pageB, "upsertRMRoadsDisruptionEvent", {
        id: foreignEventId,
        type: "Probe",
        severity: "low",
        affectedText: "Cross-tenant probe attempt",
        confidence: 50,
        source: "playwright test",
      });
      expect(upsertResponse.status(), "user B upsert on user A's event id must be rejected").toBe(404);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("user B cannot mutate user A's decisions or invitations", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    try {
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const userA = createRandomUser();
      const userB = createRandomUser();

      await signUp(pageA, userA);
      await signUp(pageB, userB);
      await signIn(pageA, userA);
      await signIn(pageB, userB);

      await openRMRoads(pageA);
      await seedDemoData(pageA);
      await openRMRoads(pageB);
      await seedDemoData(pageB);

      const aDashboard = await fetchDashboardAs(pageA);
      const aExceptionId: string | undefined = aDashboard?.exceptions?.[0]?.id;
      expect(aExceptionId, "user A must have at least one exception after seeding").toBeTruthy();

      const decideResp = await callOperationAs(pageA, "decideRMRoadsException", {
        exceptionId: aExceptionId,
        status: "approved",
        scenarioAction: "expedite",
        note: "",
      });
      expect(decideResp.ok(), "user A decide must succeed").toBe(true);
      const decidedDashboard = (await decideResp.json())?.json ?? (await decideResp.json());
      const foreignDecisionId: string | undefined = decidedDashboard?.decisions?.[0]?.id;
      expect(foreignDecisionId, "user A must now have a decision id").toBeTruthy();

      const inviteResp = await callOperationAs(pageA, "createRMRoadsWorkspaceInvitation", {
        email: `probe-${Date.now()}@test.com`,
        role: "planner",
      });
      expect(inviteResp.ok(), "user A invite create must succeed").toBe(true);
      const inviteSettings = (await inviteResp.json())?.json;
      const foreignInvitationId: string | undefined = inviteSettings?.invitations?.[0]?.id;
      expect(foreignInvitationId, "user A must now have a pending invitation").toBeTruthy();

      const outcomeProbe = await callOperationAs(pageB, "updateRMRoadsDecisionOutcome", {
        decisionId: foreignDecisionId,
        outcomeStatus: "successful",
        outcomeNote: "",
      });
      expect(
        outcomeProbe.status(),
        "user B outcome update on user A's decision must be rejected",
      ).toBe(404);

      const cancelProbe = await callOperationAs(pageB, "cancelRMRoadsWorkspaceInvitation", {
        invitationId: foreignInvitationId,
      });
      expect(
        cancelProbe.status(),
        "user B cancel on user A's invitation must be rejected",
      ).toBe(404);

      const resendProbe = await callOperationAs(pageB, "resendRMRoadsWorkspaceInvitation", {
        invitationId: foreignInvitationId,
      });
      expect(
        resendProbe.status(),
        "user B resend on user A's invitation must be rejected",
      ).toBe(404);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
