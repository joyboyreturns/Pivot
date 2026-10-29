import { applyFix, withBoxParam, withGateParam } from "./builder";
import { planGate } from "./planner";
import type { Box, Fix, FixChange, Gate, PlanOptions } from "./types";

const QUICK: PlanOptions = { stepDegrees: 30, fineStepDegrees: 0 };
/**
 * A change to the room (opening, hall, lift) is suggested with this much more than the exact minimum, so the
 * result is a fit with something to spare rather than one that touches. Changes to the object are not padded:
 * "5 cm lower" is what taking a sofa's legs off actually gives.
 */
const ROOM_MARGIN = 0.01;
const cm = (m: number) => `${Math.round(m * 100)} cm`;
const fits = (box: Box, gate: Gate, options?: PlanOptions) => planGate(box, gate, options).fits;

/**
 * Smallest value of `x` in [from, limit] that makes `ok(x)` true, assuming monotone (true stays true
 * as x moves toward `limit`). Searches with the quick planner, then confirms with the full one.
 */
function smallest(from: number, limit: number, quick: (x: number) => boolean, full: (x: number) => boolean): number | null {
  if (!quick(limit) && !full(limit)) return null;
  let lo = from;
  let hi = limit;
  for (let i = 0; i < 12 && Math.abs(hi - lo) > 0.004; i++) {
    const mid = (lo + hi) / 2;
    if (quick(mid)) hi = mid;
    else lo = mid;
  }
  let x = Math.round(hi * 100) / 100;
  const step = limit >= from ? 0.01 : -0.01;
  for (let i = 0; i < 8 && !full(x); i++) x = Math.round((x + step) * 100) / 100;
  return full(x) ? x : null;
}

const WORDS: Record<string, { noun: string; hint: string }> = {
  length: { noun: "shorter", hint: "arms or panels off" },
  height: { noun: "lower", hint: "legs or feet off" },
  depth: { noun: "shallower", hint: "back or doors off" },
};

/**
 * What would make a blocked gate work: a bigger opening or more room in front of it, or a smaller object
 * (legs, arms, doors taken off). Sorted by the size of the change; empty when it already fits.
 */
export function suggestFixes(box: Box, gate: Gate, options: PlanOptions = {}): Fix[] {
  const base = planGate(box, gate, options);
  if (base.fits) return [];
  const out: Fix[] = [];

  /** Smallest change to one gate parameter that makes the gate pass, judged with `opts` (the room in front can be ignored). */
  const gateFix = (g: Gate, id: string, limitGrow: number, opts: PlanOptions): { to: number; gate: Gate } | null => {
    const from = readParam(g, id);
    if (from === null) return null;
    const test = (x: number, extra?: PlanOptions) => fits(box, withGateParam(g, id, x), { ...opts, ...extra });
    const least = smallest(from, from + limitGrow, (x) => test(x, QUICK), (x) => test(x));
    if (least === null || least <= from + 1e-9) return null;
    const padded = Math.round((least + ROOM_MARGIN) * 100) / 100;
    const to = padded <= from + limitGrow && test(padded) ? padded : least;
    return { to, gate: withGateParam(g, id, to) };
  };

  const push = (kind: Fix["kind"], target: string, from: number, to: number, label: string, short: string, changes: FixChange[]) =>
    out.push({ kind, target, from, to, delta: Math.round((to - from) * 100) / 100, label, short, changes });
  const gateChange = (id: string, value: number): FixChange => ({ scope: "gate", id, value });

  /** Widen an opening, and if the room in front is still too shallow for the turn, ask for that as well. */
  const openingFix = (id: string, noun: string, limitGrow: number) => {
    const from = readParam(gate, id)!;
    const alone = gateFix(gate, id, limitGrow, { ...options, approach: null });
    if (alone && fits(box, alone.gate, options)) push("widen", `${gate.name} ${noun}`, from, alone.to, `Widen the ${gate.name} ${noun} to ${cm(alone.to)} (+${cm(alone.to - from)})`, `Widen to ${cm(alone.to)}`, [gateChange(id, alone.to)]);
    const after = alone ? alone.gate : gate;
    if (!fits(box, after, options) && planGate(box, after, options).reason === "approach") {
      const depth = gateFix(after, "hallDepth", 3, options);
      const was = readParam(after, "hallDepth") ?? 0;
      if (depth) push("deepen", `${gate.name} hall`, was, depth.to, `${alone ? `Widen the ${gate.name} ${noun} to ${cm(alone.to)} and give it ` : "Give it "}${cm(depth.to)} of room in front (now ${cm(was)})`, `${alone ? `Door ${cm(alone.to)} + ` : ""}hall ${cm(depth.to)}`, [...(alone ? [gateChange(id, alone.to)] : []), gateChange("hallDepth", depth.to)]);
    }
  };

  if (base.reason === "approach") {
    const depth = gateFix(gate, "hallDepth", 3, options);
    const was = readParam(gate, "hallDepth") ?? 0;
    if (depth) push("deepen", `${gate.name} hall`, was, depth.to, `Give it ${cm(depth.to)} of room in front of the ${gate.name} (now ${cm(was)})`, `Hall to ${cm(depth.to)}`, [gateChange("hallDepth", depth.to)]);
  } else if (gate.kind === "doorway" || gate.kind === "corridor") {
    openingFix("width", "width", 1.5);
  } else if (gate.kind === "elevator") {
    openingFix("doorWidth", "door", 1);
    const alone = gateFix(gate, "cabinDepth", 1.5, { ...options, approach: null });
    if (alone) push("widen", `${gate.name} cabin depth`, gate.cabin.depth, alone.to, `Widen the ${gate.name} cabin depth to ${cm(alone.to)} (+${cm(alone.to - gate.cabin.depth)})`, `Cabin to ${cm(alone.to)}`, [gateChange("cabinDepth", alone.to)]);
  } else {
    // An L-turn: widen both halls together.
    const from = Math.min(gate.inWidth, gate.outWidth);
    const widen = (x: number, opts?: PlanOptions) =>
      fits(box, withGateParam(withGateParam(gate, "inWidth", gate.inWidth + (x - from)), "outWidth", gate.outWidth + (x - from)), { ...options, ...opts });
    const least = smallest(from, from + 2, (x) => widen(x, QUICK), (x) => widen(x));
    const padded = least === null ? null : Math.round((least + ROOM_MARGIN) * 100) / 100;
    const to = padded !== null && padded <= from + 2 && widen(padded) ? padded : least;
    if (to !== null && to > from) {
      const delta = Math.round((to - from) * 100) / 100;
      out.push({
        kind: "widen",
        target: `${gate.name} halls`,
        from,
        to,
        delta,
        label: `Widen both halls by ${cm(delta)} (to ${cm(gate.inWidth + delta)} and ${cm(gate.outWidth + delta)})`,
        short: `Halls +${cm(delta)}`,
        changes: [gateChange("inWidth", gate.inWidth + delta), gateChange("outWidth", gate.outWidth + delta)],
      });
    }
  }

  for (const id of ["height", "depth", "length"] as const) {
    const dim = box[id];
    const test = (x: number, opts?: PlanOptions) => fits(withBoxParam(box, id, x), gate, { ...options, ...opts });
    const to = smallest(dim, Math.max(0.1, dim * 0.5), (x) => test(x, QUICK), (x) => test(x));
    if (to === null || to >= dim) continue;
    const delta = Math.round((dim - to) * 100) / 100;
    if (delta > 0.25) continue; // anything bigger is no longer the same object
    const w = WORDS[id]!;
    out.push({
      kind: "shrink",
      target: id,
      from: dim,
      to,
      delta,
      label: `Make it ${cm(delta)} ${w.noun} (${w.hint})`,
      short: `${cm(delta)} ${w.noun}`,
      changes: [{ scope: "box", id, value: to }],
    });
  }
  // Ordered by the least change each needs, so the margin added to a room fix does not push it behind a change to the
  // object; on a tie the room comes first.
  const least = (fix: Fix) => (fix.kind === "shrink" ? fix.delta : fix.delta - ROOM_MARGIN);
  return out.filter((fix) => {
    const after = applyFix(box, gate, fix);
    return planGate(after.box, after.gate, options).fits;
  }).sort((a, b) => least(a) - least(b) || Number(a.kind === "shrink") - Number(b.kind === "shrink"));
}

function readParam(gate: Gate, id: string): number | null {
  switch (gate.kind) {
    case "doorway":
    case "corridor":
      return id === "width" ? gate.width : id === "hallDepth" ? (gate.approach ? gate.approach.depth : 0) : null;
    case "elevator":
      return id === "doorWidth" ? gate.door.width : id === "cabinDepth" ? gate.cabin.depth : id === "hallDepth" ? (gate.approach ? gate.approach.depth : 0) : null;
    case "corner":
      return null;
  }
}

/**
 * The biggest uniform scale of `box` the whole route allows: 1.05 means it could be 5 percent bigger,
 * 0.9 means it has to shrink to 90 percent. 0 when even a tiny version does not fit.
 */
export function maxScale(box: Box, gates: Gate[], options: PlanOptions = {}): number {
  if (gates.length === 0) return 0;
  const scaled = (s: number): Box => ({ length: box.length * s, height: box.height * s, depth: box.depth * s });
  const ok = (s: number, opts?: PlanOptions) => gates.every((g) => fits(scaled(s), g, { ...options, ...opts }));
  if (!ok(0.2, QUICK)) return 0;
  let lo = 0.2;
  let hi = 1.8;
  if (ok(hi, QUICK)) return hi;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid, QUICK)) lo = mid;
    else hi = mid;
  }
  let s = Math.floor(lo * 100) / 100;
  for (let i = 0; i < 8 && !ok(s); i++) s = Math.round((s - 0.01) * 100) / 100;
  return s;
}
