import { describe, it, expect, vi } from "vitest";
import {
  normalizeLines,
  cartTotal,
  products,
  checkoutSchema,
  commerce,
  type CartLine,
} from "@hatan/commerce";
describe("catalog integrity and demo commerce", () => {
  it("ignores malformed entries from browser storage", () => {
    expect(
      normalizeLines([
        null,
        "broken",
        { quantity: -2 },
      ] as unknown as CartLine[]),
    ).toEqual([]);
  });
  it("does not sell a product without a supplied price", () => {
    expect(
      normalizeLines([
        { productId: "wolfberry", variantId: "ten-bags", quantity: 1 },
      ]),
    ).toEqual([]);
  });
  it("merges quantities and rejects unknown products, invalid variants and quantities", () => {
    const lines = normalizeLines([
      { productId: "sergeenee", variantId: "single", quantity: 15 },
      { productId: "sergeenee", variantId: "single", quantity: 15 },
      { productId: "made-up", variantId: "single", quantity: 1 },
      { productId: "sergeenee", variantId: "other", quantity: 4 },
      { productId: "sergeenee", variantId: "single", quantity: NaN },
    ]);
    expect(lines).toEqual([
      { productId: "sergeenee", variantId: "single", quantity: 20 },
    ]);
    expect(cartTotal(lines)).toBe(58000);
  });
  it("requires a valid contact and explicit demo acknowledgement", () => {
    expect(
      checkoutSchema.safeParse({
        name: "Бат",
        email: "invalid",
        phone: "123",
        address: "УБ",
        consent: false,
      }).success,
    ).toBe(false);
  });
  it("recomputes totals from the catalog and stores no customer details", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("sessionStorage", { setItem });
    const order = await commerce.createOrder(
      {
        name: "Бат",
        email: "bat@example.com",
        phone: "99112233",
        address: "Улаанбаатар, Сүхбаатар дүүрэг",
        consent: true,
      },
      [{ productId: "sergeenee", variantId: "single", quantity: 2 }],
    );
    expect(order.mode).toBe("demo");
    expect(order.total).toBe(products[0].price! * 2);
    expect(setItem.mock.calls[0][1]).not.toContain("bat@example.com");
    expect(setItem.mock.calls[0][1]).not.toContain("99112233");
    vi.unstubAllGlobals();
  });
  it("refuses an empty order", async () => {
    await expect(
      commerce.createOrder(
        {
          name: "Бат",
          email: "bat@example.com",
          phone: "99112233",
          address: "Улаанбаатар, Сүхбаатар дүүрэг",
          consent: true,
        },
        [],
      ),
    ).rejects.toThrow();
  });
});
