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
    if (width < 768)
      await expect(
        page.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
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
    page.getByText("Initial housing payment: ₦400,000").first(),
  ).toBeVisible();
  await expect(page.getByText("Split:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Private fixture address")).toHaveCount(0);
  await expect(page.getByText("No agent fee for this listing")).toHaveCount(0);
  await expect(
    page.getByText("Agency fee: ₦150,000", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Immediate", { exact: true })).toHaveCount(0);
  const demo = await page.goto("/listing/1");
  expect(demo?.status()).toBe(404);
});
// This reader is deliberately restricted to the disposable local test gateway.
async function fixtureRows(
  request: import("@playwright/test").APIRequestContext,
  path: string,
) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !base ||
    new URL(base).hostname !== "127.0.0.1" ||
    new URL(base).port !== "54421"
  )
    throw Error("Disposable QA database required");
  const response = await request.get(`${base}/rest/v1/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("a guest contacts the responsible agent directly on WhatsApp without a request or assignment", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(90_000);
  const snapshot = async () => ({
    requests: await fixtureRows(
      request,
      "housing_requests?select=id,status,assigned_agent_id&order=id",
    ),
    events: await fixtureRows(request, "lead_events?select=id,event&order=id"),
    outbox: await fixtureRows(
      request,
      "notification_outbox?select=id,event&order=id",
    ),
  });
  const before = await snapshot();
  const baseline = (
    await fixtureRows(
      request,
      `listings?select=whatsapp_clicks&id=eq.${listing}`,
    )
  )[0].whatsapp_clicks;
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Local WhatsApp link test. No message sent.</p>",
    }),
  );
  const formRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/housing-requests") && r.method() === "POST")
      formRequests.push(r.url());
  });
  let clicks = 0;
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/browse?university=uniport&max_total=450000");
    await page
      .getByRole("link", { name: "View Room Details", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/listing/${listing}$`));
    await expect(
      page.getByText(
        "HousePlug cannot read or monitor your private WhatsApp conversations.",
        { exact: false },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Submit Housing Request|Book inspection|Confirm inspection/i,
      }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const cta = page.getByTestId(
      width < 1024 ? "listing-whatsapp-sticky" : "listing-whatsapp-desktop",
    );
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAccessibleName("Chat With Agent on WhatsApp");
    const url = new URL((await cta.getAttribute("href"))!);
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/2348012345678");
    const message = url.searchParams.get("text")!;
    expect(message).toContain("Test fixture room");
    expect(message).toContain(`Listing reference: ${listing}`);
    expect(message).toContain(`https://www.houseplug.ng/listing/${listing}`);
    const html = await page.content();
    expect(html).not.toContain("08087654321");
    expect(html).not.toContain("agent@example.invalid");
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      cta.click(),
    ]);
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname).toBe("/2348012345678");
    await popup.close();
    clicks++;
    await expect
      .poll(
        async () =>
          (
            await fixtureRows(
              request,
              `listings?select=whatsapp_clicks&id=eq.${listing}`,
            )
          )[0].whatsapp_clicks,
      )
      .toBe(baseline + clicks);
    await page.screenshot({
      path: `test-results/direct-contact-${width}.png`,
      fullPage: true,
    });
  }
  await expect
    .poll(
      async () =>
        (
          await fixtureRows(
            request,
            `listings?select=whatsapp_clicks&id=eq.${listing}`,
          )
        )[0].whatsapp_clicks,
    )
    .toBe(baseline + 3);
  await expect
    .poll(
      async () =>
        (
          await fixtureRows(
            request,
            `funnel_events?select=event&event=eq.whatsapp_click&listing_id=eq.${listing}`,
          )
        ).length,
    )
    .toBe(1);
  expect(await snapshot()).toEqual(before);
  expect(formRequests).toEqual([]);
  for (const event of [
    "qualified_enquiry_created",
    "inspection_confirmed",
    "rental_outcome_confirmed",
  ]) {
    const forged = await page.request.post("/api/funnel-events", {
      headers: { Origin: new URL(page.url()).origin },
      data: { event, session_id: randomUUID(), listing_id: listing },
    });
    expect(forged.status()).toBe(400);
  }
});

test("WhatsApp navigation survives tracking failure and never becomes a booking form", async ({
  page,
  context,
}) => {
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Local WhatsApp test</p>",
    }),
  );
  await page.route("**/api/funnel-events", (route) => route.abort());
  await page.route("**/*", (route) =>
    route.request().method() === "POST" &&
    route.request().headers()["next-action"]
      ? route.abort()
      : route.fallback(),
  );
  await page.goto(`/listing/${listing}`);
  const cta = page.getByTestId("listing-whatsapp-desktop");
  const [popup] = await Promise.all([page.waitForEvent("popup"), cta.click()]);
  await popup.waitForLoadState();
  expect(new URL(popup.url()).hostname).toBe("wa.me");
  await popup.close();
  await expect(page).toHaveURL(new RegExp(`/listing/${listing}$`));
  await expect(
    page.getByRole("button", { name: /submit|book|confirm inspection/i }),
  ).toHaveCount(0);
});

test("unpublished and expired contacts stay private; missing WhatsApp has an honest empty state", async ({
  page,
}) => {
  for (const id of [
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000004",
  ]) {
    await page.goto(`/listing/${id}`);
    await expect(page.locator("a[data-listing-whatsapp]")).toHaveCount(0);
    expect(await page.content()).not.toContain("08087654321");
  }
  await page.goto("/listing/20000000-0000-4000-8000-000000000003");
  await expect(
    page
      .getByText("Agent WhatsApp contact is not available for this listing.")
      .first(),
  ).toBeVisible();
  await expect(page.locator("a[data-listing-whatsapp]")).toHaveCount(0);
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
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
test("optional assistance needs no agent assignment; private requests stay authorized", async ({
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
    },
  });
  expect(qualified.status()).toBe(200);
  const appointment = await p.request.patch(`/api/housing-requests/${id}`, {
    headers: { Origin: baseURL! },
    data: { status: "inspection_confirmed" },
  });
  expect(appointment.status()).toBe(400);
  const matched = await p.request.post(`/api/housing-requests/${id}/matches`, {
    headers: { Origin: baseURL! },
    data: { listing_ids: [listing] },
  });
  expect(matched.status()).toBe(200);
  await p.reload();
  await expect(
    p.getByRole("link", { name: "View suggested room" }),
  ).toBeVisible();
  const connected = await p.request.patch(
    `${baseURL}/api/housing-requests/${id}`,
    { headers: { Origin: baseURL! }, data: { status: "connected" } },
  );
  expect(connected.status()).toBe(200);
  await admin.close();
  await other.close();
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
