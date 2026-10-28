import type { Box, Gate, PlanOptions } from "./types";

const positive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite`);
};

/** Reject invalid measurements before they can produce a false fit or an endless search. */
export function validateInput(box: Box, gate: Gate, options: PlanOptions): void {
  positive("Object length", box.length);
  positive("Object height", box.height);
  positive("Object depth", box.depth);
  if (gate.kind === "elevator") {
    positive("Door width", gate.door.width);
    positive("Door height", gate.door.height);
    positive("Cabin width", gate.cabin.width);
    positive("Cabin depth", gate.cabin.depth);
    positive("Cabin height", gate.cabin.height);
  } else if (gate.kind === "corner") {
    positive("Hall in", gate.inWidth);
    positive("Hall out", gate.outWidth);
    positive("Ceiling", gate.height);
  } else {
    positive("Gate width", gate.width);
    positive("Gate height", gate.height);
    if (gate.kind === "corridor") positive("Corridor length", gate.length);
  }
  const approach = options.approach === null ? null : options.approach ?? (gate.kind === "corner" ? null : gate.approach);
  if (approach) {
    positive("Approach depth", approach.depth);
    positive("Approach height", approach.height);
  }
  if (options.stepDegrees !== undefined) positive("Search step", options.stepDegrees);
  for (const [name, value] of [["Fine search step", options.fineStepDegrees], ["Comfortable clearance", options.comfortableClearance]] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new RangeError(`${name} must be non-negative and finite`);
  }
}
