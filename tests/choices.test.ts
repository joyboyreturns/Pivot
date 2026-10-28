import { describe, expect, it } from "vitest";
import { planRoute, rankRoutes, recommendRoute, scenarios } from "../src/planner";
import type { RouteChoice } from "../src/planner";

const box = { length: 1.2, height: 1, depth: 0.8 };
const route = (id: string, width: number): RouteChoice => ({ id, name: id, gates: [{ kind: "doorway", name: "Door", width, height: 2.2, approach: { depth: 3, height: 2.8 } }] });

describe("measured route alternatives", () => {
  it("prefers a fitting route with more clearance and leaves inputs unchanged", () => {
    const choices = [route("blocked", 0.5), route("tight", 0.81), route("roomy", 1.4)];
    const before = JSON.stringify(choices);
    expect(rankRoutes(box, choices).map((r) => r.choice.id)).toEqual(["roomy", "tight", "blocked"]);
    expect(recommendRoute(box, choices)!.choice.id).toBe("roomy");
    expect(JSON.stringify(choices)).toBe(before);
  });

  it("prefers checked maneuvers over an unmeasured route", () => {
    const checked = route("checked", 0.95);
    const unknown: RouteChoice = { id: "unknown", name: "Unknown", gates: [{ kind: "doorway", name: "Door", width: 1.1, height: 2.2 }] };
    expect(recommendRoute(box, [unknown, checked])!.choice.id).toBe("checked");
  });

  it("keeps deterministic input order for equal routes", () => {
    const choices = [route("first", 1.4), route("second", 1.4)];
    expect(rankRoutes(box, choices).map((r) => r.choice.id)).toEqual(["first", "second"]);
    expect(rankRoutes(box, choices)).toEqual(rankRoutes(box, choices));
  });

  it("offers nothing when every route is blocked or absent", () => {
    expect(recommendRoute(box, [route("small", 0.5)])).toBeNull();
    expect(recommendRoute(box, [])).toBeNull();
  });

  it("every showcase alternative improves on its original route", () => {
    const choices = scenarios.filter((s) => s.alternatives?.length);
    expect(choices.length).toBeGreaterThanOrEqual(3);
    for (const s of choices) {
      const before = planRoute(s.box, s.gates);
      const after = recommendRoute(s.box, s.alternatives!)!;
      expect(after.plan.fits, s.id).toBe(true);
      expect(after.plan.clearance, s.id).toBeGreaterThan(before.clearance);
    }
  });

  it("showcases five distinct non-furniture object contexts", () => {
    for (const id of ["backstage-flight-case", "gallery-loading", "workshop-bench", "aquarium-delivery", "cargo-lift"]) {
      expect(scenarios.some((s) => s.id === id), id).toBe(true);
    }
  });
});
