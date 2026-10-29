import { cornerSamplingAllowance, solveCorner } from "./corner";
import { gateClearance, isPoseGate, sweepChain, sweepSegment } from "./gates";
import { lengthText } from "./format";
import { resolveApproach } from "./planner";
import { planRoute } from "./route";
import type { Approach, Box, CornerGate, Gate, GatePlan, PlanOptions, Pose, RouteOptions } from "./types";

/**
 * Stated measurement error, in metres. These are bounds you assume, not probabilities and not a sensor
 * confidence: "the object may be up to `object` bigger in every dimension, and every stated size of the
 * room may be up to `environment` smaller". A carrying margin (room you want for hands) is a separate
 * number, `carryMargin`, and is never added to either.
 */
export interface Tolerance {
  object: number;
  environment: number;
}

/**
 * holds: the nominal maneuver still clears with the carry margin when the object is enlarged and the room shrunk.
 * too-close: it fits as measured, but not once the stated error is allowed for. This is not a predicted collision.
 * does-not-fit: it does not fit as measured, so tolerance was not applied (the search found no pose or turn).
 */
export type ToleranceStatus = "holds" | "too-close" | "does-not-fit";

export interface GateAssessment {
  gate: Gate;
  status: ToleranceStatus;
  /** Spare room as measured (m); negative when it does not fit. */
  nominalClearance: number;
  /** Spare room for the same maneuver when the stated error is allowed for (m); null when it does not fit as measured. */
  toleranceClearance: number | null;
  /** How much of the nominal clearance the stated error and any numerical allowance uses up (m). */
  reduction: number;
  /** Part of `reduction` that is numerical allowance for angle sampling (corners only), not tolerance. */
  numericalAllowance: number;
  /** True only when the nominal maneuver was fully checked. Tolerance never upgrades an unverified maneuver. */
  maneuverChecked: boolean;
}

export interface RouteAssessment {
  tolerance: Tolerance;
  carryMargin: number;
  status: ToleranceStatus | "empty";
  gates: GateAssessment[];
  /** Gate with the least tolerance clearance (or the first that does not fit); -1 when empty. */
  limitingIndex: number;
  /** True when every gate's maneuver was checked as measured. */
  maneuverChecked: boolean;
  summary: string;
}

export interface AssessOptions extends RouteOptions {
  /** Room wanted beyond the tolerance, e.g. for hands (m). Default 0. */
  carryMargin?: number;
}

/** Swing-angle step for corners under tolerance: finer than the planner's, so the allowance stays at millimetres. */
const CORNER_STEP = 0.1;

const grow = (box: Box, t: number): Box => ({ length: box.length + t, height: box.height + t, depth: box.depth + t });
const shrinkApproach = (a: Approach | null, t: number): Approach | null => (a ? { depth: a.depth - t, height: a.height - t } : null);

function check(tolerance: Tolerance, carryMargin: number): void {
  for (const [name, v] of [["object tolerance", tolerance.object], ["environment tolerance", tolerance.environment], ["carry margin", carryMargin]] as const)
    if (!Number.isFinite(v) || v < 0) throw new RangeError(`The ${name} must be non-negative and finite`);
}

/**
 * Fixed pose, enlarged object, shrunk opening: the posed box only grows and the free rectangle only shrinks,
 * so a pose that clears here clears for every size within the stated bounds. Exact up to floating point.
 */
function poseGateClearance(box: Box, gate: Exclude<Gate, CornerGate>, pose: Pose, approach: Approach | null, t: Tolerance): number {
  const big = grow(box, t.object);
  const e = t.environment;
  let shrunk: Exclude<Gate, CornerGate>;
  switch (gate.kind) {
    case "doorway":
    case "corridor":
      shrunk = { ...gate, width: gate.width - e, height: gate.height - e };
      break;
    case "elevator":
      shrunk = {
        ...gate,
        door: { width: gate.door.width - e, height: gate.door.height - e },
        cabin: { width: gate.cabin.width - e, depth: gate.cabin.depth - e, height: gate.cabin.height - e },
      };
      break;
  }
  const g = gateClearance(big, shrunk, pose);
  const a = approach ? sweepChain(big, shrinkApproach(approach, e), pose).clearance : Infinity;
  return Math.min(g, a);
}

/**
 * The nominal corner maneuver (laid flat or not, swing direction) with the same enlargement and shrinking.
 * Slack is sampled over the swing, so the sampling allowance is subtracted to keep the result conservative.
 */
function cornerToleranceClearance(box: Box, gate: CornerGate, tipped: boolean, direction: 1 | -1, t: Tolerance): { clearance: number; allowance: number } {
  const big = grow(box, t.object);
  const footprint = tipped ? { length: big.length, depth: big.height } : { length: big.length, depth: big.depth };
  const vertical = tipped ? big.depth : big.height;
  const a = gate.inWidth - t.environment;
  const b = gate.outWidth - t.environment;
  const height = gate.height - t.environment;
  const ceiling = height - vertical;
  const tilt = tipped ? sweepSegment(big, { depth: a, height }, { pitch: 0, yaw: 0, roll: 0 }, { pitch: 90, yaw: 0, roll: 0 }).clearance : Infinity;
  if (a <= 0 || b <= 0) return { clearance: Math.min(a, b, ceiling, tilt), allowance: 0 };
  const sol = solveCorner(footprint, a, b, CORNER_STEP, [direction]);
  const allowance = cornerSamplingAllowance(footprint, CORNER_STEP);
  return { clearance: Math.min(sol.slack - allowance, ceiling, tilt), allowance };
}

function assessGate({ gate, plan }: GatePlan, box: Box, tolerance: Tolerance, carryMargin: number, options: PlanOptions): GateAssessment {
  if (!plan.fits)
    return { gate, status: "does-not-fit", nominalClearance: plan.clearance, toleranceClearance: null, reduction: 0, numericalAllowance: 0, maneuverChecked: false };

  let clearance: number;
  let allowance = 0;
  if (isPoseGate(gate)) {
    const pass = plan.steps[plan.steps.length - 1]!;
    clearance = poseGateClearance(box, gate, pass.pose, resolveApproach(gate, options), tolerance);
  } else {
    const turn = plan.turn!;
    ({ clearance, allowance } = cornerToleranceClearance(box, gate, turn.tipped, turn.direction, tolerance));
  }
  return {
    gate,
    status: clearance >= carryMargin ? "holds" : "too-close",
    nominalClearance: plan.clearance,
    toleranceClearance: clearance,
    reduction: plan.clearance - clearance,
    numericalAllowance: allowance,
    maneuverChecked: plan.verified,
  };
}

/**
 * Re-judge the nominal route under stated measurement error. The nominal plan is unchanged: this takes its
 * maneuver at every gate (pose, or flat-and-swing direction for an L-turn) and measures that same maneuver
 * on an enlarged object in a shrunk room. The nominal plans are `planRoute`'s, with the same options. It does not search again, so "too-close" means this maneuver cannot
 * be confirmed under the assumptions, not that no maneuver could be. Gates are still judged independently.
 */
export function assessRoute(box: Box, gates: Gate[], tolerance: Tolerance, options: AssessOptions = {}): RouteAssessment {
  const { carryMargin = 0, ...routeOptions } = options;
  check(tolerance, carryMargin);
  // The nominal plans are the route's own, so both answers describe the same maneuver.
  const nominal = planRoute(box, gates, routeOptions);
  const assessed = nominal.gates.map((g) => assessGate(g, box, tolerance, carryMargin, routeOptions));

  const firstNoFit = assessed.findIndex((g) => g.status === "does-not-fit");
  let limitingIndex = firstNoFit;
  if (limitingIndex < 0) {
    let least = Infinity;
    assessed.forEach((g, i) => {
      if (g.toleranceClearance! < least) {
        least = g.toleranceClearance!;
        limitingIndex = i;
      }
    });
  }
  const status = !assessed.length ? "empty" : firstNoFit >= 0 ? "does-not-fit" : assessed.some((g) => g.status === "too-close") ? "too-close" : "holds";
  const maneuverChecked = assessed.length > 0 && assessed.every((g) => g.maneuverChecked);
  return { tolerance, carryMargin, status, gates: assessed, limitingIndex, maneuverChecked, summary: summarise(assessed, status, limitingIndex, tolerance, maneuverChecked) };
}

function summarise(gates: GateAssessment[], status: RouteAssessment["status"], index: number, t: Tolerance, checked: boolean): string {
  if (status === "empty") return "No gates on this route.";
  const g = gates[index]!;
  if (status === "does-not-fit") return `${g.gate.name} does not fit as measured, so no tolerance was applied.`;
  const stated = `object +${lengthText(t.object)}, room -${lengthText(t.environment)}`;
  const note = checked ? "" : " Turning space was not measured, so only the opening is judged.";
  const nominal = g.nominalClearance >= 0 ? lengthText(g.nominalClearance) : `-${lengthText(g.nominalClearance)}`;
  if (status === "holds") return `Holds with the stated error (${stated}): ${g.gate.name} keeps ${lengthText(g.toleranceClearance!)} of ${nominal}.${note}`;
  const left = g.toleranceClearance!;
  const lack = left < 0 ? `short by ${lengthText(left)}` : `leaves ${lengthText(left)}`;
  return `Too close to confirm (${stated}): ${g.gate.name} fits with ${nominal} as measured but ${lack} once error is allowed for.${note}`;
}
