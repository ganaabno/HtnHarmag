import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  Component,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  View,
  useGLTF,
  Environment,
  Lightformer,
  ContactShadows,
  PerspectiveCamera,
  AdaptiveDpr,
  Line,
} from "@react-three/drei";
import {
  Box3,
  Vector3,
  Group,
  MathUtils,
  Mesh,
  PointLight,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  Euler,
  Matrix4,
  type Material,
} from "three";
import {
  createInspectionState,
  bindInspection,
  stepInspection,
  setInspectionBounds,
  resetInspection,
  zoomInspection,
  type InspectionState,
} from "./interaction";
import { Berry, NativePlant, useBotanicalAssets } from "./botanicals";
import { modelRegistry } from "./model-registry";
export interface SceneTimeline {
  progress: number;
  reduced: boolean;
  intro?: number;
  reveal?: number;
  berries?: number;
  light?: number;
  inspection?: InspectionState;
}
// A portal may mount an already cached model before its HTML listener commits.
// Persist readiness as well as emitting events so that fallback visibility cannot race.
const readyModels = new Set<string>();
export interface FooterTimeline {
  progress: number;
  reduced: boolean;
  pointerX?: number;
  pointerY?: number;
}
function useVisible() {
  const element = useRef<HTMLDivElement>(null),
    active = useRef(false);
  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        active.current = !!entries[0]?.isIntersecting;
        if (active.current) window.dispatchEvent(new Event("hatan-scene-wake"));
      },
      { rootMargin: "80px" },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return { element, active };
}
export function Model({
  url,
  opacity = 1,
  onBounds,
}: {
  url: string;
  opacity?: number;
  onBounds?: (radius: number, size: Vector3) => void;
}) {
  const { scene } = useGLTF(url);
  const { object, scale, radius, dimensions, materials } = useMemo(() => {
    const object = scene.clone(true);
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object),
      size = box.getSize(new Vector3()),
      center = box.getCenter(new Vector3()),
      scale = 2.65 / size.y,
      materials: Material[] = [];
    object.position.sub(center);
    object.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (opacity < 1) {
          const source = Array.isArray(o.material) ? o.material : [o.material];
          const clones = source.map((m) => {
            const c = m.clone();
            c.transparent = true;
            c.opacity = opacity;
            c.depthWrite = false;
            materials.push(c);
            return c;
          });
          o.material = Array.isArray(o.material) ? clones : clones[0];
        }
      }
    });
    return {
      object,
      scale,
      radius: size.length() * 0.5 * scale,
      dimensions: size.clone().multiplyScalar(scale),
      materials,
    };
  }, [scene, opacity]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(() => {
    onBounds?.(radius, dimensions);
    readyModels.add(url);
    window.dispatchEvent(new CustomEvent("hatan-model-ready", { detail: url }));
  }, [url, onBounds, radius, dimensions]);
  return (
    <group scale={scale} dispose={null}>
      <primitive object={object} dispose={null} />
    </group>
  );
}
export function preloadProducts() {
  useGLTF.preload(modelRegistry.sergeenee.url);
}
export function Lights({ night = false }: { night?: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.3 : 0.45} />
      <directionalLight
        position={[3, 5, 5]}
        intensity={night ? 1.8 : 1.7}
        color="#ffe6be"
      />
      <directionalLight
        position={[-4, 2, 2]}
        intensity={night ? 0.8 : 0.9}
        color="#d1b8e5"
      />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.5}
          scale={[4, 6, 1]}
          position={[4, 3, 4]}
          rotation-y={-0.6}
        />
        <Lightformer
          intensity={1.5}
          scale={[3, 5, 1]}
          position={[-4, 1, 3]}
          rotation-y={0.7}
        />
        <Lightformer
          intensity={3}
          color="#dcb36f"
          scale={[3, 3, 1]}
          position={[1, 4, -3]}
        />
      </Environment>
    </>
  );
}
function BerryBranch() {
  const assets = useBotanicalAssets();
  return (
    <group rotation={[0.12, -0.2, -0.32]}>
      <Line
        points={[
          [-0.7, -0.9, 0],
          [-0.35, -0.25, 0],
          [0.05, 0.35, 0.04],
          [0.4, 1, 0],
        ]}
        color="#86734b"
        lineWidth={4}
      />
      {Array.from({ length: 13 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const y = -0.55 + i * 0.105;
        const x = y * 0.55 + side * (0.19 + (i % 3) * 0.04);
        return (
          <group key={i}>
            <Line
              points={[
                [y * 0.55, y, 0],
                [x, y + 0.36, (i % 3) * 0.035],
              ]}
              color="#81724e"
              lineWidth={1.8}
            />
            <Berry
              assets={assets}
              position={[x, y + 0.17, (i % 3) * 0.035]}
              scale={0.8 + (i % 4) * 0.09}
              index={i}
            />
          </group>
        );
      })}
      <group position={[0.2, 0.55, -0.04]} scale={0.75}>
        <NativePlant assets={assets} />
      </group>
    </group>
  );
}
function StoryScene({
  timeline,
  active,
}: {
  timeline: RefObject<SceneTimeline>;
  active: RefObject<boolean>;
}) {
  const assets = useBotanicalAssets();
  const stage = useRef<Group>(null),
    spin = useRef<Group>(null),
    cluster = useRef<Group>(null),
    nature = useRef<Group>(null),
    accent = useRef<Group>(null);
  const { viewport, size, invalidate } = useThree();
  const mobile = size.width < 700;
  const fallback = useRef(createInspectionState());
  const inspection = timeline.current.inspection ?? fallback.current;
  const framing = useMemo(
    () => ({
      box: new Box3(),
      rotated: new Box3(),
      matrix: new Matrix4(),
      rotation: new Euler(),
      halfSize: new Vector3(),
    }),
    [],
  );
  const bounds = useCallback(
    (r: number, dimensions: Vector3) => {
      setInspectionBounds(inspection, r);
      framing.box.min.copy(dimensions).multiplyScalar(-0.5);
      framing.box.max.copy(dimensions).multiplyScalar(0.5);
    },
    [inspection, framing],
  );
  useEffect(() => {
    inspection.invalidate = invalidate;
    return () => {
      inspection.invalidate = () => {};
    };
  }, [inspection, invalidate]);
  useFrame(({ camera }, delta) => {
    if (!active.current || document.hidden) return;
    const t = timeline.current,
      p = t.progress,
      intro = t.reveal ?? 1;
    const dt = Math.min(delta, 0.1);
    const origin =
      MathUtils.smoothstep(p, 0.12, 0.25) *
      (1 - MathUtils.smoothstep(p, 0.4, 0.52));
    const future = MathUtils.smoothstep(p, 0.74, 0.86);
    const running = stepInspection(inspection, delta, performance.now(), {
      intro: (t.intro ?? 1) < 0.99,
      scroll: p,
    });
    let settling = false;
    if (stage.current) {
      stage.current.visible = intro > 0.001 && origin < 0.98;
      const targetScale =
        (mobile ? 0.72 : size.width < 1000 ? 0.95 : 1.29) *
        (0.91 + intro * 0.09) *
        (1 - origin * 0.8) *
        (1 - future * 0.1);
      const targetX = mobile ? 0 : viewport.width * 0.235;
      const targetY = (mobile ? -0.73 : 0.03) - (1 - intro) * 0.3;
      settling =
        Math.abs(stage.current.scale.x - targetScale) > 0.001 ||
        Math.abs(stage.current.position.y - targetY) > 0.001;
      stage.current.position.set(
        targetX,
        MathUtils.damp(stage.current.position.y, targetY, 7, dt),
        0,
      );
      stage.current.scale.setScalar(
        MathUtils.damp(stage.current.scale.x, targetScale, 7, dt),
      );
      stage.current.rotation.y = (1 - intro) * -0.35;
    }
    if (spin.current)
      spin.current.rotation.set(inspection.pitch, inspection.yaw, -0.045);
    if (cluster.current) {
      cluster.current.visible = origin > 0.01;
      cluster.current.position.set(
        mobile ? 0 : viewport.width * 0.23,
        mobile ? -0.7 : -0.08,
        0,
      );
      cluster.current.scale.setScalar(origin * (mobile ? 1.15 : 1.65));
      cluster.current.rotation.y = (p - 0.3) * 0.5;
    }
    if (nature.current) nature.current.visible = future > 0.05;
    if (accent.current) {
      accent.current.visible = p < 0.14;
      accent.current.position.set(
        (mobile ? 0 : viewport.width * 0.235) + (mobile ? 0.55 : 0.85),
        mobile ? -1.78 : -1.68,
        -0.35,
      );
      accent.current.scale.setScalar(intro * (mobile ? 0.85 : 1.15));
    }
    framing.rotation.set(
      inspection.pitch,
      inspection.yaw + (1 - intro) * -0.35,
      -0.045,
    );
    framing.matrix.makeRotationFromEuler(framing.rotation);
    framing.rotated.copy(framing.box).applyMatrix4(framing.matrix);
    framing.rotated
      .getSize(framing.halfSize)
      .multiplyScalar((stage.current?.scale.x ?? 1) * 0.5);
    const tangent = Math.tan((35 * Math.PI) / 360);
    const safeDistance =
      Math.max(
        (Math.abs(stage.current?.position.y ?? 0) + framing.halfSize.y) /
          tangent,
        (Math.abs(stage.current?.position.x ?? 0) + framing.halfSize.x) /
          ((tangent * size.width) / size.height),
      ) *
        1.03 +
      framing.halfSize.z;
    const targetZ = Math.max(
      safeDistance,
      inspection.distance + (1 - (t.intro ?? 1)) * 0.8,
    );
    settling = settling || Math.abs(camera.position.z - targetZ) > 0.001;
    camera.position.set(
      inspection.pointerX * 0.018,
      0,
      MathUtils.damp(camera.position.z, targetZ, 7, dt),
    );
    camera.lookAt(0, 0, 0);
    if (running || settling || (t.intro ?? 1) < 0.999) invalidate();
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7.2]} fov={35} />
      <Lights />
      <directionalLight position={[2, 4, -3]} color="#ffd8c3" intensity={2.5} />
      <group ref={stage} scale={0.8} position={[0, -0.3, 0]}>
        <group ref={spin}>
          <Suspense fallback={null}>
            <Model url={modelRegistry.sergeenee.url} onBounds={bounds} />
          </Suspense>
        </group>
      </group>
      <group ref={cluster} visible={false}>
        <BerryBranch />
      </group>
      <group ref={accent} rotation-z={-0.22}>
        <NativePlant assets={assets} />
      </group>
      <group
        ref={nature}
        visible={false}
        position={[mobile ? -0.9 : viewport.width * 0.4, -1.8, -0.5]}
        scale={0.8}
      >
        <NativePlant assets={assets} />
      </group>
      <ContactShadows
        position={[
          mobile ? 0 : viewport.width * 0.235,
          mobile ? -1.98 : -1.93,
          0,
        ]}
        opacity={0.35}
        color="#170b14"
        scale={5}
        far={3}
        blur={3.5}
        resolution={128}
        frames={2}
      />
    </>
  );
}
function ProductScene({
  url,
  inspection,
  interactive,
  active,
}: {
  url: string;
  inspection: InspectionState;
  interactive: boolean;
  previewUrl?: string;
  active: RefObject<boolean>;
}) {
  const product = useRef<Group>(null);
  const { invalidate, size, performance: quality } = useThree();
  const held = useRef(false);
  const framing = useMemo(
    () => ({
      box: new Box3(
        new Vector3(-0.8, -1.325, -0.2),
        new Vector3(0.8, 1.325, 0.2),
      ),
      rotated: new Box3(),
      matrix: new Matrix4(),
      rotation: new Euler(),
      halfSize: new Vector3(),
    }),
    [],
  );
  const bounds = useCallback(
    (r: number, dimensions: Vector3) => {
      setInspectionBounds(inspection, r);
      framing.box.min.copy(dimensions).multiplyScalar(-0.5);
      framing.box.max.copy(dimensions).multiplyScalar(0.5);
    },
    [inspection, framing],
  );
  useEffect(() => {
    inspection.invalidate = invalidate;
    invalidate();
    return () => {
      inspection.invalidate = () => {};
    };
  }, [inspection, invalidate]);
  useFrame(({ camera }, rawDelta) => {
    if (!active.current || document.hidden) return;
    if (inspection.pointers.size && !held.current) quality.regress();
    held.current = inspection.pointers.size > 0;
    const running = stepInspection(inspection, rawDelta, performance.now());
    if (product.current) {
      product.current.rotation.set(inspection.pitch, inspection.yaw, 0);
      product.current.position.y = 0;
    }
    // Fit the rotated box, rather than a height-only bound: sideways cartons and
    // pitched pouches must also stay inside narrow touch viewports at max zoom.
    framing.rotation.set(inspection.pitch, inspection.yaw, 0);
    framing.matrix.makeRotationFromEuler(framing.rotation);
    framing.rotated.copy(framing.box).applyMatrix4(framing.matrix);
    framing.rotated.getSize(framing.halfSize).multiplyScalar(0.5);
    const aspect = size.width / size.height;
    const tangent = Math.tan((35 * Math.PI) / 360);
    const safeDistance =
      Math.max(
        framing.halfSize.y / tangent,
        framing.halfSize.x / (tangent * aspect),
      ) *
        1.1 +
      framing.halfSize.z;
    camera.position.set(
      0,
      0,
      Math.max(
        safeDistance,
        inspection.distance * (aspect < 0.65 ? 1.16 : 0.78),
      ),
    );
    camera.lookAt(0, 0, 0);
    if (running) invalidate();
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7.2]} fov={35} />
      <Lights />
      <group ref={product}>
        <Suspense fallback={null}>
          <Model url={url} onBounds={bounds} />
        </Suspense>
      </group>
      <Suspense fallback={null}>
        <ContactShadows
          position={[0, -1.39, 0]}
          opacity={0.24}
          scale={5}
          blur={2.8}
          far={3}
          resolution={128}
          frames={2}
        />
      </Suspense>
    </>
  );
}
function FooterScene({
  timeline,
  active,
}: {
  timeline: RefObject<FooterTimeline>;
  active: RefObject<boolean>;
}) {
  const product = useRef<Group>(null),
    plant = useRef<Group>(null),
    light = useRef<PointLight>(null),
    assets = useBotanicalAssets();
  const { size, invalidate } = useThree();
  const mobile = size.width < 700;
  const anchorX = mobile ? 0 : (size.width / size.height) * 3.78 * 0.235;
  useFrame(({ camera }, delta) => {
    if (!active.current || document.hidden) return;
    const pointer = {
      x: timeline.current.pointerX ?? 0,
      y: timeline.current.pointerY ?? 0,
    };
    const dt = Math.min(0.05, delta),
      p = timeline.current.progress,
      x = anchorX + pointer.x * 0.035,
      z = mobile ? 5.8 : 6,
      settling =
        Math.abs(camera.position.x - pointer.x * 0.09) > 0.001 ||
        Math.abs(camera.position.z - z) > 0.002;
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointer.x * 0.09,
      4,
      dt,
    );
    camera.position.z = MathUtils.damp(camera.position.z, z, 5, dt);
    camera.lookAt(0, -0.05, 0);
    if (product.current) {
      product.current.scale.setScalar(mobile ? 1.02 : 1.13);
      product.current.position.set(
        x,
        0.02 + (1 - MathUtils.smoothstep(p, 0, 0.65)) * 0.08,
        0,
      );
      product.current.rotation.set(0.03, -0.32 + pointer.x * 0.035, -0.035);
    }
    if (plant.current)
      plant.current.scale.setScalar(MathUtils.smoothstep(p, 0.35, 0.95));
    if (light.current) light.current.position.x = 1.5 + pointer.x * 0.8;
    if (settling) invalidate();
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8.5]} fov={35} />
      <Lights night />
      <pointLight
        ref={light}
        position={[1.5, 3, -1]}
        color="#f3b963"
        intensity={8}
        distance={12}
      />

      <group
        ref={product}
        position={[mobile ? 0 : 2, 0, 0]}
        scale={mobile ? 1.02 : 1.13}
      >
        <Suspense fallback={null}>
          <Model url={modelRegistry.sergeenee.url} />
        </Suspense>
      </group>
      <ContactShadows
        position={[anchorX, -1.5, 0]}
        color="#110a16"
        opacity={0.5}
        scale={7}
        far={4}
        blur={3}
        frames={2}
        resolution={128}
      />
      <group
        ref={plant}
        position={[mobile ? -0.7 : anchorX + 0.9, -1.62, -0.3]}
      >
        <NativePlant assets={assets} />
      </group>
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    document.documentElement.dataset.webgl = "false";
    window.dispatchEvent(new Event("hatan-webgl-failed"));
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function ProductView({
  url,
  image,
  label,
  interactive = true,
  reset = 0,
  zoom = 0,
  className = "",
  previewUrl,
}: {
  url: string;
  image: string;
  label: string;
  interactive?: boolean;
  reset?: number;
  zoom?: number;
  className?: string;
  previewUrl?: string;
}) {
  const { element, active } = useVisible();
  const [supported, setSupported] = useState(true),
    [ready, setReady] = useState(false),
    [visited, setVisited] = useState(false);
  const inspection = useMemo(() => createInspectionState(), [url]),
    commands = useRef({ reset, zoom });
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisited(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, [element]);
  useEffect(() => {
    if (!element.current || !interactive || !supported) return;
    return bindInspection(element.current, inspection);
  }, [element, inspection, interactive, supported]);
  useEffect(() => {
    if (reset !== commands.current.reset) resetInspection(inspection);
    else if (zoom !== commands.current.zoom)
      zoomInspection(inspection, (commands.current.zoom - zoom) * 0.55);
    commands.current = { reset, zoom };
  }, [inspection, reset, zoom]);
  useEffect(() => {
    setReady(readyModels.has(url));
    const ready = (event: Event) => {
      if ((event as CustomEvent<string>).detail === url) setReady(true);
    };
    window.addEventListener("hatan-model-ready", ready);
    return () => window.removeEventListener("hatan-model-ready", ready);
  }, [url]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setSupported(document.documentElement.dataset.webgl !== "false");
    update();
    media.addEventListener("change", update);
    window.addEventListener("hatan-render-support", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("hatan-render-support", update);
    };
  }, []);
  return (
    <div
      ref={element}
      className={`product-view ${ready ? "model-ready" : ""} ${interactive ? "inspectable" : ""} ${className}`}
      style={{ touchAction: interactive && supported ? "none" : undefined }}
      role={interactive ? "region" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`${label}, ${interactive ? "эргүүлж үзэх 3D загвар" : "3D загвар"}`}
      aria-describedby={
        interactive
          ? `inspection-help-${url.includes("wolfberry") ? "wolfberry" : "sergeenee"}`
          : undefined
      }
    >
      <img className="model-fallback" src={image} alt={label} />
      {interactive && (
        <span
          className="sr-only"
          id={`inspection-help-${url.includes("wolfberry") ? "wolfberry" : "sergeenee"}`}
        >
          Чирж эргүүлнэ. Хоёр хуруугаар эсвэл хулганы дугуйгаар ойртуулна. Сум
          товчоор эргүүлж, нэмэх хасах товчоор томруулна. Home эсвэл хоёр дарж
          анхны байрлалд оруулна.
        </span>
      )}
      {supported && visited && (
        <SceneBoundary fallback={null}>
          <View className="three-view" index={2}>
            <Suspense fallback={null}>
              <ProductScene
                key={url}
                url={url}
                inspection={inspection}
                interactive={interactive}
                previewUrl={previewUrl}
                active={active}
              />
            </Suspense>
          </View>
        </SceneBoundary>
      )}
    </div>
  );
}
export function StoryView({
  timeline,
}: {
  timeline: RefObject<SceneTimeline>;
}) {
  const { element, active } = useVisible();
  return (
    <View ref={element} className="story-three-view" index={1}>
      <Suspense fallback={null}>
        <StoryScene timeline={timeline} active={active} />
      </Suspense>
    </View>
  );
}
export function FooterView({
  timeline,
}: {
  timeline: RefObject<FooterTimeline>;
}) {
  const { element, active } = useVisible();
  return (
    <View ref={element} className="footer-three-view" index={3}>
      <Suspense fallback={null}>
        <FooterScene timeline={timeline} active={active} />
      </Suspense>
    </View>
  );
}
export function GlobalCanvas({
  eventSource,
}: {
  eventSource: RefObject<HTMLElement | null>;
  animated?: boolean;
}) {
  const [supported, setSupported] = useState(false),
    [lost, setLost] = useState(false);
  useEffect(() => {
    const fail = () => setLost(true);
    window.addEventListener("hatan-webgl-failed", fail);
    return () => window.removeEventListener("hatan-webgl-failed", fail);
  }, []);
  useEffect(() => {
    const canvas = document.createElement("canvas"),
      gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }),
      capable = !!gl && navigator.hardwareConcurrency > 2;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const okay = capable;
      document.documentElement.dataset.webgl = String(okay);
      setSupported(okay);
      window.dispatchEvent(new Event("hatan-render-support"));
      if (okay) preloadProducts();
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (!supported || lost) return null;
  return (
    <SceneBoundary fallback={null}>
      <Canvas
        className="global-canvas"
        frameloop="demand"
        eventSource={eventSource as RefObject<HTMLElement>}
        eventPrefix="client"
        dpr={[
          0.8,
          Math.min(
            window.devicePixelRatio,
            window.innerWidth < 768 ? 1.2 : 1.5,
          ),
        ]}
        camera={{ position: [0, 0, 7.2], fov: 35 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = SRGBColorSpace;
          document.documentElement.dataset.webgl = "true";
          if (import.meta.env.DEV)
            gl.domElement.addEventListener("hatan-renderer-stats", (event) => {
              const detail = (event as CustomEvent<Record<string, number>>)
                .detail;
              Object.assign(detail, {
                geometries: gl.info.memory.geometries,
                textures: gl.info.memory.textures,
                programs: gl.info.programs?.length ?? 0,
                calls: gl.info.render.calls,
              });
            });
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            document.documentElement.dataset.webgl = "false";
            window.dispatchEvent(new Event("hatan-render-support"));
            setLost(true);
          });
        }}
      >
        <View.Port />
        <AdaptiveDpr />
        <InvalidateOnInput />
      </Canvas>
    </SceneBoundary>
  );
}
function InvalidateOnInput() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const update = () => invalidate();
    for (const event of ["scroll", "resize", "pointermove", "hatan-scene-wake"])
      window.addEventListener(event, update, { passive: true });
    return () => {
      for (const event of [
        "scroll",
        "resize",
        "pointermove",
        "hatan-scene-wake",
      ])
        window.removeEventListener(event, update);
    };
  }, [invalidate]);
  return null;
}
