# PIVOT: Devpost pitch

**Tagline:** Before you lift it, know if it fits.

## The problem
Every AR furniture app asks "does it fit in this spot?". Moving day asks something harder: "can it get there?" A sofa that fits the living room can still jam in the lift, the hall corner or the flat door, and the answer depends on how you turn it and whether you have room to turn it. Nobody finds out until the sofa is stuck on the stairs.

## Who it is for
Anyone who has to get a big thing through a building: people buying a sofa or a wardrobe, movers, delivery crews, furniture shops, landlords checking whether a flat is practical to furnish.

## What it does
PIVOT plans the whole move for **any object and any place**, and shows it as a model you can see at a glance.

- **The move table.** The room is a 1:10 model on a table about a metre ahead, a little below eye level, inside the glasses' narrow view. One pinch makes it life size where the move happens.
- **Information on the thing.** No paragraphs. Dimension lines sit at the gap where the object passes with the clearance beside them ("2.5 cm" a side); a red, amber or green glow marks the tightest point; the step label rides on the ghost; the gate tokens along the table edge carry the verdict and a diamond marks the bottleneck.
- **The whole move at once.** A seven-frame ghost trail shows the path with the tightest moment tinted, and the ghost replays it by itself (tip, turn, slide, swing round the corner). Pinch the arrow to step, drag the rail to scrub.
- **Try the fix.** When something is blocked, tags on the model say the smallest change that works: "Widen to 85 cm", "5 cm lower (legs off)", "Hall to 227 cm". Pinch one and PIVOT applies it and re-plans the whole route, so you watch the verdict flip.
- **Any object, any place.** 12 objects, 6 places, or *Your move*: edit every number (object size; door width and height, the room in front, ceiling, lift cabin, hallway widths), add and remove gates (doorway, corridor, lift, L-shaped corner).
- **How big could it be.** "This route allows up to 105% of this size", or "shrink to 94% to fit".
- **Honest about what it checked.** A step says **Verified step** only if the geometry was checked, including the room to turn it. A turn where nobody measured the hall, and every no-fit illustration, says **Unverified maneuver**.

Things a doorway-only check cannot tell you, and PIVOT does:
- "The door is wide enough, but turning the sofa sweeps a 2.3 m diagonal and the hall is 1.2 m deep."
- "No orientation gets an 85 cm sofa through an 80 cm door. Take the legs off (5 cm) or widen the door to 85 cm."
- "The lift door passes the mattress, but the cabin is 1.4 m deep and the mattress cannot stand diagonally."
- "The sofa fits the hallway corner with 1 cm to spare, laid on its back, tightest 47 degrees into the turn."

## Why it stands out
Every entry is planned with the same skill pack and built with the same agent tools. What differs is what is built.
- **A real algorithm, not a prompt.** The planner is 79 unit tests of geometry: oriented-box pose search, an exact L-turn solver (matches the closed form), approach-space sweeps, bisection for fixes. The Lens draws what it says; nothing is faked per scenario.
- **It says what it did not check.** Verified versus unverified is in the data model and on every step.
- **It tells you what to do next.** A verdict is not enough; PIVOT proposes the fix and lets you try it.
- **Designed to the glasses, not to a screen.** Layout numbers (distance, height, field of view) live in one file and a LEAF scenario asserts them.

## Why glasses
The object, the opening and the answer sit together at world scale. You look at a model of the move on the table in front of you, step into life size at the gate, walk round it (the labels turn to face you), look at the tight spot and watch the ghost pass it. Your hands are free to pinch. On a phone you would look at a screen about a doorway; here you look at the doorway.

## How it works
A pure TypeScript planner (no engine imports, 79 unit tests) and a thin Lens.
- Object = oriented box. Pose search over pitch, yaw and roll, then a 5 degree refinement for tight gates.
- Gates: doorway, corridor, lift (door and cabin in the same pose), 90 degree L-turn.
- L-turn: the footprint is swept through every angle of the swing against the inside corner. Pushing toward the outer corner never hurts, which turns the planning problem into one clipped-polygon test per angle; bisection on the hall widths gives the slack. It matches the closed form for equal halls.
- Approach clearance: tilts and turns are sampled along the interpolated rotation against the depth and ceiling in front of the gate.
- Fixes: bisection on each gate and object dimension for the smallest change that makes a blocked gate pass; the largest uniform scale a route allows.
- The Lens (Spectacles Interaction Kit, mouse-simulated pinch in the preview) draws everything from the plan. Nothing is authored per scenario.

## How it was built
Planned in `devpost/design-brief.md`, built by a coding agent driving Lens Studio through the Lens Studio MCP (scene and asset GraphQL, VirtualScene, runtime scene queries, preview interaction, screenshots, logs) and tested with LEAF: 11 scenarios run in the preview. See `build-notes.md`.

## What is real and what is not
- Logic proven: the planner (79 tests) and the Lens flow (11 LEAF scenarios in Lens Studio's Interactive Preview).
- Feel unproven: no SPECS device was available. Comfort, text legibility on the real display, reach of the small pinch targets and hand tracking are untested.
- Dimensions are typed in, not sensed. On glasses the same steppers would be set by pinching the real door edges; that is not built.
- Furniture is a bounding box, so a real sofa that compresses or has removable legs may fit where PIVOT says no. Not modelled: stairs, wall thickness while tilting through, rotating inside a lift, doors that open.

## What's next
Measure the gate with the glasses (depth and spatial mapping), recognise the object, keep the same planner.

## Built with
Lens Studio, TypeScript, Spectacles Interaction Kit, LEAF, Vitest.
