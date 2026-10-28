import { describe, expect, it } from "vitest";
import { cornerCentre, minCornerWidth, planGate, solveCorner } from "../src/planner";
import type { CornerGate } from "../src/planner";

const sofa = { length: 2.1, height: 0.85, depth: 0.9 };
const corner = (inWidth: number, outWidth: number, height = 2.4): CornerGate => ({ kind: "corner", name: "Corner", inWidth, outWidth, height });

describe("corner solver", () => {
  it("matches the closed form for equal halls: the tightest angle is 45 degrees and w = (L/2 + D) / sqrt(2)", () => {
    const wMin = (2.1 / 2 + 0.9) / Math.SQRT2;
    const s = solveCorner({ length: 2.1, depth: 0.9 }, 1.5, 1.5);
    expect(Math.abs(s.tightestAngle)).toBeCloseTo(45, 0);
    expect(s.slack).toBeCloseTo(1.5 - wMin, 2);
  });

  it("slack falls by the same amount when both halls narrow", () => {
    const a = solveCorner({ length: 2.1, depth: 0.9 }, 1.5, 1.5).slack;
    const b = solveCorner({ length: 2.1, depth: 0.9 }, 1.4, 1.4).slack;
    expect(a - b).toBeCloseTo(0.1, 3);
  });

  it("is symmetric: swapping the halls gives the same slack", () => {
    const a = solveCorner({ length: 2.1, depth: 0.9 }, 1.3, 1.6).slack;
    const b = solveCorner({ length: 2.1, depth: 0.9 }, 1.6, 1.3).slack;
    expect(a).toBeCloseTo(b, 2);
  });

  it("a square-ish box that fits both halls never jams in the middle", () => {
    expect(solveCorner({ length: 0.6, depth: 0.6 }, 0.8, 0.8).slack).toBeGreaterThan(0.1);
  });

  it("a box wider than a hall is rejected on entry even when the swing is easy", () => {
    expect(solveCorner({ length: 1.0, depth: 0.8 }, 0.7, 3).slack).toBeLessThan(0);
  });

  it("pushed centre touches both outer walls", () => {
    const c = cornerCentre({ length: 2, depth: 1 }, 0, 1.2, 1.5);
    expect(c.x).toBeCloseTo(1.5 - 1, 9);
    expect(c.y).toBeCloseTo(1.2 - 0.5, 9);
  });
});

describe("planGate on an L-turn", () => {
  it("fits a wide hall with a verified plan", () => {
    const plan = planGate(sofa, corner(1.6, 1.6));
    expect(plan.fits).toBe(true);
    expect(plan.verified).toBe(true);
    expect(plan.turn?.tipped).toBe(false);
    expect(plan.steps[plan.bottleneckIndex]!.kind).toBe("pass");
    expect(plan.clearance).toBeGreaterThan(0.1);
  });

  it("jams in a narrow hall and still describes the best attempt", () => {
    const plan = planGate(sofa, corner(1.0, 1.0));
    expect(plan.fits).toBe(false);
    expect(plan.reason).toBe("gate");
    expect(plan.clearance).toBeLessThan(-0.2);
    expect(plan.steps.length).toBeGreaterThan(2);
  });

  it("swings the leading end into the new hall (clockwise) for a right-hand turn", () => {
    expect(planGate(sofa, corner(1.6, 1.6)).turn?.direction).toBe(-1);
  });

  it("a low ceiling makes the ceiling the limit", () => {
    const plan = planGate(sofa, corner(1.8, 1.8, 0.85));
    expect(plan.turn!.ceilingSlack).toBeCloseTo(0, 6);
    expect(plan.clearance).toBeCloseTo(0, 6);
  });

  it("rejects laying a tall box down when the initial tilt hits the ceiling", () => {
    const wardrobe = { length: 1.0, height: 2.0, depth: 0.6 };
    const plan = planGate(wardrobe, corner(1.5, 1.5, 1.5));
    expect(plan.fits).toBe(false);
    expect(plan.verified).toBe(false);
    expect(plan.clearance).toBeLessThan(0);
  });

  it("the smallest equal hall for a square-profile sofa agrees with the closed form", () => {
    const block = { length: 2.1, height: 0.9, depth: 0.9 };
    expect(minCornerWidth(block, 2.4)!).toBeCloseTo((2.1 / 2 + 0.9) / Math.SQRT2, 2);
  });

  it("laying the sofa on its back gets it round a slightly tighter corner", () => {
    expect(minCornerWidth(sofa, 2.4)!).toBeLessThan((2.1 / 2 + 0.9) / Math.SQRT2 - 0.02);
    expect(planGate(sofa, corner(1.36, 1.36)).turn?.tipped).toBe(true);
  });
});
