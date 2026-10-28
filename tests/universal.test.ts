import { describe, expect, it } from "vitest";
import {
  applyFix,
  boxParams,
  customScenario,
  defaultGate,
  gateParams,
  maxScale,
  nextGate,
  objectLibrary,
  placeLibrary,
  planGate,
  planRoute,
  scenarioById,
  scenarios,
  suggestFixes,
  withBoxParam,
  withGateParam,
} from "../src/planner";
import type { Gate } from "../src/planner";

const sofa = { length: 2.1, height: 0.85, depth: 0.9 };

describe("editable parameters", () => {
  it("every gate kind exposes at most five rows and every row round-trips", () => {
    for (const kind of ["doorway", "corridor", "elevator", "corner"] as const) {
      const gate = defaultGate(kind);
      const rows = gateParams(gate);
      expect(rows.length).toBeGreaterThan(2);
      expect(rows.length).toBeLessThanOrEqual(5);
      for (const row of rows) {
        const again = gateParams(withGateParam(gate, row.id, row.value)).find((r) => r.id === row.id)!;
        expect(again.value).toBeCloseTo(row.value, 9);
      }
    }
  });

  it("changing a parameter returns a new gate and leaves the old one alone", () => {
    const gate = defaultGate("doorway");
    const wider = withGateParam(gate, "width", 1.2);
    expect(wider).not.toBe(gate);
    expect(gateParams(wider)[0]!.value).toBe(1.2);
    expect(gateParams(gate)[0]!.value).toBe(0.9);
  });

  it("values are clamped to the row's range", () => {
    expect(gateParams(withGateParam(defaultGate("doorway"), "width", 99))[0]!.value).toBe(2.2);
    expect(boxParams(withBoxParam(sofa, "height", -4))[1]!.value).toBe(0.1);
  });

  it("a hall depth under 30 cm means the room in front was not measured, so the turn becomes unverified", () => {
    const gate = withGateParam(defaultGate("doorway"), "hallDepth", 0) as Extract<Gate, { kind: "doorway" }>;
    expect(gate.approach).toBeUndefined();
    const plan = planGate(sofa, { ...gate, width: 0.95 });
    expect(plan.fits).toBe(true);
    expect(plan.verified).toBe(false);
  });

  it("the lift door height follows the cabin ceiling", () => {
    const lift = withGateParam(defaultGate("elevator"), "cabinHeight", 2.0) as Extract<Gate, { kind: "elevator" }>;
    expect(lift.door.height).toBeLessThanOrEqual(1.9);
  });

  it("nextGate cycles kinds and numbers them", () => {
    const one = nextGate([]);
    const two = nextGate([one]);
    expect([one.kind, two.kind]).toEqual(["doorway", "corridor"]);
    expect(two.name).toBe("Corridor 2");
  });
});

describe("libraries", () => {
  it("has a dozen objects and several places, each planable", () => {
    expect(objectLibrary.length).toBeGreaterThanOrEqual(12);
    expect(placeLibrary.length).toBeGreaterThanOrEqual(6);
    for (const o of objectLibrary) for (const p of placeLibrary) expect(() => planRoute(o.box, p.gates)).not.toThrow();
  });

  it("different objects get different verdicts in the same place (so the library is not trivial)", () => {
    const terrace = placeLibrary.find((p) => p.id === "terrace")!;
    const verdicts = new Set(objectLibrary.map((o) => planRoute(o.box, terrace.gates).verdict));
    expect(verdicts.size).toBeGreaterThanOrEqual(2);
  });

  it("the open-plan office takes everything", () => {
    const office = placeLibrary.find((p) => p.id === "open-plan")!;
    for (const o of objectLibrary) expect(planRoute(o.box, office.gates).fits, o.id).toBe(true);
  });

  it("customScenario wraps any object and route", () => {
    const s = customScenario(objectLibrary[0]!, placeLibrary[0]!.gates);
    expect(s.id).toBe("your-move");
    expect(s.boxName).toContain("210 x 85 x 90");
  });
});

describe("what would make it fit", () => {
  it("says nothing when it already fits", () => {
    const wide = { ...(defaultGate("doorway", "d") as Extract<Gate, { kind: "doorway" }>), width: 1.1, approach: { depth: 3, height: 2.6 } };
    expect(suggestFixes(sofa, wide)).toEqual([]);
  });

  it("for the 80 cm door: widen to 85, or take 5 cm off the height", () => {
    const door = scenarioById("studio-sofa")!.gates[1]!;
    const fixes = suggestFixes(sofa, door);
    const widen = fixes.find((f) => f.kind === "widen")!;
    const shrink = fixes.find((f) => f.kind === "shrink" && f.target === "height")!;
    expect(widen.to).toBeCloseTo(0.85, 2);
    expect(shrink.delta).toBeCloseTo(0.05, 2);
    expect(shrink.label).toContain("legs");
    // Applying a fix really makes it fit.
    expect(planGate(sofa, { ...(door as Extract<Gate, { kind: "doorway" }>), width: widen.to }).fits).toBe(true);
    expect(planGate({ ...sofa, height: shrink.to }, door).fits).toBe(true);
    expect(fixes.map((f) => f.delta)).toEqual([...fixes.map((f) => f.delta)].sort((a, b) => a - b));
  });

  it("when the door is too narrow and the hall too shallow, asks for both, in that order", () => {
    const front = placeLibrary.find((p) => p.id === "old-flat")!.gates[0]!;
    const fixes = suggestFixes(sofa, front);
    const deepen = fixes.find((f) => f.kind === "deepen")!;
    expect(deepen.changes.find((c) => c.id === "width")!.value).toBeCloseTo(0.85, 2);
    expect(deepen.to).toBeGreaterThan(2);
    const after = applyFix(sofa, front, deepen);
    expect(planGate(after.box, after.gate).fits).toBe(true);
    expect(fixes.every((fix) => { const after = applyFix(sofa, front, fix); return planGate(after.box, after.gate).fits; })).toBe(true);
  });

  it("for a door that fits but a hall that is too shallow: more room in front", () => {
    const door = scenarioById("narrow-hall")!.gates[1]!;
    const fixes = suggestFixes(sofa, door);
    const deepen = fixes.find((f) => f.kind === "deepen")!;
    expect(deepen.to).toBeGreaterThan(1.2);
    expect(deepen.to).toBeLessThan(2.4);
    const doorway = door as Extract<Gate, { kind: "doorway" }>;
    expect(planGate(sofa, { ...doorway, approach: { ...doorway.approach!, depth: deepen.to } }).fits).toBe(true);
  });

  it("for the mattress and the lift: the cabin has to be deeper", () => {
    const lift = scenarioById("mattress-lift")!.gates[1]!;
    const fixes = suggestFixes(scenarioById("mattress-lift")!.box, lift);
    expect(fixes.some((f) => f.target.includes("cabin depth"))).toBe(true);
  });

  it("for a tight L-turn: widen both halls", () => {
    const corner = { kind: "corner" as const, name: "Corner", inWidth: 1.1, outWidth: 1.1, height: 2.4 };
    const fixes = suggestFixes(sofa, corner);
    const widen = fixes.find((f) => f.kind === "widen")!;
    expect(widen.delta).toBeGreaterThan(0.1);
    const grown = { ...corner, inWidth: 1.1 + widen.delta, outWidth: 1.1 + widen.delta };
    expect(planGate(sofa, grown).fits).toBe(true);
  });
});

describe("trying a fix", () => {
  it("applying any suggested fix to a blocked gate makes it fit", () => {
    let tried = 0;
    for (const s of scenarios) {
      for (const gate of s.gates) {
        if (planGate(s.box, gate).fits) continue;
        for (const fix of suggestFixes(s.box, gate)) {
          const after = applyFix(s.box, gate, fix);
          expect(planGate(after.box, after.gate).fits, `${s.id}: ${fix.label}`).toBe(true);
          expect(fix.short.length).toBeGreaterThan(3);
          tried++;
        }
      }
    }
    expect(tried).toBeGreaterThanOrEqual(5);
  });
});

describe("largest size the route allows", () => {
  it("is above 1 for a route the object clears easily, below 1 for one it does not", () => {
    const roomy = placeLibrary.find((p) => p.id === "open-plan")!.gates;
    expect(maxScale(sofa, roomy)).toBeGreaterThan(1.05);
    const studio = scenarioById("studio-sofa")!.gates;
    const s = maxScale(sofa, studio);
    expect(s).toBeLessThan(1);
    expect(s).toBeGreaterThan(0.85);
  });

  it("a scaled object at exactly that scale fits and 3 percent more does not", () => {
    const gates = scenarioById("studio-sofa")!.gates;
    const s = maxScale(sofa, gates);
    const at = (k: number) => ({ length: sofa.length * k, height: sofa.height * k, depth: sofa.depth * k });
    expect(planRoute(at(s), gates).fits).toBe(true);
    expect(planRoute(at(s + 0.03), gates).fits).toBe(false);
  });
});
