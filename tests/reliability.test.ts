import { describe, expect, it } from "vitest";
import { applyFix, extents, frameAt, maxScale, planGate, planMove, suggestFixes, sweepSegment, withBoxParam, withGateParam } from "../src/planner";
import type { Gate } from "../src/planner";

const box = { length: 2.1, height: 0.85, depth: 0.9 };
const zero = { pitch: 0, yaw: 0, roll: 0 };

describe("continuous turning clearance", () => {
  it("finds the exact diagonal peak between ten-degree samples", () => {
    const depth = Math.hypot(box.length, box.depth);
    const sweep = sweepSegment(box, { depth: depth - 0.001, height: 3 }, zero, { ...zero, yaw: 90 });
    expect(sweep.depth).toBeCloseTo(depth, 10);
    expect(sweep.clearance).toBeCloseTo(-0.001, 10);
  });

  it("agrees with dense independent samples for every single-axis segment", () => {
    for (const axis of ["pitch", "yaw", "roll"] as const) {
      const from = { pitch: 25, yaw: 35, roll: 15 };
      const to = { ...from, [axis]: -110 };
      const result = sweepSegment(box, null, from, to);
      let depth = 0, height = 0;
      for (let i = 0; i <= 2000; i++) {
        const e = extents(box, { ...from, [axis]: from[axis] + (to[axis] - from[axis]) * i / 2000 });
        depth = Math.max(depth, e.z);
        height = Math.max(height, e.y);
      }
      expect(result.depth).toBeGreaterThanOrEqual(depth - 1e-10);
      expect(result.height).toBeGreaterThanOrEqual(height - 1e-10);
      expect(result.depth).toBeCloseTo(depth, 5);
      expect(result.height).toBeCloseTo(height, 5);
    }
  });
});

describe("credible playback", () => {
  it("turns fully in front of the wall and finishes completely through it", () => {
    const plan = planMove(box, { width: 0.95, height: 2.05 }, { approach: { depth: 3, height: 2.5 } });
    expect(plan.fits).toBe(true);
    for (let i = 0; i < plan.steps.length - 2; i++) {
      const a = plan.steps[i]!;
      const b = plan.steps[i + 1]!;
      for (let j = 0; j <= 100; j++) {
        const f = frameAt(plan, (i + j / 100) / (plan.steps.length - 1));
        expect(f.position.z - extents(box, f.pose).z / 2, `${a.kind} to ${b.kind}`).toBeGreaterThan(0);
      }
    }
    const last = frameAt(plan, 1);
    expect(last.position.z + extents(box, last.pose).z / 2).toBeLessThan(0);
  });

  it("includes a failed corner tilt in the fit verdict and clearance", () => {
    const plan = planGate({ length: 1, height: 2, depth: 0.6 }, { kind: "corner", name: "Low hall", inWidth: 1.5, outWidth: 1.5, height: 1.5 });
    expect(plan.fits).toBe(false);
    expect(plan.clearance).toBeLessThan(0);
    expect(plan.verified).toBe(false);
  });
});

describe("defensive measurements and fixes", () => {
  it.each([0, -1, NaN, Infinity])("rejects invalid search steps: %s", (stepDegrees) => {
    expect(() => planMove(box, { width: 1, height: 2 }, { stepDegrees })).toThrow(RangeError);
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid object measurements: %s", (length) => {
    expect(() => planMove({ ...box, length }, { width: 1, height: 2 })).toThrow(RangeError);
  });

  it("ignores non-finite handle values without poisoning a measurement", () => {
    const gate: Gate = { kind: "doorway", name: "Door", width: 0.8, height: 2.05 };
    expect(withBoxParam(box, "length", NaN)).toBe(box);
    expect(withGateParam(gate, "width", Infinity)).toBe(gate);
  });

  it("never offers a partial fix for a narrow opening with no turning room", () => {
    const gate: Gate = { kind: "doorway", name: "Front door", width: 0.8, height: 2.05, approach: { depth: 1, height: 2.5 } };
    const fixes = suggestFixes(box, gate);
    expect(fixes.length).toBeGreaterThan(0);
    for (const fix of fixes) {
      const after = applyFix(box, gate, fix);
      expect(planGate(after.box, after.gate).fits, fix.label).toBe(true);
    }
    expect(fixes.some((f) => f.changes.length > 1)).toBe(true);
  });

  it("does not claim an empty route allows the maximum object size", () => {
    expect(maxScale(box, [])).toBe(0);
  });
});
