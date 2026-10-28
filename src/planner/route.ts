import { planGate } from "./planner";
import type { Box, Gate, GatePlan, RouteOptions, RoutePlan, Verdict } from "./types";

const cm = (m: number) => `${(Math.abs(m) * 100).toFixed(0)} cm`;

/**
 * Plan a whole route: every gate in order, the gate that limits the move, and one verdict.
 * "blocked" if any gate rejects the object, "tight" if the least slack is under `tightClearance`.
 */
export function planRoute(box: Box, gates: Gate[], options: RouteOptions = {}): RoutePlan {
  const { tightClearance = 0.03, ...planOptions } = options;
  if (!Number.isFinite(tightClearance) || tightClearance < 0) throw new RangeError("Tight clearance must be non-negative and finite");
  const plans: GatePlan[] = gates.map((gate) => ({ gate, plan: planGate(box, gate, { ...planOptions, comfortableClearance: planOptions.comfortableClearance ?? tightClearance }) }));

  let bottleneckIndex = -1;
  let firstBlockedIndex = -1;
  let clearance = Infinity;
  let unverifiedSteps = 0;
  plans.forEach(({ plan }, i) => {
    if (!plan.fits && firstBlockedIndex < 0) firstBlockedIndex = i;
    if (plan.clearance < clearance) {
      clearance = plan.clearance;
      bottleneckIndex = i;
    }
    if (plan.fits) unverifiedSteps += plan.steps.filter((s) => !s.verified).length;
  });

  const fits = plans.length > 0 && firstBlockedIndex < 0;
  const verdict: Verdict = !fits ? "blocked" : clearance < tightClearance ? "tight" : "clear";
  if (!plans.length) clearance = 0;

  return {
    fits,
    verdict,
    gates: plans,
    bottleneckIndex,
    firstBlockedIndex,
    clearance,
    verified: fits && unverifiedSteps === 0,
    unverifiedSteps,
    summary: summarise(plans, verdict, bottleneckIndex, firstBlockedIndex, clearance),
  };
}

function summarise(plans: GatePlan[], verdict: Verdict, bottleneck: number, blocked: number, clearance: number): string {
  if (!plans.length) return "No gates on this route.";
  if (verdict === "blocked") {
    const { gate, plan } = plans[blocked]!;
    if (plan.reason === "approach") {
      const need = plan.approachNeeded;
      return `Blocked at ${gate.name}: it fits the opening, but turning it needs ${need ? cm(need.depth) : "more"} of room in front and there is less.`;
    }
    return `Blocked at ${gate.name}: ${cm(plan.clearance)} too tight in the best pose.`;
  }
  const name = plans[bottleneck]!.gate.name;
  return verdict === "tight"
    ? `Fits, but only just: ${name} leaves ${cm(clearance)} to spare.`
    : `Clear: the tightest point is ${name} with ${cm(clearance)} to spare.`;
}
