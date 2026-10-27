import type { Box, Doorway } from "./types";

/** Typical furniture sizes (metres): length x height x depth. */
export const furniture: Record<string, Box> = {
  sofa3Seater: { length: 2.0, height: 0.85, depth: 0.9 },
  armchair: { length: 0.85, height: 0.9, depth: 0.85 },
  wardrobe: { length: 1.0, height: 2.0, depth: 0.6 },
  fridge: { length: 0.7, height: 1.8, depth: 0.7 },
  queenMattress: { length: 2.03, height: 0.3, depth: 1.52 },
  diningTable: { length: 1.8, height: 0.75, depth: 0.9 },
};

/** Common doorway openings (metres). */
export const doorways: Record<string, Doorway> = {
  narrow: { width: 0.75, height: 2.0 },
  standard: { width: 0.85, height: 2.03 },
  wide: { width: 0.95, height: 2.05 },
  double: { width: 1.5, height: 2.1 },
};
