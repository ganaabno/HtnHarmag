import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
export function JournalCard({
  image,
  label,
  title,
  slug,
}: {
  image: string;
  label: string;
  title: string;
  slug: string;
}) {
  return (
    <Link to="/journal/$slug" params={{ slug }} className="journal-card">
      <div className="journal-image">
        <img src={`/images/${image}.webp`} alt={title} loading="lazy" />
      </div>
      <p className="eyebrow">{label}</p>
      <h3>
        {title} <ArrowUpRight size={20} />
      </h3>
    </Link>
  );
}
