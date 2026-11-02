import {
  createRootRouteWithContext,
  Outlet,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  ShoppingBag,
  Menu,
  ArrowUpRight,
  X,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import {
  useCart,
  products,
  cartTotal,
  formatMNT,
  commerce,
} from "@hatan/commerce";
import { Button } from "@hatan/ui";
import { useSmoothScroll } from "@hatan/animations";
import { CinematicFooter } from "../features/footer/CinematicFooter";
const Canvas = lazy(() =>
  import("@hatan/three").then((m) => ({ default: m.GlobalCanvas })),
);
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Layout,
    errorComponent: ({ error }) => (
      <main className="page-shell">
        <h1>Түр алдаа гарлаа.</h1>
        <p>
          {error instanceof Error ? error.message : "Хуудсыг дахин ачаална уу."}
        </p>
        <Button onClick={() => window.location.reload()}>Дахин ачаалах</Button>
      </main>
    ),
  },
);
function Layout() {
  const ref = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cartOpen = useCart((s) => s.open);
  useSmoothScroll();
  useEffect(() => {
    const product = products.find((p) => path === `/products/${p.slug}`);
    document.title = product
      ? `${product.title} | Хатан Хармаг`
      : path === "/"
        ? "Хатан Хармаг — Байгалиас төрсөн."
        : "Хатан Хармаг — Говийн үнэ цэн";
  }, [path]);
  return (
    <div ref={ref} id="app-shell">
      <a href="#main-content" className="skip-link">
        Агуулга руу шилжих
      </a>
      <Header />
      <div id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
      <Footer />
      <CartDrawer />
      <Suspense fallback={null}>
        <Canvas
          eventSource={ref}
          animated={
            !cartOpen &&
            (path === "/" || path === "/products" || path === "/products/")
          }
        />
      </Suspense>
    </div>
  );
}
const links = [
  { to: "/products", label: "Бүтээгдэхүүн" },
  { to: "/story", label: "Бидний түүх" },
  { to: "/impact", label: "Байгальдаа" },
  { to: "/journal", label: "Тэмдэглэл" },
] as const;
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const cart = useCart();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    setMenu(false);
  }, [path]);
  return (
    <header
      className={`site-header ${scrolled || path !== "/" ? "solid" : ""}`}
    >
      <Link to="/" aria-label="Хатан Хармаг — нүүр" className="brand">
        <img src="/images/logo.png" alt="Hatan Harmag" width="58" height="58" />
        <span>
          Хатан Хармаг<small>THE SPIRIT OF GOBI</small>
        </span>
      </Link>
      <nav aria-label="Үндсэн цэс" className="desktop-nav">
        {links.map((l) => (
          <Link key={l.to} to={l.to} activeProps={{ className: "active" }}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <span className="language">
          MN <span>/ EN</span>
        </span>
        <button
          className="icon-button cart-trigger"
          onClick={() => cart.setOpen(true)}
          aria-label={`Сагс, ${cart.lines.reduce((s, l) => s + l.quantity, 0)} бүтээгдэхүүн`}
        >
          <ShoppingBag size={20} />
          <span>
            {cart.lines
              .reduce((s, l) => s + l.quantity, 0)
              .toString()
              .padStart(2, "0")}
          </span>
        </button>
        <Dialog.Root open={menu} onOpenChange={setMenu}>
          <Dialog.Trigger asChild>
            <button
              className="icon-button mobile-menu-trigger"
              aria-label="Цэс нээх"
            >
              <Menu />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="mobile-menu">
              <Dialog.Title className="eyebrow">Хатан Хармаг</Dialog.Title>
              <Dialog.Description className="sr-only">
                Үндсэн хуудаснууд
              </Dialog.Description>
              <Dialog.Close asChild>
                <button
                  className="icon-button drawer-close"
                  aria-label="Цэс хаах"
                >
                  <X />
                </button>
              </Dialog.Close>
              {links.map((l) => (
                <Link key={l.to} to={l.to}>
                  {l.label}
                  <ArrowUpRight />
                </Link>
              ))}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
function CartDrawer() {
  const { lines, open, setOpen, setQuantity } = useCart();
  const total = cartTotal(lines);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="dialog-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.aside
                className="cart-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 280 }}
              >
                <div className="drawer-heading">
                  <div>
                    <p className="eyebrow">YOUR LITTLE GOBI</p>
                    <Dialog.Title>Таны сагс</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="icon-button" aria-label="Сагс хаах">
                      <X />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="demo-notice">
                  Туршилтын дэлгүүр · бодит төлбөр авахгүй.
                </Dialog.Description>
                {lines.length === 0 ? (
                  <div className="empty-cart">
                    <ShoppingBag size={48} strokeWidth={1} />
                    <h3>Жижигхэн эхлэл.</h3>
                    <p>Таны сагс одоогоор хоосон байна.</p>
                    <Button asChild>
                      <Link to="/products" onClick={() => setOpen(false)}>
                        Бүтээгдэхүүн үзэх <ArrowRight size={17} />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="cart-lines">
                      {lines.map((l) => {
                        const p = products.find((p) => p.id === l.productId)!;
                        return (
                          <div key={l.productId} className="cart-line">
                            <img src={p.image} alt={p.title} />
                            <div>
                              <h3>{p.title}</h3>
                              <p>{p.variant.label}</p>
                              <strong>{formatMNT(p.price!)}</strong>
                              <div className="quantity">
                                <button
                                  aria-label={`${p.title} тоог багасгах`}
                                  onClick={() =>
                                    setQuantity(p.id, l.quantity - 1)
                                  }
                                >
                                  <Minus size={14} />
                                </button>
                                <span>{l.quantity}</span>
                                <button
                                  aria-label={`${p.title} тоог нэмэх`}
                                  disabled={l.quantity >= 20}
                                  onClick={() =>
                                    setQuantity(p.id, l.quantity + 1)
                                  }
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                className="text-button"
                                onClick={() => setQuantity(p.id, 0)}
                              >
                                Хасах
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="cart-bottom">
                      <p>
                        <span>Нийт дүн</span>
                        <strong>{formatMNT(total)}</strong>
                      </p>
                      <small>Хүргэлтийн бодит үйлчилгээ холбогдоогүй.</small>
                      <Button asChild>
                        <Link to="/checkout" onClick={() => setOpen(false)}>
                          Демо захиалга хийх <ArrowRight size={18} />
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="newsletter"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await commerce.subscribe(email);
          setStatus("Демо бүртгэл амжилттай. И-мэйл серверт илгээгээгүй.");
          setEmail("");
        } catch {
          setStatus("И-мэйл хаягаа шалгаад дахин оролдоно уу.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="newsletter-email">Говиос ирэх захидал.</label>
      <div>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="Таны и-мэйл хаяг"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button type="submit" disabled={busy} aria-label="Мэдээлэлд бүртгүүлэх">
          <ArrowUpRight />
        </button>
      </div>
      <small>Демо бүртгэл. Холбогдсон и-мэйл үйлчилгээ байхгүй.</small>
      <p role="status">{status}</p>
    </form>
  );
}
function Footer() {
  return <CinematicFooter newsletter={<Newsletter />} />;
}
