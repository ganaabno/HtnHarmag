import { createFileRoute } from "@tanstack/react-router";
import { ProductCollection } from "../features/products/Collection";
export const Route = createFileRoute("/products/")({
  component: () => (
    <main className="catalog-page">
      <ProductCollection catalog />
      <p className="catalog-disclaimer">
        Зөвхөн нийлүүлсэн загвар, баримтаар баталгаажсан хоёр бүтээгдэхүүн.
        Дэлгүүр одоогоор демо горимд ажиллаж байна.
      </p>
    </main>
  ),
});
