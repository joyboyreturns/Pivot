# PIVOT step-by-step plan

Target: submit **8 Nov 2026**. The official rules (read on learn-specs.devpost.com/rules on 28 Oct 2026) give the Submission Period as 15 Oct 10:00 AM ET to **9 Nov 2026, 5:00 PM ET**, judging 10-17 Nov, winners around 19 Nov. The Live Project Review is Thu 5 Nov, 12 PM ET (post in #devpost-learn-feedback tagged "Learn AR with SPECS" and "Will It Ship").

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
- [x] 9 LEAF scenarios passing in Preview
- [x] Hands-free replay after each analysis, camera-facing labels, wardrobe and mattress details
- Done when: the full flow runs in Preview. Met in Interactive Preview with mouse-simulated pinch.

## Step 3b: Any object, any place - done in Preview

- [x] Parameter model for every box and gate; edited copies, clamped to a centimetre
- [x] Library of 12 objects and 6 places; free-form routes of up to 3 gates
- [x] "What would make it fit": smallest widening, hall depth, cabin depth, halls or object change (`suggestFixes`)
- [x] "How big could it be": `maxScale`
- [x] *Your move* mode in the Lens: Next object, Next place, + Gate, - Gate, steppers on every parameter, plus draggable handles on the object's and gate's edges (`handles.ts`, `PivotHandles.ts`)
- [x] LEAF scenario for the sandbox

## Step 3c: The move table (design-rules overhaul) - done in Preview

- [x] Room as a 1:10 model on a table 1.1 m ahead, life-size toggle
- [x] Numbers on the thing: dimension lines at the gap, step label on the ghost, trail of the whole move
- [x] Fix tags you can pinch to try the fix
- [x] Controls cut to a few large targets; placement numbers in one file and tested

## Step 3d: Measurement error and honest wording (29 Oct, owner approved scope A)

- [x] `lengthText`: a positive margin under 1 cm reads in millimetres in the route summary, step hints and text report (was "0 cm")
- [x] `assessRoute`: conservative re-measure of the nominal maneuver under stated object and room error, separate carry margin, 19 tests with hand-worked fixtures
- [x] Corner sampling bound (`cornerSamplingAllowance`) and a swing-direction option in `solveCorner`
- [x] Docs and pitch: "any object, any place" and "exact L-turn" wording qualified; gates judged independently; "verified" defined
- [ ] One Lens scenario that shows the tolerance result (needs Lens Studio access; not built)
- [ ] Re-run all LEAF scenarios after `npm run sync` (planner text changed; not run)

## Step 4: Polish (4-6 Nov)

- [x] Walk-around check with the preview camera (orbit), L-turn framing, text stack, switch size, long titles
- [ ] Sound cues (none yet: no audio assets added)
- [ ] Record the video (under 3 minutes, public on YouTube), capture images, write the Devpost description from `lens/devpost/pitch.md`
- Done when: video and images are ready.

## Step 5: Submit (7-8 Nov)

- [ ] Re-read the rules page for changes (they can be amended on the site)
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

## Submission checklist (from the official rules and the Devpost page)

Judging is two stages: pass/fail viability (uses the required tools, meets the requirements), then four equally weighted criteria: Design, Technical Implementation, Innovation/Idea, Presentation.

- [ ] Demo video under 3 minutes, public on YouTube, screen recording of the Lens Studio preview, no third-party trademarks or copyrighted music (`lens/devpost/demo-outline.md`)
- [ ] Public repo (GitHub, GitLab or Bitbucket) with the Lens Studio project and the `devpost/` folder
- [ ] Text description of features and functionality (`lens/devpost/pitch.md`)
- [ ] Disclose pre-existing code: Spectacles Interaction Kit, LEAF, the Interior Props package and Lens Studio template materials; everything under `src/`, `lens/Assets/Scripts` (except `DragInteraction.ts`, `TapInteraction.ts`, adapted from the SIK recipes) and `tests/` was written during the Submission Period (first commit 27 Oct 2026)
- [ ] Show the process in the video if time allows: design brief, the agent building through the Lens Studio MCP, LEAF runs (`lens/devpost/build-notes.md`)
- [ ] Submit from one Representative's account; prizes are paid to the Representative

## Open questions

- Team size has no stated limit; one Representative submits.
- Prizes: $1,250 / $750 / $500 cash, subject to winner affidavit and tax forms (W-8BEN for non-US residents). Whether payment to India works is still to confirm with the hackathon manager.
- Feel on real glasses: reading distance of the text stack, reach of the chips, hand-tracking reliability. Nothing here was tried on a device.
