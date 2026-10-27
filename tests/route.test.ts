import { describe, expect, it } from "vitest";
import {
  attemptFrame,
  fitMatrix,
  formatFitMatrix,
  formatScenario,
  frameAt,
  furniture,
  gateClearance,
  maxProgress,
  minDoorwayWidth,
  planGate,
  planMove,
  planRoute,
  routes,
  scenarioById,
  scenarios,
} from "../src/planner";
import type { Gate } from "../src/planner";

const sofa = { length: 2.1, height: 0.85, depth: 0.9 };
const upright = { pitch: 0, yaw: 0, roll: 0 };

describe("approach clearance", () => {
  it("without approach space the tilts and turns are unverified", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 });
    expect(plan.verified).toBe(false);
    const rotate = plan.steps.find((s) => s.kind === "rotate")!;
    expect(rotate.verified).toBe(false);
    expect(rotate.clearance).toBeNull();
    expect(plan.steps.at(-1)!.verified).toBe(true);
  });

  it("with enough room every step is verified and the turn is measured", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 }, { approach: { depth: 2.6, height: 2.5 } });
    expect(plan.fits).toBe(true);
    expect(plan.verified).toBe(true);
    expect(plan.steps.at(-1)!.pose.yaw).toBe(90);
    const rotate = plan.steps.find((s) => s.kind === "rotate")!;
    expect(rotate.clearance).toBeGreaterThan(0);
    expect(plan.approachClearance).toBeGreaterThan(0);
    expect(plan.approachNeeded!.depth).toBeGreaterThan(2.1);
  });

  it("a turn sweeps a diagonal longer than the sofa itself", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 });
    expect(plan.steps.at(-1)!.pose.yaw).toBe(90);
    expect(plan.approachNeeded!.depth).toBeGreaterThan(2.25);
    expect(plan.approachNeeded!.depth).toBeLessThan(2.3);
  });

  it("with less room the planner switches to another way of getting it through, and checks that too", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 }, { approach: { depth: 2.2, height: 2.5 } });
    expect(plan.fits).toBe(true);
    expect(plan.verified).toBe(true);
    expect(plan.approachClearance).toBeGreaterThanOrEqual(0);
    expect(plan.steps.at(-1)!.pose.yaw).not.toBe(90);
  });

  it("1 m of room is not enough for a 2.1 m sofa in any pose", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 }, { approach: { depth: 1.0, height: 2.5 } });
    expect(plan.fits).toBe(false);
    expect(plan.reason).toBe("approach");
  });

  it("a door that fits but cannot be reached reports the approach as the reason, with the plan that would work", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 }, { approach: { depth: 1.2, height: 2.5 } });
    expect(plan.fits).toBe(false);
    expect(plan.reason).toBe("approach");
    expect(plan.gateClearance).toBeGreaterThan(0);
    expect(plan.approachClearance).toBeLessThan(0);
    expect(plan.clearance).toBeLessThan(0);
    expect(plan.alternative?.fits).toBe(true);
    expect(plan.approachNeeded!.depth).toBeGreaterThan(2.1);
  });

  it("a door that is too small reports the gate, whatever the approach", () => {
    const plan = planMove(sofa, { width: 0.8, height: 2.05 }, { approach: { depth: 3, height: 2.5 } });
    expect(plan.fits).toBe(false);
    expect(plan.reason).toBe("gate");
  });

  it("an object that goes straight through needs no turning room and stays verified", () => {
    const plan = planMove({ length: 0.5, height: 0.5, depth: 0.5 }, { width: 0.9, height: 2 }, { approach: { depth: 0.3, height: 1 } });
    expect(plan.fits).toBe(true);
    expect(plan.verified).toBe(true);
    expect(plan.approachNeeded).toBeNull();
  });

  it("a low ceiling can rule out the pose that the doorway alone would choose", () => {
    const tall = { length: 1.0, height: 2.0, depth: 0.6 };
    const loose = planMove(tall, { width: 0.7, height: 2.1 });
    const capped = planMove(tall, { width: 0.7, height: 2.1 }, { approach: { depth: 2, height: 1.1 } });
    expect(loose.fits).toBe(true);
    expect(capped.fits).toBe(false);
    expect(capped.reason).toBe("approach");
  });

  it("the doorway's own approach space is used unless overridden", () => {
    const gate: Gate = { kind: "doorway", name: "d", width: 0.95, height: 2.05, approach: { depth: 1.2, height: 2.5 } };
    expect(planGate(sofa, gate).fits).toBe(false);
    expect(planGate(sofa, gate, { approach: { depth: 3, height: 2.5 } }).fits).toBe(true);
    expect(planGate(sofa, gate, { approach: null }).fits).toBe(true);
  });
});

describe("elevator gate", () => {
  const lift: Gate = {
    kind: "elevator",
    name: "Lift",
    door: { width: 0.8, height: 2.05 },
    cabin: { width: 1.1, depth: 1.4, height: 2.3 },
  };

  it("checks the cabin as well as the door", () => {
    const wardrobe = furniture.wardrobe!;
    const quarterTurn = { pitch: 0, yaw: 90, roll: 0 };
    // door: width .6 and height 2.0 fit; cabin depth: 1.0 fits in 1.4
    expect(gateClearance(wardrobe, lift as never, quarterTurn)).toBeCloseTo(0.05, 6);
    const tooDeep = { ...lift, cabin: { width: 1.1, depth: 0.9, height: 2.3 } } as never;
    expect(gateClearance(wardrobe, tooDeep, quarterTurn)).toBeCloseTo(-0.1, 6);
  });

  it("a wardrobe fits the lift after a quarter turn", () => {
    const plan = planGate(furniture.wardrobe!, lift);
    expect(plan.fits).toBe(true);
    expect(plan.steps.some((s) => s.kind === "rotate")).toBe(true);
  });

  it("a queen mattress cannot ride in a 1.4 m deep cabin", () => {
    expect(planGate(furniture.queenMattress!, lift).fits).toBe(false);
  });
});

describe("corridor gate", () => {
  it("is checked on its cross-section", () => {
    const corridor: Gate = { kind: "corridor", name: "c", width: 0.9, height: 1.95, length: 6 };
    expect(planGate(furniture.wardrobe!, corridor).fits).toBe(true);
    expect(planGate(furniture.wardrobe!, { ...corridor, width: 0.5 }).fits).toBe(false);
  });
});

describe("planRoute", () => {
  it("reports each gate, the bottleneck and a clear verdict", () => {
    const route = planRoute(furniture.fridge!, routes["New build"]!);
    expect(route.gates).toHaveLength(2);
    expect(route.verdict).toBe("clear");
    expect(route.fits).toBe(true);
    expect(route.bottleneckIndex).toBeGreaterThanOrEqual(0);
    const limiting = route.gates[route.bottleneckIndex]!.plan.clearance;
    expect(route.gates.every((g) => g.plan.clearance >= limiting - 1e-9)).toBe(true);
    expect(route.clearance).toBeCloseTo(limiting, 9);
  });

  it("is blocked at the first gate that does not fit", () => {
    const route = planRoute(sofa, scenarioById("studio-sofa")!.gates);
    expect(route.verdict).toBe("blocked");
    expect(route.firstBlockedIndex).toBe(1);
    expect(route.bottleneckIndex).toBe(1);
    expect(route.summary).toContain("Flat door");
  });

  it("is tight when the least slack is under the threshold", () => {
    const route = planRoute(sofa, scenarioById("hallway-corner")!.gates);
    expect(route.verdict).toBe("tight");
    expect(planRoute(sofa, scenarioById("hallway-corner")!.gates, { tightClearance: 0.001 }).verdict).toBe("clear");
  });

  it("counts unverified steps and clears the flag when the approach space is given", () => {
    const gates: Gate[] = [{ kind: "doorway", name: "d", width: 0.95, height: 2.05 }];
    const bare = planRoute(sofa, gates);
    expect(bare.verified).toBe(false);
    expect(bare.unverifiedSteps).toBeGreaterThan(0);
    const withRoom = planRoute(sofa, gates, { approach: { depth: 2.6, height: 2.5 } });
    expect(withRoom.verified).toBe(true);
    expect(withRoom.unverifiedSteps).toBe(0);
  });

  it("an empty route is not a fit", () => {
    expect(planRoute(sofa, []).fits).toBe(false);
  });
});

describe("inverse queries", () => {
  it("the sofa needs a doorway at least 85 cm wide", () => {
    const need = minDoorwayWidth(sofa, 2.05)!;
    expect(need.width).toBeCloseTo(0.85, 2);
    expect(need.plan.fits).toBe(true);
    expect(planMove(sofa, { width: need.width - 0.01, height: 2.05 }).fits).toBe(false);
  });

  it("is null when the height rules the box out", () => {
    expect(minDoorwayWidth(sofa, 0.5)).toBeNull();
  });

  it("the approach space can raise the answer", () => {
    const free = minDoorwayWidth(sofa, 2.05)!.width;
    const boxed = minDoorwayWidth(sofa, 2.05, { approach: { depth: 1.2, height: 2.5 } })!.width;
    expect(boxed).toBeGreaterThanOrEqual(free);
  });

  it("fit matrix has one row per object and one cell per route", () => {
    const rows = fitMatrix(furniture, routes);
    expect(rows).toHaveLength(Object.keys(furniture).length);
    for (const row of rows) expect(row.cells).toHaveLength(Object.keys(routes).length);
    const fridge = rows.find((r) => r.box === "fridge")!;
    expect(fridge.cells.every((c) => c.verdict !== "blocked")).toBe(true);
    expect(rows.find((r) => r.box === "queenMattress")!.cells.find((c) => c.route === "Lift move")!.verdict).toBe("blocked");
    expect(formatFitMatrix(rows)).toContain("BLOCKED");
  });
});

describe("scenario library", () => {
  it("has at least six uniquely named scenarios with story text", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
    for (const s of scenarios) {
      expect(s.story.length).toBeGreaterThan(30);
      expect(s.lesson.length).toBeGreaterThan(30);
    }
  });

  it("every scenario gives the verdict it advertises", () => {
    for (const s of scenarios) expect(planRoute(s.box, s.gates).verdict, s.id).toBe(s.expected);
  });

  it("covers all four gate kinds and all three verdicts", () => {
    const kinds = new Set(scenarios.flatMap((s) => s.gates.map((g) => g.kind)));
    expect(kinds).toEqual(new Set(["doorway", "corridor", "elevator", "corner"]));
    expect(new Set(scenarios.map((s) => s.expected))).toEqual(new Set(["clear", "tight", "blocked"]));
  });

  it("the narrow hall scenario is blocked by the approach, not the door", () => {
    const route = planRoute(sofa, scenarioById("narrow-hall")!.gates);
    expect(route.gates[route.firstBlockedIndex]!.plan.reason).toBe("approach");
  });

  it("the widened door scenario is fully verified", () => {
    const s = scenarioById("widened-door")!;
    expect(planRoute(s.box, s.gates).verified).toBe(true);
  });

  it("the report names the story, the bottleneck and the doorway it would need", () => {
    const text = formatScenario(scenarioById("studio-sofa")!);
    expect(text).toContain("Studio flat sofa");
    expect(text).toContain("<- bottleneck");
    expect(text).toContain("at least 85 cm");
  });
});

describe("choreography", () => {
  it("starts at the first step and ends at the pass step", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 });
    const first = frameAt(plan, 0);
    const last = frameAt(plan, 1);
    expect(first.pose).toEqual(upright);
    expect(first.position.z).toBeCloseTo(plan.steps[0]!.at.z, 9);
    expect(last.pose.yaw).toBeCloseTo(plan.steps.at(-1)!.pose.yaw, 9);
    expect(last.position.z).toBeCloseTo(plan.steps.at(-1)!.at.z, 9);
  });

  it("moves the object through the doorway plane (z falls) and clamps u", () => {
    const plan = planMove(sofa, { width: 0.95, height: 2.05 });
    expect(frameAt(plan, 1).position.z).toBeLessThan(frameAt(plan, 0).position.z);
    expect(frameAt(plan, 5).pose).toEqual(frameAt(plan, 1).pose);
  });

  it("an L-turn follows the corner path: the yaw passes through every angle between 0 and the swing", () => {
    const plan = planGate(sofa, { kind: "corner", name: "c", inWidth: 1.6, outWidth: 1.6, height: 2.4 });
    const yaws = Array.from({ length: 41 }, (_, i) => frameAt(plan, i / 40).pose.yaw);
    expect(Math.min(...yaws)).toBeCloseTo(-90, 6);
    expect(Math.max(...yaws)).toBeCloseTo(0, 6);
    const end = frameAt(plan, 1);
    expect(end.position.z).toBeGreaterThan(frameAt(plan, 0.6).position.z - 1e-9);
  });

  it("a blocked corner can only be played up to its jam point", () => {
    const plan = planGate(sofa, { kind: "corner", name: "c", inWidth: 1.0, outWidth: 1.0, height: 2.4 });
    expect(plan.fits).toBe(false);
    expect(maxProgress(plan)).toBeLessThan(1);
    expect(maxProgress(plan)).toBeGreaterThan(0);
    const fit = planGate(sofa, { kind: "corner", name: "c", inWidth: 1.6, outWidth: 1.6, height: 2.4 });
    expect(maxProgress(fit)).toBe(1);
  });

  it("plans without steps use the attempt animation", () => {
    const plan = planMove(sofa, { width: 0.8, height: 2.05 });
    expect(frameAt(plan, 1)).toEqual(attemptFrame(1));
    expect(attemptFrame(0).pose).toEqual(upright);
  });
});
