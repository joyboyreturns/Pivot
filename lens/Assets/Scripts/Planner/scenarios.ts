import { furniture } from "./fixtures";
import type { Box, Gate, Verdict } from "./types";
import type { RouteChoice } from "./choices";
import { objectLibrary, placeLibrary } from "./library";

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
  /** Optional measured alternatives, compared using the same object and planner. */
  alternatives?: RouteChoice[];
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
    title: "Door fits, hall not",
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
      { kind: "doorway", name: "Flat door", width: 0.78, height: 2.05 },
    ],
    story: "A 2 m wardrobe goes up to the fifth floor: lobby door, a small lift, then the flat door.",
    lesson:
      "A quarter turn carries it through all three gates, and the lift cabin is checked in the same pose, not just its door. Nobody measured the hall in front of the flat door, so that last turn is shown as an unverified maneuver.",
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
    title: "Wardrobe, low corridor",
    boxName: "Wardrobe 100 x 200 x 60 cm",
    box: furniture.wardrobe!,
    gates: [
      { kind: "corridor", name: "Service corridor", width: 0.9, height: 1.95, length: 6, approach: { depth: 2.6, height: 2.5 } },
    ],
    story: "The only way to the back room is a 6 m service corridor with a 1.95 m ceiling beam. The wardrobe is 2.00 m tall.",
    lesson: "Standing up it cannot pass. Laying it down and turning it does, and the room to tip it over is part of the check.",
    expected: "clear",
  },
  {
    id: "backstage-flight-case",
    title: "The show must go on",
    boxName: "Touring flight case 120 x 110 x 65 cm",
    box: objectLibrary.find((o) => o.id === "flight-case")!.box,
    gates: placeLibrary.find((p) => p.id === "backstage")!.gates,
    story: "A touring crew has one flight case, a 72 cm stage door, and a turn into the wings. Check the whole load-in before the show.",
    lesson: "Rotate the case at the door, then follow its footprint around the corner. The same solver works for equipment as well as furniture.",
    expected: "clear",
  },
  {
    id: "gallery-loading",
    title: "Art takes another route",
    boxName: "Gallery art crate 165 x 180 x 45 cm",
    box: objectLibrary.find((o) => o.id === "art-crate")!.box,
    gates: [{ kind: "doorway", name: "Side entrance", width: 0.42, height: 2.1, approach: { depth: 3, height: 2.8 } }],
    alternatives: [{ id: "gallery-loading", name: "Gallery loading", gates: placeLibrary.find((p) => p.id === "gallery")!.gates }],
    story: "A framed work arrives in a rigid transport crate. The side entrance is too narrow. Pinch Try another route to compare the measured loading entrance.",
    lesson: "A blocked entrance does not mean cancelling the delivery. Compare a different route with the exact same object and measurements.",
    expected: "blocked",
  },
  {
    id: "workshop-bench",
    title: "A millimetre matters",
    boxName: "Workshop bench 160 x 90 x 75 cm",
    box: objectLibrary.find((o) => o.id === "workbench")!.box,
    gates: placeLibrary.find((p) => p.id === "workshop")!.gates,
    alternatives: [{ id: "workshop-double", name: "Double doors", gates: [{ kind: "doorway", name: "Double doors", width: 1.3, height: 2.1, approach: { depth: 3, height: 2.8 } }] }],
    story: "The bench clears the workshop door, but the 1.10 m hall turn leaves almost no spare room. Try the double doors before taking a risk.",
    lesson: "Clearance is a measured gap, not a promise of handling room. A route with more margin is a better choice than a just-touching turn.",
    expected: "tight",
  },
  {
    id: "aquarium-delivery",
    title: "Glass through the garden",
    boxName: "Empty aquarium 120 x 70 x 50 cm",
    box: objectLibrary.find((o) => o.id === "aquarium")!.box,
    gates: [
      { kind: "doorway", name: "Garden gate", width: 0.78, height: 1.9, approach: { depth: 2.4, height: 2.5 } },
      { kind: "corridor", name: "Side passage", width: 0.82, height: 2.1, length: 5, approach: { depth: 2.4, height: 2.5 } },
    ],
    story: "An empty aquarium is delivered through the garden and a narrow side passage. Plan the geometric route before carrying the fragile load.",
    lesson: "Replace the object, keep the route model. The result checks its rigid bounding box; weight, contents and handling requirements still need human judgement.",
    expected: "clear",
  },
  {
    id: "cargo-lift",
    title: "The lift door is not enough",
    boxName: "Delivery crate 120 x 100 x 80 cm",
    box: objectLibrary.find((o) => o.id === "cargo")!.box,
    gates: [{ kind: "elevator", name: "Passenger lift", door: { width: 0.9, height: 2.05 }, cabin: { width: 0.9, depth: 0.9, height: 1.1 }, approach: { depth: 2.5, height: 2.6 } }],
    alternatives: [{ id: "goods-lift", name: "Goods lift", gates: [{ kind: "elevator", name: "Goods lift", door: { width: 1.2, height: 2.2 }, cabin: { width: 1.6, depth: 2, height: 2.4 }, approach: { depth: 3, height: 2.8 } }] }],
    story: "The delivery crate looks small enough for the lift door. The cabin behind it is a different constraint. Compare the goods lift before loading.",
    lesson: "A doorway check alone misses the space behind the opening. The same pose must fit both the door and the entire cabin.",
    expected: "blocked",
  },
];

export const scenarioById = (id: string): Scenario | undefined => scenarios.find((s) => s.id === id);
