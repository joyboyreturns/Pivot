# PIVOT step-by-step plan

Target: submit **8 Nov 2026**. The official deadline for Learn AR with SPECS is reported as 9 Nov 2026, 5:00 PM ET, but that comes from an earlier research report and has not been checked against the official page. Budget about 25 hours, 2-3 hours a day alongside LicenseGraph.

## Step 1: Foundation (27-28 Oct) - done

- [x] Repo, MIT licence, TypeScript, Vitest
- [x] Planner core v1 (box vs doorway, pose search) with tests on three door sizes
- [x] Architecture and plan docs, `AGENTS.md`
- [x] Lens Studio project under `lens/` showing the sofa and doorway in Preview

## Step 2: Planner core (29-31 Oct) - done

- [x] Furniture and doorway fixtures
- [x] Finer search (5 degrees) around the best pose for tight doors
- [x] Sync script: `npm run sync` copies `src/planner/*.ts` into `lens/Assets/Scripts/Planner`
- [x] Approach clearance so `tilt` and `rotate` steps are checked against room depth and ceiling; steps carry `verified`
- [x] Route gates beyond doorways: corridor, lift (door and cabin), 90 degree L-turn
- [x] `planRoute`: per-gate plans, bottleneck, verdict
- [x] Inverse queries (smallest doorway, smallest corner hall) and fit matrix
- [x] Scenario library (7) with story text; `npm run demo` prints the report
- Done when: tests pass and the planner runs inside Lens Studio. Met (60 tests).

## Step 3: Lens experience (1-3 Nov) - done in Preview

- [x] Scenario switcher (pinch Next scenario)
- [x] Gate chips: one chip per gate, verdict colour, diamond on the bottleneck
- [x] Real-size gate view: doorway, corridor, lift cabin, L-shaped hall
- [x] Ghost playback from the plan, pinch arrow and drag rail
- [x] Verified step / Unverified maneuver label, per step
- [x] 8 LEAF scenarios passing in Preview
- Done when: the full flow runs in Preview. Met in Interactive Preview with mouse-simulated pinch.

## Step 4: Polish (4-6 Nov)

- [ ] Walk around the preview with WASD and fix anything cramped or hard to read; the L-turn view and the text stack are the likeliest
- [ ] Sound cues, no-fit state, nicer box objects (wardrobe, mattress)
- [ ] Record the video (under 3 minutes, public on YouTube), capture images, write the Devpost description from `lens/devpost/pitch.md`
- Done when: video and images are ready.

## Step 5: Submit (7-8 Nov)

- [ ] Re-read the official rules page one last time (deadline, team size, prizes, prize payment to India)
- [ ] Make the repo public with the Lens project and the `devpost/` folder
- [ ] Submit on 8 Nov

## Preview checklist

1. Sofa and doorway appear at real scale (210 x 85 x 90 cm sofa, 80 cm door), labels readable.
2. Pinch Next scenario cycles seven scenarios; the title shows n/7.
3. The route verdict, bottleneck diamond and chip colours match the planner.
4. Pinching a chip shows that gate; the frame, lift cabin, corridor or L-hall changes shape.
5. Arrow steps and the rail scrubs; the label says Verified step only for checked steps.
6. The blocked scenarios show an Unverified maneuver illustration that stops at the jam.
7. The corner scenario swings the sofa round the corner at the marker.

## Open questions

- Official SPECS rules, deadline, prizes and team-size limit (unconfirmed).
- Whether prizes can be paid to India.
- Feel on real glasses: reading distance of the text stack, reach of the chips, hand-tracking reliability. Nothing here was tried on a device.
