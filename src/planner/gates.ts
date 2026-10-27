import { extents } from "./geometry";
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
