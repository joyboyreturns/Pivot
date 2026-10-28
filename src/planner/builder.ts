import type { Box, CornerGate, Fix, CorridorGate, DoorwayGate, ElevatorGate, Gate, GateKind, Param } from "./types";

const round = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const GATE_KINDS: GateKind[] = ["doorway", "corridor", "elevator", "corner"];

export function boxParams(box: Box): Param[] {
  const p = (id: string, label: string, value: number): Param => ({ id, label, value, min: 0.1, max: 3.5, step: 0.01 });
  return [p("length", "LENGTH", box.length), p("height", "HEIGHT", box.height), p("depth", "DEPTH", box.depth)];
}

export function withBoxParam(box: Box, id: string, value: number): Box {
  if (!Number.isFinite(value)) return box;
  const v = round(clamp(value, 0.1, 3.5));
  if (id === "length") return { ...box, length: v };
  if (id === "height") return { ...box, height: v };
  if (id === "depth") return { ...box, depth: v };
  return box;
}

const DEPTH_FLOOR = 0.3;

const approachRows = (gate: { approach?: { depth: number; height: number } }): Param[] => [
  { id: "hallDepth", label: "HALL DEPTH", value: gate.approach ? gate.approach.depth : 0, min: 0, max: 5, step: 0.01, optional: true },
  { id: "ceiling", label: "CEILING", value: gate.approach ? gate.approach.height : 2.4, min: 1.8, max: 3.5, step: 0.01 },
];

/** The numbers worth editing for a gate (at most five). Depth 0 means the room in front was not measured. */
export function gateParams(gate: Gate): Param[] {
  switch (gate.kind) {
    case "doorway":
      return [
        { id: "width", label: "WIDTH", value: gate.width, min: 0.4, max: 2.2, step: 0.01 },
        { id: "height", label: "HEIGHT", value: gate.height, min: 1.4, max: 3, step: 0.01 },
        ...approachRows(gate),
      ];
    case "corridor":
      return [
        { id: "width", label: "WIDTH", value: gate.width, min: 0.4, max: 2.5, step: 0.01 },
        { id: "height", label: "HEIGHT", value: gate.height, min: 1.4, max: 3, step: 0.01 },
        ...approachRows(gate),
      ];
    case "elevator":
      return [
        { id: "doorWidth", label: "DOOR", value: gate.door.width, min: 0.5, max: 2, step: 0.01 },
        { id: "cabinWidth", label: "CABIN W", value: gate.cabin.width, min: 0.6, max: 3, step: 0.01 },
        { id: "cabinDepth", label: "CABIN D", value: gate.cabin.depth, min: 0.6, max: 3.5, step: 0.01 },
        { id: "cabinHeight", label: "CABIN H", value: gate.cabin.height, min: 1.8, max: 3.2, step: 0.01 },
        { id: "hallDepth", label: "LOBBY", value: gate.approach ? gate.approach.depth : 0, min: 0, max: 5, step: 0.01, optional: true },
      ];
    case "corner":
      return [
        { id: "inWidth", label: "HALL IN", value: gate.inWidth, min: 0.5, max: 3, step: 0.01 },
        { id: "outWidth", label: "HALL OUT", value: gate.outWidth, min: 0.5, max: 3, step: 0.01 },
        { id: "height", label: "CEILING", value: gate.height, min: 1.0, max: 3.5, step: 0.01 },
      ];
  }
}

function withApproach<T extends { approach?: { depth: number; height: number } }>(gate: T, id: string, v: number): T {
  if (id === "hallDepth") {
    if (v < DEPTH_FLOOR) {
      const { approach: _drop, ...rest } = gate;
      return rest as T;
    }
    return { ...gate, approach: { depth: v, height: gate.approach ? gate.approach.height : 2.4 } };
  }
  if (id === "ceiling") return { ...gate, approach: { depth: gate.approach ? gate.approach.depth : 2, height: v } };
  return gate;
}

/** A copy of the gate with one parameter changed (clamped, rounded to a centimetre). */
export function withGateParam(gate: Gate, id: string, value: number): Gate {
  if (!Number.isFinite(value)) return gate;
  const spec = gateParams(gate).find((p) => p.id === id);
  if (!spec) return gate;
  const v = round(clamp(value, spec.min, spec.max));
  switch (gate.kind) {
    case "doorway":
    case "corridor": {
      let g: DoorwayGate | CorridorGate = gate;
      if (id === "width") g = { ...gate, width: v };
      else if (id === "height") g = { ...gate, height: v };
      else g = withApproach(gate, id, v);
      return g;
    }
    case "elevator": {
      const g: ElevatorGate = gate;
      if (id === "doorWidth") return { ...g, door: { ...g.door, width: v } };
      if (id === "cabinWidth") return { ...g, cabin: { ...g.cabin, width: v } };
      if (id === "cabinDepth") return { ...g, cabin: { ...g.cabin, depth: v } };
      if (id === "cabinHeight") return { ...g, cabin: { ...g.cabin, height: v }, door: { ...g.door, height: Math.min(g.door.height, round(v - 0.1)) } };
      return withApproach(g, id, v);
    }
    case "corner": {
      const g: CornerGate = gate;
      if (id === "inWidth") return { ...g, inWidth: v };
      if (id === "outWidth") return { ...g, outWidth: v };
      if (id === "height") return { ...g, height: v };
      return g;
    }
  }
}

/** A sensible starting gate of each kind. */
export function defaultGate(kind: GateKind, name?: string): Gate {
  switch (kind) {
    case "doorway":
      return { kind, name: name ?? "Doorway", width: 0.9, height: 2.05, approach: { depth: 2.0, height: 2.4 } };
    case "corridor":
      return { kind, name: name ?? "Corridor", width: 0.9, height: 2.0, length: 4, approach: { depth: 2.0, height: 2.4 } };
    case "elevator":
      return {
        kind,
        name: name ?? "Lift",
        door: { width: 0.8, height: 2.05 },
        cabin: { width: 1.1, depth: 1.4, height: 2.3 },
        approach: { depth: 1.8, height: 2.4 },
      };
    case "corner":
      return { kind, name: name ?? "Corner", inWidth: 1.4, outWidth: 1.4, height: 2.4 };
  }
}

const NAMES: Record<GateKind, string> = { doorway: "Door", corridor: "Corridor", elevator: "Lift", corner: "Corner" };

/** The next gate to add to a route: cycles doorway, corridor, lift, corner, with a numbered name. */
export function nextGate(existing: Gate[]): Gate {
  const kind = GATE_KINDS[existing.length % GATE_KINDS.length]!;
  return defaultGate(kind, `${NAMES[kind]} ${existing.length + 1}`);
}

/** The object and gate with a suggested fix applied, ready to be planned again. */
export function applyFix(box: Box, gate: Gate, fix: Fix): { box: Box; gate: Gate } {
  let b = box;
  let g = gate;
  for (const c of fix.changes) {
    if (c.scope === "box") b = withBoxParam(b, c.id, c.value);
    else g = withGateParam(g, c.id, c.value);
  }
  return { box: b, gate: g };
}
