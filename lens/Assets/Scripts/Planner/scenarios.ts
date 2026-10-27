import { furniture } from "./fixtures";
import type { Box, Gate, Verdict } from "./types";

export interface Scenario {
  id: string;
  title: string;
  /** Name of the object being moved, for labels. */
  boxName: string;
  box: Box;
  gates: Gate[];
  /** Two or three sentences setting the scene. */
  story: string;
  /** What the viewer should take away. */
  lesson: string;
  /** What the planner is expected to say; the tests hold the library to this. */
  expected: Verdict;
}

const studioSofa: Box = { length: 2.1, height: 0.85, depth: 0.9 };
const entrance = (width: number): Gate => ({
  kind: "doorway",
  name: "Building entrance",
  width,
  height: 2.1,
  approach: { depth: 3.0, height: 2.6 },
});
const flatDoor = (width: number, hallDepth: number): Gate => ({
  kind: "doorway",
  name: "Flat door",
  width,
  height: 2.05,
  approach: { depth: hallDepth, height: 2.5 },
});

export const scenarios: Scenario[] = [
  {
    id: "studio-sofa",
    title: "Studio flat sofa",
    boxName: "3-seat sofa 210 x 85 x 90 cm",
    box: studioSofa,
    gates: [entrance(1.0), flatDoor(0.8, 2.4)],
    story:
      "You bought a 2.10 m sofa for a third-floor studio. The building entrance is wide enough once you turn the sofa, but the flat door is only 80 cm.",
    lesson: "The smallest face of the sofa is 85 cm. No orientation gets it through an 80 cm door, so find out before the movers arrive.",
    expected: "blocked",
  },
  {
    id: "widened-door",
    title: "Same sofa, 95 cm door",
    boxName: "3-seat sofa 210 x 85 x 90 cm",
    box: studioSofa,
    gates: [entrance(1.0), flatDoor(0.95, 2.4)],
    story: "The landlord swaps the flat door for a 95 cm one. The hall in front of it is 2.4 m deep, so there is room to swing the sofa.",
    lesson: "A quarter turn gets it through with 5 cm to spare, and every tilt and turn on the way is checked, not just the doorway.",
    expected: "clear",
  },
  {
    id: "narrow-hall",
    title: "Door fits, hall does not",
    boxName: "3-seat sofa 210 x 85 x 90 cm",
    box: studioSofa,
    gates: [entrance(1.0), flatDoor(0.95, 1.2)],
    story: "Same sofa, same 95 cm door, but the flat's entrance hall is only 1.2 m deep.",
    lesson: "The door is wide enough, yet turning the sofa sweeps a 2.3 m diagonal and there is only 1.2 m. A doorway-only check would say yes.",
    expected: "blocked",
  },
  {
    id: "elevator-wardrobe",
    title: "Wardrobe by lift",
    boxName: "Wardrobe 100 x 200 x 60 cm",
    box: furniture.wardrobe!,
    gates: [
      { kind: "doorway", name: "Lobby door", width: 0.9, height: 2.1, approach: { depth: 2.5, height: 2.4 } },
      {
        kind: "elevator",
        name: "Lift",
        door: { width: 0.8, height: 2.05 },
        cabin: { width: 1.1, depth: 1.4, height: 2.3 },
        approach: { depth: 1.8, height: 2.4 },
      },
      flatDoor(0.78, 1.2),
    ],
    story: "A 2 m wardrobe goes up to the fifth floor: lobby door, a small lift, then the flat door.",
    lesson: "One quarter turn before the lift carries it through all three. The lift cabin is checked in the same pose, not just its door.",
    expected: "clear",
  },
  {
    id: "hallway-corner",
    title: "Tight hallway corner",
    boxName: "3-seat sofa 210 x 85 x 90 cm",
    box: studioSofa,
    gates: [{ kind: "corner", name: "Hallway corner", inWidth: 1.4, outWidth: 1.3, height: 2.4 }],
    story: "An L-shaped hallway turns 90 degrees between the stairs and the flat: 1.40 m wide in, 1.30 m wide out.",
    lesson: "The sofa sweeps a diagonal at the corner. PIVOT swings the footprint through every angle and shows where it is tightest.",
    expected: "tight",
  },
  {
    id: "mattress-lift",
    title: "Queen mattress by lift",
    boxName: "Queen mattress 203 x 30 x 152 cm",
    box: furniture.queenMattress!,
    gates: [
      { kind: "doorway", name: "Lobby door", width: 1.0, height: 2.1, approach: { depth: 2.5, height: 2.4 } },
      {
        kind: "elevator",
        name: "Lift",
        door: { width: 0.9, height: 2.05 },
        cabin: { width: 1.1, depth: 1.4, height: 2.3 },
        approach: { depth: 2.0, height: 2.4 },
      },
    ],
    story: "A queen mattress is thin, so the lobby and the lift door are no problem.",
    lesson: "The cabin is only 1.4 m deep and 2.3 m tall, and the mattress cannot stand diagonally inside it. Stairs, or a different mattress.",
    expected: "blocked",
  },
  {
    id: "service-corridor",
    title: "Wardrobe down a low corridor",
    boxName: "Wardrobe 100 x 200 x 60 cm",
    box: furniture.wardrobe!,
    gates: [
      { kind: "corridor", name: "Service corridor", width: 0.9, height: 1.95, length: 6, approach: { depth: 2.6, height: 2.5 } },
    ],
    story: "The only way to the back room is a 6 m service corridor with a 1.95 m ceiling beam. The wardrobe is 2.00 m tall.",
    lesson: "Standing up it cannot pass. Laying it down and turning it does, and the room to tip it over is part of the check.",
    expected: "clear",
  },
];

export const scenarioById = (id: string): Scenario | undefined => scenarios.find((s) => s.id === id);
