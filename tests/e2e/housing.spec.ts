import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
const listing = "20000000-0000-4000-8000-000000000001";
const sessions = JSON.parse(process.env.HOUSEPLUG_TEST_SESSIONS || "{}");
async function login(context: any, role: string) {
  const session = sessions[role];
  await context.addCookies([
    {
      name: "sb-127-auth-token",
      value:
        "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}
test("mobile homepage has exact positioning, honest totals, accessible search and no overflow", async ({
  page,
}) => {
  for (const width of [320, 360, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Find a Room Near Campus Without the Stress.",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(page.getByText("Move-in total: ₦400,000")).toBeVisible();
    await expect(page.getByText("500+ Verified Listings")).toHaveCount(0);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
test("total budget filtering, single occupancy and no synthetic inventory", async ({
  page,
}) => {
  await page.goto("/browse?university=uniport&max_total=300000");
  await expect(
    page.getByText("No confirmed rooms match these filters.", { exact: false }),
  ).toBeVisible();
  await page.goto("/browse?university=uniport&max_total=450000");
  await expect(page.getByText("Move-in total: ₦400,000")).toBeVisible();
  await page.goto(`/listing/${listing}`);
  await expect(
    page.getByText("Initial housing payment: ₦400,000"),
  ).toBeVisible();
  await expect(page.getByText("Split:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Private fixture address")).toHaveCount(0);
  const demo = await page.goto("/listing/1");
  expect(demo?.status()).toBe(404);
});
test("guest request persists, returns reference, and is idempotent", async ({
  page,
}) => {
  await page.goto("/housing-assistance");
  await page.getByLabel("Campus", { exact: true }).selectOption("uniport");
  await page.getByLabel("Preferred area", { exact: true }).fill("Aluu");
  await page
    .getByLabel("Total move-in budget (₦)", { exact: true })
    .fill("400000");
  await page.getByLabel("Move-in date", { exact: true }).fill("2099-01-01");
  await page.getByLabel("Your name", { exact: true }).fill("Fixture Student");
  await page
    .getByLabel("Phone or WhatsApp number", { exact: true })
    .fill("08012345678");
  await page
    .getByLabel("I agree to HousePlug using my contact details", {
      exact: false,
    })
    .check();
  const result = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/housing-requests") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit Housing Request" }).click();
  const response = await result;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  expect(saved.reference).toMatch(/^HP-/);
  await expect(page.getByText("Your request is saved")).toBeVisible();
  await page.screenshot({
    path: "test-results/request-success.png",
    fullPage: true,
  });
  const requestBody = response.request().postDataJSON();
  const retry = await page.request.post("/api/housing-requests", {
    headers: { Origin: new URL(page.url()).origin },
    data: requestBody,
  });
  expect(retry.status()).toBe(201);
  expect((await retry.json()).reference).toBe(saved.reference);
});
test("administrator sees private inbox; unrelated student cannot alter a request", async ({
  browser,
  baseURL,
}) => {
  const admin = await browser.newContext();
  await login(admin, "admin");
  const p = await admin.newPage();
  await p.goto("/admin/requests");
  await expect(
    p.getByRole("heading", { name: "Housing requests", exact: true }),
  ).toBeVisible();
  await expect(
    p.getByText("Fixture Student", { exact: false }).first(),
  ).toBeVisible();
  const id = await p
    .locator("article[data-request-id]")
    .first()
    .getAttribute("data-request-id");
  expect(id).toBeTruthy();
  const other = await browser.newContext();
  await login(other, "other");
  const g = await other.newPage();
  const denied = await g.request.patch(
    `${baseURL}/api/housing-requests/${id}`,
    { headers: { Origin: baseURL! }, data: { status: "qualified" } },
  );
  expect(denied.status()).toBe(404);
  const qualified = await p.request.patch(`/api/housing-requests/${id}`, {
    headers: { Origin: baseURL! },
    data: {
      status: "qualified",
      assigned_agent_id: "10000000-0000-4000-8000-000000000003",
    },
  });
  expect(qualified.status()).toBe(200);
  const matched = await p.request.post(`/api/housing-requests/${id}/matches`, {
    headers: { Origin: baseURL! },
    data: { listing_ids: [listing] },
  });
  expect(matched.status()).toBe(200);
  await p.reload();
  await expect(
    p.getByRole("link", { name: "View suggested room" }),
  ).toBeVisible();
  const agent = await browser.newContext();
  await login(agent, "agent");
  const ap = await agent.newPage();
  const connected = await ap.request.patch(
    `${baseURL}/api/housing-requests/${id}`,
    { headers: { Origin: baseURL! }, data: { status: "connected" } },
  );
  expect(connected.status()).toBe(200);
  await admin.close();
  await other.close();
  await agent.close();
});
test("canonical host, sitemap and guides do not expose previews or private request pages", async ({
  page,
}) => {
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("https://www.houseplug.ng/sitemap.xml");
  const sitemap = await page.request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).not.toContain("vercel.app");
  expect(xml).not.toContain("/student/requests");
  expect(xml).not.toContain("/roommates/");
  expect(xml).toContain(`/listing/${listing}`);
  await page.goto("/guides/student-rental-fees-nigeria");
  await expect(
    page.getByRole("heading", {
      name: "Student rental fees explained",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://www.houseplug.ng/guides/student-rental-fees-nigeria",
  );
});
