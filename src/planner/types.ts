/** All lengths are metres, all angles are degrees. */

/** Object modelled as an oriented box: dimensions along its own x (length), y (height), z (depth). */
export interface Box {
  length: number;
  height: number;
  depth: number;
}

/**
 * Doorway opening in the wall plane. The wall normal is the z axis, so the
 * object is carried through along z with a fixed orientation. Because the
 * silhouette is constant while sliding, wall thickness does not change the result.
 */
export interface Doorway {
  width: number;
  height: number;
}

/** Orientation applied to the box: rotate about x (pitch), then y (yaw), then z (roll). */
export interface Pose {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Free space in front of a gate where the object is tipped and turned before it is
 * carried through: `depth` is how far back from the wall it can swing (z), `height` is the ceiling.
 */
export interface Approach {
  depth: number;
  height: number;
}

export interface DoorwayGate {
  kind: "doorway";
  name: string;
  width: number;
  height: number;
  approach?: Approach;
}

/** A straight passage. The object keeps one pose all the way, so it is checked like a doorway of its cross-section. */
export interface CorridorGate {
  kind: "corridor";
  name: string;
  width: number;
  height: number;
  length: number;
  approach?: Approach;
}

/** Lift: the object must pass the door and then stand inside the cabin in the same pose. */
export interface ElevatorGate {
  kind: "elevator";
  name: string;
  door: Doorway;
  cabin: { width: number; depth: number; height: number };
  approach?: Approach;
}

/**
 * L-shaped hallway with a 90 degree turn. `inWidth` is the hallway the object arrives in,
 * `outWidth` the one it leaves by, `height` the ceiling. Plan view: the object arrives
 * travelling east and leaves travelling south; the inside (reentrant) corner is the origin.
 */
export interface CornerGate {
  kind: "corner";
  name: string;
  inWidth: number;
  outWidth: number;
  height: number;
}

export type Gate = DoorwayGate | CorridorGate | ElevatorGate | CornerGate;
export type GateKind = Gate["kind"];

export type StepKind = "start" | "tilt" | "rotate" | "slide" | "pass";

export interface PlanStep {
  kind: StepKind;
  pose: Pose;
  /** Centre of the object in the gate frame (metres): x across the wall, y up, z toward the viewer (carry direction is -z). */
  at: Vec3;
  /**
   * Spare room (m) at this step in the tightest axis; null when nothing was measured for it
   * (a tilt or turn with no approach space given, or a step the gate does not constrain).
   */
  clearance: number | null;
  /**
   * True when this step was actually checked against the geometry. False means it is an
   * illustration only ("Unverified maneuver").
   */
  verified: boolean;
  /** Short wearer-facing hint, e.g. "Turn it 90 degrees". */
  hint: string;
}

/** Details of an L-turn: everything needed to place the object at any angle of the swing. */
export interface CornerTurn {
  /** Footprint (plan view) of the object while turning. */
  footprint: { length: number; depth: number };
  /** Hallway widths (m). */
  inWidth: number;
  outWidth: number;
  /** Which way it swings (+1 counter-clockwise seen from above, -1 clockwise). */
  direction: 1 | -1;
  /** Angle of the swing (degrees, signed by `direction`) where the object is tightest. */
  tightestAngle: number;
  /** True when the object is laid on its back (depth vertical) to get under the ceiling. */
  tipped: boolean;
  /** Slack (m) in the hallway widths: how much narrower both halls could be. */
  hallSlack: number;
  /** Slack (m) under the ceiling. */
  ceilingSlack: number;
}

export type PlanReason = "ok" | "gate" | "approach";

export interface Plan {
  fits: boolean;
  steps: PlanStep[];
  /** Index into `steps` of the tightest measured step, or -1 when nothing fits. */
  bottleneckIndex: number;
  /**
   * Overall slack: the smallest of the gate clearance and any measured approach clearance.
   * Negative when it does not fit.
   */
  clearance: number;
  /** Slack at the gate itself for the chosen pose. */
  gateClearance: number;
  /** Smallest slack while tipping/turning in the approach space; null when no approach space was given or no rotation is needed. */
  approachClearance: number | null;
  /** Why it does not fit: the gate is too small for any pose, or the pose fits but cannot be reached in the approach space. */
  reason: PlanReason;
  /** Space the tilts and turns sweep through (m); null when the plan needs no rotation. */
  approachNeeded: Approach | null;
  /** True when every step was checked, so no "Unverified maneuver" caveat applies. */
  verified: boolean;
  /** L-turns only. */
  turn?: CornerTurn;
  /** When reason is "approach": the plan that would work if the approach space were big enough. */
  alternative?: Plan;
}

export interface PlanOptions {
  /** Search resolution for each rotation axis. Default 15. */
  stepDegrees?: number;
  /** Finer search around the best pose when no pose is comfortable (tight doors). 0 disables. Default 5. */
  fineStepDegrees?: number;
  /** Clearance (m) considered comfortable; poses above it are ranked by least rotation. Default 0.02. */
  comfortableClearance?: number;
  /** Approach space override: an object replaces the gate's own, null ignores it. */
  approach?: Approach | null;
}

export type Verdict = "clear" | "tight" | "blocked";

export interface GatePlan {
  gate: Gate;
  plan: Plan;
}

export interface RoutePlan {
  fits: boolean;
  verdict: Verdict;
  gates: GatePlan[];
  /** Index of the gate with the least slack (the worst blocker when blocked), or -1 for an empty route. */
  bottleneckIndex: number;
  /** Index of the first gate that does not fit, or -1. */
  firstBlockedIndex: number;
  /** Least slack over the route (m). */
  clearance: number;
  /** True when every step of every gate was checked. */
  verified: boolean;
  /** Count of steps shown as illustration only. */
  unverifiedSteps: number;
  summary: string;
}

export interface RouteOptions extends PlanOptions {
  /** Routes whose least slack is below this (m) are "tight". Default 0.03. */
  tightClearance?: number;
}
