import { clearance } from "./geometry";
import type { Box, Doorway, Plan, PlanOptions, PlanStep, Pose } from "./types";

const UPRIGHT: Pose = { pitch: 0, yaw: 0, roll: 0 };
const EPS = 1e-9;

const effort = (p: Pose) => p.pitch + p.yaw + p.roll;

/**
 * Pick the pass pose. Among poses with comfortable clearance, the one needing the
 * least rotation wins; if none is comfortable, the one with the most clearance
 * that still fits; otherwise nothing fits.
 */
function choosePose(box: Box, door: Doorway, step: number, comfortable: number): { pose: Pose; clearance: number } {
  let comfy: { pose: Pose; clearance: number } | null = null;
  let best: { pose: Pose; clearance: number } = { pose: UPRIGHT, clearance: clearance(box, door, UPRIGHT) };

  // The box is symmetric under 180 degree turns, so [0, 180) covers every distinct pose.
  for (let pitch = 0; pitch < 180; pitch += step)
    for (let yaw = 0; yaw < 180; yaw += step)
      for (let roll = 0; roll < 180; roll += step) {
        const pose = { pitch, yaw, roll };
        const c = clearance(box, door, pose);
        if (c > best.clearance + EPS) best = { pose, clearance: c };
        if (c < comfortable - EPS) continue;
        const dEffort = comfy ? effort(pose) - effort(comfy.pose) : -1;
        // Least rotation wins; at equal rotation, the roomier pose wins.
        if (!comfy || dEffort < -EPS || (Math.abs(dEffort) <= EPS && c > comfy.clearance + EPS)) comfy = { pose, clearance: c };
      }
  return comfy ?? best;
}

function hint(pose: Pose): string {
  const parts = [
    pose.pitch && `tip it ${pose.pitch} degrees`,
    pose.yaw && `turn it ${pose.yaw} degrees`,
    pose.roll && `tilt it ${pose.roll} degrees`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "carry it straight through";
}

/** Plan how to carry `box` through `door`. Pure and deterministic. */
export function planMove(box: Box, door: Doorway, options: PlanOptions = {}): Plan {
  const { stepDegrees = 15, comfortableClearance = 0.02 } = options;
  const { pose, clearance: c } = choosePose(box, door, stepDegrees, comfortableClearance);

  if (c < -EPS) {
    return { fits: false, steps: [], bottleneckIndex: -1, clearance: c };
  }

  const steps: PlanStep[] = [{ kind: "start", pose: UPRIGHT, clearance: null, hint: "Start here" }];
  if (pose.pitch) steps.push({ kind: "tilt", pose: { ...UPRIGHT, pitch: pose.pitch }, clearance: null, hint: `Tip it ${pose.pitch} degrees` });
  if (pose.roll) steps.push({ kind: "tilt", pose: { ...UPRIGHT, pitch: pose.pitch, roll: pose.roll }, clearance: null, hint: `Tilt it ${pose.roll} degrees` });
  if (pose.yaw) steps.push({ kind: "rotate", pose, clearance: null, hint: `Turn it ${pose.yaw} degrees` });
  steps.push({ kind: "slide", pose, clearance: null, hint: "Slide it up to the doorway" });
  steps.push({ kind: "pass", pose, clearance: c, hint: `Now ${hint(pose)}: ${(c * 100).toFixed(0)} cm to spare` });

  return { fits: true, steps, bottleneckIndex: steps.length - 1, clearance: c };
}
