import { describe, expect, it } from "vitest";
import { formatRoute, lengthText, planGate, planRoute, scenarios } from "../src/planner";
import type { Box, Gate } from "../src/planner";

describe("lengthText", () => {
  it("never turns a positive sub-centimetre margin into 0 cm", () => {
    expect(lengthText(0.004)).toBe("4 mm");
    expect(lengthText(0.0006)).toBe("1 mm");
    expect(lengthText(0.00999)).toBe("10 mm");
  });
  it("uses whole centimetres from 1 cm up and ignores the sign", () => {
    expect(lengthText(0.01)).toBe("1 cm");
    expect(lengthText(0.024)).toBe("2 cm");
    expect(lengthText(-0.05)).toBe("5 cm");
  });
  it("keeps an exact zero as 0 cm", () => {
    expect(lengthText(0)).toBe("0 cm");
  });
  it("reads floating-point noise as zero, not as 1 mm", () => {
    expect(lengthText(-1.1102230246251565e-16)).toBe("0 cm");
    expect(lengthText(1e-12)).toBe("0 cm");
    expect(lengthText(0.000001)).toBe("1 mm");
  });
});

describe("a sofa as tall as the door is wide", () => {
  it("fits with nothing to spare and says so, not '1 mm'", () => {
    const sofa = scenarios[0]!;
    const door: Gate = { kind: "doorway", name: "Flat door", width: 0.85, height: 2.05, approach: { depth: 2.4, height: 2.5 } };
    const plan = planGate(sofa.box, door, { approach: door.approach });
    expect(plan.fits).toBe(true);
    expect(Math.abs(plan.clearance)).toBeLessThan(1e-9);
    expect(lengthText(plan.clearance)).toBe("0 cm");
  });
});

describe("clearance wording in every planner surface", () => {
  // A 0.6 m cube in a 0.604 m doorway: the pose search finds 4 mm of slack (2 mm a side).
  const cube: Box = { length: 0.6, height: 0.6, depth: 0.6 };
  const door: Gate = { kind: "doorway", name: "Hatch", width: 0.604, height: 2 };

  it("the step hint, route summary and report all say mm", () => {
    const plan = planGate(cube, door);
    expect(plan.fits).toBe(true);
    expect(plan.clearance).toBeGreaterThan(0);
    expect(plan.clearance).toBeLessThan(0.01);
    const route = planRoute(cube, [door]);
    const mm = lengthText(route.clearance);
    expect(mm).toMatch(/^\d+ mm$/);
    expect(route.summary).toContain(mm);
    expect(formatRoute(route)).toContain(mm);
    expect(plan.steps[plan.bottleneckIndex]!.hint).toContain(mm);
    expect(formatRoute(route)).not.toMatch(/\b0 cm\b/);
  });

  it("no advertised scenario prints a positive clearance as 0 cm", () => {
    for (const s of scenarios) {
      const route = planRoute(s.box, s.gates);
      if (route.fits && route.clearance > 0) expect(route.summary, s.id).not.toMatch(/\b0 cm\b/);
    }
  });
});
