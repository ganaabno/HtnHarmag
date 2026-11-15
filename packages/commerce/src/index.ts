import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

export interface Product {
  id: string;
  slug: string;
  title: string;
  english: string;
  category: string;
  description: string;
  ingredients: string;
  model: string;
  image: string;
  color: string;
  variant: { id: string; label: string };
  price: number | null;
  priceNote: string;
  facts: { label: string; value: string }[];
  source: string;
}
export const products: Product[] = [
  {
    id: "sergeenee",
    slug: "sergeenee",
    title: "Сэргээнээ",
    english: "A little Gobi. Every day.",
    category: "Гоёоны орцтой ундаа",
    description:
      "Говийн улаан гоёоны орцтой, өдөр тутмын хэмнэлд тань зориулсан ундаа. Байгалийн үнэ цэнийг энгийн нэг мөчид.",
    ingredients:
      "Цэвэршүүлсэн ус, улаан гоёо, чихэр өвс, нимбэгийн хүчил (хүчиллэг тохируулагч), байгалийн гаралтай чихрийн амт оруулагч.",
    model: "/models/sergeenee_surface_refined_repaired.glb",
    image: "/images/sergeenee.png",
    color: "#C57A34",
    variant: { id: "single", label: "1 ширхэг · 150 мл" },
    price: 2900,
    priceNote:
      "Туршилтын үнэ. Нийлүүлсэн 1,000 ширхэгийн үнийн саналын нэгж үнэ; одоогийн жижиглэнгийн үнэ биш.",
    facts: [
      { label: "Орцын онцлог", value: "Улаан гоёо · чихэр өвс" },
      { label: "Илчлэг / 100 г", value: "12.57 ккал" },
      { label: "Найрлагын тэмдэглэл", value: "Будагч, нөөшлөгч ороогүй" },
      { label: "Савлагаа", value: "150 мл · уутан савлагаа" },
    ],
    source: "Сэргээнээ гоёо танилцуулга.pdf",
  },
  {
    id: "wolfberry",
    slug: "black-wolfberry",
    title: "Чонон Хармаг",
    english: "Wild fruit of Gobi.",
    category: "Хатаасан хармаг жимс",
    description:
      "Говийн жимсгэний өөрийн өнгө, өөрийн амт. QN Black Wolfberry — байгалийн цэвэр амтыг аяганд тань.",
    ingredients: "Хатаасан чонон хармаг жимс.",
    model: "/models/wolfberry.glb",
    image: "/images/wolfberry.png",
    color: "#59236A",
    variant: { id: "ten-bags", label: "1 хайрцаг · 10 уут" },
    price: null,
    priceNote:
      "Баталгаажсан үнэ, үлдэгдэл ирээгүй. Худалдан авах нөхцөлийг биднээс лавлана уу.",
    facts: [
      { label: "Савлагаа", value: "10 уут" },
      { label: "Орц", value: "Хатаасан чонон хармаг" },
      {
        label: "Хадгалалт",
        value: "Нарны шууд тусгалаас хол, хуурай, сэрүүн нөхцөлд",
      },
      { label: "Амт", value: "Байгалийн цэвэр амт" },
    ],
    source: "Бүтээгдэхүүний нийлүүлсэн савлагаа / QN GLB",
  },
];
export const formatMNT = (amount: number) =>
  `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}
export const normalizeLines = (lines: CartLine[]): CartLine[] => {
  const map = new Map<string, CartLine>();
  for (const line of lines) {
    if (!line || typeof line !== "object") continue;
    const p = products.find(
      (p) =>
        p.id === line.productId &&
        p.variant.id === line.variantId &&
        p.price !== null,
    );
    if (!p || !Number.isFinite(line.quantity) || line.quantity < 1) continue;
    const key = `${p.id}:${p.variant.id}`;
    map.set(key, {
      productId: p.id,
      variantId: p.variant.id,
      quantity: Math.min(
        20,
        Math.floor(line.quantity) + (map.get(key)?.quantity ?? 0),
      ),
    });
  }
  return [...map.values()];
};
export const cartTotal = (lines: CartLine[]) =>
  normalizeLines(lines).reduce(
    (sum, l) =>
      sum +
      (products.find((p) => p.id === l.productId)?.price ?? 0) * l.quantity,
    0,
  );
interface CartState {
  lines: CartLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (p: Product, quantity?: number) => void;
  setQuantity: (id: string, n: number) => void;
  clear: () => void;
}
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (p, quantity = 1) =>
        set((s) => ({
          lines: normalizeLines([
            ...s.lines,
            { productId: p.id, variantId: p.variant.id, quantity },
          ]),
          open: true,
        })),
      setQuantity: (id, n) =>
        set((s) => ({
          lines: normalizeLines(
            s.lines.map((l) =>
              l.productId === id ? { ...l, quantity: n } : l,
            ),
          ),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "hatan-cart-v1",
      partialize: (s) => ({ lines: s.lines }),
      merge: (stored, current) => ({
        ...current,
        lines: normalizeLines(
          Array.isArray((stored as { lines?: unknown })?.lines)
            ? (stored as { lines: CartLine[] }).lines
            : [],
        ),
      }),
    },
  ),
);
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ бүтнээр оруулна уу."),
  email: z.email("И-мэйл хаягаа шалгана уу."),
  phone: z
    .string()
    .regex(/^(\+976[ -]?)?\d{8}$/, "8 оронтой утасны дугаар оруулна уу."),
  address: z
    .string()
    .trim()
    .min(8, "Хүргэлтийн хаягаа дэлгэрэнгүй оруулна уу."),
  consent: z.boolean().refine((v) => v, "Демо захиалга болохыг зөвшөөрнө үү."),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;
export interface DemoOrder {
  id: string;
  createdAt: string;
  lines: CartLine[];
  total: number;
  mode: "demo";
}
const delay = () => new Promise((resolve) => setTimeout(resolve, 350));
export const commerce = {
  async listProducts() {
    await delay();
    return products;
  },
  async createOrder(
    values: CheckoutValues,
    raw: CartLine[],
  ): Promise<DemoOrder> {
    checkoutSchema.parse(values);
    const lines = normalizeLines(raw);
    if (!lines.length) throw new Error("Таны сагс хоосон байна.");
    await delay();
    const order: DemoOrder = {
      id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      lines,
      total: cartTotal(lines),
      mode: "demo",
    };
    // No customer PII or payment data is stored or transmitted by the demo adapter.
    sessionStorage.setItem("hatan-last-order", JSON.stringify(order));
    return order;
  },
  async subscribe(email: string) {
    z.email().parse(email);
    await delay();
    return { mode: "demo" as const };
  },
};
