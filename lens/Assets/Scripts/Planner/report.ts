import { lengthText } from "./format";
import { suggestFixes, maxScale } from "./fixes";
import type { FitRow } from "./inverse";
import type { Scenario } from "./scenarios";
import { planRoute } from "./route";
import type { Gate, Plan, RoutePlan } from "./types";

const m = (v: number) => `${v.toFixed(2)} m`;
const cm = lengthText;
const signed = (v: number) => `${v >= 0 ? "+" : "-"}${cm(Math.abs(v))}`;

export function describeGate(gate: Gate): string {
  switch (gate.kind) {
    case "doorway":
      return `doorway ${m(gate.width)} x ${m(gate.height)}`;
    case "corridor":
      return `corridor ${m(gate.width)} wide, ${m(gate.height)} high, ${m(gate.length)} long`;
    case "elevator":
      return `lift door ${m(gate.door.width)} x ${m(gate.door.height)}, cabin ${m(gate.cabin.width)} x ${m(gate.cabin.depth)} x ${m(gate.cabin.height)}`;
    case "corner":
      return `L-turn ${m(gate.inWidth)} in, ${m(gate.outWidth)} out, ceiling ${m(gate.height)}`;
  }
}

/** One line a viewer can read: the outcome at this gate and why. */
export function describePlan(plan: Plan): string {
  if (plan.fits) {
    const pass = plan.steps[plan.bottleneckIndex]!;
    const state = plan.verified ? "verified" : "UNVERIFIED maneuver";
    return `fits, ${cm(plan.clearance)} to spare, tightest: ${pass.hint} [${state}]`;
  }
  if (plan.reason === "approach") {
    const need = plan.approachNeeded;
    return `NO: opening is fine (${signed(plan.gateClearance)}) but turning needs ${need ? m(need.depth) : "more"} of room in front`;
  }
  return `NO: best pose is ${cm(Math.abs(plan.clearance))} too tight`;
}

export function formatRoute(route: RoutePlan, indent = "  "): string {
  const lines = route.gates.map(({ gate, plan }, i) => {
    const mark = i === route.bottleneckIndex ? "<- bottleneck" : "";
    return `${indent}${i + 1}. ${gate.name} (${describeGate(gate)}): ${describePlan(plan)} ${mark}`.trimEnd();
  });
  lines.push(`${indent}Verdict: ${route.verdict.toUpperCase()}. ${route.summary}`);
  return lines.join("\n");
}

export function formatScenario(s: Scenario): string {
  const route = planRoute(s.box, s.gates);
  const out = [`## ${s.title}`, s.story, `Object: ${s.boxName}`, formatRoute(route)];
  const blocked = route.gates[route.firstBlockedIndex];
  if (blocked) for (const fix of suggestFixes(s.box, blocked.gate).slice(0, 3)) out.push(`  Fix: ${fix.label}.`);
  const scale = maxScale(s.box, s.gates);
  out.push(scale >= 1 ? `  This route allows up to ${Math.round(scale * 100)}% of this size.` : `  Shrink to ${Math.round(scale * 100)}% of this size to fit.`);
  out.push(`  ${s.lesson}`);
  return out.join("\n");
}

export function formatFitMatrix(rows: FitRow[]): string {
  if (!rows.length) return "";
  const routes = rows[0]!.cells.map((c) => c.route);
  const first = Math.max(...rows.map((r) => r.box.length), 6);
  const widths = routes.map((r) => Math.max(r.length, 14));
  const head = `${"".padEnd(first)}  ${routes.map((r, i) => r.padEnd(widths[i]!)).join("  ")}`;
  const body = rows.map((row) => {
    const cells = row.cells.map((c, i) => {
      const text = c.verdict === "blocked" ? "BLOCKED" : `${c.verdict} ${cm(c.clearance)}`;
      return text.padEnd(widths[i]!);
    });
    return `${row.box.padEnd(first)}  ${cells.join("  ")}`;
  });
  return [head, ...body].join("\n");
}
