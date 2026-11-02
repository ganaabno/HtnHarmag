import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { articles, report, brochure } from "../lib/editorial";
export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const a = articles.find((a) => a.slug === params.slug);
    if (!a) throw notFound();
    return a;
  },
  component: Article,
});
function Article() {
  const a = Route.useLoaderData();
  return (
    <main className="page-shell article-page">
      <Link to="/journal" className="understated-link">
        <ArrowLeft size={16} /> Тэмдэглэлүүд
      </Link>
      <p className="eyebrow">{a.category}</p>
      <h1>{a.title}</h1>
      <p className="editorial-lede">{a.intro}</p>
      <img
        className="article-image"
        src={`/images/${a.image}.webp`}
        alt={a.title}
      />
      <div className="editorial-body">
        {a.paragraphs.map((p) => (
          <p key={p.slice(0, 30)}>{p}</p>
        ))}
        <p className="source-note">
          Фото болон мэдээллийн эх сурвалж: нийлүүлсэн компанийн баримтууд.
          Эрүүл мэндийн зөвлөгөө, хараат бус судалгааны дүгнэлт биш.
        </p>
        <div className="source-links">
          <a href={report} target="_blank" rel="noreferrer">
            Кластерын тайлан <ArrowUpRight size={16} />
          </a>
          <a href={brochure} target="_blank" rel="noreferrer">
            Бүтээгдэхүүний танилцуулга <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </main>
  );
}
