import { expect, test, type Page } from "@playwright/test";
import { createRandomUser, signUserUp, type User } from "./utils";

const DEFAULT_PASSWORD = "password123";

async function signIn(page: Page, user: User) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', DEFAULT_PASSWORD);
  await page.click('button:has-text("Log in")');
  await page.waitForLoadState("networkidle");
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

      await signUserUp({ page: pageA, user: userA });
      await signUserUp({ page: pageB, user: userB });

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
});
