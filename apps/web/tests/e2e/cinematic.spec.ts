import { test, expect, type Locator } from "@playwright/test";
test.use({ trace: "off" });
const number = async (element: Locator, key: string) =>
  Number(await element.getAttribute(`data-${key}`));
test("inspection preserves angles, supports wheel/keyboard and smooth resets", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/products/sergeenee");
  const region = page.locator(".product-view.inspectable");
  await expect(region).toHaveClass(/model-ready/, { timeout: 20_000 });
  await expect(region).toHaveAttribute("data-interaction-state", "IDLE");
  const box = await region.boundingBox();
  expect(box).not.toBeNull();
  const start = await number(region, "yaw");
  await page.mouse.move(box!.x + box!.width * 0.35, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width * 0.65,
    box!.y + box!.height * 0.55,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect.poll(() => number(region, "yaw")).toBeGreaterThan(start + 0.3);
  await expect(region).toHaveAttribute("data-interaction-state", "IDLE", {
    timeout: 15_000,
  });
  const held = await number(region, "yaw");
  await page.waitForTimeout(350);
  expect(Math.abs((await number(region, "yaw")) - held)).toBeLessThan(0.02);
  const distance = await number(region, "distance"),
    scroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -100);
  await expect
    .poll(() => number(region, "distance"))
    .toBeLessThan(distance - 0.08);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await region.evaluate((element) => {
    for (let i = 0; i < 41; i++)
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
  });
  await expect.poll(() => number(region, "yaw")).toBeGreaterThan(6);
  await page.keyboard.press("Home");
  await expect(region).toHaveAttribute("data-interaction-state", "RESETTING");
  await expect
    .poll(async () => Math.abs(Math.sin((await number(region, "yaw")) + 0.24)))
    .toBeLessThan(0.015);
  await expect(region).toHaveAttribute("data-interaction-state", "IDLE");
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => number(region, "pitch")).toBeLessThan(0);
  await region.dblclick();
  await expect.poll(() => number(region, "pitch")).toBeCloseTo(0.035, 2);
  expect(errors).toEqual([]);
});
test("touch drag and genuine two-contact pinch zoom stay inside the viewer", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  await page.goto("/products/black-wolfberry");
  const region = page.locator(".product-view.inspectable");
  await expect(region).toHaveClass(/model-ready/, { timeout: 20_000 });
  await expect(region).toHaveAttribute("data-interaction-state", "IDLE");
  const box = await region.boundingBox();
  const x = box!.x + box!.width * 0.5,
    y = box!.y + box!.height * 0.48;
  const client = await context.newCDPSession(page);
  const point = (id: number, x: number, y: number) => ({
    id,
    x,
    y,
    radiusX: 4,
    radiusY: 4,
    force: 0.5,
  });
  const send = (
    type: "touchStart" | "touchMove" | "touchEnd",
    touchPoints: ReturnType<typeof point>[],
  ) => client.send("Input.dispatchTouchEvent", { type, touchPoints });
  const initial = await number(region, "yaw"),
    scroll = await page.evaluate(() => scrollY);
  await send("touchStart", [point(1, x - 45, y)]);
  await send("touchMove", [point(1, x + 35, y + 12)]);
  await send("touchEnd", []);
  await expect.poll(() => number(region, "yaw")).toBeGreaterThan(initial + 0.2);
  await expect(region).toHaveAttribute("data-interaction-state", "IDLE", {
    timeout: 15_000,
  });
  const distance = await number(region, "distance");
  await send("touchStart", [point(1, x - 30, y), point(2, x + 30, y)]);
  await send("touchMove", [point(1, x - 60, y), point(2, x + 60, y)]);
  await send("touchEnd", []);
  await expect
    .poll(() => number(region, "distance"))
    .toBeLessThan(distance - 0.5);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  expect(await page.evaluate(() => visualViewport?.scale)).toBe(1);
  await client.detach();
});
test("continuous homepage journey, carousel inspection and route cleanup", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".sg-journey")).toHaveClass(/sg-ready/, {
    timeout: 25_000,
  });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".journey-three-view")).toHaveCount(1);
  await expect(page.locator(".pin-spacer .sg-dive")).toHaveCount(1);
  for (const chapter of [".sg-intro", ".sg-dive", ".sg-collection"]) {
    await page.locator(chapter).scrollIntoViewIfNeeded();
    await expect(page.locator("canvas")).toHaveCount(1);
  }
  const inspect = page.locator(".sg-inspect");
  await inspect.focus();
  const angle = await number(inspect, "yaw");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => number(inspect, "yaw")).toBeGreaterThan(angle + 0.05);
  await page.getByRole("button", { name: "Анхны байрлалд оруулах" }).click();
  await expect.poll(() => number(inspect, "yaw")).toBeCloseTo(-0.24, 1);
  await page.getByRole("button", { name: "Дараах бүтээгдэхүүн" }).click();
  await expect(page.locator(".sg-carousel-bottom h3")).toHaveText(
    "Чонон Хармаг",
  );
  await expect(page.locator(".sg-collection")).toHaveClass(/sg-flavor-1/);
  await expect(
    page.getByRole("button", { name: "Сагсанд нэмэх", exact: true }),
  ).toHaveCount(0);
  await page.locator(".sg-finale").scrollIntoViewIfNeeded();
  await expect(page.locator(".sg-finale h2")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".sg-finale .sg-button").click();
  await expect(page.locator(".sg-collection")).toBeInViewport();
  await page.locator(".sg-product-detail").click();
  await expect(page).toHaveURL(/products/);
  await expect(page.locator(".journey-three-view")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/sergeenee-home/);
  expect(errors).toEqual([]);
});

test("repeated product visits keep renderer resources bounded", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const stats = () =>
    page.locator("canvas").evaluate((canvas) => {
      const data: Record<string, number> = {};
      canvas.dispatchEvent(
        new CustomEvent("hatan-renderer-stats", { detail: data }),
      );
      return data;
    });
  await page.goto("/products/sergeenee");
  await expect(page.locator(".product-view")).toHaveClass(/model-ready/, {
    timeout: 20_000,
  });
  await page.locator(".related-card").click();
  await expect(page).toHaveURL(/black-wolfberry/);
  await expect(page.locator(".product-view")).toHaveClass(/model-ready/, {
    timeout: 20_000,
  });
  const first = await stats();
  for (let i = 0; i < 3; i++) {
    await page.locator(".related-card").click();
    await expect(page).toHaveURL(i % 2 ? /black-wolfberry/ : /sergeenee/);
    await expect(page.locator(".product-view")).toHaveClass(/model-ready/, {
      timeout: 20_000,
    });
    await expect(page.locator("canvas")).toHaveCount(1);
  }
  const last = await stats();
  expect(last.geometries).toBeLessThanOrEqual(first.geometries + 25);
  expect(last.textures).toBeLessThanOrEqual(first.textures + 10);
});
