import { withBoxParam, withGateParam } from "./builder";
import type { Box, Gate, Vec3 } from "./types";

/**
 * A grab point on the object or the gate. It sits on the very edge it changes, in the stage's own frame
 * (metres: x across the gate, y up, z toward the wearer), and moves along one axis.
 * Dragging it by `delta` metres along `axis` changes the parameter `id` by `sign * delta`
 * (sign 2 for edges that grow symmetrically about the middle, so the edge follows the hand).
 */
export interface HandleSpec {
  key: string;
  scope: "box" | "gate";
  id: string;
  label: string;
  axis: "x" | "y" | "z";
  sign: number;
  at: Vec3;
  /** Value of the parameter at the handle's current position (what a drag starts from). */
  value: number;
  /** True when the number was never measured: the handle shows a proposal and changes nothing until it is moved. */
  proposal?: boolean;
}

/** Where an unmeasured hall is proposed to end until the wearer drags it. */
export const PROPOSED_HALL = 1.5;

const hallHandle = (gate: { approach?: { depth: number } }, label: string): HandleSpec => ({
  key: "gate:hallDepth",
  scope: "gate",
  id: "hallDepth",
  label,
  axis: "z",
  sign: 1,
  at: { x: -1.15, y: 0.03, z: gate.approach ? gate.approach.depth : PROPOSED_HALL },
  value: gate.approach ? gate.approach.depth : PROPOSED_HALL,
  proposal: !gate.approach,
});

/** The object's three edges, on the box as it stands upright at the start of the move (`start` is its floor position). */
export function boxHandles(box: Box, start: Vec3): HandleSpec[] {
  return [
    { key: "box:length", scope: "box", id: "length", label: "LENGTH", axis: "x", sign: 2, at: { x: start.x + box.length / 2, y: box.height / 2, z: start.z }, value: box.length },
    { key: "box:height", scope: "box", id: "height", label: "HEIGHT", axis: "y", sign: 1, at: { x: start.x, y: box.height, z: start.z }, value: box.height },
    { key: "box:depth", scope: "box", id: "depth", label: "DEPTH", axis: "z", sign: 2, at: { x: start.x, y: box.height / 2, z: start.z + box.depth / 2 }, value: box.depth },
  ];
}

/** The gate's edges: jambs, lintel, cabin walls, hall ends and the room in front of the gate. */
export function gateHandles(gate: Gate): HandleSpec[] {
  switch (gate.kind) {
    case "doorway":
    case "corridor":
      return [
        { key: "gate:width", scope: "gate", id: "width", label: "WIDTH", axis: "x", sign: 2, at: { x: gate.width / 2, y: gate.height / 2, z: 0 }, value: gate.width },
        { key: "gate:height", scope: "gate", id: "height", label: "HEIGHT", axis: "y", sign: 1, at: { x: 0, y: gate.height, z: 0 }, value: gate.height },
        hallHandle(gate, "ROOM TO TURN"),
      ];
    case "elevator": {
      const { door, cabin } = gate;
      return [
        { key: "gate:doorWidth", scope: "gate", id: "doorWidth", label: "DOOR", axis: "x", sign: 2, at: { x: door.width / 2, y: door.height / 2, z: 0 }, value: door.width },
        { key: "gate:cabinWidth", scope: "gate", id: "cabinWidth", label: "CABIN WIDTH", axis: "x", sign: 2, at: { x: cabin.width / 2, y: cabin.height / 2, z: -cabin.depth / 2 }, value: cabin.width },
        { key: "gate:cabinDepth", scope: "gate", id: "cabinDepth", label: "CABIN DEPTH", axis: "z", sign: -1, at: { x: 0, y: cabin.height / 2, z: -cabin.depth }, value: cabin.depth },
        { key: "gate:cabinHeight", scope: "gate", id: "cabinHeight", label: "CABIN HEIGHT", axis: "y", sign: 1, at: { x: 0, y: cabin.height, z: -cabin.depth / 2 }, value: cabin.height },
        hallHandle(gate, "LOBBY"),
      ];
    }
    case "corner":
      return [
        { key: "gate:inWidth", scope: "gate", id: "inWidth", label: "HALL IN", axis: "z", sign: -1, at: { x: -1, y: 0.15, z: -gate.inWidth }, value: gate.inWidth },
        { key: "gate:outWidth", scope: "gate", id: "outWidth", label: "HALL OUT", axis: "x", sign: 1, at: { x: gate.outWidth, y: 0.15, z: 1 }, value: gate.outWidth },
      ];
  }
}

/** The object and gate after a handle was dragged `delta` metres along its axis from where the drag began. */
export function applyHandle(box: Box, gate: Gate, spec: HandleSpec, delta: number): { box: Box; gate: Gate } {
  if (delta === 0) return { box, gate };
  const value = spec.value + spec.sign * delta;
  if (spec.scope === "box") return { box: withBoxParam(box, spec.id, value), gate };
  return { box, gate: withGateParam(gate, spec.id, value) };
}
