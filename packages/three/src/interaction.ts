/** The single owner of inspection rotation/zoom. No camera or GSAP writes here. */
export type InteractionPhase =
  "INTRO" | "IDLE" | "USER_INTERACTING" | "SCROLL_ANIMATING" | "RESETTING";
export interface InspectionState {
  sleeping: boolean;
  waking: boolean;
  phase: InteractionPhase;
  yaw: number;
  pitch: number;
  distance: number;
  targetYaw: number;
  targetPitch: number;
  targetDistance: number;
  velocityYaw: number;
  velocityPitch: number;
  minimumDistance: number;
  maximumDistance: number;
  pointers: Map<number, { x: number; y: number; time: number }>;
  pinchSpan: number;
  armed: boolean;
  engaged: boolean;
  resetting: boolean;
  pointerX: number;
  pointerY: number;
  hover: boolean;
  initialYaw: number;
  initialPitch: number;
  initialDistance: number;
  lastScroll: number;
  scrollUntil: number;
  userUntil: number;
  invalidate: () => void;
  notify: () => void;
}
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const damp = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));
export function createInspectionState(): InspectionState {
  return {
    sleeping: true,
    waking: false,
    phase: "INTRO",
    yaw: -0.24,
    pitch: 0.035,
    distance: 7.2,
    targetYaw: -0.24,
    targetPitch: 0.035,
    targetDistance: 7.2,
    velocityYaw: 0,
    velocityPitch: 0,
    minimumDistance: 4.5,
    maximumDistance: 10,
    pointers: new Map(),
    pinchSpan: 0,
    armed: false,
    engaged: false,
    resetting: false,
    pointerX: 0,
    pointerY: 0,
    hover: false,
    initialYaw: -0.24,
    initialPitch: 0.035,
    initialDistance: 7.2,
    lastScroll: 0,
    scrollUntil: 0,
    userUntil: 0,
    invalidate: () => {},
    notify: () => {},
  };
}
export function setInspectionPhase(
  s: InspectionState,
  phase: InteractionPhase,
) {
  if (s.phase !== phase) {
    s.phase = phase;
    s.notify();
  }
}
function wakeInspection(s: InspectionState) {
  if (s.sleeping) s.waking = true;
  s.sleeping = false;
  s.invalidate();
}
export function rotateInspection(
  s: InspectionState,
  yaw: number,
  pitch: number,
) {
  s.resetting = false;
  s.engaged = true;
  s.targetYaw += yaw;
  s.targetPitch = clamp(s.targetPitch + pitch, -1.02, 1.02);
  s.userUntil = performance.now() + 220;
  setInspectionPhase(s, "USER_INTERACTING");
  wakeInspection(s);
  s.notify();
}
export function zoomInspection(s: InspectionState, delta: number) {
  s.resetting = false;
  s.engaged = true;
  s.targetDistance = clamp(
    s.targetDistance + delta,
    s.minimumDistance,
    s.maximumDistance,
  );
  s.userUntil = performance.now() + 220;
  setInspectionPhase(s, "USER_INTERACTING");
  wakeInspection(s);
  s.notify();
}
export function resetInspection(s: InspectionState) {
  s.pointers.clear();
  s.velocityYaw = 0;
  s.velocityPitch = 0;
  s.pinchSpan = 0;
  s.resetting = true;
  // Shortest path even after many complete revolutions.
  s.targetYaw =
    s.yaw +
    Math.atan2(Math.sin(s.initialYaw - s.yaw), Math.cos(s.initialYaw - s.yaw));
  s.targetPitch = s.initialPitch;
  s.targetDistance = s.initialDistance;
  setInspectionPhase(s, "RESETTING");
  wakeInspection(s);
  s.notify();
}
export function setInspectionBounds(s: InspectionState, radius: number) {
  s.minimumDistance = clamp(radius * 2.65, 4.2, 5.4);
  s.maximumDistance = 10;
  s.targetDistance = clamp(
    s.targetDistance,
    s.minimumDistance,
    s.maximumDistance,
  );
}
export function stepInspection(
  s: InspectionState,
  delta: number,
  now: number,
  context: { intro?: boolean; scroll?: number } = {},
): boolean {
  const dt = s.waking ? 1 / 60 : Math.min(0.25, Math.max(0.001, delta));
  s.waking = false;
  if (
    context.scroll !== undefined &&
    Math.abs(context.scroll - s.lastScroll) > 0.00005
  ) {
    s.scrollUntil = now + 180;
    s.lastScroll = context.scroll;
  }
  if (!s.pointers.size && !s.resetting) {
    s.targetYaw += s.velocityYaw * Math.min(dt, 0.05);
    s.targetPitch = clamp(
      s.targetPitch + s.velocityPitch * Math.min(dt, 0.05),
      -1.02,
      1.02,
    );
    const friction = Math.exp(-8.5 * dt);
    s.velocityYaw *= friction;
    s.velocityPitch *= friction;
    if (Math.abs(s.targetPitch) >= 1.02) s.velocityPitch = 0;
    if (Math.abs(s.velocityYaw) < 0.002) s.velocityYaw = 0;
    if (Math.abs(s.velocityPitch) < 0.002) s.velocityPitch = 0;
  }
  const speed = s.resetting ? 8 : 17;
  s.yaw = damp(s.yaw, s.targetYaw, speed, dt);
  s.pitch = damp(s.pitch, s.targetPitch, speed, dt);
  s.distance = damp(s.distance, s.targetDistance, 10, dt);
  const moving =
    Math.abs(s.yaw - s.targetYaw) +
      Math.abs(s.pitch - s.targetPitch) +
      Math.abs(s.distance - s.targetDistance) >
    0.0005;
  if (s.resetting && !moving) {
    s.resetting = false;
    s.engaged = false;
  }
  const phase = s.pointers.size
    ? "USER_INTERACTING"
    : s.resetting
      ? "RESETTING"
      : s.velocityYaw || s.velocityPitch || now < s.userUntil
        ? "USER_INTERACTING"
        : now < s.scrollUntil
          ? "SCROLL_ANIMATING"
          : context.intro && !s.engaged
            ? "INTRO"
            : "IDLE";
  setInspectionPhase(s, phase);
  s.notify();
  const needsFrames =
    moving ||
    !!s.pointers.size ||
    !!s.velocityYaw ||
    !!s.velocityPitch ||
    now < s.userUntil ||
    now < s.scrollUntil ||
    s.resetting;
  s.sleeping = !needsFrames;
  return needsFrames;
}
export function bindInspection(
  element: HTMLElement,
  s: InspectionState,
  { hero = false }: { hero?: boolean } = {},
): () => void {
  let lastTelemetry = "";
  const previousNotify = s.notify;
  s.notify = () => {
    const telemetry = `${s.phase}:${s.yaw.toFixed(3)}:${s.pitch.toFixed(3)}:${s.distance.toFixed(3)}:${s.armed}:${s.hover}:${s.pointers.size}`;
    if (lastTelemetry === telemetry) return;
    lastTelemetry = telemetry;
    element.dataset.interactionState = s.phase;
    element.dataset.yaw = s.yaw.toFixed(3);
    element.dataset.pitch = s.pitch.toFixed(3);
    element.dataset.distance = s.distance.toFixed(3);
    element.style.cursor = s.pointers.size ? "grabbing" : "grab";
    element.toggleAttribute("data-lenis-prevent", !hero || s.armed);
  };
  const span = () => {
    const [a, b] = [...s.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== "touch") return;
    if ((e.target as HTMLElement).closest("button,a,input")) return;
    s.armed = true;
    s.engaged = true;
    s.resetting = false;
    s.velocityYaw = 0;
    s.velocityPitch = 0;
    s.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    });
    s.pinchSpan = span();
    try {
      element.setPointerCapture(e.pointerId);
    } catch {
      /* Pointer was canceled by the browser. */
    }
    element.focus({ preventScroll: true });
    e.preventDefault();
    setInspectionPhase(s, "USER_INTERACTING");
    wakeInspection(s);
    s.notify();
  };
  const move = (e: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    s.pointerX = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    s.pointerY = clamp(1 - ((e.clientY - rect.top) / rect.height) * 2, -1, 1);
    s.hover = true;
    const previous = s.pointers.get(e.pointerId);
    if (previous) {
      e.preventDefault();
      const now = performance.now();
      const elapsed = Math.max(0.012, (now - previous.time) / 1000);
      const dx =
        ((e.clientX - previous.x) / Math.max(240, rect.width)) * Math.PI * 1.65;
      const dy =
        ((e.clientY - previous.y) / Math.max(280, rect.height)) * Math.PI * 1.1;
      s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, time: now });
      if (s.pointers.size > 1) {
        const next = span();
        if (s.pinchSpan > 0 && next > 0)
          zoomInspection(s, s.targetDistance * (s.pinchSpan / next - 1));
        s.pinchSpan = next;
        s.velocityYaw = 0;
        s.velocityPitch = 0;
      } else {
        rotateInspection(s, dx, dy);
        s.velocityYaw = clamp(dx / elapsed, -4, 4);
        s.velocityPitch = clamp(dy / elapsed, -2, 2);
      }
    }
    s.invalidate();
    s.notify();
  };
  const up = (e: PointerEvent) => {
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.delete(e.pointerId);
    s.pinchSpan = 0;
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
      /* Capture may already be released. */
    }
    if (e.type === "pointercancel") {
      s.velocityYaw = 0;
      s.velocityPitch = 0;
    }
    s.userUntil = performance.now() + 200;
    s.invalidate();
    s.notify();
  };
  const leave = () => {
    s.hover = false;
    s.pointerX = 0;
    s.pointerY = 0;
    if (!s.pointers.size) s.armed = false;
    s.invalidate();
    s.notify();
  };
  const wheel = (e: WheelEvent) => {
    if (hero && !s.armed && document.activeElement !== element) return;
    e.preventDefault();
    e.stopPropagation();
    zoomInspection(s, clamp(e.deltaY, -150, 150) * 0.006);
  };
  const doubleClick = (e: MouseEvent) => {
    e.preventDefault();
    resetInspection(s);
  };
  const key = (e: KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => rotateInspection(s, -0.16, 0),
      ArrowRight: () => rotateInspection(s, 0.16, 0),
      ArrowUp: () => rotateInspection(s, 0, -0.12),
      ArrowDown: () => rotateInspection(s, 0, 0.12),
      "+": () => zoomInspection(s, -0.55),
      "=": () => zoomInspection(s, -0.55),
      "-": () => zoomInspection(s, 0.55),
      Home: () => resetInspection(s),
      r: () => resetInspection(s),
      R: () => resetInspection(s),
    };
    if (actions[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      s.armed = true;
      actions[e.key]();
    }
  };
  const command = (e: Event) => {
    const command = (e as CustomEvent<string>).detail;
    if (command === "reset") resetInspection(s);
    if (command === "zoom-in") zoomInspection(s, -0.55);
    if (command === "zoom-out") zoomInspection(s, 0.55);
  };
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", up);
  element.addEventListener("lostpointercapture", up);
  element.addEventListener("pointerleave", leave);
  element.addEventListener("wheel", wheel, { passive: false });
  element.addEventListener("dblclick", doubleClick);
  element.addEventListener("keydown", key);
  element.addEventListener("hatan-view-command", command);
  s.notify();
  return () => {
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", up);
    element.removeEventListener("lostpointercapture", up);
    element.removeEventListener("pointerleave", leave);
    element.removeEventListener("wheel", wheel);
    element.removeEventListener("dblclick", doubleClick);
    element.removeEventListener("keydown", key);
    element.removeEventListener("hatan-view-command", command);
    s.pointers.clear();
    s.notify = previousNotify;
  };
}
