import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
// Lenis's documented integration uses elapsed wall time, including slow frames.
gsap.ticker.lagSmoothing(0);
export { gsap, ScrollTrigger };
let activeScroll: Lenis | null = null;
/** Route-local anchors should not compete with the router's hash restoration. */
export function scrollToSection(selector: string) {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;
  if (activeScroll) activeScroll.scrollTo(target, { offset: -80, force: true });
  else target.scrollIntoView({ behavior: "instant", block: "start" });
}
export function useSmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let teardown = () => {};
    const configure = () => {
      teardown();
      teardown = () => {};
      if (media.matches) return;
      const lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        anchors: true,
      });
      activeScroll = lenis;
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      const stop = () =>
        document.querySelector('[data-state="open"][role="dialog"]') ||
        document.documentElement.dataset.viewerFullscreen === "true"
          ? lenis.stop()
          : lenis.start();
      const observer = new MutationObserver(stop);
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state"],
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-viewer-fullscreen"],
      });
      stop();
      teardown = () => {
        if (activeScroll === lenis) activeScroll = null;
        observer.disconnect();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    };
    configure();
    media.addEventListener("change", configure);
    return () => {
      media.removeEventListener("change", configure);
      teardown();
    };
  }, []);
}
