import { test, expect } from "@playwright/test";
// GPU screencast capture on every pointer event overwhelms software-rendered CI.
test.use({ trace: "off" });
test("one WebGL context, real models, viewer controls and context-loss fallback", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/products/sergeenee");
  await expect(page.locator("html")).toHaveAttribute("data-webgl", "true");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".product-view")).toHaveClass(/model-ready/, {
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Ойртуулах", exact: true }).click();
  await page
    .getByRole("button", { name: "Загварыг анхны байрлалд оруулах" })
    .click();
  const view = page.locator(".detail-viewer");
  const box = await view.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5, {
      steps: 4,
    });
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "Бүтэн дэлгэцээр үзэх" }).click();
  await expect(view).toHaveClass(/fullscreen-viewer/);
  await page.getByRole("button", { name: "Бүтэн дэлгэцээс гарах" }).click();
  await expect(view).not.toHaveClass(/fullscreen-viewer/);
  await page.evaluate(() => {
    const c = document.querySelector("canvas");
    c?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator("html")).toHaveAttribute("data-webgl", "false");
  await expect(page.locator(".model-fallback")).toBeVisible();
  await page
    .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
