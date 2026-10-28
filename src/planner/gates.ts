import { extents, rotationMatrix } from "./geometry";
import type { Approach, Box, Gate, Pose } from "./types";

/** Gates that are passed in one fixed pose, so a pose either clears them or it does not. */
export type PoseGate = Exclude<Gate, { kind: "corner" }>;

export const isPoseGate = (gate: Gate): gate is PoseGate => gate.kind !== "corner";

/** Spare room at the gate for a pose: the smallest slack over every constraint; negative means it jams. */
export function gateClearance(box: Box, gate: PoseGate, pose: Pose): number {
  const e = extents(box, pose);
  switch (gate.kind) {
    case "doorway":
    case "corridor":
      return Math.min(gate.width - e.x, gate.height - e.y);
    case "elevator":
      return Math.min(
        gate.door.width - e.x,
        gate.door.height - e.y,
        gate.cabin.width - e.x,
        gate.cabin.height - e.y,
        gate.cabin.depth - e.z,
      );
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return { pitch: lerp(a.pitch, b.pitch, t), yaw: lerp(a.yaw, b.yaw, t), roll: lerp(a.roll, b.roll, t) };
}

export interface Sweep {
  /** Smallest slack against the approach space while rotating; Infinity when no rotation. */
  clearance: number;
  /** Largest extent reached along z (depth needed) and y (height needed). */
  depth: number;
  height: number;
}

/**
 * Rotate from `from` to `to` (angles interpolated linearly, sampled every `maxStep` degrees)
 * and take the tightest clearance against the approach space.
 */
export function sweepSegment(box: Box, approach: Approach | null, from: Pose, to: Pose, maxStep = 10): Sweep {
  if (!Number.isFinite(maxStep) || maxStep <= 0) throw new RangeError("Sweep step must be positive and finite");
  const axes = (["pitch", "yaw", "roll"] as const).filter((axis) => from[axis] !== to[axis]);
  if (axes.length === 1) return singleAxisSweep(box, approach, from, to, axes[0]!);
  const delta = Math.max(Math.abs(to.pitch - from.pitch), Math.abs(to.yaw - from.yaw), Math.abs(to.roll - from.roll));
  const n = Math.max(1, Math.ceil(delta / maxStep));
  let clearance = Infinity;
  let depth = 0;
  let height = 0;
  for (let i = 0; i <= n; i++) {
    const e = extents(box, lerpPose(from, to, i / n));
    depth = Math.max(depth, e.z);
    height = Math.max(height, e.y);
    if (approach) clearance = Math.min(clearance, approach.depth - e.z, approach.height - e.y);
  }
  return { clearance, depth, height };
}

/** Each signed vertex coordinate is a sinusoid during a one-axis turn. Check its
 * exact maximum, including peaks between the old ten-degree samples. */
function singleAxisSweep(box: Box, approach: Approach | null, from: Pose, to: Pose, axis: keyof Pose): Sweep {
  const matrices = [0, 90, 180].map((angle) => rotationMatrix({ ...from, [axis]: angle }));
  const lo = Math.min(from[axis], to[axis]) * Math.PI / 180;
  const hi = Math.max(from[axis], to[axis]) * Math.PI / 180;
  const maximum = (row: number): number => {
    let result = 0;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const v = [box.length * sx, box.height * sy, box.depth * sz];
      const values = matrices.map((m) => m[row]! * v[0]! + m[row + 1]! * v[1]! + m[row + 2]! * v[2]!);
      const c = (values[0]! + values[2]!) / 2;
      const a = values[0]! - c;
      const b = values[1]! - c;
      const at = (angle: number) => c + a * Math.cos(angle) + b * Math.sin(angle);
      result = Math.max(result, at(lo), at(hi));
      const phase = Math.atan2(b, a);
      const peak = phase + Math.ceil((lo - phase) / (2 * Math.PI)) * 2 * Math.PI;
      if (peak <= hi) result = Math.max(result, c + Math.hypot(a, b));
    }
    return result;
  };
  const depth = maximum(6);
  const height = maximum(3);
  return { depth, height, clearance: approach ? Math.min(approach.depth - depth, approach.height - height) : Infinity };
}

/** The tilt/rotate stages that take the box from upright to `pose`: pitch, then roll, then yaw. */
export function rotationChain(pose: Pose): { kind: "tilt" | "rotate"; pose: Pose; hint: string }[] {
  const chain: { kind: "tilt" | "rotate"; pose: Pose; hint: string }[] = [];
  if (pose.pitch) chain.push({ kind: "tilt", pose: { pitch: pose.pitch, yaw: 0, roll: 0 }, hint: `Tip it ${round(pose.pitch)} degrees` });
  if (pose.roll) chain.push({ kind: "tilt", pose: { pitch: pose.pitch, yaw: 0, roll: pose.roll }, hint: `Tilt it ${round(pose.roll)} degrees` });
  if (pose.yaw) chain.push({ kind: "rotate", pose, hint: `Turn it ${round(pose.yaw)} degrees` });
  return chain;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Sweep the whole rotation chain to `pose` against the approach space. */
export function sweepChain(box: Box, approach: Approach | null, pose: Pose): Sweep {
  let prev: Pose = { pitch: 0, yaw: 0, roll: 0 };
  const total: Sweep = { clearance: Infinity, depth: 0, height: 0 };
  for (const stage of rotationChain(pose)) {
    const s = sweepSegment(box, approach, prev, stage.pose);
    total.clearance = Math.min(total.clearance, s.clearance);
    total.depth = Math.max(total.depth, s.depth);
    total.height = Math.max(total.height, s.height);
    prev = stage.pose;
  }
  return total;
}
