import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { products } from "@hatan/commerce";
export const Route = createFileRoute("/ingredients")({
  component: () => (
    <main className="page-shell ingredients-page">
      <p className="eyebrow">BOTANICAL NOTES</p>
      <h1>
        Орц бүрийн
        <br />
        <em>өөрийн түүх.</em>
      </h1>
      <p className="editorial-lede">
        Хармаг жимс болон улаан гоёо нь өөр өөр ургамлууд. Бүтээгдэхүүнийхээ
        бодит орцтой танилцаарай.
      </p>
      <div className="ingredients-grid">
        {products.map((p) => (
          <article key={p.id}>
            <img
              src={p.id === "sergeenee" ? p.image : "/images/berries.webp"}
              alt={p.title}
              loading="lazy"
            />
            <p className="eyebrow">{p.category}</p>
            <h2>{p.title}</h2>
            <p>{p.ingredients}</p>
            <Link
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="understated-link"
            >
              Мэдээлэл үзэх <ArrowUpRight size={17} />
            </Link>
          </article>
        ))}
      </div>
    </main>
  ),
});
