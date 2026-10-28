import type { Box, Gate } from "./types";
import { routes } from "./fixtures";
import type { Scenario } from "./scenarios";

export interface ObjectPreset {
  id: string;
  name: string;
  box: Box;
  /** "sofa" objects are drawn with the sofa model, everything else as a box with details. */
  look: "sofa" | "box";
}

/** Things people actually move, as bounding boxes (metres: length x height x depth). */
export const objectLibrary: ObjectPreset[] = [
  { id: "sofa", name: "3-seat sofa", box: { length: 2.1, height: 0.85, depth: 0.9 }, look: "sofa" },
  { id: "armchair", name: "Armchair", box: { length: 0.85, height: 0.9, depth: 0.85 }, look: "box" },
  { id: "wardrobe", name: "Wardrobe", box: { length: 1.0, height: 2.0, depth: 0.6 }, look: "box" },
  { id: "fridge", name: "Fridge-freezer", box: { length: 0.7, height: 1.8, depth: 0.7 }, look: "box" },
  { id: "mattress", name: "Queen mattress", box: { length: 2.03, height: 0.3, depth: 1.52 }, look: "box" },
  { id: "dining-table", name: "Dining table", box: { length: 1.8, height: 0.75, depth: 0.9 }, look: "box" },
  { id: "piano", name: "Upright piano", box: { length: 1.5, height: 1.2, depth: 0.65 }, look: "box" },
  { id: "washer", name: "Washing machine", box: { length: 0.6, height: 0.85, depth: 0.6 }, look: "box" },
  { id: "bookcase", name: "Tall bookcase", box: { length: 0.8, height: 2.1, depth: 0.3 }, look: "box" },
  { id: "bed", name: "Double bed frame", box: { length: 2.05, height: 1.0, depth: 1.45 }, look: "box" },
  { id: "desk", name: "Office desk", box: { length: 1.6, height: 0.75, depth: 0.8 }, look: "box" },
  { id: "treadmill", name: "Treadmill", box: { length: 1.8, height: 1.4, depth: 0.85 }, look: "box" },
  { id: "flight-case", name: "Touring flight case", box: { length: 1.2, height: 1.1, depth: 0.65 }, look: "box" },
  { id: "art-crate", name: "Gallery art crate", box: { length: 1.65, height: 1.8, depth: 0.45 }, look: "box" },
  { id: "aquarium", name: "Empty aquarium", box: { length: 1.2, height: 0.7, depth: 0.5 }, look: "box" },
  { id: "workbench", name: "Workshop bench", box: { length: 1.6, height: 0.9, depth: 0.75 }, look: "box" },
  { id: "cargo", name: "Delivery crate", box: { length: 1.2, height: 1, depth: 0.8 }, look: "box" },
];

export interface PlacePreset {
  id: string;
  name: string;
  gates: Gate[];
}

/** Ready-made routes to start from; every number can be edited. */
export const placeLibrary: PlacePreset[] = [
  { id: "old-flat", name: "Old flat", gates: routes["Old flat"]! },
  { id: "new-build", name: "New build", gates: routes["New build"]! },
  { id: "lift-move", name: "Lift move", gates: routes["Lift move"]! },
  {
    id: "terrace",
    name: "Terraced house",
    gates: [
      { kind: "doorway", name: "Front door", width: 0.76, height: 1.98, approach: { depth: 1.0, height: 2.4 } },
      { kind: "corner", name: "Hall turn", inWidth: 0.95, outWidth: 0.85, height: 2.3 },
      { kind: "doorway", name: "Living room", width: 0.8, height: 1.98, approach: { depth: 2.6, height: 2.4 } },
    ],
  },
  {
    id: "open-plan",
    name: "Open-plan office",
    gates: [
      { kind: "doorway", name: "Double doors", width: 1.5, height: 2.1, approach: { depth: 3, height: 2.8 } },
      { kind: "corridor", name: "Corridor", width: 1.6, height: 2.6, length: 12, approach: { depth: 3, height: 2.8 } },
    ],
  },
  {
    id: "service",
    name: "Service route",
    gates: [
      { kind: "corridor", name: "Service corridor", width: 0.9, height: 1.95, length: 6, approach: { depth: 2.6, height: 2.5 } },
      {
        kind: "elevator",
        name: "Goods lift",
        door: { width: 0.9, height: 2.05 },
        cabin: { width: 1.4, depth: 2.0, height: 2.4 },
        approach: { depth: 2.2, height: 2.5 },
      },
    ],
  },
  {
    id: "backstage", name: "Backstage", gates: [
      { kind: "doorway", name: "Stage door", width: 0.72, height: 1.95, approach: { depth: 2.6, height: 2.5 } },
      { kind: "corner", name: "Wings turn", inWidth: 1.2, outWidth: 1.1, height: 2.4 },
    ],
  },
  {
    id: "gallery", name: "Gallery loading", gates: [
      { kind: "doorway", name: "Loading door", width: 1.2, height: 2.2, approach: { depth: 3, height: 2.8 } },
      { kind: "corridor", name: "Gallery hall", width: 1.3, height: 2.4, length: 6, approach: { depth: 3, height: 2.8 } },
    ],
  },
  {
    id: "workshop", name: "Workshop", gates: [
      { kind: "doorway", name: "Workshop door", width: 0.8, height: 2, approach: { depth: 2.4, height: 2.5 } },
      { kind: "corner", name: "Bench corner", inWidth: 1.1, outWidth: 1.1, height: 2.4 },
    ],
  },
];

/** A free-form scenario built from any object and any place, for the Lens's "your move" mode. */
export function customScenario(object: ObjectPreset, gates: Gate[], box: Box = object.box): Scenario {
  return {
    id: "your-move",
    title: "Your move",
    boxName: `${object.name} ${Math.round(box.length * 100)} x ${Math.round(box.height * 100)} x ${Math.round(box.depth * 100)} cm`,
    box,
    gates,
    story: "Pull the glowing edges of the object and the gate to match your sizes, or pick another object or place. PIVOT re-plans the whole route every time.",
    lesson: "Measure the real gates, edit the numbers, and read the verdict and the suggested fixes before you lift.",
    expected: "clear",
  };
}
