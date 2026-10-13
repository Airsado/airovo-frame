import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.SIDEBAR_MATRIX_URL ?? "http://localhost:5176";
const username = process.env.SIDEBAR_MATRIX_USERNAME ?? "admin";
const password = process.env.SIDEBAR_MATRIX_PASSWORD ?? "123456";
const executablePath = process.env.SIDEBAR_MATRIX_BROWSER;

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.setDefaultTimeout(5000);

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="username[0].value"]').fill(username);
  await page.locator('input[name="password[0].value"]').fill(password);
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForTimeout(600);

  await page.goto(`${baseUrl}/dashboard/navigation-tree/overview`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(600);

  const active = page.locator('[data-app-sidebar-active="true"]').first();
  assert.equal(await active.getAttribute("aria-current"), "page");
  const activeStyle = await active.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, color: style.color };
  });
  assert.notEqual(activeStyle.background, "rgba(0, 0, 0, 0)");

  const hoverTarget = page.locator(
    '[data-menu-url="/dashboard/navigation-tree/layout"]',
  );
  await hoverTarget.hover();
  const hoverBackground = await hoverTarget.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  assert.notEqual(hoverBackground, "rgba(0, 0, 0, 0)");

  await hoverTarget.focus();
  const focusRing = await hoverTarget.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  assert.match(focusRing, /2px/);

  const disabled = page.locator(
    '[data-menu-url="/dashboard/navigation-tree/restricted"]',
  );
  assert.equal(await disabled.getAttribute("aria-disabled"), "true");
  assert.equal(await disabled.getAttribute("tabindex"), "-1");
  const beforeDisabledClick = page.url();
  await disabled.click({ force: true });
  assert.equal(page.url(), beforeDisabledClick);

  const rail = page.locator('[data-sidebar="rail"]');
  assert.equal(
    await page.locator('[data-slot="sidebar"]').getAttribute("data-state"),
    "expanded",
  );
  await rail.click();
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator('[data-slot="sidebar"]').getAttribute("data-state"),
    "collapsed",
  );

  await page.goto(`${baseUrl}/dashboard/overview`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
  const collapsedParent = page
    .locator('[data-sidebar-menu-kind="parent-collapsed"]')
    .first();
  assert.ok(await collapsedParent.count());
  await collapsedParent.click();
  await page.waitForTimeout(200);
  const collapsedChildren = page.locator(
    '[data-sidebar-menu-kind="collapsed-child"]',
  );
  assert.ok(await collapsedChildren.count());
  await collapsedChildren.first().focus();
  assert.equal(
    await collapsedChildren
      .first()
      .evaluate((element) => document.activeElement === element),
    true,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  assert.equal(await collapsedChildren.count(), 0);

  await page.getByRole("button", { name: "打开主题设置" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "地下" }).click();
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator("html").getAttribute("data-theme-preset"),
    "underground",
  );
  const animationToggle = page.locator(
    '[role="dialog"] input[type="checkbox"]',
  );
  await animationToggle.click();
  await page.waitForTimeout(150);
  assert.equal(
    await page
      .locator("html")
      .evaluate((element) => element.classList.contains("no-anim")),
    true,
  );
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "切换主题" }).click();
  await page.waitForTimeout(150);
  assert.equal(
    await page
      .locator("html")
      .evaluate((element) => element.classList.contains("dark")),
    true,
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    true,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard/navigation-tree/overview`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
  await page.locator('[data-sidebar="trigger"]').click();
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator('[data-mobile="true"]').getAttribute("data-state"),
    "open",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-mobile="true"]').count(), 0);

  await page.locator('[data-sidebar="trigger"]').click();
  await page.waitForTimeout(200);
  await page.mouse.click(380, 400);
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-mobile="true"]').count(), 0);

  console.log(
    JSON.stringify({
      baseUrl,
      desktop:
        "expanded/collapsed, active/hover/focus/disabled, dropdown Escape",
      theme: "dark/preset/reduced-motion",
      mobile: "Sheet open, Escape, outside click",
    }),
  );
} finally {
  await browser.close();
}
