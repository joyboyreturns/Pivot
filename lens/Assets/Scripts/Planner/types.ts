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

export type StepKind = "start" | "tilt" | "rotate" | "slide" | "pass";

export interface PlanStep {
  kind: StepKind;
  pose: Pose;
  /** Spare room (m) at this step in the tightest axis; null when the step is not constrained by the doorway. */
  clearance: number | null;
  /** Short wearer-facing hint, e.g. "Turn it 90 degrees". */
  hint: string;
}

export interface Plan {
  fits: boolean;
  steps: PlanStep[];
  /** Index into `steps` of the tightest step, or -1 when nothing fits. */
  bottleneckIndex: number;
  /** Clearance of the chosen pass pose; negative or 0 when it does not fit. */
  clearance: number;
}

export interface PlanOptions {
  /** Search resolution for each rotation axis. Default 15. */
  stepDegrees?: number;
  /** Clearance (m) considered comfortable; poses above it are ranked by least rotation. Default 0.02. */
  comfortableClearance?: number;
}
