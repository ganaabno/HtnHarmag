import { test, expect, type Page } from "@playwright/test";
test.use({ trace: "off" });
const pose = async (page: Page) =>
  (await page.locator(".sg-journey").getAttribute("data-journey-pose"))!
    .split(",")
    .map(Number);
const seek = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY),
    );

test("readable poses survive reverse scrolling, resize and model handoffs", async ({
  page,
  isMobile,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".sg-journey")).toHaveClass(/sg-ready/, {
    timeout: 25000,
  });
  await seek(page, ".sg-intro");
  await expect.poll(async () => (await pose(page))[3]).toBeCloseTo(0.16, 2);
  const first = await pose(page);
  await page.screenshot({ path: testInfo.outputPath("intro-polished.png") });
  const start = await page
    .locator(".pin-spacer")
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const duration = await page.evaluate(
    () => innerHeight * (innerWidth < 700 ? 0.65 : 0.95),
  );
  let previous = Math.PI * 2;
  for (const progress of [0.3, 0.6, 0.9]) {
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      start + duration * progress,
    );
    await expect
      .poll(async () => (await pose(page))[2])
      .toBeGreaterThan(previous + 0.05);
    await page.waitForTimeout(650);
    previous = (await pose(page))[2];
  }
  await seek(page, ".sg-benefit-two");
  await expect
    .poll(async () => (await pose(page))[0])
    .toBeCloseTo(isMobile ? 0 : -0.255, 2);
  await seek(page, ".sg-intro");
  await expect
    .poll(async () =>
      Math.max(...(await pose(page)).map((v, i) => Math.abs(v - first[i]))),
    )
    .toBeLessThan(0.003);
  await seek(page, ".sg-collection");
  const next = page.getByRole("button", { name: "Дараах бүтээгдэхүүн" });
  for (const title of ["Чонон Хармаг", "Сэргээнээ"]) {
    await next.click();
    await expect(page.locator(".sg-carousel-bottom h3")).toHaveText(title);
    await expect(next).toBeEnabled({ timeout: 15000 });
  }
  await page.screenshot({ path: testInfo.outputPath("carousel-polished.png") });
  await page.setViewportSize({
    width: isMobile ? 430 : 1100,
    height: isMobile ? 920 : 850,
  });
  await seek(page, ".sg-collection");
  await expect
    .poll(async () => (await pose(page))[2])
    .toBeCloseTo(Math.PI * 4, 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pin-spacer .sg-dive")).toHaveCount(0);
  await seek(page, ".sg-benefit-two");
  await expect.poll(async () => (await pose(page))[2]).toBe(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
