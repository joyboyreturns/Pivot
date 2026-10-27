# PIVOT

> Before you lift it, know if it fits.

PIVOT is an AR path planner for SPECS. Most AR furniture apps answer "does it fit in this spot?". PIVOT answers "can it get there?": the whole route, gate by gate, at real scale, with the tightest point marked and every step labelled as checked or unverified.

Give it an object's dimensions and a route (doorways, a lift, a low corridor, an L-shaped hallway corner). It shows a short sequence of ghost poses (tip, turn, slide) that get the object through each gate, which gate limits the move, and an honest verdict: clear, tight or blocked.

Built for the Learn AR with SPECS challenge.

## What it does

- **Route gates.** Doorway, corridor, lift (door and cabin in the same pose) and a 90 degree L-turn. The L-turn sweeps the object's footprint through every angle against the inside corner and finds the narrowest hall it can turn in.
- **Route planner.** `planRoute(box, gates)` plans every gate, names the bottleneck, and gives one verdict.
- **Verified versus unverified.** Tilts and turns are checked against the room in front of the gate (swing depth and ceiling). Where that room was not given, the step is shown as an "Unverified maneuver" and counted.
- **Inverse questions.** The smallest doorway a sofa needs, and a fit matrix of furniture against routes.
- **Seven scenarios** with story text: studio flat sofa, the same sofa with a 95 cm door, "the door fits but the hall does not", wardrobe by lift, a tight hallway corner, a queen mattress that cannot ride the lift, a wardrobe down a low corridor.

## In the Lens (Lens Studio 5.23, Interactive Preview)

- Pinch **Next scenario** to cycle scenarios.
- Pinch a **gate chip** to look at one gate of the route; the chip colour and the diamond show the verdict and the bottleneck.
- After the analysis scan the ghost plays the maneuver by itself; pinch the **arrow** to step it or drag the **rail** to scrub, and your first touch takes over.
- Labels turn to face you, so you can walk round the gate and still read them.
- The doorway, lift cabin, corridor or L-shaped hall is drawn at real size (cm). A red, amber or green marker sits at the tightest point; a floor line shows where the room in front of the gate ends.
- The label says "Verified step" only for steps that were checked and "Unverified maneuver" for illustration (including every no-fit attempt).

No SPECS device was available. Everything was run in Interactive Preview with mouse-simulated pinch; hand tracking and comfort on real glasses are unproven.

## Status

Planner core and Lens experience working. 60 Vitest tests (`npm test`) and 9 LEAF scenarios under `lens/Assets/Scripts/Tests/`. See [`docs/PLAN.md`](docs/PLAN.md) for what is done and what remains.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Step-by-step plan](docs/PLAN.md)
- [Devpost pitch, design brief and demo outline](lens/devpost/)

## Develop

```
npm install
npm test            # planner unit tests
npm run typecheck
npm run demo        # prints the scenario report and the fit matrix
npm run sync        # copies src/planner into lens/Assets/Scripts/Planner
```

Open `lens/` in Lens Studio 5.23 or later. The planner is plain TypeScript with no engine imports, so the same files run in Node and in the Lens.

## License

MIT
