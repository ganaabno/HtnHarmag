import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  View,
  PerspectiveCamera,
  useProgress,
  useGLTF,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Model, Lights } from "./cinematic-stage";
import { modelRegistry, type ModelId } from "./model-registry";
import { stepInspection, type InspectionState } from "./interaction";

export interface JourneyState {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  intro: number;
  switching: number;
  scroll: number;
  reduced: boolean;
  inspection: InspectionState;
}

class ModelBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function JourneyLoader({ ready }: { ready: boolean }) {
  const { progress, errors } = useProgress();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const update = () => {
      if (document.documentElement.dataset.webgl === "false")
        setDismissed(true);
    };
    window.addEventListener("hatan-render-support", update);
    update();
    // Slow/failed devices retain the honest product photograph and usable page.
    const deadline = window.setTimeout(() => setDismissed(true), 10000);
    return () => {
      clearTimeout(deadline);
      window.removeEventListener("hatan-render-support", update);
    };
  }, []);
  return (
    <div
      className={`journey-loader ${ready || dismissed || errors.length ? "is-loaded" : ""}`}
      aria-hidden="true"
    >
      <span>
        Сэргээнээ<span className="loader-sun">✳</span>
      </span>
      <small>ГОВИОС ТАНД · {Math.round(progress)}%</small>
      <div>
        <i style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
    </div>
  );
}

function JourneyProduct({
  state,
  product,
  onReady,
}: {
  state: RefObject<JourneyState>;
  product: ModelId;
  onReady: () => void;
}) {
  const travel = useRef<Group>(null),
    float = useRef<Group>(null),
    inspect = useRef<Group>(null);
  const previous = useRef({ scroll: 0, stillUntil: 0, float: 0 });
  const idleFrame = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { size, viewport, invalidate } = useThree();
  const mobile = size.width < 700;
  useEffect(() => {
    state.current.inspection.invalidate = invalidate;
    invalidate();
    return () => {
      state.current.inspection.invalidate = () => {};
    };
  }, [state, invalidate, product]);
  useEffect(() => {
    const collection = document.getElementById("collection");
    if (!collection) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          useGLTF.preload(modelRegistry.wolfberry.url);
          observer.disconnect();
        }
      },
      { rootMargin: "1000px" },
    );
    observer.observe(collection);
    return () => {
      observer.disconnect();
      clearTimeout(idleFrame.current);
    };
  }, []);
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener("sergeenee-frame", wake);
    return () => window.removeEventListener("sergeenee-frame", wake);
  }, [invalidate]);
  useFrame(({ clock }, delta) => {
    if (
      !travel.current ||
      !inspect.current ||
      !float.current ||
      document.hidden
    )
      return;
    const s = state.current;
    const page = document.querySelector(".sg-journey");
    if (page && page.getBoundingClientRect().bottom <= 0) {
      travel.current.visible = false;
      return;
    }
    travel.current.visible = true;
    const now = performance.now();
    const last = previous.current;
    if (Math.abs(s.scroll - last.scroll) > 0.05 || s.intro < 0.999)
      last.stillUntil = now + 160;
    last.scroll = s.scroll;
    const interactive = stepInspection(s.inspection, delta, now, {
      scroll: s.scroll,
      intro: s.intro < 0.999,
    });
    const floating =
      !s.reduced &&
      !s.inspection.engaged &&
      now > last.stillUntil &&
      Math.abs(s.switching) < 0.001;
    last.float = MathUtils.damp(
      last.float,
      floating ? 1 : 0,
      5,
      Math.min(delta, 0.05),
    );
    const time = clock.elapsedTime;
    float.current.position.y = Math.sin(time * 0.95) * 0.025 * last.float;
    float.current.rotation.set(
      Math.sin(time * 0.7) * 0.012 * last.float,
      Math.sin(time * 0.6) * 0.016 * last.float,
      Math.sin(time * 0.8) * 0.009 * last.float,
    );
    travel.current.position.set(
      (s.x + s.switching * 0.7) * viewport.width,
      (s.y + Math.abs(s.switching) * 0.045) * viewport.height +
        (1 - s.intro) * 5,
      s.z - Math.abs(s.switching) * 0.65,
    );
    travel.current.rotation.set(
      s.rx,
      s.ry + (1 - s.intro) * 0.9 + s.switching * 1.1,
      s.rz + (1 - s.intro) * -0.5 + s.switching * -0.15,
    );
    travel.current.scale.setScalar(
      s.scale * (mobile ? 0.69 : 1) * (1 - Math.abs(s.switching) * 0.12),
    );
    inspect.current.rotation.set(s.inspection.pitch, s.inspection.yaw, 0);
    if (interactive) invalidate();
    else if (!s.reduced) {
      clearTimeout(idleFrame.current);
      idleFrame.current = setTimeout(invalidate, mobile ? 33 : 16);
    }
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7.8]} fov={35} />
      <Lights />
      <group ref={travel}>
        <group ref={float}>
          <group ref={inspect}>
            <Model url={modelRegistry[product].url} onBounds={onReady} />
          </group>
        </group>
      </group>
    </>
  );
}

/** One persistent View + one product instance for every homepage chapter. */
export function JourneyView({
  state,
  product,
  onReady,
}: {
  state: RefObject<JourneyState>;
  product: ModelId;
  onReady: () => void;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const update = () =>
      setFailed(document.documentElement.dataset.webgl === "false");
    window.addEventListener("hatan-render-support", update);
    update();
    return () => window.removeEventListener("hatan-render-support", update);
  }, []);
  if (failed) return null;
  return (
    <ModelBoundary
      onFailure={() => {
        setFailed(true);
        document.documentElement.dataset.productFailed = "true";
        onReady();
      }}
    >
      <View className="journey-three-view" index={4}>
        <Suspense fallback={null}>
          <JourneyProduct state={state} product={product} onReady={onReady} />
        </Suspense>
      </View>
    </ModelBoundary>
  );
}
