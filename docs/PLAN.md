# PIVOT step-by-step plan

Target: submit **8 Nov 2026**. The official deadline for Learn AR with SPECS is reported as 9 Nov 2026, 5:00 PM ET, but that comes from an earlier research report and has not been checked against the official page. Budget about 25 hours, 2-3 hours a day alongside LicenseGraph.

## Step 1: Foundation (27-28 Oct)

- [x] Repo, MIT licence, TypeScript, Vitest
- [x] Planner core v1 (box vs doorway, pose search) with tests on three door sizes
- [x] Architecture and plan docs, `AGENTS.md`
- [ ] Install Lens Studio 5.22+ and confirm it runs well on the MacBook Air M4 (16 GB)
- [ ] Create the Lens project under `lens/` and show a ghost box in Preview
- Done when: a ghost box is visible in Preview.

## Step 2: Planner core (29-31 Oct)

- [ ] Review the v1 model against real furniture sizes; add fixtures
- [ ] Add approach clearance (hallway width) so `tilt` and `rotate` steps can also be constrained
- [ ] Consider a finer search around the best pose (5 degrees) for tight doors
- [ ] Sync script: copy `src/planner/*.ts` into the Lens project's assets
- Done when: tests pass on 3 door sizes and the planner runs inside Lens Studio.

## Step 3: Lens experience (1-3 Nov)

- [ ] Adjustable room scene: floor, wall, doorway with draggable width and height
- [ ] Ghost-pose playback for each `PlanStep`
- [ ] Bottleneck marker on the `pass` step
- [ ] Pinch to step through poses
- Done when: the full flow runs in Preview and the plan recomputes as the doorway is dragged.

## Step 4: Polish (4-6 Nov)

- [ ] World-scale check, materials, sound cues, no-fit state
- [ ] Record the video, capture images, write the description
- Done when: video and images are ready.

## Step 5: Submit (7-8 Nov)

- [ ] Re-read the official rules page one last time (deadline, team size, prizes, prize payment to India)
- [ ] Submit on 8 Nov

## Preview checklist

1. Ghost box appears at world scale.
2. Dragging doorway width or height changes the plan live.
3. A too-narrow doorway shows the no-fit state.
4. Pinch advances through steps and the bottleneck marker is on the last one.

## Open questions

- Official SPECS rules, deadline, prizes and team-size limit (unconfirmed).
- Whether prizes can be paid to India.
- Whether Lens Studio 5.22+ runs well on the MacBook Air M4.
