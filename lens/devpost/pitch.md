# PIVOT: Devpost pitch

**Tagline:** Before you lift it, know if it fits.

## Inspiration

Every AR furniture app asks "does it fit in this spot?". Moving day asks something harder: "can it get there?" A sofa that fits the living room can still jam in the hallway corner, the lift or the flat door, and the answer depends on how you turn it and whether you have room to turn it. Nobody measures that until the sofa is stuck.

## What it does

PIVOT plans the whole move at real scale, in the place where it happens.

- Pick a scenario (pinch *Next scenario*): a studio-flat sofa, a wardrobe by lift, a mattress, a tight hallway corner.
- See the route as gate chips: doorway, lift, corridor, L-shaped corner. Each chip is coloured by its verdict and the tightest gate carries a diamond.
- Pinch a chip to look at that gate at its real size. The doorway frame, lift cabin, low corridor or L-shaped hall is drawn in front of you with a red, amber or green marker at the tightest point.
- Step a ghost of the object through the plan (pinch the arrow) or scrub it (drag the rail): tip, turn, slide, swing round the corner.
- PIVOT says what it actually checked. A step is a **Verified step** only if the geometry was checked, including the room you need to turn it. Anything else, and every no-fit attempt, carries an **Unverified maneuver** label.

Things a doorway-only check cannot tell you, which PIVOT does:

- "The door is wide enough, but turning the sofa sweeps a 2.3 m diagonal and the hall is 1.2 m deep."
- "No orientation gets an 85 cm sofa through an 80 cm door. You need at least 85 cm."
- "The lift door passes it, but the cabin is 1.4 m deep and the mattress cannot stand diagonally."
- "The sofa fits the hallway corner with 1 cm to spare, laid on its back, tightest 47 degrees into the turn."

## How it works

A pure TypeScript planner (no engine imports, 60 unit tests) and a thin Lens.

- Object = oriented box. Pose search over pitch, yaw and roll, then a 5 degree refinement for tight gates.
- Gates: doorway, corridor, lift (door and cabin in the same pose), 90 degree L-turn.
- L-turn: the footprint is swept through every angle of the swing against the inside corner. A monotonicity argument (pushing toward the outer corner never hurts) turns the planning problem into one clipped-polygon test per angle, and bisection on the hall widths gives the slack. It matches the closed-form answer for equal halls.
- Approach clearance: tilts and turns are sampled along the interpolated rotation against the room in front of the gate (depth and ceiling).
- Route planner: per-gate plans, the bottleneck gate and one verdict (clear, tight, blocked). Inverse queries: the smallest doorway a sofa needs, and a furniture by route fit matrix.

The Lens is built with Spectacles Interaction Kit (pinch and drag, mouse-simulated in Interactive Preview) and draws everything from the plan. No per-scenario authoring.

## Why glasses

The sofa, the opening and the answer sit together at world scale where the move would happen. You walk round the gate, look at the tight spot and see the ghost pass it. Hands stay free to pinch. On a phone you would be looking at a screen about a doorway instead of at the doorway.

## What is real and what is not

- Logic proven: the planner (60 tests) and the Lens flow (8 LEAF scenarios run in Lens Studio's Interactive Preview, mouse-simulated pinch).
- Feel unproven: no SPECS device was available. Comfort, text legibility at reading distance on the real display, reach of the targets and hand-tracking reliability are untested.
- Dimensions are supplied in advance; there is no room scanning or object recognition. Furniture is a bounding box, so a real sofa that compresses or has removable legs may fit where PIVOT says no.
- Not modelled: stairs, wall thickness while tilting through, rotating inside a lift, doors that open.

## What's next

Measure the gate with the glasses (depth and spatial mapping), recognise the object, and keep the same planner.

## Built with

Lens Studio, TypeScript, Spectacles Interaction Kit, LEAF, Vitest.
