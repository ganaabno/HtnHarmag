import { createFileRoute, Link } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  RotateCcw,
  Move,
  Plus,
  Minus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMotionPreference } from "../lib/useMotionPreference";
import { gsap, scrollToSection } from "@hatan/animations";
import { products, formatMNT, useCart } from "@hatan/commerce";
import type { JourneyState, ModelId } from "@hatan/three";
import {
  createInspectionState,
  bindInspection,
  resetInspection,
} from "@hatan/three/interaction";
const JourneyView = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.JourneyView })),
);
const JourneyLoader = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.JourneyLoader })),
);

import { useProductTimeline } from "../features/products/useProductTimeline";

export const Route = createFileRoute("/")({ component: Home });
const wake = () => window.dispatchEvent(new Event("sergeenee-frame"));
function Flower({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`gobi-flower ${className}`}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0 60 28 79 10 74 36 100 34 80 51 98 71 72 68 77 94 57 77 47 100 40 75 16 91 23 65 0 62 23 47 5 25 32 30 29 4 46 25Z" />
    </svg>
  );
}
function Home() {
  const root = useRef<HTMLElement>(null),
    drag = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const [ready, setReady] = useState(false),
    [active, setActive] = useState(0),
    [switching, setSwitching] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const switchTimeline = useRef<gsap.core.Timeline | null>(null);
  const waitingForModel = useRef(false);
  const state = useRef<JourneyState>({
    x: 0.14,
    y: -0.035,
    z: 0,
    rx: 0.035,
    ry: 0,
    rz: -0.15,
    scale: 1.2,
    intro: 0,
    switching: 0,
    scroll: 0,
    reduced: !!reduced,
    inspection: createInspectionState(),
  });
  const onReady = useCallback(() => {
    setReady(true);
    if (waitingForModel.current) {
      waitingForModel.current = false;
      switchTimeline.current?.play();
    }
    wake();
  }, []);
  const product = products[active];
  const add = useCart((s) => s.add);
  useEffect(() => {
    document.documentElement.classList.add("sergeenee-home");
    return () => {
      document.documentElement.classList.remove("sergeenee-home");
      waitingForModel.current = false;
      switchTimeline.current?.kill();
    };
  }, []);
  useEffect(() => {
    if (!drag.current) return;
    return bindInspection(drag.current, state.current.inspection, {
      hero: true,
    });
  }, []);
  useProductTimeline(root, state, ready, !!reduced);
  useEffect(() => {
    if (!reduced) return;
    switchTimeline.current?.kill();
    waitingForModel.current = false;
    state.current.switching = 0;
    setSwitching(false);
    wake();
  }, [reduced]);
  function select(direction: number) {
    if (switching) return;
    if (reduced) {
      setActive((i) => (i + direction + products.length) % products.length);
      setQuantity(1);
      state.current.switching = 0;
      resetInspection(state.current.inspection);
      wake();
      return;
    }
    setSwitching(true);
    resetInspection(state.current.inspection);
    const tl = gsap.timeline({
      onUpdate: wake,
      onComplete: () => setSwitching(false),
    });
    switchTimeline.current = tl;
    tl.to(state.current, {
      switching: direction,
      duration: 0.48,
      ease: "power3.in",
    })
      .call(() => {
        waitingForModel.current = true;
        tl.pause();
        setActive((i) => (i + direction + products.length) % products.length);
        setQuantity(1);
      })
      .set(state.current, { switching: -direction })
      .to(state.current, {
        switching: 0,
        duration: 0.85,
        ease: "power3.out",
      });
  }
  return (
    <main ref={root} className={`sg-journey ${ready ? "sg-ready" : ""}`}>
      <Suspense fallback={null}>
        <JourneyLoader ready={ready} />
        <JourneyView
          state={state}
          product={product.id as ModelId}
          onReady={onReady}
        />
      </Suspense>
      <section className="sg-section sg-hero">
        <div className="sg-grain" aria-hidden="true" />
        <p className="sg-kicker">
          ХАТАН ХАРМАГ PRESENTS <span>ӨМНӨГОВЬ, МОНГОЛ</span>
        </p>
        <h1 aria-label="Говиос. Сэргээнээ.">
          <span>ГОВИОС.</span>
          <span>СЭРГЭЭНЭЭ.</span>
        </h1>
        <Flower className="sg-hero-flower" />
        <div className="sg-stamp" aria-hidden="true">
          <span>МОНГОЛ</span>
          <b>150</b>
          <span>МЛ · СЭРГЭЭНЭЭ</span>
        </div>
        <img
          className="sg-product-image"
          src={product.image}
          alt={product.title}
        />
        <div className="sg-hero-bottom">
          <p>
            Говийн ургамал.
            <br />
            Өдөр бүрийн шинэ мөч.
          </p>
          <a
            className="sg-button"
            href="#collection"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#collection");
            }}
          >
            Өөрийн амтыг ол <ArrowUpRight size={20} />
          </a>
          <a
            href="#origin"
            className="sg-scroll"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#origin");
            }}
          >
            ГҮЙЛГЭЖ НЭЭГЭЭРЭЙ <ArrowDown size={17} />
          </a>
        </div>
        <div className="sg-hero-edition">
          <span>БАЙГАЛИАС ЭХЛЭЛТЭЙ.</span>
          <span>ӨДӨР ТУТАМД ЗОРИУЛАВ.</span>
        </div>
      </section>
      <div className="sg-ticker" aria-hidden="true">
        <span>ГОВИОС ТАНД</span>✳<span>ӨӨРИЙН ӨНГӨ. ӨӨРИЙН АМТ.</span>✳
        <span>СЭРГЭЭНЭЭ</span>✳<span>ГОВИОС ТАНД</span>✳
      </div>
      <section id="origin" className="sg-section sg-intro">
        <img
          className="sg-resting-fallback"
          src={product.image}
          alt={product.title}
        />
        <div className="sg-side-copy sg-right sg-reveal">
          <p className="sg-kicker">01 / A LITTLE GOBI. EVERY DAY.</p>
          <h2>
            ЖИЖИГ
            <br />
            САВЛАГАА.
            <br />
            <em>ТОМ ТҮҮХ.</em>
          </h2>
          <p>
            Говийн улаан гоёо, чихэр өвсний орцтой Сэргээнээ. Байгальтай
            холбогдох таны өдөр тутмын жижигхэн мөч.
          </p>
          <Link to="/story" className="sg-text-link">
            Говиос эхэлсэн түүх <ArrowUpRight size={19} />
          </Link>
        </div>
        <Flower className="sg-intro-flower" />
        <span className="sg-section-number">01 — МОНГОЛЫН ГОВИОС</span>
      </section>
      <section className="sg-section sg-dive" aria-label="Говийн амтыг нээ">
        <img
          className="sg-resting-fallback"
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
        <p className="sg-kicker">БАЙГАЛИАС УРАМ АВСАН. ТАНД ЗОРИУЛСАН.</p>
        <div className="sg-dive-streaks" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${i * 13}%`,
                top: `${(i * 17) % 80}%`,
                height: `${80 + i * 21}px`,
              }}
            />
          ))}
        </div>
        <h2 className="sg-dive-type">
          АМТ РУУ
          <br />
          <span>ШУМБА.</span>
        </h2>
        <Flower className="sg-dive-flower" />
        <span className="sg-section-number">
          02 — A TASTE OF SOMETHING DIFFERENT
        </span>
      </section>
      <section
        id="collection"
        className={`sg-section sg-collection sg-flavor-${active}`}
      >
        <div className="sg-carousel-top">
          <p className="sg-kicker">02 БҮТЭЭГДЭХҮҮН / НЭГ ГОВЬ</p>
          <h2>ӨӨРИЙН АМТЫГ ОЛ.</h2>
          <Link to="/products" className="sg-text-link">
            Бүгдийг үзэх <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sg-flavor-rings" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="sg-carousel-arrows">
          <button
            onClick={() => select(-1)}
            disabled={switching}
            aria-label="Өмнөх бүтээгдэхүүн"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => select(1)}
            disabled={switching}
            aria-label="Дараах бүтээгдэхүүн"
          >
            <ArrowRight />
          </button>
        </div>
        <div
          ref={drag}
          className="sg-inspect"
          role="region"
          aria-label="Бүтээгдэхүүнийг чирж эргүүлэх"
          tabIndex={0}
          data-lenis-prevent
        >
          <span className="sr-only">
            Чирж эсвэл сум товчоор эргүүлнэ. Home товчоор анхны байрлалд
            оруулна.
          </span>
        </div>
        <div className="sg-inspect-tools">
          <span>
            <Move size={13} /> ЧИРЖ ЭРГҮҮЛЭХ
          </span>
          <button
            onClick={() => resetInspection(state.current.inspection)}
            aria-label="Анхны байрлалд оруулах"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <img
          className="sg-carousel-fallback"
          src={product.image}
          alt={product.title}
        />
        <div className="sg-carousel-bottom" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: 0.2 }}
            >
              <span className="sg-kicker">
                0{active + 1} / 02 · {product.variant.label}
              </span>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
            </motion.div>
          </AnimatePresence>
          <div className="sg-buy">
            {product.price !== null ? (
              <>
                <div className="sg-price">
                  <strong>{formatMNT(product.price)}</strong>
                  <span>ТУРШИЛТЫН НЭГЖ ҮНЭ</span>
                </div>
                <div className="sg-buy-row">
                  <div className="sg-quantity">
                    <button
                      aria-label="Тоог багасгах"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((n) => n - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      aria-label="Тоог нэмэх"
                      disabled={quantity >= 20}
                      onClick={() => setQuantity((n) => n + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    className="sg-button"
                    onClick={() => add(product, quantity)}
                  >
                    Сагсанд нэмэх <Plus size={18} />
                  </button>
                </div>
              </>
            ) : (
              <Link
                className="sg-button"
                to="/products/$slug"
                params={{ slug: product.slug }}
              >
                Дэлгэрэнгүй үзэх <ArrowUpRight size={18} />
              </Link>
            )}
            <Link
              to="/products/$slug"
              params={{ slug: product.slug }}
              className="sg-product-detail"
            >
              Бүтээгдэхүүнтэй танилцах <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="sg-section sg-benefit-one">
        <img
          className="sg-resting-fallback"
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
        <div className="sg-side-copy sg-left sg-reveal">
          <p className="sg-kicker">03 / ROOTED IN NATURE</p>
          <h2>
            ӨӨРИЙН
            <br />
            ГАРАЛ.
            <br />
            <em>ӨӨРИЙН ОНЦЛОГ.</em>
          </h2>
          <p>
            Сэргээнээний орцод говийн улаан гоёо, чихэр өвс багтдаг.
            Бүтээгдэхүүний найрлага, савлагааны мэдээлэлтэй танилцаарай.
          </p>
          <Link to="/ingredients" className="sg-text-link">
            Орцын тухай <ArrowUpRight size={18} />
          </Link>
        </div>
        <Flower className="sg-benefit-flower" />
        <span className="sg-section-number">
          БАЙГАЛИЙН ҮНЭ ЦЭНИЙГ ӨДӨР ТУТАМД.
        </span>
      </section>
      <section className="sg-section sg-benefit-two">
        <img
          className="sg-resting-fallback"
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
        <div className="sg-side-copy sg-right sg-reveal">
          <p className="sg-kicker">04 / THE SPIRIT OF GOBI</p>
          <h2>
            НЭГ ГОВЬ.
            <br />
            ОЛОН ТҮҮХ.
            <br />
            <em>ХАМТДАА.</em>
          </h2>
          <p>
            Хатан Хармаг кластер нь 2012 оноос говийн ургамлыг хамгаалж,
            үржүүлэх ажлыг хөгжүүлж ирсэн. Бидний эхлэл, хүмүүс, бодит ажлын
            тухай.
          </p>
          <Link to="/impact" className="sg-text-link">
            Бидний хийж буй ажил <ArrowUpRight size={18} />
          </Link>
        </div>
        <img
          className="sg-botanical-photo"
          src="/images/berries.webp"
          alt="Кластерын тайланд нийтэлсэн хармаг жимсний гэрэл зураг"
          loading="lazy"
        />
        <span className="sg-photo-note">
          ХАРМАГ · КЛАСТЕРЫН ТАЙЛАНГИЙН ГЭРЭЛ ЗУРАГ
        </span>
      </section>
      <section className="sg-section sg-finale">
        <img
          className="sg-resting-fallback"
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
        <p className="sg-kicker">ГОВИОС ЭХЛЭЛТЭЙ. ТАНТАЙ ҮРГЭЛЖИЛНЭ.</p>
        <h2>
          ӨДӨР БҮР.
          <br />
          <span>СЭРГЭЭНЭЭ.</span>
        </h2>
        <Flower className="sg-finale-flower" />
        <div className="sg-finale-bottom">
          <p>
            Байгалиас төрсөн.
            <br />
            Таны хэмнэлд зориулсан.
          </p>
          <a
            href="#collection"
            className="sg-button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#collection");
            }}
          >
            Дахин нэгийг? <ArrowUpRight size={20} />
          </a>
          <span>
            ХҮН БА БАЙГАЛИЙН
            <br />
            АМИН ХОЛБОО.
          </span>
        </div>
      </section>
    </main>
  );
}
