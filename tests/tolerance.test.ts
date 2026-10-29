import { describe, expect, it } from "vitest";
import { assessRoute, planGate, planRoute, scenarioById, scenarios } from "../src/planner";
import { cornerSamplingAllowance, solveCorner } from "../src/planner/corner";
import type { Approach, Box, CornerGate, Gate } from "../src/planner";

const zero = { object: 0, environment: 0 };
const door = (width: number, height: number, approach?: Approach): Gate => ({ kind: "doorway", name: "Door", width, height, ...(approach ? { approach } : {}) });
const corner = (w: number, height = 2.4): CornerGate => ({ kind: "corner", name: "Corner", inWidth: w, outWidth: w, height });

// Reference values below are worked out by hand from the box dimensions, not read back from the planner.
describe("tolerance on a doorway", () => {
  const cube: Box = { length: 0.6, height: 0.6, depth: 0.6 };

  it("a cube in a 0.604 m door: 4 mm nominal, 2 mm with 1 mm of error on each side", () => {
    const g = door(0.604, 2);
    const nominal = planGate(cube, g);
    expect(nominal.clearance).toBeCloseTo(0.004, 9);
    const a = assessRoute(cube, [g], { object: 0.001, environment: 0.001 }).gates[0]!;
    expect(a.toleranceClearance).toBeCloseTo(0.604 - 0.001 - (0.6 + 0.001), 9);
    expect(a.nominalClearance).toBeCloseTo(0.004, 9);
    expect(a.reduction).toBeCloseTo(0.002, 9);
    expect(a.status).toBe("holds");
  });

  it("the same fit becomes 'too close to confirm' when the error is larger, without changing the nominal plan", () => {
    const g = door(0.604, 2);
    const before = JSON.stringify(planRoute(cube, [g]));
    const r = assessRoute(cube, [g], { object: 0.003, environment: 0.003 });
    expect(r.status).toBe("too-close");
    expect(r.gates[0]!.toleranceClearance).toBeCloseTo(-0.002, 9);
    expect(r.summary).toContain("Too close to confirm");
    expect(r.summary).not.toMatch(/collid|collision|will jam/i);
    expect(JSON.stringify(planRoute(cube, [g]))).toBe(before);
  });

  it("the carry margin is separate from the tolerance", () => {
    const g = door(0.604, 2);
    const tol = { object: 0.001, environment: 0.001 };
    expect(assessRoute(cube, [g], tol, { carryMargin: 0.002 }).status).toBe("holds");
    expect(assessRoute(cube, [g], tol, { carryMargin: 0.0025 }).status).toBe("too-close");
    // The margin changes the verdict, not the stated clearance.
    expect(assessRoute(cube, [g], tol, { carryMargin: 0.0025 }).gates[0]!.toleranceClearance).toBeCloseTo(0.002, 9);
  });

  it("boundary: clearance exactly equal to the margin holds", () => {
    expect(assessRoute(cube, [door(0.61, 2)], zero, { carryMargin: 0.01 }).status).toBe("holds");
  });

  it("a turned pose is enlarged along the axes it presents: slab 1.0 x 0.5 x 0.3 turned 90 degrees", () => {
    const slab: Box = { length: 1.0, height: 0.5, depth: 0.3 };
    const g = door(0.52, 0.6);
    const plan = planGate(slab, g);
    expect(plan.steps.at(-1)!.pose).toEqual({ pitch: 0, yaw: 90, roll: 0 });
    const a = assessRoute(slab, [g], { object: 0.01, environment: 0.02 }).gates[0]!;
    // After the turn it presents depth (0.3 + 0.01) across and height (0.5 + 0.01) up.
    expect(a.toleranceClearance).toBeCloseTo(Math.min(0.52 - 0.02 - 0.31, 0.6 - 0.02 - 0.51), 9);
  });

  it("the turning sweep uses the exact peak: sqrt(L^2 + D^2) between samples", () => {
    const slab: Box = { length: 1.0, height: 0.5, depth: 0.3 };
    const g = door(0.52, 0.6, { depth: 1.1, height: 2 });
    const nominal = planGate(slab, g);
    expect(nominal.steps.at(-1)!.pose).toEqual({ pitch: 0, yaw: 90, roll: 0 });
    expect(nominal.clearance).toBeCloseTo(1.1 - Math.hypot(1.0, 0.3), 6);
    const a = assessRoute(slab, [g], { object: 0.01, environment: 0.02 }).gates[0]!;
    expect(a.toleranceClearance).toBeCloseTo(1.1 - 0.02 - Math.hypot(1.01, 0.31), 6);
    expect(a.maneuverChecked).toBe(true);
  });

  it("an unmeasured turn stays unverified: only the opening is judged and the summary says so", () => {
    const slab: Box = { length: 1.0, height: 0.5, depth: 0.3 };
    const r = assessRoute(slab, [door(0.52, 0.6)], { object: 0.01, environment: 0.02 });
    expect(r.gates[0]!.maneuverChecked).toBe(false);
    expect(r.maneuverChecked).toBe(false);
    expect(r.summary).toContain("Turning space was not measured");
  });

  it("when it does not fit as measured, tolerance is not applied", () => {
    const r = assessRoute(cube, [door(0.5, 2)], { object: 0.01, environment: 0.01 });
    expect(r.status).toBe("does-not-fit");
    expect(r.gates[0]!.toleranceClearance).toBeNull();
    expect(r.summary).toContain("no tolerance was applied");
  });
});

describe("tolerance on a lift and an L-turn", () => {
  it("lift: door and cabin all shrink; the cabin depth can be the limit", () => {
    const crate: Box = { length: 0.8, height: 1.0, depth: 0.5 };
    const g: Gate = { kind: "elevator", name: "Lift", door: { width: 1.0, height: 2.1 }, cabin: { width: 1.4, depth: 0.62, height: 2.2 } };
    const plan = planGate(crate, g);
    expect(plan.fits).toBe(true);
    const pose = plan.steps.at(-1)!.pose;
    expect(pose).toEqual({ pitch: 0, yaw: 0, roll: 0 });
    const a = assessRoute(crate, [g], { object: 0.01, environment: 0.01 }).gates[0]!;
    // Upright: x 0.8, y 1.0, z 0.5 become 0.81, 1.01, 0.51. Cabin depth 0.62 - 0.01 - 0.51 = 0.10 is smallest.
    expect(a.toleranceClearance).toBeCloseTo(0.62 - 0.01 - 0.51, 9);
  });

  it("corner: matches the closed form w = (L/2 + D) / sqrt(2), less the stated sampling allowance", () => {
    const block: Box = { length: 2.1, height: 0.9, depth: 0.9 };
    const o = 0.005;
    const e = 0.005;
    const a = assessRoute(block, [corner(1.4)], { object: o, environment: e }).gates[0]!;
    const analytic = 1.4 - e - ((2.1 + o) / 2 + (0.9 + o)) / Math.SQRT2;
    expect(a.numericalAllowance).toBeGreaterThan(0);
    expect(a.numericalAllowance).toBeLessThan(0.005);
    expect(a.toleranceClearance!).toBeLessThanOrEqual(analytic + 1e-4);
    expect(a.toleranceClearance!).toBeGreaterThanOrEqual(analytic - a.numericalAllowance - 1e-4);
  });

  it("corner: the allowance really covers the gap to a 10x finer reference sweep", () => {
    const fp = { length: 2.105, depth: 0.905 };
    const coarse = solveCorner(fp, 1.395, 1.395, 0.1, [-1]).slack;
    const dense = solveCorner(fp, 1.395, 1.395, 0.01, [-1]).slack;
    expect(coarse - dense).toBeLessThanOrEqual(cornerSamplingAllowance(fp, 0.1));
    expect(dense).toBeLessThanOrEqual(coarse + 1e-9);
  });

  it("a hall narrowed to nothing is not confirmed", () => {
    const block: Box = { length: 2.1, height: 0.9, depth: 0.9 };
    const r = assessRoute(block, [corner(1.5)], { object: 0, environment: 1.6 });
    expect(r.gates[0]!.status).toBe("too-close");
    expect(r.gates[0]!.toleranceClearance!).toBeLessThan(0);
  });
});

describe("properties", () => {
  it("zero tolerance reproduces the nominal clearance for pose gates", () => {
    for (const s of scenarios) {
      const nominal = planRoute(s.box, s.gates);
      const a = assessRoute(s.box, s.gates, zero);
      s.gates.forEach((g, i) => {
        const n = nominal.gates[i]!.plan;
        const x = a.gates[i]!;
        if (!n.fits) return expect(x.status, s.id).toBe("does-not-fit");
        if (g.kind === "corner") expect(x.toleranceClearance!, s.id).toBeLessThanOrEqual(n.clearance + 1e-9);
        else expect(x.toleranceClearance!, s.id).toBeCloseTo(n.clearance, 9);
        expect(x.maneuverChecked, s.id).toBe(n.verified);
      });
    }
  });

  it("more error never gives more room, for every scenario gate", () => {
    for (const s of scenarios) {
      let previous: (number | null)[] = s.gates.map(() => Infinity);
      for (const t of [0, 0.002, 0.005, 0.02]) {
        const a = assessRoute(s.box, s.gates, { object: t, environment: t });
        const now = a.gates.map((g) => g.toleranceClearance);
        now.forEach((c, i) => {
          if (c !== null && previous[i] !== null) expect(c, `${s.id} gate ${i} at ${t}`).toBeLessThanOrEqual(previous[i]! + 1e-9);
        });
        previous = now;
      }
    }
  });

  it("is deterministic and never mutates its inputs", () => {
    const s = scenarios[0]!;
    const box = { ...s.box };
    const gates = JSON.parse(JSON.stringify(s.gates)) as Gate[];
    const a = JSON.stringify(assessRoute(box, gates, { object: 0.005, environment: 0.005 }));
    expect(JSON.stringify(assessRoute(box, gates, { object: 0.005, environment: 0.005 }))).toBe(a);
    expect(box).toEqual(s.box);
    expect(gates).toEqual(s.gates);
  });

  it("ties on the limiting gate go to the first", () => {
    const cube: Box = { length: 0.6, height: 0.6, depth: 0.6 };
    const r = assessRoute(cube, [door(0.62, 2), door(0.62, 2)], { object: 0.001, environment: 0.001 });
    expect(r.limitingIndex).toBe(0);
  });

  it("an empty route is 'empty', and a blocked gate takes precedence over a too-close one", () => {
    const cube: Box = { length: 0.6, height: 0.6, depth: 0.6 };
    expect(assessRoute(cube, [], zero).status).toBe("empty");
    const r = assessRoute(cube, [door(0.602, 2), door(0.5, 2)], { object: 0.003, environment: 0 });
    expect(r.status).toBe("does-not-fit");
    expect(r.limitingIndex).toBe(1);
  });

  it("rejects negative or non-finite error and margin", () => {
    const cube: Box = { length: 0.6, height: 0.6, depth: 0.6 };
    expect(() => assessRoute(cube, [door(1, 2)], { object: -0.001, environment: 0 })).toThrow(RangeError);
    expect(() => assessRoute(cube, [door(1, 2)], { object: 0, environment: Number.NaN })).toThrow(RangeError);
    expect(() => assessRoute(cube, [door(1, 2)], zero, { carryMargin: -1 })).toThrow(RangeError);
  });
});

describe("the demonstration story", () => {
  it("the workshop bench fits by millimetres but cannot be confirmed at +-5 mm; the double doors hold with more room", () => {
    const bench = scenarioById("workshop-bench")!;
    const tol = { object: 0.005, environment: 0.005 };
    const nominal = planRoute(bench.box, bench.gates);
    expect(nominal.fits).toBe(true);
    expect(nominal.clearance).toBeLessThan(0.01);
    const own = assessRoute(bench.box, bench.gates, tol);
    expect(own.status).toBe("too-close");
    const alt = assessRoute(bench.box, bench.alternatives![0]!.gates, tol);
    expect(alt.status).toBe("holds");
    expect(alt.gates[0]!.toleranceClearance!).toBeGreaterThan(own.gates[own.limitingIndex]!.toleranceClearance! + 0.05);
  });
});
