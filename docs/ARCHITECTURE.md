# PIVOT architecture

> Before you lift it, know if it fits.

PIVOT is an AR path planner for SPECS. Most AR furniture apps answer "does it fit in this spot?". PIVOT answers "can it get there?", which depends on rotation and move order. You give it an object's dimensions; the Lens shows a short sequence of ghost poses in the room (tilt, rotate, slide) and marks the tightest step.

## Two layers

```
+--------------------------------------------------------------+
|  Lens Studio project (lens/)                                  |
|  scene, ghost box, bottleneck marker, draggable doorway,      |
|  pinch-to-step, sound   <-- thin; no planning logic here      |
+----------------------------+---------------------------------+
                             | calls
+----------------------------v---------------------------------+
|  Planner core (src/planner/), pure TypeScript                 |
|  planMove(box, door) -> Plan { fits, steps[], bottleneck }    |
|  unit-tested with Vitest outside Lens Studio                  |
+--------------------------------------------------------------+
```

The planner has no engine imports, so it is tested in Node and the same files are synced into the Lens project.

## Planner model (v1)

- The object is an oriented box: length, height, depth in metres.
- The doorway is a width x height opening in the wall plane; the wall normal is the z axis.
- The object is carried through along z with a fixed orientation, so its silhouette is constant and wall thickness does not change the result.
- Silhouette extents come from the rotation matrix: `width = sum(|R[0][i]| * dim[i])`, `height = sum(|R[1][i]| * dim[i])`.
- Clearance = `min(door.width - width, door.height - height)`. Negative means it does not fit.
- Pose search: pitch, yaw and roll in steps of 15 degrees over [0, 180) (a box is symmetric under 180 degree turns), so 1,728 poses.
- Ranking: poses with at least 2 cm clearance are comfortable; the one needing the least rotation wins, ties go to the roomier pose. If none is comfortable, the pose with the most clearance that still fits. If none fits, the plan says so.
- Plan steps: `start`, optional `tilt`s, optional `rotate`, `slide`, `pass`. The `pass` step carries the clearance and is the marked bottleneck.

## Lens layer (to build)

| Piece | Behaviour |
|---|---|
| Room | Adjustable scene (no SPECS device): floor, wall, doorway |
| Doorway control | Judge drags width and height in Preview; plan recomputes live |
| Ghost poses | Translucent box shown at each step's pose, world scale |
| Bottleneck marker | Glowing ring on the doorway at the `pass` step, colour by clearance |
| Stepping | Hand pinch advances; no panels or screen-style UI |
| Feedback | Short sound on step, different cue when it does not fit |

## Design fit for the SPECS challenge

Content responds to the wearer's view, sits at world scale and avoids screen-style UI: ghost objects, a glowing marker and a pinch, no menus.

## Testing

- Geometry: known silhouettes for upright and 90 degree poses.
- Planner: three door sizes (wide, standard, narrow) with expected fit or no-fit, determinism, and no-rotation case.
- Lens: manual Preview checklist in `docs/PLAN.md` (ghost box, playback, drag doorway, pinch).

## Out of scope (cut first)

Room scanning, object recognition, full six-axis planning (hallway turns, stairs, wall thickness while tilting through).
