import { useState, lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Leaf,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from "lucide-react";
import { commerce, products, useCart, formatMNT } from "@hatan/commerce";
import { Button } from "@hatan/ui";
const ProductView = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.ProductView })),
);
export function ProductCollection({ catalog = false }: { catalog?: boolean }) {
  const {
    data = products,
    isError,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: commerce.listProducts });
  const [selected, setSelected] = useState(0);
  const add = useCart((s) => s.add);
  const p = data[selected];
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const viewer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.activeElement as HTMLElement;
    document.documentElement.dataset.viewerFullscreen = "true";
    viewer.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key !== "Tab") return;
      const controls = Array.from(
        viewer.current?.querySelectorAll<HTMLElement>(
          'button, [tabindex="0"]',
        ) ?? [],
      );
      const current = controls.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      controls[
        (current + (event.shiftKey ? -1 : 1) + controls.length) %
          controls.length
      ]?.focus();
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      delete document.documentElement.dataset.viewerFullscreen;
      window.removeEventListener("keydown", keyboard);
      previous?.focus({ preventScroll: true });
    };
  }, [fullscreen]);
  const select = (delta: number) =>
    setSelected((v) => (v + delta + data.length) % data.length);
  return (
    <section
      className={`collection section-pad ${catalog ? "catalog" : ""}`}
      id="collection"
      style={{ "--product-color": p.color } as React.CSSProperties}
      aria-label="Бүтээгдэхүүний цуглуулга"
    >
      <div className="section-title-row">
        <div>
          <p className="eyebrow">
            THE GOBI COLLECTION / {data.length.toString().padStart(2, "0")}
          </p>
          <h2>
            Өөрийн хэмнэлд.
            <br />
            <em>Байгалийн амт.</em>
          </h2>
        </div>
        <p className="section-aside">
          Том хотын хэмнэл дунд
          <br />
          говьтой холбогдох жижигхэн мөч.
        </p>
      </div>
      {isError && (
        <p role="alert">
          Каталогийг ачаалж чадсангүй.{" "}
          <button onClick={() => refetch()}>Дахин оролдох</button>
        </p>
      )}
      <div className="collection-layout">
        <div
          ref={viewer}
          className={`collection-visual ${fullscreen ? "collection-fullscreen" : ""}`}
          tabIndex={0}
          role={fullscreen ? "dialog" : "region"}
          aria-modal={fullscreen || undefined}
          aria-roledescription="carousel"
          aria-label="3D бүтээгдэхүүн, сум товчоор сонгоно уу"
          onKeyDown={(e) => {
            if ((e.target as HTMLElement).closest(".product-view")) return;
            if (e.key === "Escape") setFullscreen(false);
            if (e.key === "ArrowRight") {
              e.preventDefault();
              select(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              select(-1);
            }
          }}
        >
          <span className="collection-ghost" aria-hidden="true">
            {selected === 0 ? "Гоёо." : "Хармаг."}
          </span>
          <div className="product-halo" />
          <Suspense
            fallback={
              <img className="standalone-product" src={p.image} alt={p.title} />
            }
          >
            <ProductView
              url={p.model}
              image={p.image}
              label={p.title}
              interactive
              reset={reset}
              zoom={zoom}
            />
          </Suspense>

          <span className="rotate-hint">ЧИРЖ ЭРГҮҮЛЭХ · 360°</span>
          <div className="collection-inspection-tools">
            <button
              aria-label="Загварыг дахин тохируулах"
              onClick={() => setReset((v) => v + 1)}
            >
              <RotateCcw size={17} />
            </button>
            <button
              aria-label="Ойртуулах"
              onClick={() => setZoom((v) => v + 1)}
            >
              <ZoomIn size={17} />
            </button>
            <button
              aria-label="Холдуулах"
              onClick={() => setZoom((v) => v - 1)}
            >
              <ZoomOut size={17} />
            </button>
            <button
              aria-label={fullscreen ? "Бүтэн дэлгэц хаах" : "Бүтэн дэлгэц"}
              onClick={() => setFullscreen((v) => !v)}
            >
              {fullscreen ? <X size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
          <div className="carousel-controls">
            <button
              className="icon-button outlined"
              onClick={() => select(-1)}
              aria-label="Өмнөх бүтээгдэхүүн"
            >
              <ArrowLeft size={20} />
            </button>
            <span>
              {(selected + 1).toString().padStart(2, "0")}{" "}
              <i>/ {data.length.toString().padStart(2, "0")}</i>
            </span>
            <button
              className="icon-button outlined"
              onClick={() => select(1)}
              aria-label="Дараагийн бүтээгдэхүүн"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <div className="collection-info">
          <AnimatePresence mode="wait">
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="eyebrow">
                <Leaf size={14} /> {p.category}
              </p>
              <h3>{p.title}</h3>
              <p className="product-english">{p.english}</p>
              <p className="product-description">{p.description}</p>
              <div
                className="variant-options"
                role="group"
                aria-label="Савлагааны сонголт"
              >
                <button className="variant active" aria-pressed="true">
                  {p.variant.label}
                </button>
              </div>
              <div className="product-purchase">
                <div>
                  <strong>
                    {p.price === null ? "Үнэ лавлах" : formatMNT(p.price)}
                  </strong>
                  <small>
                    {p.price === null
                      ? "Үнэ, үлдэгдлийг баталгаажуулна уу."
                      : "Демо үнэ · одоогийн худалдааны үнэ биш"}
                  </small>
                </div>
                {p.price !== null ? (
                  <Button onClick={() => add(p)}>
                    Сагслах <Plus size={18} />
                  </Button>
                ) : (
                  <Button asChild>
                    <a href="mailto:hatanharmag@gmail.com?subject=Чонон%20Хармаг%20үнийн%20лавлагаа">
                      Лавлах <ArrowUpRight size={18} />
                    </a>
                  </Button>
                )}
              </div>
              <Link
                className="understated-link product-detail-link"
                to="/products/$slug"
                params={{ slug: p.slug }}
              >
                Дэлгэрэнгүй үзэх <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          </AnimatePresence>
          <div
            className="collection-tabs"
            role="group"
            aria-label="Бүтээгдэхүүн сонгох"
          >
            {data.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setSelected(i)}
                className={i === selected ? "active" : ""}
                aria-pressed={i === selected}
              >
                <span>{(i + 1).toString().padStart(2, "0")}</span>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
