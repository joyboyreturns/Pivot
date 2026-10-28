import { planRoute } from "./route";
import type { Box, Gate, RouteOptions, RoutePlan } from "./types";

export interface RouteChoice {
  id: string;
  name: string;
  gates: Gate[];
}

export interface RankedRoute {
  choice: RouteChoice;
  plan: RoutePlan;
}

/** Compare measured alternatives. A checked route wins over an unmeasured one;
 * within that group prefer more clearance, then fewer gates. Ties keep input order. */
export function rankRoutes(box: Box, choices: RouteChoice[], options: RouteOptions = {}): RankedRoute[] {
  return choices.map((choice, index) => ({ choice, index, plan: planRoute(box, choice.gates, options) }))
    .sort((a, b) => Number(b.plan.fits) - Number(a.plan.fits)
      || Number(b.plan.verified) - Number(a.plan.verified)
      || b.plan.clearance - a.plan.clearance
      || a.plan.gates.length - b.plan.gates.length
      || a.index - b.index)
    .map(({ choice, plan }) => ({ choice, plan }));
}

/** No recommendation when all alternatives are blocked. */
export function recommendRoute(box: Box, choices: RouteChoice[], options: RouteOptions = {}): RankedRoute | null {
  const best = rankRoutes(box, choices, options)[0];
  return best?.plan.fits ? best : null;
}
