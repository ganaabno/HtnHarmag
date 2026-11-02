import { createFileRoute } from "@tanstack/react-router";
import { articles } from "../lib/editorial";
import { JournalCard } from "../features/JournalCard";
export const Route = createFileRoute("/journal/")({
  component: () => (
    <main className="page-shell journal-page">
      <p className="eyebrow">FIELD NOTES / ХАТАН ХАРМАГ</p>
      <h1>
        Говиос ирэх
        <br />
        <em>тэмдэглэлүүд.</em>
      </h1>
      <p className="editorial-lede">
        Байгаль, гарал үүсэл, биднийг холбох түүхүүд. Нийлүүлсэн эх баримтад
        тулгуурласан тэмдэглэл.
      </p>
      <div className="journal-grid">
        {articles.map((a) => (
          <JournalCard
            key={a.slug}
            image={a.image}
            label={a.category}
            title={a.title}
            slug={a.slug}
          />
        ))}
      </div>
    </main>
  ),
});
