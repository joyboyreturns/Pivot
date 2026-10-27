import { cornerCentre, solveCorner } from "./corner";
import { gateClearance, isPoseGate, rotationChain, sweepChain, sweepSegment } from "./gates";
import type { PoseGate } from "./gates";
import type {
  Approach,
  Box,
  CornerGate,
  Doorway,
  Gate,
  Plan,
  PlanOptions,
  PlanStep,
  Pose,
  Vec3,
} from "./types";

const UPRIGHT: Pose = { pitch: 0, yaw: 0, roll: 0 };
const EPS = 1e-9;

/** Where the object stands, in metres along z (the carry direction is -z), while it is shown in each phase. */
export const APPROACH_Z = 0.55;
export const SLIDE_Z = 0.25;
export const PASS_Z = -0.55;

const effort = (p: Pose) => p.pitch + p.yaw + p.roll;
const at = (z: number): Vec3 => ({ x: 0, y: 0, z });
const centimetres = (m: number) => `${(m * 100).toFixed(0)} cm`;

interface Eval {
  gate: number;
  /** Infinity when there is no approach space or no rotation. */
  approach: number;
  total: number;
}

interface Choice extends Eval {
  pose: Pose;
}

function resolveApproach(gate: Gate, options: PlanOptions): Approach | null {
  if (options.approach === null) return null;
  if (options.approach) return options.approach;
  return gate.kind === "corner" ? null : (gate.approach ?? null);
}

/**
 * Pick the pass pose. Among poses with comfortable clearance, the one needing the
 * least rotation wins; if none is comfortable, the one with the most clearance
 * that still fits; otherwise nothing fits. Clearance is the smaller of the gate slack and
 * the slack while getting into that pose inside the approach space.
 */
function choosePose(box: Box, gate: PoseGate, approach: Approach | null, step: number, comfortable: number, fine: number): Choice {
  const evaluate = (pose: Pose, best: Choice | null): Eval => {
    const g = gateClearance(box, gate, pose);
    // The approach sweep is the expensive part: skip it for poses that cannot win.
    const canWin = g >= comfortable - EPS || !best || g > best.total + EPS;
    if (!approach || g < -EPS || !canWin) return { gate: g, approach: Infinity, total: g };
    const a = sweepChain(box, approach, pose).clearance;
    return { gate: g, approach: a, total: Math.min(g, a) };
  };

  let best: Choice = { pose: UPRIGHT, ...evaluate(UPRIGHT, null) };
  let comfy: Choice | null = null;

  // The box is symmetric under 180 degree turns, so [0, 180) covers every distinct pose.
  for (let pitch = 0; pitch < 180; pitch += step)
    for (let yaw = 0; yaw < 180; yaw += step)
      for (let roll = 0; roll < 180; roll += step) {
        const pose = { pitch, yaw, roll };
        const e = evaluate(pose, best);
        if (e.total > best.total + EPS) best = { pose, ...e };
        if (e.total < comfortable - EPS) continue;
        const dEffort = comfy ? effort(pose) - effort(comfy.pose) : -1;
        // Least rotation wins; at equal rotation, the roomier pose wins.
        if (!comfy || dEffort < -EPS || (Math.abs(dEffort) <= EPS && e.total > comfy.total + EPS)) comfy = { pose, ...e };
      }
  return comfy ?? refine(best, step, fine, (pose, b) => evaluate(pose, b));
}

/** Tight doors: search around the best coarse pose in finer increments for a few more cm. */
function refine(start: Choice, span: number, fine: number, evaluate: (pose: Pose, best: Choice) => Eval): Choice {
  if (fine <= 0 || fine >= span) return start;
  let best = start;
  for (let dp = -span; dp <= span; dp += fine)
    for (let dy = -span; dy <= span; dy += fine)
      for (let dr = -span; dr <= span; dr += fine) {
        const pose = { pitch: start.pose.pitch + dp, yaw: start.pose.yaw + dy, roll: start.pose.roll + dr };
        const e = evaluate(pose, best);
        if (e.total > best.total + EPS) best = { pose, ...e };
      }
  return best;
}

function hint(pose: Pose): string {
  const parts = [
    pose.pitch && `tip it ${pose.pitch} degrees`,
    pose.yaw && `turn it ${pose.yaw} degrees`,
    pose.roll && `tilt it ${pose.roll} degrees`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "carry it straight through";
}

function indexOfTightest(steps: PlanStep[]): number {
  let index = -1;
  let min = Infinity;
  steps.forEach((s, i) => {
    if (s.clearance !== null && s.clearance <= min + EPS) {
      min = s.clearance;
      index = i;
    }
  });
  return index;
}

function emptyPlan(reason: "gate" | "approach", e: Eval, extra: Partial<Plan> = {}): Plan {
  return {
    fits: false,
    steps: [],
    bottleneckIndex: -1,
    clearance: e.total,
    gateClearance: e.gate,
    approachClearance: Number.isFinite(e.approach) ? e.approach : null,
    reason,
    approachNeeded: null,
    verified: false,
    ...extra,
  };
}

function planThroughPoseGate(box: Box, gate: PoseGate, options: PlanOptions): Plan {
  const { stepDegrees = 15, comfortableClearance = 0.02, fineStepDegrees = 5 } = options;
  const approach = resolveApproach(gate, options);
  const choice = choosePose(box, gate, approach, stepDegrees, comfortableClearance, fineStepDegrees);
  const { pose } = choice;

  if (choice.total < -EPS) {
    // Ask what the gate alone allows, to tell "too small" apart from "no room to turn it".
    const alone = approach ? planThroughPoseGate(box, gate, { ...options, approach: null }) : null;
    if (!alone || !alone.fits) {
      const g = alone ? alone.gateClearance : choice.gate;
      return emptyPlan("gate", { gate: g, approach: Infinity, total: g });
    }
    const aloneStep = alone.steps[alone.bottleneckIndex]!;
    const a = sweepChain(box, approach, aloneStep.pose).clearance;
    return emptyPlan(
      "approach",
      { gate: alone.gateClearance, approach: a, total: Math.min(alone.gateClearance, a) },
      { alternative: alone, approachNeeded: alone.approachNeeded },
    );
  }

  const chain = rotationChain(pose);
  const rotates = chain.length > 0;
  const steps: PlanStep[] = [{ kind: "start", pose: UPRIGHT, at: at(APPROACH_Z), clearance: null, verified: true, hint: "Start here" }];
  let prev = UPRIGHT;
  for (const stage of chain) {
    const sweep = sweepSegment(box, approach, prev, stage.pose);
    const measured = approach !== null;
    steps.push({
      kind: stage.kind,
      pose: stage.pose,
      at: at(APPROACH_Z),
      clearance: measured ? sweep.clearance : null,
      verified: measured && sweep.clearance >= -EPS,
      hint: stage.hint,
    });
    prev = stage.pose;
  }
  const settle = approach ? sweepSegment(box, approach, pose, pose).clearance : null;
  steps.push({
    kind: "slide",
    pose,
    at: at(SLIDE_Z),
    clearance: settle,
    verified: !rotates || (settle !== null && settle >= -EPS),
    hint: "Slide it up to the doorway",
  });
  steps.push({
    kind: "pass",
    pose,
    at: at(PASS_Z),
    clearance: choice.gate,
    verified: true,
    hint: `Now ${hint(pose)}: ${centimetres(choice.gate)} to spare`,
  });

  const needed = sweepChain(box, null, pose);
  return {
    fits: true,
    steps,
    bottleneckIndex: indexOfTightest(steps),
    clearance: choice.total,
    gateClearance: choice.gate,
    approachClearance: approach && rotates ? choice.approach : null,
    reason: "ok",
    approachNeeded: rotates ? { depth: needed.depth, height: needed.height } : null,
    verified: steps.every((s) => s.verified),
  };
}

interface CornerCandidate {
  tipped: boolean;
  pose: Pose;
  footprint: { length: number; depth: number };
  vertical: number;
  hallSlack: number;
  tightestAngle: number;
  direction: 1 | -1;
  ceilingSlack: number;
  total: number;
}

function cornerCandidate(box: Box, gate: CornerGate, tipped: boolean): CornerCandidate {
  // Laid on its back (depth vertical) the box stands lower but sprawls wider.
  const footprint = tipped ? { length: box.length, depth: box.height } : { length: box.length, depth: box.depth };
  const vertical = tipped ? box.depth : box.height;
  const sol = solveCorner(footprint, gate.inWidth, gate.outWidth);
  const ceilingSlack = gate.height - vertical;
  return {
    tipped,
    pose: { pitch: tipped ? 90 : 0, yaw: 0, roll: 0 },
    footprint,
    vertical,
    hallSlack: sol.slack,
    tightestAngle: sol.tightestAngle,
    direction: sol.direction,
    ceilingSlack,
    total: Math.min(sol.slack, ceilingSlack),
  };
}

function planCorner(box: Box, gate: CornerGate, options: PlanOptions): Plan {
  const { comfortableClearance = 0.02 } = options;
  const upright = cornerCandidate(box, gate, false);
  const tipped = cornerCandidate(box, gate, true);
  const pick = upright.total >= comfortableClearance - EPS || upright.total >= tipped.total - EPS ? upright : tipped;

  const { footprint, tightestAngle, direction } = pick;
  const { inWidth: a, outWidth: b } = gate;
  const frame = (deg: number): Vec3 => {
    const c = cornerCentre(footprint, deg, a, b);
    return { x: c.x, y: 0, z: -c.y };
  };
  const yawPose = (deg: number): Pose => ({ ...pick.pose, yaw: deg });
  const end = direction * 90;
  const lead = 1.5;
  const start = frame(0);
  const out = frame(end);

  const tiltSweep = sweepSegment(box, { depth: a, height: gate.height }, UPRIGHT, pick.pose);
  const steps: PlanStep[] = [
    { kind: "start", pose: UPRIGHT, at: { ...start, x: start.x - lead }, clearance: null, verified: true, hint: "Start here" },
  ];
  if (pick.tipped)
    steps.push({
      kind: "tilt",
      pose: pick.pose,
      at: { ...start, x: start.x - lead },
      clearance: tiltSweep.clearance,
      verified: tiltSweep.clearance >= -EPS,
      hint: "Lay it on its back",
    });
  steps.push({ kind: "slide", pose: pick.pose, at: start, clearance: null, verified: true, hint: "Carry it to the corner" });
  steps.push({
    kind: "pass",
    pose: yawPose(tightestAngle),
    at: frame(tightestAngle),
    clearance: pick.total,
    verified: true,
    hint: `Tightest at ${Math.abs(Math.round(tightestAngle))} degrees into the turn: ${centimetres(pick.total)} to spare`,
  });
  steps.push({ kind: "rotate", pose: yawPose(end), at: out, clearance: null, verified: true, hint: "Finish the 90 degree swing" });
  steps.push({ kind: "slide", pose: yawPose(end), at: { ...out, z: out.z + lead }, clearance: null, verified: true, hint: "Carry it down the hall" });

  const fits = pick.total >= -EPS;
  return {
    fits,
    steps,
    bottleneckIndex: indexOfTightest(steps),
    clearance: pick.total,
    gateClearance: pick.total,
    approachClearance: pick.tipped ? tiltSweep.clearance : null,
    reason: fits ? "ok" : "gate",
    approachNeeded: null,
    verified: fits && steps.every((s) => s.verified),
    turn: {
      footprint,
      inWidth: a,
      outWidth: b,
      direction,
      tightestAngle,
      tipped: pick.tipped,
      hallSlack: pick.hallSlack,
      ceilingSlack: pick.ceilingSlack,
    },
  };
}

/**
 * Plan how to get `box` through one gate. Pure and deterministic.
 *
 * Corner gates always return the best attempt in `steps` (it jams at the bottleneck step when `fits`
 * is false); other gates return no steps when nothing fits.
 */
export function planGate(box: Box, gate: Gate, options: PlanOptions = {}): Plan {
  return isPoseGate(gate) ? planThroughPoseGate(box, gate, options) : planCorner(box, gate, options);
}

/** Plan how to carry `box` through a doorway. Pass `options.approach` to check the tilts and turns too. */
export function planMove(box: Box, door: Doorway, options: PlanOptions = {}): Plan {
  return planThroughPoseGate(box, { kind: "doorway", name: "Doorway", width: door.width, height: door.height }, options);
}
