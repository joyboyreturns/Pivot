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
