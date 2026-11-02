import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@hatan/animations";
import type { JourneyState } from "@hatan/three";
import { resetInspection } from "@hatan/three/interaction";
import {
  sampleJourney,
  type JourneyKey,
  type JourneyPose,
} from "../../lib/journey-motion";

const wake = () => window.dispatchEvent(new Event("sergeenee-frame"));

export function useProductTimeline(
  root: RefObject<HTMLElement | null>,
  state: RefObject<JourneyState>,
  ready: boolean,
  reduced: boolean,
) {
  useEffect(() => {
    if (!root.current) return;
    let disposed = false;
    const ctx = gsap.context(() => {
      const pose = state.current;
      pose.reduced = reduced;
      if (ready) {
        if (reduced || window.scrollY > 80 || pose.intro >= 0.99)
          pose.intro = 1;
        else {
          gsap
            .timeline({ onUpdate: wake })
            .to(pose, { intro: 1, duration: 1.7, ease: "power3.out" }, 0.15)
            .fromTo(
              ".sg-hero h1 span",
              { yPercent: 32, rotate: 3, autoAlpha: 0 },
              {
                yPercent: 0,
                rotate: 0,
                autoAlpha: 1,
                duration: 1.05,
                stagger: 0.13,
                ease: "power3.out",
              },
              0.12,
            )
            .fromTo(
              ".sg-hero > .sg-kicker, .sg-hero-bottom",
              { opacity: 0, y: 16 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: "power2.out",
              },
              0.75,
            );
        }
      }
      const mm = gsap.matchMedia();
      mm.add(
        { mobile: "(max-width: 699px)", desktop: "(min-width: 700px)" },
        (match) => {
          const mobile = !!match.conditions?.mobile;
          const element = root.current!;
          const playhead = { distance: 0 };
          let keys: JourneyKey[] = [],
            collectionTop = 0,
            collectionBottom = 0;
          // Pinning changes layout only. It never competes for product transforms.
          const pin = reduced
            ? null
            : ScrollTrigger.create({
                trigger: ".sg-dive",
                start: "top top",
                end: () => `+=${window.innerHeight * (mobile ? 0.65 : 0.95)}`,
                pin: true,
                anticipatePin: 1,
                refreshPriority: 2,
                invalidateOnRefresh: true,
              });
          const measure = () => {
            const height = window.innerHeight;
            const top = (selector: string) =>
              element
                .querySelector<HTMLElement>(selector)!
                .getBoundingClientRect().top + window.scrollY;
            const fullTurn = reduced ? 0 : Math.PI * 4;
            const stops: { selector: string; pose: JourneyPose }[] = [
              {
                selector: ".sg-hero",
                pose: {
                  x: mobile ? 0 : 0.14,
                  y: -0.035,
                  z: 0,
                  rx: 0.035,
                  ry: 0,
                  rz: -0.15,
                  scale: mobile ? 1.12 : 1.2,
                },
              },
              {
                selector: ".sg-intro",
                pose: {
                  x: mobile ? 0 : -0.25,
                  y: mobile ? -0.19 : -0.02,
                  z: -0.35,
                  rx: 0.08,
                  ry: 0.28,
                  rz: 0.16,
                  scale: mobile ? 0.95 : 1.06,
                },
              },
              {
                selector: ".sg-dive",
                pose: {
                  x: 0,
                  y: mobile ? -0.06 : 0,
                  z: mobile ? 0.45 : 0.75,
                  rx: 0.18,
                  ry: Math.PI * 2,
                  rz: -0.38,
                  scale: mobile ? 1.03 : 1.12,
                },
              },
              {
                selector: ".sg-collection",
                pose: {
                  x: 0,
                  y: mobile ? 0.005 : 0.04,
                  z: 0,
                  rx: 0.035,
                  ry: fullTurn,
                  rz: -0.06,
                  scale: mobile ? 1.04 : 0.88,
                },
              },
              {
                selector: ".sg-benefit-one",
                pose: {
                  x: mobile ? 0 : 0.255,
                  y: mobile ? -0.21 : 0,
                  z: 0,
                  rx: 0.06,
                  ry: fullTurn + 0.1,
                  rz: -0.13,
                  scale: mobile ? 0.84 : 1.13,
                },
              },
              {
                selector: ".sg-benefit-two",
                pose: {
                  x: mobile ? 0 : -0.255,
                  y: mobile ? -0.21 : 0,
                  z: -0.25,
                  rx: -0.04,
                  ry: fullTurn + 0.32,
                  rz: 0.14,
                  scale: mobile ? 0.84 : 1.13,
                },
              },
              {
                selector: ".sg-finale",
                pose: {
                  x: 0,
                  y: mobile ? -0.03 : -0.01,
                  z: 0.25,
                  rx: 0.035,
                  ry: fullTurn,
                  rz: -0.16,
                  scale: mobile ? 1.05 : 1.22,
                },
              },
            ];
            if (reduced)
              for (const stop of stops)
                Object.assign(stop.pose, { rx: 0.035, ry: 0, rz: -0.06, z: 0 });
            keys = [{ at: 0, pose: stops[0].pose }];
            let previous = stops[0].pose;
            for (const stop of stops.slice(1)) {
              const arrival =
                stop.selector === ".sg-dive" && pin
                  ? pin.start
                  : top(stop.selector);
              keys.push({
                at: Math.max(
                  keys[keys.length - 1].at + 1,
                  arrival - height * 0.82,
                ),
                pose: previous,
              });
              keys.push({
                at: arrival,
                pose: stop.pose,
                arc: reduced
                  ? undefined
                  : { y: mobile ? 0.018 : 0.045, z: 0.12 },
              });
              previous = stop.pose;
              if (stop.selector === ".sg-dive" && pin) {
                // The dive rolls in ONE direction, then decelerates into the label.
                keys.push({
                  at: pin.start + (pin.end - pin.start) * 0.52,
                  pose: {
                    ...previous,
                    x: mobile ? 0.025 : 0.09,
                    y: -0.045,
                    rx: -0.16,
                    ry: Math.PI * 3.15,
                    rz: 0.3,
                    z: mobile ? 0.7 : 1.15,
                  },
                });
                previous = { ...previous, ry: fullTurn, rx: 0.09, rz: -0.18 };
                keys.push({ at: pin.end, pose: previous });
              }
            }
            const finaleBottom =
              top(".sg-finale") +
              element.querySelector<HTMLElement>(".sg-finale")!.offsetHeight;
            keys.push({
              at: Math.max(
                keys[keys.length - 1].at + 1,
                finaleBottom - height * 0.68,
              ),
              pose: previous,
            });
            keys.push({
              at: finaleBottom,
              pose: { ...previous, y: 0.65, z: -1, scale: 0.01 },
            });
            collectionTop = top(".sg-collection");
            collectionBottom =
              collectionTop +
              element.querySelector<HTMLElement>(".sg-collection")!
                .offsetHeight;
          };
          const render = () => {
            sampleJourney(keys, playhead.distance, pose);
            pose.scroll = playhead.distance;
            const inspection = pose.inspection;
            if (
              (pose.scroll < collectionTop - window.innerHeight * 0.55 ||
                pose.scroll > collectionBottom - window.innerHeight * 0.5) &&
              inspection.engaged &&
              !inspection.resetting &&
              !inspection.pointers.size
            )
              resetInspection(inspection);
            // Read-only telemetry lets browser checks verify real resting poses.
            element.dataset.journeyPose = [
              pose.x,
              pose.y,
              pose.ry,
              pose.rz,
              pose.scale,
            ]
              .map((n) => n.toFixed(4))
              .join(",");
            wake();
          };
          measure();
          gsap.fromTo(
            playhead,
            { distance: 0 },
            {
              distance: () => element.offsetHeight,
              ease: "none",
              onUpdate: render,
              scrollTrigger: {
                trigger: element,
                start: "top top",
                end: () => `+=${element.offsetHeight}`,
                scrub: reduced ? true : mobile ? 0.38 : 0.55,
                invalidateOnRefresh: true,
                onRefresh: (self) => {
                  measure();
                  playhead.distance = self.progress * element.offsetHeight;
                  render();
                },
              },
            },
          );
          if (!reduced) {
            gsap.to(".sg-dive-type", {
              yPercent: -12,
              rotate: -7,
              ease: "none",
              scrollTrigger: {
                trigger: ".sg-dive",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.65,
              },
            });
            gsap.to(".sg-dive-streaks", {
              yPercent: 36,
              xPercent: -8,
              ease: "none",
              scrollTrigger: {
                trigger: ".sg-dive",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.65,
              },
            });
            gsap.utils
              .toArray<HTMLElement>(".sg-reveal")
              .forEach((el) =>
                gsap.fromTo(
                  el,
                  { y: 30, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.85,
                    ease: "power2.out",
                    scrollTrigger: {
                      trigger: el,
                      start: "top 88%",
                      toggleActions: "play none none reverse",
                    },
                  },
                ),
              );
            for (const selector of [
              ".sg-hero-flower",
              ".sg-intro-flower",
              ".sg-benefit-flower",
              ".sg-finale-flower",
            ])
              gsap.to(selector, {
                rotation: "+=32",
                yPercent: -12,
                ease: "none",
                scrollTrigger: {
                  trigger: selector,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.9,
                },
              });
          }
          return () => {
            pin?.kill();
          };
        },
      );
      document.fonts.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
      return () => mm.revert();
    }, root);
    return () => {
      disposed = true;
      ctx.revert();
    };
  }, [root, state, ready, reduced]);
}
