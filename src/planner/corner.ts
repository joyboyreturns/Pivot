/**
 * L-shaped hallway turn, in plan view.
 *
 * Hall A (width a) runs east-west and hall B (width b) runs north-south. The outer walls
 * are y = a and x = b; the inside corner is the origin and the solid it belongs to is the
 * quadrant Q = {x < 0, y < 0}. The object is a rectangle that rotates through 90 degrees.
 *
 * Q is closed downward, so pushing a feasible rectangle toward the outer corner (up and
 * right) keeps it feasible. For every angle the best position is therefore the one touching
 * both outer walls, and a path exists exactly when that pushed rectangle clears Q at every angle
 * of the swing. Slack is how far both widths could shrink (bisection) before some angle fails.
 */

export interface Footprint {
  length: number;
  depth: number;
}

export interface CornerSolution {
  /** Metres both hallways could narrow before it jams; negative = how much wider they must be. */
  slack: number;
  /** Signed swing angle (degrees) at which it is tightest. */
  tightestAngle: number;
  direction: 1 | -1;
}

type P = { x: number; y: number };

const rad = (d: number) => (d * Math.PI) / 180;
const AREA_EPS = 1e-9;

/** Pushed-into-the-outer-corner centre of the footprint at swing angle `deg` (signed) for hall widths a (in) and b (out). */
export function cornerCentre(fp: Footprint, deg: number, a: number, b: number): P {
  const c = Math.abs(Math.cos(rad(deg)));
  const s = Math.abs(Math.sin(rad(deg)));
  return { x: b - (fp.length * c + fp.depth * s) / 2, y: a - (fp.length * s + fp.depth * c) / 2 };
}

function vertices(fp: Footprint, deg: number, centre: P): P[] {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const hl = fp.length / 2;
  const hd = fp.depth / 2;
  return [
    [-hl, -hd],
    [hl, -hd],
    [hl, hd],
    [-hl, hd],
  ].map(([u, v]) => ({ x: centre.x + u! * c - v! * s, y: centre.y + u! * s + v! * c }));
}

/** Sutherland-Hodgman clip against the half-plane nx*x + ny*y <= 0. */
function clip(poly: P[], nx: number, ny: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const fp = nx * p.x + ny * p.y;
    const fq = nx * q.x + ny * q.y;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}

function area(poly: P[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    sum += p.x * q.y - q.x * p.y;
  }
  return Math.abs(sum) / 2;
}

/** Does the rectangle pushed into the corner of halls (a, b) overlap the solid inside corner? */
function jams(fp: Footprint, deg: number, a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return true;
  const poly = vertices(fp, deg, cornerCentre(fp, deg, a, b));
  const inside = clip(clip(poly, 1, 0), 0, 1);
  return inside.length >= 3 && area(inside) > AREA_EPS;
}

/** Most both halls can narrow (negative: must widen) before the footprint at this angle jams. */
function angleSlack(fp: Footprint, deg: number, a: number, b: number): number {
  let lo = -(fp.length + fp.depth + 1);
  let hi = Math.min(a, b);
  if (jams(fp, deg, a - lo, b - lo)) return lo;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (jams(fp, deg, a - mid, b - mid)) hi = mid;
    else lo = mid;
  }
  return lo;
}

export function solveCorner(input: Footprint, a: number, b: number, stepDeg = 1): CornerSolution {
  // The object enters hall A and leaves hall B lengthwise; its short side must fit each hall.
  const fp = input.length >= input.depth ? input : { length: input.depth, depth: input.length };
  const entry = Math.min(a, b) - fp.depth;
  let best: CornerSolution = { slack: -Infinity, tightestAngle: 0, direction: -1 };
  for (const direction of [-1, 1] as const) {
    let worst = Infinity;
    let worstAngle = 0;
    for (let deg = 0; deg <= 90 + 1e-9; deg += stepDeg) {
      const s = angleSlack(fp, direction * deg, a, b);
      if (s < worst) {
        worst = s;
        worstAngle = deg;
      }
    }
    // Refine around the tightest angle.
    for (let deg = Math.max(0, worstAngle - stepDeg); deg <= Math.min(90, worstAngle + stepDeg) + 1e-9; deg += stepDeg / 10) {
      const s = angleSlack(fp, direction * deg, a, b);
      if (s < worst) {
        worst = s;
        worstAngle = deg;
      }
    }
    if (worst > best.slack) best = { slack: worst, tightestAngle: direction * worstAngle, direction };
  }
  // Clockwise (leading end swings into the new hall) is tried first, so it wins ties.
  return { ...best, slack: Math.min(best.slack, entry) };
}
