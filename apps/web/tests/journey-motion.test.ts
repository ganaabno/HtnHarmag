import { describe, expect, it } from "vitest";
import {
  sampleJourney,
  poseAxes,
  type JourneyKey,
  type JourneyPose,
} from "../src/lib/journey-motion";
const a: JourneyPose = {
  x: 0.14,
  y: 0,
  z: 0,
  rx: 0,
  ry: 0,
  rz: -0.15,
  scale: 1.2,
};
const b: JourneyPose = {
  x: -0.25,
  y: -0.1,
  z: 0.75,
  rx: 0.1,
  ry: Math.PI * 2,
  rz: 0.2,
  scale: 0.9,
};
const keys: JourneyKey[] = [
  { at: 0, pose: a },
  { at: 200, pose: a },
  { at: 900, pose: b, arc: { y: 0.04, z: 0.12 } },
  { at: 1200, pose: b },
];
const at = (distance: number) => {
  const out = { ...a };
  sampleJourney(keys, distance, out);
  return out;
};
describe("continuous product motion", () => {
  it("holds readable poses and clamps overscroll", () => {
    expect(at(-100)).toEqual(a);
    expect(at(170)).toEqual(a);
    expect(at(1000)).toEqual(b);
    expect(at(9000)).toEqual(b);
  });
  it("gives the same pose when reversing or seeking directly", () => {
    const forward = at(570);
    at(1100);
    at(0);
    at(850);
    expect(at(570)).toEqual(forward);
  });
  it("settles without a velocity discontinuity at either end of the flight", () => {
    for (const time of [200, 900])
      for (const axis of poseAxes) {
        expect(Math.abs(at(time + 0.1)[axis] - at(time)[axis])).toBeLessThan(
          0.00001,
        );
        expect(Math.abs(at(time - 0.1)[axis] - at(time)[axis])).toBeLessThan(
          0.00001,
        );
      }
  });
  it("keeps scale positive and rolls forward through the intended full turn", () => {
    let angle = 0;
    for (let distance = 0; distance <= 1200; distance += 3) {
      const pose = at(distance);
      expect(pose.scale).toBeGreaterThan(0);
      expect(pose.ry).toBeGreaterThanOrEqual(angle);
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      angle = pose.ry;
    }
    expect(angle).toBeCloseTo(Math.PI * 2);
  });
});
