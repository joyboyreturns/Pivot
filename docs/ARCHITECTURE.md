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

### Scenario library and choreography

`scenarios` holds seven scenarios (story, lesson, expected verdict); a test holds the planner to every advertised verdict. `frameAt(plan, u)` returns the object's position and pose at progress `u`, interpolating between steps and following the exact swing for L-turns; `attemptFrame` is the failed-attempt wiggle for a doorway where nothing fits.

## Lens layer

| Piece | Behaviour |
|---|---|
| `PivotAnalysis` | Holds the scenario and selected gate, runs `planRoute`, writes the labels (title, story, route verdict, result, detail), keeps gate chips, restarts the brief scan on each change. Pinch Next scenario cycles. |
| `PivotGateView` | Pool of box panels built at runtime from the gate: doorway frame, corridor walls, lift cabin, cutaway L-hall, floor line for the approach limit, a tone-coloured bottleneck marker. |
| `PivotManeuver` | Ghost playback from `frameAt`; the object rotates about the middle of its volume and rests on the floor. Sofa mesh for sofas, a real-size box with details (wardrobe doors, mattress quilting) otherwise. Replays the maneuver by itself after each analysis (`autoPlay`); the first pinch or drag takes over. Arrow steps, rail scrubs, label says verified step or Unverified maneuver. |
| Labels | Billboarded about the vertical toward the wearer's head so they read from any side. |
| L-turn view | The room hangs off a `Stage` object tipped 62 degrees toward the viewer so the plan is readable from standing height. |

Interactions use SIK (`TapInteraction`, `DragInteraction`), so they work with the mouse in Interactive Preview and with hands on device. The display is additive: text is light, nothing relies on dark colours.

## Testing

- Vitest (60 tests): geometry, three door sizes, fixtures, fine search, corner solver against the closed form, approach sweeps, elevator and corridor gates, route verdicts, inverse queries, scenario library, choreography.
- LEAF (9 scenarios in `lens/Assets/Scripts/Tests`): scene and scale, no-fit result and stepping, scrub, scenario switch, gate chips, verified versus unverified, corner turn, box object and lift, hands-free replay.

## Not modelled (cut first)

Room scanning, object recognition, stairs, wall thickness while tilting through, deformable furniture, rotation inside a lift cabin, an L-turn with a tilted object turning about a non-vertical axis, doors that open.
