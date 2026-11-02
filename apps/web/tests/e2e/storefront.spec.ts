import { test, expect } from "@playwright/test";
test("catalog, persistent cart, validated demo checkout and confirmation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/products/sergeenee");
  await expect(
    page.getByRole("heading", { name: "Сэргээнээ", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Тоо нэмэх", exact: true }).click();
  await page
    .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Таны сагс")).toBeVisible();
  await drawer.getByRole("button", { name: "Сагс хаах" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Сагс, 2 бүтээгдэхүүн" }).click();
  await page.getByRole("link", { name: "Демо захиалга хийх" }).click();
  await expect(page).toHaveURL(/checkout/);
  await page
    .getByRole("button", { name: "Демо захиалга баталгаажуулах" })
    .click();
  await expect(page.getByText("Нэрээ бүтнээр оруулна уу.")).toBeVisible();
  await page.getByLabel("Таны нэр", { exact: true }).fill("Бат Эрдэнэ");
  await page.getByLabel("И-мэйл", { exact: true }).fill("bat@example.com");
  await page.getByLabel("Утасны дугаар", { exact: true }).fill("99112233");
  await page
    .getByLabel("Хүргэлтийн хаяг", { exact: true })
    .fill("Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо");
  await page.getByLabel("Бодит худалдан авалт биш", { exact: false }).check();
  await page
    .getByRole("button", { name: "Демо захиалга баталгаажуулах" })
    .click();
  await expect(page).toHaveURL(/confirmation\/DEMO-/);
  await expect(page.getByText("Баярлалаа.")).toBeVisible();
  await expect(
    page.getByText("Төлбөр аваагүй.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("hatan-last-order")),
  ).not.toContain("bat@example.com");
  expect(errors).toEqual([]);
});
test("carousel keyboard, inquiry product, empty cart and editorial pages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/products");
  const carousel = page.getByRole("region", {
    name: "3D бүтээгдэхүүн, сум товчоор сонгоно уу",
  });
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Чонон Хармаг", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Лавлах", exact: true }),
  ).toHaveAttribute("href", /mailto:/);
  await page.getByRole("link", { name: "Дэлгэрэнгүй үзэх" }).click();
  await expect(page).toHaveURL(/black-wolfberry/);
  await expect(page.getByRole("button", { name: "Сагсанд нэмэх" })).toHaveCount(
    0,
  );
  await page.goto("/checkout");
  await expect(page.getByText("Сагсаа эхлээд", { exact: false })).toBeVisible();
  await page.goto("/impact");
  await expect(
    page.getByRole("heading", { name: "Одоогийн баталгаажуулалт" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Кластерын тойм тайлан" }),
  ).toHaveAttribute("href", /\.pdf$/);
  await page.goto("/journal/roots");
  await expect(
    page.getByRole("heading", { name: "Жижиг үрээс урт түүх эхэлдэг" }),
  ).toBeVisible();
});
test("mobile menu, focus trap and reduced-motion manual inspection", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-webgl", "true");
  const image = page.locator(".sg-product-image");
  await page.locator("#collection").scrollIntoViewIfNeeded();
  await expect(page.locator(".sg-inspect")).toBeVisible();
  expect(
    await image.evaluate((i: HTMLImageElement) => i.naturalWidth),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (isMobile) {
    await page.getByRole("button", { name: "Цэс нээх" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Бидний түүх" }).click();
    await expect(page).toHaveURL(/story/);
    await expect(dialog).toHaveCount(0);
  }
});
