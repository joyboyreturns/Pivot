import { cornerCentre } from "./corner";
import { lerpPose } from "./gates";
import type { Plan, Pose, Vec3 } from "./types";

/** Where the object is and how it is turned at one moment of the playback. */
export interface Frame {
  /** Centre of the object in the gate frame (metres). */
  position: Vec3;
  pose: Pose;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });

/** How far (0..1) playback can run: all the way when it fits, up to the jam point of a corner plan when it does not. */
export function maxProgress(plan: Plan): number {
  if (plan.fits || plan.steps.length < 2 || plan.bottleneckIndex < 0) return 1;
  return plan.bottleneckIndex / (plan.steps.length - 1);
}

/**
 * Object frame at progress `u` (0..1) spread evenly over the plan's steps. Poses are interpolated
 * between steps; L-turns follow the exact pushed-into-the-corner path while swinging.
 * Plans without steps (nothing fits a doorway) use `attemptFrame`.
 */
export function frameAt(plan: Plan, u: number): Frame {
  if (plan.steps.length < 2) return attemptFrame(u);
  const n = plan.steps.length - 1;
  const cursor = Math.min(1, Math.max(0, u)) * n;
  const i = Math.min(n - 1, Math.floor(cursor));
  const f = cursor - i;
  const a = plan.steps[i]!;
  const b = plan.steps[i + 1]!;
  const pose = lerpPose(a.pose, b.pose, f);
  if (plan.turn && a.pose.yaw !== b.pose.yaw) {
    const c = cornerCentre(plan.turn.footprint, pose.yaw, plan.turn.inWidth, plan.turn.outWidth);
    return { position: { x: c.x, y: 0, z: -c.y }, pose };
  }
  return { position: lerpVec(a.at, b.at, f), pose };
}

/** A failed attempt at a doorway: the object is pushed up and twisted against the opening. */
export function attemptFrame(u: number): Frame {
  const p = Math.min(1, Math.max(0, u));
  return { position: { x: 0, y: 0.18 * p, z: 0.55 - 0.2 * p }, pose: { pitch: 0, yaw: 31.5 * p, roll: 63 * p } };
}
