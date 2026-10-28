# PIVOT architecture

> Before you lift it, know if it fits.

PIVOT is an AR path planner for SPECS. Most AR furniture apps answer "does it fit in this spot?". PIVOT answers "can it get there?", which depends on rotation, move order and the room to carry them out. You give it an object's dimensions and a route; the Lens shows a short sequence of ghost poses in the room and marks the tightest step.

## Two layers

```
+---------------------------------------------------------------+
|  Lens Studio project (lens/Assets/Scripts)                     |
|  PivotAnalysis  scenario + gate state, labels, chips           |
|  PivotGateView  doorway / corridor / lift cabin / L-hall       |
|  PivotManeuver  ghost playback, arrow, rail, step label        |
|  thin: no planning logic, only drawing what the plan says      |
+-------------------------------+-------------------------------+
                                | calls (synced copy)
+-------------------------------v-------------------------------+
|  Planner core (src/planner/), pure TypeScript                  |
|  planRoute(box, gates) -> RoutePlan                            |
|  planGate / planMove -> Plan { steps[], bottleneck, verified } |
|  scenarios, inverse queries, choreography, text report         |
|  unit-tested with Vitest outside Lens Studio                   |
+---------------------------------------------------------------+
```

`npm run sync` copies `src/planner/*.ts` into `lens/Assets/Scripts/Planner`, next to the scripts that import them.

## Planner model

All lengths are metres, angles degrees. The object is an oriented box (length, height, depth). A pose is pitch (about x), then yaw (y), then roll (z); the carry direction through a gate is z.

### Gates

| Gate | Check |
|---|---|
| `doorway` | Silhouette of the posed box (`extents` x, y) fits width x height. Wall thickness does not matter because the pose is fixed while sliding. |
| `corridor` | Same cross-section check; carried in one pose, so no turning inside. |
| `elevator` | The same pose must clear the lift door and also stand inside the cabin: the posed box's axis-aligned extents (x, y, z) must fit the cabin. This is exact, since an oriented box fits inside an axis-aligned one iff its bounding box does. |
| `corner` | 90 degree L-turn, solved in plan view (below). |

Clearance is the smallest slack over every constraint; negative means it does not fit.

### Pose search (doorway, corridor, lift)

Pitch, yaw and roll in 15 degree steps over [0, 180) (a box is symmetric under 180 degree turns), 1,728 poses. Poses with at least 2 cm clearance are comfortable and the one needing the least rotation wins (ties go to the roomier pose). If none is comfortable, the pose with the most clearance that still fits, refined in 5 degree steps. If none fits, the plan says so.

### Approach clearance and verification

Each gate may carry an `approach`: the free depth in front of it (how far back the object can swing) and the ceiling height. The tilts and turns that take the object from upright to the pass pose are sampled every 10 degrees along the interpolated rotation; the smallest `min(depth - extent z, height - extent y)` is that step's clearance. The search ranks poses by the smaller of gate clearance and approach clearance, so with little room it chooses a different way through.

Every `PlanStep` has `verified`:

- `start` and `pass` are verified (the pass pose is checked exactly).
- `tilt`, `rotate` and `slide` are verified only if an approach space was given and the clearance is non-negative. With no approach space they stay unverified, and the Lens shows "Unverified maneuver".
- If the gate fits but the turn does not, `reason` is `"approach"` and `alternative` holds the plan that would work with enough room, together with the room it needs (`approachNeeded`).

### L-turn

Plan view: hall A (width a) runs east-west, hall B (width b) north-south, outer walls at y = a and x = b, inside corner at the origin, solid quadrant Q = {x < 0, y < 0}. The footprint rectangle rotates through 90 degrees.

Q is closed downward, so pushing any feasible rectangle toward the outer corner keeps it feasible. For every angle the best position therefore touches both outer walls, and a path exists exactly when that pushed rectangle clears Q at every angle (polygon clipping, positive overlap area counts). Slack is found by bisection on shrinking both widths together. Both swing directions are tried. With equal halls and a 45 degree tightest angle the answer matches the closed form `w = (L/2 + D) / sqrt(2)` (tested).

The solver also tries laying the object on its back (depth vertical) when upright is not comfortable, and takes the ceiling into account. The plan carries a `turn` with everything needed to place the object at any angle, so the Lens animates the exact path.

### Route planner

`planRoute(box, gates)` plans each gate, the bottleneck (least slack; for a blocked route the worst blocker), the first blocked gate and a verdict: `blocked`, `tight` (< 3 cm) or `clear`. It also counts unverified steps.

### Inverse queries

`minDoorwayWidth(box, height)` (bisection on the monotone fit answer), `minCornerWidth(box, ceiling)` and `fitMatrix(boxes, routes)`.

### Any object, any place

- `builder.ts`: every box and gate exposes its editable numbers as `Param` rows (`boxParams`, `gateParams`) and returns edited copies (`withBoxParam`, `withGateParam`), clamped and rounded to a centimetre. A hall depth of 0 means "not measured": the approach is dropped and the turn becomes unverified. `defaultGate` and `nextGate` build routes.
- `handles.ts`: where each grab point sits (`boxHandles`, `gateHandles`) and what a drag changes (`applyHandle`), as pure functions the Lens only draws.
- `library.ts`: 12 objects (`objectLibrary`), 6 places (`placeLibrary`) and `customScenario` for the Lens's *Your move* mode.
- `fixes.ts`: `suggestFixes(box, gate)` finds the smallest change that makes a blocked gate pass: widen the opening (judged without the approach space first, then, if the turn is still blocked, the hall depth needed), a deeper cabin, wider halls, or a smaller object (height, depth or length, capped at 25 cm). Each search is a bisection with the quick planner (30 degree steps) confirmed by the full planner. `maxScale(box, gates)` is the largest uniform scale the whole route allows.

### Scenario library and choreography

`scenarios` holds seven scenarios (story, lesson, expected verdict); a test holds the planner to every advertised verdict. `frameAt(plan, u)` returns the object's position and pose at progress `u`, interpolating between steps and following the exact swing for L-turns; `attemptFrame` is the failed-attempt wiggle for a doorway where nothing fits.

## Design rules the Lens follows

From the SPECS design material the hackathon is built on: not a website floating in front of the face (information on the thing it is about), not everything on display all the time (the story fades after a few seconds, fix tags go when there is nothing to fix), a few big targets (pinch is the tap), nothing behind the shoulder (everything within the display's narrow view), main content 0.6 to 1.6 m away and a little below eye level, light content for the additive display. A LEAF scenario asserts the placement numbers.

## Lens layer

| Piece | Behaviour |
|---|---|
| `PivotLayout` | Where everything sits: the move table 1.1 m ahead and below eye level, model scale 1:10, positions of controls and labels inside +-36 cm sideways, and text sizes. One file, so the comfort numbers live in one place. |
| `PivotStageFx` / `PivotPose` | The trail of ghost frames and the dimension lines with their numbers, drawn on the stage; the pose math shared with the ghost. |
| `PivotAnalysis` | Holds the scenario and selected gate, runs `planRoute`, writes the labels (title, story, route verdict, result, detail), keeps gate chips, restarts the brief scan on each change. Pinch Next scenario cycles. |
| `PivotHandles` | Draws the handles from the planner's specs, uses the Interactable and InteractableManipulation of the Spectacles Interaction Kit, turns hand movement into a distance along the handle's axis (throttled to 20 Hz), and snaps each handle back onto its edge. |
| `PivotSandbox` | *Your move*: object and place pickers, add and remove gates, a stepper row for every parameter of the selected object or gate. It only edits an object and a list of gates and hands the result to `PivotAnalysis`. |
| `PivotGateView` | Pool of box panels built at runtime from the gate: doorway frame, corridor walls, lift cabin, cutaway L-hall, floor line for the approach limit, a tone-coloured bottleneck marker. |
| `PivotManeuver` | Ghost playback from `frameAt`; the object rotates about the middle of its volume and rests on the floor. Sofa mesh for sofas, a real-size box with details (wardrobe doors, mattress quilting) otherwise. Replays the maneuver by itself after each analysis (`autoPlay`); the first pinch or drag takes over. Arrow steps, rail scrubs, label says verified step or Unverified maneuver. |
| Labels | Billboarded about the vertical toward the wearer's head so they read from any side. |
| L-turn view | The room hangs off a `Stage` object tipped 62 degrees toward the viewer so the plan is readable from standing height. |

Interactions use SIK (`TapInteraction`, `DragInteraction`), so they work with the mouse in Interactive Preview and with hands on device. The display is additive: text is light, nothing relies on dark colours.

## Testing

- Vitest (86 tests): geometry, handles, three door sizes, fixtures, fine search, corner solver against the closed form, approach sweeps, elevator and corridor gates, route verdicts, inverse queries, scenario library, choreography.
- LEAF (12 scenarios in `lens/Assets/Scripts/Tests`): scene and scale, no-fit result and stepping, scrub, scenario switch, gate chips, verified versus unverified, corner turn, box object and lift, hands-free replay, your-move sandbox, dragging handles (door, hall, object, L-turn), the move table (controls and labels inside the field of view, model scale, callouts, trail, life size).

## Not modelled (cut first)

Room scanning, object recognition, stairs, wall thickness while tilting through, deformable furniture, rotation inside a lift cabin, an L-turn with a tilted object turning about a non-vertical axis, doors that open.
