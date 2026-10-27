import { planGate, planMove } from "./planner";
import { planRoute } from "./route";
import type { Box, CornerGate, Gate, Plan, PlanOptions, RouteOptions, RoutePlan, Verdict } from "./types";

export interface MinimumWidth {
  /** Smallest opening width (m) the box gets through, to the nearest millimetre. */
  width: number;
  /** The plan at that width. */
  plan: Plan;
}

/**
 * Smallest doorway width that lets `box` through a doorway of the given height, or null if the
 * height itself rules it out. Bisection on the monotone "does it fit" answer.
 */
export function minDoorwayWidth(box: Box, doorHeight: number, options: PlanOptions = {}): MinimumWidth | null {
  const opts = { ...options, fineStepDegrees: options.fineStepDegrees ?? 5 };
  let hi = box.length + box.height + box.depth;
  if (!planMove(box, { width: hi, height: doorHeight }, opts).fits) return null;
  let lo = 0;
  while (hi - lo > 0.0005) {
    const mid = (lo + hi) / 2;
    if (planMove(box, { width: mid, height: doorHeight }, opts).fits) hi = mid;
    else lo = mid;
  }
  return { width: Math.ceil(hi * 1000) / 1000, plan: planMove(box, { width: Math.ceil(hi * 1000) / 1000, height: doorHeight }, opts) };
}

/** Narrowest equal-width L-hallway (m) the box can be turned through under a ceiling, or null if the ceiling rules it out. */
export function minCornerWidth(box: Box, ceiling: number): number | null {
  const gate = (w: number): CornerGate => ({ kind: "corner", name: "Corner", inWidth: w, outWidth: w, height: ceiling });
  let hi = box.length + box.depth + box.height;
  if (!planGate(box, gate(hi)).fits) return null;
  let lo = 0;
  while (hi - lo > 0.0005) {
    const mid = (lo + hi) / 2;
    if (planGate(box, gate(mid)).fits) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 1000) / 1000;
}

export interface FitCell {
  route: string;
  verdict: Verdict;
  clearance: number;
  /** Name of the limiting gate. */
  bottleneck: string;
}

export interface FitRow {
  box: string;
  cells: FitCell[];
}

/** Every box against every route: the "will it fit anywhere" table. */
export function fitMatrix(boxes: Record<string, Box>, routes: Record<string, Gate[]>, options: RouteOptions = {}): FitRow[] {
  return Object.entries(boxes).map(([box, dims]) => ({
    box,
    cells: Object.entries(routes).map(([route, gates]) => {
      const plan: RoutePlan = planRoute(dims, gates, options);
      const limiting = plan.gates[plan.bottleneckIndex];
      return { route, verdict: plan.verdict, clearance: plan.clearance, bottleneck: limiting ? limiting.gate.name : "-" };
    }),
  }));
}
