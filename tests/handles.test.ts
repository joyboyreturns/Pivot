import { describe, expect, it } from "vitest";
import { applyHandle, boxHandles, defaultGate, frameAt, gateHandles, gateParams, planRoute, scenarios, withGateParam, PROPOSED_HALL } from "../src/planner/index";
import type { Gate, HandleSpec } from "../src/planner/index";

const value = (gate: Gate, id: string) => gateParams(gate).find((p) => p.id === id)!.value;

describe("drag handles", () => {
  it("sit on the edge they change, for every kind of gate", () => {
    for (const kind of ["doorway", "corridor", "elevator", "corner"] as const) {
      const gate = defaultGate(kind);
      for (const h of gateHandles(gate)) {
        const axisPos = h.at[h.axis];
        // The handle's own coordinate is the parameter (or half of it, for symmetric edges) up to the sign.
        expect(Math.abs(axisPos)).toBeCloseTo(h.value / (h.sign === 2 ? 2 : 1), 5);
      }
    }
  });

  it("moves the edge by exactly the drag, and the same drag back restores it", () => {
    const gate = defaultGate("doorway");
    const width = gateHandles(gate).find((h) => h.id === "width")!;
    const out = applyHandle({ length: 1, height: 1, depth: 1 }, gate, width, 0.05);
    expect(value(out.gate, "width")).toBeCloseTo(0.9 + 0.1, 5);
    const back = applyHandle({ length: 1, height: 1, depth: 1 }, out.gate, { ...width, value: value(out.gate, "width") }, -0.05);
    expect(value(back.gate, "width")).toBeCloseTo(0.9, 5);
  });

  it("clamps at the limits of each parameter", () => {
    const gate = defaultGate("doorway");
    const h = gateHandles(gate).find((x) => x.id === "height")!;
    expect(value(applyHandle({ length: 1, height: 1, depth: 1 }, gate, h, 9).gate, "height")).toBe(3);
    expect(value(applyHandle({ length: 1, height: 1, depth: 1 }, gate, h, -9).gate, "height")).toBe(1.4);
  });

  it("grows the cabin backwards and the hall toward the wearer", () => {
    const lift = defaultGate("elevator");
    const depth = gateHandles(lift).find((h) => h.id === "cabinDepth")!;
    expect(depth.at.z).toBeCloseTo(-1.4, 5);
    const deeper = applyHandle({ length: 1, height: 1, depth: 1 }, lift, depth, -0.2);
    expect(value(deeper.gate, "cabinDepth")).toBeCloseTo(1.6, 5);
    const hall = gateHandles(defaultGate("doorway")).find((h) => h.id === "hallDepth")!;
    expect(value(applyHandle({ length: 1, height: 1, depth: 1 }, defaultGate("doorway"), hall, 0.5).gate, "hallDepth")).toBeCloseTo(2.5, 5);
  });

  it("proposes an unmeasured hall without changing the gate until it is moved", () => {
    const door = withGateParam(defaultGate("doorway"), "hallDepth", 0);
    const hall = gateHandles(door).find((h) => h.id === "hallDepth")!;
    expect(hall.proposal).toBe(true);
    expect(hall.at.z).toBe(PROPOSED_HALL);
    expect(applyHandle({ length: 1, height: 1, depth: 1 }, door, hall, 0).gate).toBe(door);
    expect(value(applyHandle({ length: 1, height: 1, depth: 1 }, door, hall, 0.5).gate, "hallDepth")).toBeCloseTo(2, 5);
  });

  it("puts the object's handles on its upright start pose in every scenario", () => {
    for (const s of scenarios) {
      const route = planRoute(s.box, s.gates);
      const f = frameAt(route.gates[0]!.plan, 0);
      expect(f.pose).toEqual({ pitch: 0, yaw: 0, roll: 0 });
      const [length, height, depth] = boxHandles(s.box, f.position) as [HandleSpec, HandleSpec, HandleSpec];
      expect(length.at.x - f.position.x).toBeCloseTo(s.box.length / 2, 5);
      expect(height.at.y).toBeCloseTo(s.box.height, 5);
      expect(depth.at.z - f.position.z).toBeCloseTo(s.box.depth / 2, 5);
    }
  });

  it("resizes the object symmetrically, so the edge follows the hand", () => {
    const box = { length: 2, height: 0.9, depth: 1 };
    const [length] = boxHandles(box, { x: 0, y: 0, z: 0.55 }) as [HandleSpec, HandleSpec, HandleSpec];
    const grown = applyHandle(box, defaultGate("doorway"), length, 0.1);
    expect(grown.box.length).toBeCloseTo(2.2, 5);
    expect(length.at.x + 0.1).toBeCloseTo(grown.box.length / 2, 5);
  });
});
