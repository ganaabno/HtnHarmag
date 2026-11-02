import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { products, formatMNT, useCart } from "@hatan/commerce";
import { Button } from "@hatan/ui";
import {
  Minus,
  Plus,
  RotateCcw,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
const ProductView = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.ProductView })),
);
export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const p = products.find((p) => p.slug === params.slug);
    if (!p) throw notFound();
    return p;
  },
  component: ProductDetail,
});
function ProductDetail() {
  const p = Route.useLoaderData();
  const [quantity, setQuantity] = useState(1);
  const [reset, setReset] = useState(0);

  const [fullscreen, setFullscreen] = useState(
    () => window.location.hash === "#inspect",
  );
  const add = useCart((s) => s.add);
  const viewer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.title = `${p.title} | Хатан Хармаг`;
    setQuantity(1);
  }, [p]);
  useEffect(() => {
    const exit = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", exit);
    return () => window.removeEventListener("keydown", exit);
  }, []);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.activeElement as HTMLElement;
    document.documentElement.dataset.viewerFullscreen = "true";
    viewer.current?.focus();
    return () => {
      delete document.documentElement.dataset.viewerFullscreen;
      previous?.focus({ preventScroll: true });
    };
  }, [fullscreen]);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    brand: { "@type": "Brand", name: "Hatan Harmag" },
    image: p.image,
    sku: p.id,
  };
  return (
    <main className="product-page page-shell">
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <Link to="/products" className="understated-link">
        <ArrowLeft size={16} /> Бүтээгдэхүүн
      </Link>
      <div className="detail-layout">
        <div
          ref={viewer}
          tabIndex={fullscreen ? -1 : undefined}
          role={fullscreen ? "dialog" : undefined}
          aria-modal={fullscreen || undefined}
          aria-label={
            fullscreen ? `${p.title} бүтэн дэлгэцийн загвар` : undefined
          }
          onKeyDown={(e) => {
            if (fullscreen && e.key === "Tab") {
              const buttons = Array.from(
                viewer.current?.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ) ?? [],
              );
              const current = buttons.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              e.preventDefault();
              buttons[
                (current + (e.shiftKey ? -1 : 1) + buttons.length) %
                  buttons.length
              ]?.focus();
            }
          }}
          className={`detail-viewer ${fullscreen ? "fullscreen-viewer" : ""}`}
        >
          <span className="eyebrow viewer-badge">EXPLORE IN 3D</span>
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
            />
          </Suspense>
          <div className="viewer-controls">
            <button
              className="icon-button outlined"
              aria-label="Загварыг анхны байрлалд оруулах"
              onClick={() => {
                setReset((v) => v + 1);
              }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="icon-button outlined"
              aria-label="Ойртуулах"

              onClick={() =>
                viewer.current?.querySelector(".product-view")?.dispatchEvent(
                  new CustomEvent("hatan-view-command", {
                    detail: "zoom-in",
                  }),
                )
              }
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="icon-button outlined"
              aria-label="Холдуулах"

              onClick={() =>
                viewer.current?.querySelector(".product-view")?.dispatchEvent(
                  new CustomEvent("hatan-view-command", {
                    detail: "zoom-out",
                  }),
                )
              }
            >
              <ZoomOut size={18} />
            </button>
            <button
              className="icon-button outlined"
              aria-label={
                fullscreen ? "Бүтэн дэлгэцээс гарах" : "Бүтэн дэлгэцээр үзэх"
              }
              onClick={() => setFullscreen((v) => !v)}
            >
              {fullscreen ? <X size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
          <span className="rotate-hint">
            ЧИРЖ ЭРГҮҮЛЭХ · ХОЁР ХУРУУГААР ОЙРТУУЛАХ
          </span>
        </div>
        <div className="detail-info">
          <p className="eyebrow">{p.category}</p>
          <h1>{p.title}</h1>
          <p className="product-english">{p.english}</p>
          <p className="product-description">{p.description}</p>
          <div className="variant-options">
            <button className="variant active" aria-pressed="true">
              {p.variant.label}
            </button>
          </div>
          <strong className="detail-price">
            {p.price === null ? "Үнэ лавлах" : formatMNT(p.price)}
          </strong>
          <p className="price-disclaimer">{p.priceNote}</p>
          {p.price !== null ? (
            <div className="detail-add">
              <div className="quantity">
                <button
                  aria-label="Тоо багасгах"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((v) => v - 1)}
                >
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  aria-label="Тоо нэмэх"
                  disabled={quantity >= 20}
                  onClick={() => setQuantity((v) => v + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
              <Button onClick={() => add(p, quantity)}>
                Сагсанд нэмэх <Plus size={18} />
              </Button>
            </div>
          ) : (
            <Button asChild>
              <a href="mailto:hatanharmag@gmail.com?subject=Чонон%20Хармаг%20үнийн%20лавлагаа">
                Үнэ, худалдан авах нөхцөл лавлах <ArrowUpRight size={18} />
              </a>
            </Button>
          )}
          <Accordion.Root
            type="multiple"
            className="product-accordion"
            defaultValue={["ingredients"]}
          >
            {[
              {
                id: "ingredients",
                title: "Орц, найрлага",
                content: <p>{p.ingredients}</p>,
              },
              {
                id: "facts",
                title: "Бүтээгдэхүүний мэдээлэл",
                content: (
                  <dl>
                    {p.facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                ),
              },
              {
                id: "nutrition",
                title: "Шим тэжээлийн мэдээлэл",
                content:
                  p.id === "sergeenee" ? (
                    <>
                      <p>Нийлүүлсэн танилцуулгын 100 г-д харгалзах хүснэгт:</p>
                      <dl>
                        {[
                          ["Илчлэг", "12.57 ккал"],
                          ["Нүүрс ус", "2.67"],
                          ["Эслэг", "1.04"],
                          ["Уураг", "0.39"],
                          ["Өөх тос", "0.04"],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <small>
                        Илчлэгээс бусад үзүүлэлтийн нэгжийг эх баримтад тусад нь
                        заагаагүй тул нэмж таамаглаагүй.
                      </small>
                    </>
                  ) : (
                    <p>
                      Баталгаажуулсан шим тэжээлийн хүснэгт нийлүүлэгдээгүй.
                      Шинжилгээний мэдээллийг үйлдвэрлэгчээс лавлана уу.
                    </p>
                  ),
              },
              {
                id: "delivery",
                title: "Захиалга, хүргэлтийн тухай",
                content: (
                  <p>
                    Энэ нь туршилтын дэлгүүр. Бодит төлбөр, хүргэлт, агуулахын
                    үлдэгдэлтэй холбогдоогүй. Бодитоор худалдан авах бол{" "}
                    <a href="tel:+97686740025">+976 8674 0025</a> дугаарт
                    холбогдоно уу.
                  </p>
                ),
              },
            ].map((a) => (
              <Accordion.Item value={a.id} key={a.id}>
                <Accordion.Header>
                  <Accordion.Trigger>
                    {a.title}
                    <ChevronDown size={17} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>{a.content}</Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
          <p className="source-note">Эх сурвалж: {p.source}</p>
        </div>
      </div>
      <section className="related-products">
        <p className="eyebrow">ALSO FROM OUR GOBI</p>
        <h2>
          Өөр нэг <em>байгалийн амт.</em>
        </h2>
        {products
          .filter((item) => item.id !== p.id)
          .map((item) => (
            <Link
              key={item.id}
              to="/products/$slug"
              params={{ slug: item.slug }}
              className="related-card"
            >
              <img src={item.image} alt={item.title} loading="lazy" />
              <div>
                <p className="eyebrow">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
      </section>
    </main>
  );
}
