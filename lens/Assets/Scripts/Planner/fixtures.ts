import type { Box, Doorway, Gate } from "./types";

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

/** Ready-made routes for the fit matrix: a few gates each, with the room in front of them. */
export const routes: Record<string, Gate[]> = {
  "Old flat": [
    { kind: "doorway", name: "Front door", width: 0.8, height: 2.0, approach: { depth: 1.2, height: 2.4 } },
    { kind: "corner", name: "Stair turn", inWidth: 0.95, outWidth: 0.95, height: 2.3 },
  ],
  "New build": [
    { kind: "doorway", name: "Front door", width: 0.95, height: 2.1, approach: { depth: 2.4, height: 2.5 } },
    { kind: "corner", name: "Hall turn", inWidth: 1.4, outWidth: 1.4, height: 2.5 },
  ],
  "Lift move": [
    { kind: "doorway", name: "Lobby door", width: 0.9, height: 2.1, approach: { depth: 2.5, height: 2.4 } },
    {
      kind: "elevator",
      name: "Lift",
      door: { width: 0.8, height: 2.05 },
      cabin: { width: 1.1, depth: 1.4, height: 2.3 },
      approach: { depth: 1.8, height: 2.4 },
    },
  ],
};
