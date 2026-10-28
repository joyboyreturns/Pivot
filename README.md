# PIVOT

> Before you lift it, know if it fits.

PIVOT is an AR path planner for SPECS. Most AR furniture apps answer "does it fit in this spot?". PIVOT answers "can it get there?": the whole route, gate by gate, at real scale, with the tightest point marked and every step labelled as checked or unverified.

Give it any object's dimensions and any route (doorways, a lift, a low corridor, an L-shaped hallway corner). It shows a short sequence of ghost poses (tip, turn, slide) that get the object through each gate, which gate limits the move, and an honest verdict: clear, tight or blocked.

Built for the Learn AR with SPECS challenge.

## What it does

- **Route gates.** Doorway, corridor, lift (door and cabin in the same pose) and a 90 degree L-turn. The L-turn sweeps the object's footprint through every angle against the inside corner and finds the narrowest hall it can turn in.
- **Route planner.** `planRoute(box, gates)` plans every gate, names the bottleneck, and gives one verdict.
- **Verified versus unverified.** Tilts and turns are checked against the room in front of the gate (swing depth and ceiling). Where that room was not given, the step is shown as an "Unverified maneuver" and counted.
- **Inverse questions.** The smallest doorway a sofa needs, and a fit matrix of furniture against routes.
- **What would make it fit.** When a gate blocks, PIVOT says the smallest change that works: widen the opening to 85 cm, give the hall 2.3 m, take 5 cm off the height (legs off), widen both halls. It also says how big the object could be: "this route allows up to 104% of this size".
- **Any object, any place.** A library of 12 objects and 6 places, and a *Your move* mode where every number (object length, height, depth; door width and height, hall depth, ceiling, lift cabin size, hall widths) can be changed, and routes can have up to three gates of any type.
- **Seven scenarios** with story text: studio flat sofa, the same sofa with a 95 cm door, "the door fits but the hall does not", wardrobe by lift, a tight hallway corner, a queen mattress that cannot ride the lift, a wardrobe down a low corridor.

## In the Lens (Lens Studio 5.23, Interactive Preview)

PIVOT is designed to the SPECS design habits, not as a screen in the air:

- **A move table, not a wall of text.** The room is a 1:10 model on a table about 1.1 m ahead and a little below eye level, inside the glasses' narrow field of view. Pinch **Life size** for the real 1:1 room.
- **Numbers sit on the thing they describe.** Dimension lines at the gap where the object passes, with the clearance beside them; the step label rides on the ghost; the tightest moment of the move is tinted in the trail.
- **The whole move at once.** A seven-frame ghost trail shows the path, and the ghost replays it by itself.
- **Try the fix.** Blocked? Two tags on the model say what would fix it ("Widen to 85 cm", "5 cm lower"). Pinch one and the whole route re-plans with the change.
- **Drag the edges.** Small handles sit on the edges that matter: the sofa's end, top and front, the door's jamb and lintel, the lift's cabin walls, the hall's far end, the L-turn's two halls. Pinch one and pull along its axis: the number appears on it, PIVOT re-plans on every step, and the verdict, trail and fix tags follow. A guide line shows the axis a handle moves on, and the object's handles step aside while the ghost plays the move. Grabbing an edge of a ready-made scenario takes it over, so "what if the door were 10 cm wider?" is one pull.
- **Few big targets.** Next scenario, Your move, Life size, the next-step arrow and the scrub rail; the route is three tokens along the table edge.

- Pinch **Next scenario** to cycle scenarios, or pinch **Your move** for the sandbox: **Next object**, **Next place**, **+ Gate**, **– Gate**, and a **–/+** stepper for every size when you want exact numbers (one tap is 1 cm, quick repeats 5 cm), or just drag the handles. Pinch the **Object** chip to edit the object, a gate chip to edit that gate. A hall depth of 0 means "not measured", and the turn is then shown as unverified.
- Pinch a **gate chip** to look at one gate of the route; the chip colour and the diamond show the verdict and the bottleneck.
- After the analysis scan the ghost plays the maneuver by itself; pinch the **arrow** to step it or drag the **rail** to scrub, and your first touch takes over.
- Labels turn to face you, so you can walk round the gate and still read them.
- The doorway, lift cabin, corridor or L-shaped hall is drawn at real size (cm). A red, amber or green marker sits at the tightest point; a floor line shows where the room in front of the gate ends.
- The label says "Verified step" only for steps that were checked and "Unverified maneuver" for illustration (including every no-fit attempt).

No SPECS device was available. Everything was run in Interactive Preview with mouse-simulated pinch; hand tracking and comfort on real glasses are unproven.

## Status

Planner core and Lens experience working. 86 Vitest tests (`npm test`) and 12 LEAF scenarios under `lens/Assets/Scripts/Tests/`. See [`docs/PLAN.md`](docs/PLAN.md) for what is done and what remains.

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
