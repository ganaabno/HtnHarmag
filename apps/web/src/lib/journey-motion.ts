export const poseAxes = ["x", "y", "z", "rx", "ry", "rz", "scale"] as const;
export type JourneyPose = Record<(typeof poseAxes)[number], number>;
export interface JourneyKey {
  at: number;
  pose: JourneyPose;
  /** A gentle flight arc which vanishes with zero velocity at either end. */
  arc?: { x?: number; y?: number; z?: number };
}

/** Stateless sampling makes fast seeks, reverse scroll and resize deterministic.
 * Quintic easing has zero velocity AND acceleration at each readable pose. */
export function sampleJourney(
  keys: readonly JourneyKey[],
  distance: number,
  out: JourneyPose,
) {
  if (!keys.length) return;
  let index = 1;
  while (index < keys.length && distance > keys[index].at) index++;
  if (index === keys.length || distance <= keys[0].at) {
    Object.assign(out, keys[index === keys.length ? keys.length - 1 : 0].pose);
    return;
  }
  const from = keys[index - 1],
    to = keys[index];
  const t = Math.max(
    0,
    Math.min(1, (distance - from.at) / Math.max(0.001, to.at - from.at)),
  );
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  for (const axis of poseAxes)
    out[axis] = from.pose[axis] + (to.pose[axis] - from.pose[axis]) * eased;
  if (to.arc) {
    const bell = Math.sin(Math.PI * t) ** 3;
    out.x += (to.arc.x ?? 0) * bell;
    out.y += (to.arc.y ?? 0) * bell;
    out.z += (to.arc.z ?? 0) * bell;
  }
}
