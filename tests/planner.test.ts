import { describe, expect, it } from "vitest";
import { clearance, planMove, silhouette } from "../src/planner";

const sofa = { length: 2.0, height: 0.85, depth: 0.9 };

describe("geometry", () => {
  it("upright silhouette equals length by height", () => {
    const s = silhouette(sofa, { pitch: 0, yaw: 0, roll: 0 });
    expect(s.width).toBeCloseTo(2.0);
    expect(s.height).toBeCloseTo(0.85);
  });

  it("a 90 degree yaw swaps length for depth", () => {
    const s = silhouette(sofa, { pitch: 0, yaw: 90, roll: 0 });
    expect(s.width).toBeCloseTo(0.9);
    expect(s.height).toBeCloseTo(0.85);
  });

  it("clearance is negative when the box does not fit", () => {
    expect(clearance(sofa, { width: 0.9, height: 2.0 }, { pitch: 0, yaw: 0, roll: 0 })).toBeLessThan(0);
  });
});

describe("planMove on three door sizes", () => {
  it("wide door (1.2 x 2.1): fits with plenty of room", () => {
    const plan = planMove(sofa, { width: 1.2, height: 2.1 });
    expect(plan.fits).toBe(true);
    expect(plan.clearance).toBeGreaterThan(0.2);
    expect(plan.steps.at(-1)?.kind).toBe("pass");
    expect(plan.bottleneckIndex).toBe(plan.steps.length - 1);
  });

  it("standard door (0.95 x 2.05): fits only after reorienting, with a few cm spare", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 });
    expect(plan.fits).toBe(true);
    expect(plan.clearance).toBeCloseTo(0.05, 2);
    const pass = plan.steps[plan.bottleneckIndex]!;
    expect(pass.kind).toBe("pass");
    expect(pass.pose).not.toEqual({ pitch: 0, yaw: 0, roll: 0 });
    expect(plan.steps.length).toBeGreaterThan(3);
  });

  it("narrow door (0.75 x 2.0): no pose fits, since every silhouette is wider than 0.85 m", () => {
    const plan = planMove(sofa, { width: 0.75, height: 2.0 });
    expect(plan.fits).toBe(false);
    expect(plan.steps).toEqual([]);
    expect(plan.bottleneckIndex).toBe(-1);
    expect(plan.clearance).toBeLessThan(0);
  });
});

describe("planMove determinism", () => {
  it("returns the same plan for the same input", () => {
    const a = planMove(sofa, { width: 0.95, height: 2.05 });
    const b = planMove(sofa, { width: 0.95, height: 2.05 });
    expect(a).toEqual(b);
  });

  it("an object that already fits upright needs no rotation", () => {
    const plan = planMove({ length: 0.5, height: 0.5, depth: 0.5 }, { width: 0.9, height: 2.0 });
    expect(plan.fits).toBe(true);
    expect(plan.steps.map((s) => s.kind)).toEqual(["start", "slide", "pass"]);
  });
});
