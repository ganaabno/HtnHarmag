import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ArrowUp, Leaf } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { gsap, ScrollTrigger } from "@hatan/animations";
import type { FooterTimeline } from "@hatan/three";
const FooterView = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.FooterView })),
);

export function CinematicFooter({ newsletter }: { newsletter: ReactNode }) {
  const root = useRef<HTMLElement>(null),
    timeline = useRef<FooterTimeline>({ progress: 0, reduced: false });
  const reduced = useReducedMotion();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    timeline.current.reduced = !!reduced;
    if (reduced || !root.current || path === "/") return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".closing-chapter",
          start: "top 90%",
          end: "bottom 30%",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (s) => {
            timeline.current.progress = s.progress;
          },
        },
      });
      tl.fromTo(
        ".closing-horizon",
        { opacity: 0.12, scale: 0.88 },
        { opacity: 1, scale: 1.04, duration: 0.8, ease: "none" },
        0,
      )
        .fromTo(
          ".closing-line-one .closing-line-inner",
          { yPercent: 105 },
          { yPercent: 0, duration: 0.24, ease: "power2.out" },
          0.04,
        )
        .fromTo(
          ".closing-line-two .closing-line-inner",
          { yPercent: 105 },
          { yPercent: 0, duration: 0.26, ease: "power2.out" },
          0.13,
        )
        .fromTo(
          ".closing-heading",
          { "--letter-light": "0%" },
          { "--letter-light": "100%", duration: 0.5, ease: "none" },
          0.38,
        )
        .fromTo(
          ".closing-notes",
          { opacity: 0.35, y: 20 },
          { opacity: 1, y: 0, duration: 0.35 },
          0.3,
        );
      tl.to({}, { duration: 0.12 }, 0.88);
      gsap.fromTo(
        ".footer-signature-word",
        { yPercent: 45, opacity: 0.3 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".footer-signature",
            start: "top 97%",
            end: "top 65%",
            scrub: 0.7,
          },
        },
      );
    }, root);
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, [path, reduced]);
  return (
    <footer ref={root} className="footer cinematic-footer" id="contact">
      {path !== "/" && (
        <section
          className="closing-chapter"
          aria-label="Байгальдаа буцаан өгнө"
        >
          <div className="closing-backdrop" aria-hidden="true" />
          <div className="closing-horizon" aria-hidden="true" />
          <div className="closing-topline">
            <span className="eyebrow">
              <Leaf size={13} /> THE LAND THAT GIVES BACK
            </span>
            <span>ӨМНӨГОВЬ · МОНГОЛ</span>
          </div>
          <h2 className="closing-heading">
            <span className="closing-line closing-line-one">
              <span className="closing-line-inner">Байгалиас.</span>
            </span>
            <span className="closing-line closing-line-two">
              <span className="closing-line-inner">Байгальдаа.</span>
            </span>
          </h2>
          <div
            className="closing-landscape"
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              timeline.current.pointerX =
                ((event.clientX - box.left) / box.width) * 2 - 1;
              timeline.current.pointerY =
                1 - ((event.clientY - box.top) / box.height) * 2;
              window.dispatchEvent(new Event("hatan-scene-wake"));
            }}
            onPointerLeave={() => {
              timeline.current.pointerX = 0;
              timeline.current.pointerY = 0;
              window.dispatchEvent(new Event("hatan-scene-wake"));
            }}
          >
            <img
              className="footer-static-product"
              src="/images/sergeenee.png"
              alt="Сэргээнээ — говийн ургамлын орцтой ундаа"
              loading="lazy"
            />
            {!reduced && (
              <Suspense fallback={null}>
                <FooterView timeline={timeline} />
              </Suspense>
            )}
            <div className="closing-notes">
              <span className="closing-coordinate">01 / A SHARED TOMORROW</span>
              <h3>
                Өнөөдрийн сонголт.
                <br />
                <em>Маргаашийн үндэс.</em>
              </h3>
              <p>
                Хүн ба байгалийн амин холбоо.
                <br />
                Говийн ургамлыг хамгаалж, үржүүлэх
                <br />
                нэгэн зорилгын төлөө.
              </p>
              <Link to="/impact" className="understated-link">
                Байгальдаа үлдээх үнэ цэн <ArrowUpRight size={16} />
              </Link>
              <small>
                Ургах дүрслэл нь кампанит ажлын зорилгыг бэлгэдэнэ.
                <br />
                Баталгаажсан тариалалтын тоо биш.
              </small>
            </div>
          </div>
          <span className="closing-caption">
            БАЙГАЛИЙН ӨГӨӨЖИЙГ ХҮРТЭХДЭЭ, БАЙГАЛЬДАА ЭЭЛТЭЙ БАЙЯ.
          </span>
        </section>
      )}
      <div className="footer-information">
        <div className="footer-information-top">
          <Link to="/" className="footer-brand">
            <img
              src="/images/logo.png"
              width="64"
              height="64"
              alt="Hatan Harmag"
            />
            <span>
              Хатан Хармаг<small>ХҮН БАЙГАЛИЙН АМИН ХЭЛХЭЭ</small>
            </span>
          </Link>
          <a
            className="footer-return"
            href="#main-content"
            aria-label="Хуудасны эхэнд очих"
          >
            <ArrowUp size={18} />
          </a>
        </div>
        <div className="footer-information-grid">
          <nav aria-label="Бүтээгдэхүүн ба компани">
            <p className="footer-column-label">ТАНИЛЦАХ</p>
            <Link to="/products">
              Бүтээгдэхүүн <ArrowUpRight size={13} />
            </Link>
            <Link to="/story">
              Бидний түүх <ArrowUpRight size={13} />
            </Link>
            <Link to="/ingredients">
              Байгалийн орц <ArrowUpRight size={13} />
            </Link>
            <Link to="/impact">
              Байгальдаа <ArrowUpRight size={13} />
            </Link>
            <Link to="/journal">
              Тэмдэглэлүүд <ArrowUpRight size={13} />
            </Link>
          </nav>
          <div className="footer-contact">
            <p className="footer-column-label">ХОЛБОГДОХ</p>
            <a href="mailto:hatanharmag@gmail.com">
              hatanharmag@gmail.com <ArrowUpRight size={14} />
            </a>
            <a href="tel:+97686740025">
              +976 8674 0025 <ArrowUpRight size={14} />
            </a>
            <p>
              Говийн баялаг.
              <br />
              Таны өдөр тутмын үнэ цэн.
            </p>
          </div>
          {newsletter}
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} Хатан Хармаг.</span>
          <div>
            <Link to="/privacy" hash="privacy">
              Нууцлал
            </Link>
            <Link to="/privacy" hash="demo-terms">
              Үйлчилгээний нөхцөл
            </Link>
          </div>
          <span>МОНГОЛД УРЛАВ · ГОВИОС УРАМ АВАВ</span>
        </div>
      </div>
      <div className="footer-signature" aria-label="Hatan Harmag">
        <div className="footer-signature-mask">
          <p className="footer-signature-word" aria-hidden="true">
            HATAN HARMAG
          </p>
        </div>
        <p className="footer-signature-tagline">
          Говийн баялаг. Ирээдүйн үнэ цэн.
        </p>
      </div>
    </footer>
  );
}
