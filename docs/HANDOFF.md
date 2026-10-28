# Continuation brief — 28 October 2026

## Objective
Build on PIVOT for the Learn AR with SPECS hackathon: significantly better visual presentation, multiple objects and scenarios, trustworthy planning, and verified interactions. The owner authorized creative improvements and asked for a continuation prompt before usage runs out. No submission, public publishing, account changes or commits were requested.

Read AGENTS.md, CLAUDE.md, ARCHITECTURE.md and PLAN.md. Keep the planner pure and deterministic, metres/degrees. Preserve the existing spatial model and pinch interaction; no floating screen UI. Scope cuts remain room scanning, object recognition and full six-axis planning. Use the repo owner's identity for any later authorized commit; no attribution trailers.

## Existing work to preserve
The initial checkout had untracked PIVOT/, Specs/, lens/.claude/, lens/agent/, and editor state files. Those were not created by this improvement pass. Do not delete, overwrite or accidentally stage them. The tracked primary Lens is lens/lens.esproj.

## Changes in this working tree
- 12 curated scenarios, 17 object presets, 9 place presets. Added touring flight case/backstage, gallery art crate, workshop bench, empty aquarium, delivery crate/passenger lift. Existing seven scenarios retain their indices.
- Pure choices.ts compares measured route alternatives, with deterministic ranking and no recommendation if all block. Gallery, workshop and cargo scenarios have alternatives.
- Lens reuses existing spatial targets: Object target swaps the object while preserving the route; Gate add target compares alternative routes outside sandbox mode, adds gates inside it. Comparisons can return to the original blocked route.
- PivotObjectModel builds pooled stylized parts for non-sofa objects using a shared material palette. Solid models turn into a bounding ghost during playback. Existing sofa asset remains.
- Result label shortened, font hierarchy reduced, story limited to two lines, moving annotation kept below the route summary. Blocked plans hide trail; successful trails are lighter. Playback ghosts tint coral when blocked.
- Single-axis turning sweeps use exact sinusoidal vertex extrema rather than only ten-degree samples. Public multi-axis sweep fallback is still sampled; planner rotation chains are single-axis segments.
- Playback turns wholly in front of the door plane, then slides entirely through it using object-dependent distances.
- Corner fit incorporates its initial lay-down sweep; a low-ceiling regression now correctly blocks instead of advertising a fit with an unverified collision.
- Fix suggestions are reapplied and confirmed with the full planner. Combined opening and hall-depth changes are labelled together; partial fixes are filtered out.
- Invalid measurements/search steps throw RangeError. Non-finite parameter edits return the original value. Empty routes return maxScale 0. Route pose comfort threshold now matches its tight threshold by default.
- Scale calculation cached across gate selection; comfortable-pose search skips higher-effort candidates.
- LEAF scenario count now derives from the library. Existing switch scenario covers all 12; box scenario also tests alternate-route reversal and route-preserving object swap.
- README, architecture and pitch/demo outline updated. Generalized cache/workspace ignores. No commits made.

## Verification
- npm install: passed.
- npm test: 107/107 passed, seven test files.
- npm run typecheck: passed.
- npm run sync: passed, 18 planner sources copied to lens/Assets/Scripts/Planner.
- git diff --check: passed.
- Lens Studio TypeScript compilation succeeded at 16:13:17.254 local time after the current source changes.
- Baseline pivot-scene passed before changes at 16:09:56.491. Expanded revision LEAF rerun was being started; do not infer that all scenarios pass from the earlier baseline.
- Baseline screenshot: /private/tmp/pivot-baseline.png. Improved screenshot: /private/tmp/pivot-improved.png. Both inspected: result/route/ghost text no longer overlap in the blocked sofa view; heavy blocked trail removed. Need inspect new object models and alternative routes visually.

## Live editor access
Correct project already open in the mounted application /Volumes/Lens Studio/Lens Studio.app, version 5.23.2.26081320, SPECS 27 Interactive Preview. A second /Applications/Lens Studio.app instance has an unrelated empty Project.esproj in a Default folder. The owner explicitly approved switching to PIVOT; no user work was discarded or scene saved. Use the mounted instance that owns lens.

Lens Studio MCP tools were absent from the prior session, including the sub-agent. Native application control succeeded. The LEAF panel can discover all 12 registered scenarios and run them in Preview despite 'Not Connected' (that means no physical device). Window also exposes Run Editor Code; editor API references must be read before using it. Do not bypass MCP with raw HTTP.

Log file for this running instance:
/Users/vincent/Library/Preferences/Snap/Lens Studio/logs/LensStudioLog-2026-10-28-16-05-45-720-803c6.txt
Read bounded recent slices, or filter PASSED/FAILED/CHECK FAILED and compilation diagnostics. Older transient missing-export errors occurred before planner sync. Physical-device adb timeouts and plugins requiring 5.24 are environment warnings; do not mislabel those as planner bugs. No actual glasses testing has occurred.

## Next actions
1. Finish running the 12 existing LEAF scenarios in the GUI. Prioritize pivot-scenario/scene, pivot-switch, pivot-box-and-lift (includes new comparisons), pivot-move-table, pivot-corner-turn, pivot-verified-vs-unverified, pivot-your-move and handles. Read actual LeafIndex.ts for exact scenario IDs. Fix real failures and rerun affected tests.
2. Inspect the new flight case, crate, bench, aquarium and appliance models, both at rest and ghost playback. Check labels and controls across alternatives and sandbox, not only the default sofa.
3. Several existing LEAF assertions may still assume old wording/positions. Update stale assertions only when the product behavior is correct; do not weaken checks to hide failures. In particular the box now hides its solid bounding fill at rest and uses Object craft child meshes instead.
4. Review pose and corridor playback limits honestly: the model checks gate cross-sections and sampled corner sweeps, not handling forces, weight, continuous global motion between gates, wall thickness while tilting, exit-side reorientation, or real sensing. No bug-free guarantee.
5. Finish visual polish, optional sound cues, refreshed screenshot/demo assets, then record the under-three-minute working demo. Submission/publication remain owner's decision.
6. Re-read the official hackathon page before submission. Deadline currently 9 November 2026, 5 PM EST. Judging equally considers Design, Technical Implementation, Innovation and Presentation; no winning guarantee.

## Session 2 notes (28 October 2026, afternoon)

- Access: no Lens Studio MCP tools and no computer-use tools were available in this session, so nothing could be run in the GUI from here. The log shows a run at 16:16-16:17 that this session did not start.
- That run: PASSED pivot-scene, pivot-scenario-switch, pivot-box-and-lift, pivot-move-table, pivot-scrub. FAILED pivot-analysis-and-step, pivot-gate-chips, pivot-verified-vs-unverified. The other four (autoplay, corner-turn, your-move, handles) had no result in the log yet.
- Cause of the three failures: the result label was shortened (no more "ALL STEPS CHECKED", "TOO TIGHT", "HALL ... TURN NEEDS ..."), so the assertions were stale, not the product. Updated them to the current wording: "5 CM SHORT"; route verdict and maneuver label for "EVERY STEP CHECKED"; the detail label for "TURNING SWEEPS" and "2.28 M DEEP". Converted the touched assertions to `check` so a rerun names what it saw.
- Lens Studio compiled the edited tests (TypeScript compilation succeeded 16:18:34). The three edited scenarios have NOT been rerun; treat them as unverified until they are.
- One risk to look at on rerun: pivot-verified-vs-unverified now reads "EVERY STEP CHECKED" from the maneuver label after a chip tap, which only shows while the ghost is at rest. If hands-free replay has started by then, it will fail for timing, not behavior.

## Session 3 notes (28 October 2026, 16:20-16:35)

### Access
- No Lens Studio MCP tools existed in this session. Lens Studio (/Volumes/Lens Studio/Lens Studio.app, the one that owns lens.esproj) was driven through computer use: clicking the LEAF panel and the Preview targets. No raw HTTP was used.
- The LEAF panel was too narrow to show its Run buttons; I dragged the panel splitters (UI layout only). The project still shows `lens*` as it did on arrival; nothing was saved.

### LEAF results (Preview, run all 12 in "PIVOT regression" at 16:22)
PASSED: pivot-scene, pivot-scenario-switch, pivot-box-and-lift, pivot-move-table, pivot-analysis-and-step, pivot-scrub, pivot-gate-chips, pivot-verified-vs-unverified, pivot-corner-turn, pivot-autoplay, pivot-your-move, pivot-handles. No FAILED or CHECK FAILED lines, and no `E`/exception lines in the log for the run.
- The three edited scenarios (analysis-and-step, gate-chips, verified-vs-unverified) now pass, so the earlier failures were stale wording, as suspected. The hands-free replay timing risk in verified-vs-unverified did not trigger in this run (it passed in 11.9 s); it is still timing based, so a flaky rerun is possible.
- Unit tests 107/107 and `npm run typecheck` pass. No source changes were made this session, so `npm run sync` was not needed.

### Visual inspection (Preview camera, mouse-driven pinch)
Looked at scenarios 4, 7, 8, 9 (blocked and "Try another route"), 10, 11 and 12, at the moment of switching and during hands-free replay.
- Gallery art crate (9, alternative route "Gallery loading"): solid slatted crate with art panel reads well at rest.
- Flight case (8), aquarium (11) and delivery crate (12): seen as the translucent playback ghost (blocked ones tinted coral) and the aquarium's glass box; I did not get a clean at-rest close-up of the flight case or bench.
- Alternative routes: "Try another route" switched the blocked side entrance to the gallery hall and the verdict changed to FITS 9 CM. Needed a second tap to register once; that looked like preview click timing, not confirmed.
- Not inspected: workbench model (10) at rest, appliance model, Swap object result (the tap did not visibly change the object in the one try), sandbox (Your move) controls with the new objects, life-size toggle for the new models.

### Issues seen, not fixed
1. FIXED (see "Session 3 fixes"): chip row covered by the hall-depth handle and limit bar.
2. FIXED (see "Session 3 fixes"): aquarium step label covered by the gate width handle. Not confirmed visually.
3. RESOLVED (not a bug, see "Session 4"): the cyan line and hexagon are the hall-limit bar and the "room to turn" handle.
4. FIXED in the working tree (see "Session 4"): "0 CM TO SPARE" wording on scenario 10.

### Still unverified or never tested
- Nothing has run on real glasses. Preview with mouse-simulated pinch only.
- Corridor/pose physics limits listed under "Next actions" item 4 above are unchanged.
- No sound cues, demo video or refreshed screenshots. Submission and publication remain the owner's decision.
- This is not a claim that the project is bug-free.

### Session 3 fixes (16:32-16:45)
- Cause of the chip overlap: the move table is 46 cm deep, so its front edge is at z = -83, and the gate chips, rail and arrow sat at z = -88, on the table. A hall 2.4 to 3 m deep ends at the table edge, so its floor limit bar and the "room to turn" handle landed on the chip row. Fix: `FRONT_Z = TABLE_Z + 27` in `PivotLayout.ts`; `tokenAt`, `tokenLabelAt`, `RAIL_AT` and `ARROW_AT` use it, so the row now sits just past the table edge. Hall depths above about 3 m (sandbox) can still reach the row.
- Cause of the aquarium overlap: the step label sits above the ghost, which for a 0.7 m object is about the gate's mid-height, where the width handle sits on the jamb. Fix: `PivotManeuver.clearOfHandles` lifts the label just above any gate handle it would touch (model view only; constants `LABEL_REACH`, `LABEL_CLEAR`).
- Re-run after the change: all 12 LEAF scenarios PASSED again (16:35; box-and-lift also alone at 16:40). Lens Studio recompiled cleanly. No planner change, so no sync; unit tests and typecheck were not affected.
- Visual check: the corridor scenario (7, 2.6 m hall) now shows the handle and its line clearly above the chip label. The gallery-loading route and the aquarium were not re-viewed after the fix (the Preview stopped responding to my clicks when Lens Studio was in the background), so those two are verified by reasoning and the passing tests only.
- Still open: items 3 and 4 above (always-on handle line; "0 CM" fit wording on scenario 10).

## Session 4 notes (28 October 2026, 16:45-16:55) - uncommitted

- The cyan floor line with a hexagon at its left end, seen in almost every scenario, is by design: `PivotGateView.approachBar` draws the limit of the room in front of the gate (260 cm wide, red when the turn is blocked) and the planner's hall-depth handle sits at its left end (x = -1.15 m). The handle's drag guide line only draws while a handle is hovered or dragged. No code change.
- Scenario 10 ("A millimetre matters"): the planner's route clearance is 0.40 cm (the corner scenario is 0.58 cm), a genuine fit, but the label rounded it to "0 CM TO SPARE". Added `lengthText` in `PivotLayout.ts` (millimetres under 1 cm, otherwise whole cm) and used it in `PivotAnalysis` (verdict, result, story), `PivotManeuver` (step spare) and `PivotStageFx` (corner tag). The corner LEAF assertion now expects "6 MM TO SPARE" instead of "1 CM TO SPARE"; the product is more precise, the check is not weaker.
- Lens Studio recompiled these edits cleanly (16:47:58). Unit tests 107/107 and typecheck pass; no planner change, so no sync.
- NOT verified: the LEAF run after this change, and the aquarium and gallery-route visual check. Lens Studio stopped accepting clicks from the control tool ("could not read which file this window is editing") right after the edit, so the rerun did not start. `pivot-corner-turn` is the one scenario expected to be affected (its wording changed); rerun all 12 by hand before committing.
- Nothing from this session is committed or pushed (the previous push was commit c8677f9).
- Retry at 17:00: both the background tools and full-screen control were refused by the control tool's guard ("could not verify which document this window is editing"), including after bringing Lens Studio to the front. Lens Studio's log has no entries after 16:48:00 except adb timeouts, no script errors, and the Preview frame has not changed since the 16:47 reload; the process sits at 145-175% CPU. I did not force-quit it because the project shows unsaved changes (`lens*`). The `lengthText` helper was checked outside Lens Studio: 0.40 cm -> "4 MM", 0.58 cm -> "6 MM", 5 cm -> "5 CM", 0 -> "0 CM". So the LEAF rerun and the aquarium / gallery visual checks are still pending, and whether the 16:47 reload left Lens Studio stuck or it is just busy is unknown.

## Session 5 notes (28 October 2026, 17:05-17:58) - uncommitted

### Access
Lens Studio MCP tools were available (`run_leaf_scenario`, `PreviewInteractTool`, `PreviewPanelTool`, `QueryRuntimeSceneTool`, `RecompileTypeScriptTool`); no raw HTTP and no GUI control tool was used. Newest log: `LensStudioLog-2026-10-28-17-02-19-847-e8b44.txt`. The scene and Project files were not saved; `git status` shows no `Scene.scene` or `.meta` changes.

### LEAF results (Preview)
- First pass on the code as handed over (17:22-17:27): all 12 PASSED.
- Final pass on the code below (17:45-17:58): all 12 PASSED, 0 FAILED / CHECK FAILED lines in the log. `pivot-handles` was aborted once at 17:54:37 by "Widget is not initialized" (right after "Handling authorized tokens", an environment event); the rerun PASSED at 17:57:55. Several runs take 25-47 s now and the MCP call times out on them while the scenario keeps running, so read results from the log, not the call result.
- `npm test` 107/107, `npm run typecheck` pass, `npm run sync` copied 18 files with no change under `src/planner` (no planner change this session).

### Visual checks (Preview screenshots via `PreviewPanelTool`)
- 9 blocked ("Art takes another route") and 9 after "Try another route" (Gallery loading): the cyan hall-limit bar and its handle sit above the chip row. The handle's lower point is within a few pixels of the first chip label ("LOADING DOOR") but covers nothing.
- 10 ("A millimetre matters"): reads "FITS · 4 MM TO SPARE", route line "BENCH CORNER 4 MM", corner tag "4 MM". No "0 CM".
- 11 aquarium: the gate width handle no longer covers the step label (the Session 3 fix holds).
- Workbench at rest and in playback, fridge-freezer in Your move (at rest and in playback), delivery crate, Swap object (works; the pinch call timed out but the swap applied and the scenario became "Your move"), sandbox steppers and chips with the new objects, object chip switching the steppers to LENGTH / HEIGHT / DEPTH.

### Fixes this session (all in `lens/Assets/Scripts`, Lens Studio compiled each cleanly)
1. Step label hidden by the wall (found on the aquarium): the label sat at the ghost's depth, which at the pass step is inside the 15 cm wall panels, so the text outside the opening vanished ("TURN" and "SPARE" cut off). `PivotManeuver.labelDepth` keeps it at z >= `LABEL_FRONT` (12) for doorway, corridor and lift gates. Verified: it now reads "NOW TURN IT 90 DEGREES: 28 CM TO SPARE".
2. Replay arrow unreachable at the end of playback: the timeline handle (16 cm wide) at the right end of the rail covered the arrow (x 19), and `PreviewInteractTool` reported "Blocked by Timeline handle". `ARROW_AT` is now at `RAIL_HALF + 13` (x 29), still inside the +-36 cm field. Verified: the arrow pinch works after playback ends.
3. Object name label ("WORKSHOP BENCH 160 X 90 X 75 CM") cut by the L-hall's outer wall: `PivotAnalysis.layout` now slides it along its line of sight to the eye (the origin) to just in front of the table edge, same place and apparent size on screen. Verified on scenario 10 and 1. (A first attempt in `PivotManeuver` was overridden by `layout`, which re-places that label; it was reverted.)
4. Route summary raised from y 6.5 to 8 so tall objects stop clipping its last line. Verified on scenario 1 and the sandbox; the fridge case was seen before the change, not after.
5. Sandbox detail callout ("TIGHTEST 45° INTO THE TURN") raised 3 cm (y -19 to -16) to sit above the L-hall width handle. Not re-viewed with an L-turn after this change; only the doorway sandbox was re-viewed. A first attempt (shifting it 5 cm right) pushed its long line off the display edge ("DEE" cut off) and was reverted; the LEAF suite did not catch that, so the display-edge limit is not asserted anywhere.

### Open readability problems (not fixed)
- Tall objects (fridge, wardrobe, bookcase, art crate) at rest fill the space between the table and the route summary at the fixed 1:10 scale. The white "EVERY STEP CHECKED / PINCH ARROW · PULL AN EDGE" hint sits on the pale model body and is hard to read (seen on the fridge and the bench). The step label is clamped to y <= -5, which keeps it below the summary but puts it on the object. A proper fix is a layout or scale decision (model scale per height, a different label place, or darker model colours), and the LEAF move-table checks assert the current scale, so I left it for the owner. `Text3D` has no outline or background setting.
- In the blocked door view the "UNVERIFIED MANEUVER / ILLUSTRATION ONLY" label is crossed by the red jamb lines (readable). On the aquarium the "14 CM" side numbers are crossed by the green jamb lines (readable). On the gallery crate the right width handle can sit over the "4.3 CM" side number during playback.
- The step label on L-turns ("CARRY IT DOWN THE HALL") can touch the hall-width handle.

### Still unverified
- Nothing has run on real glasses. Preview with simulated pinch only; no sound cues, demo video or refreshed screenshots.
- Not viewed at rest: flight case, wardrobe, washing machine, bookcase and other presets beyond the bench, fridge, crate and sofa. Life-size view with the new models. Fix 5 on an L-turn.
- The model checks gate cross-sections and sampled corner sweeps (Next actions item 4 above); this is not a claim that the project is bug-free.
- Nothing is committed or pushed (last push c8677f9). Working-tree changes: HANDOFF.md, PivotAnalysis.ts, PivotLayout.ts, PivotManeuver.ts, PivotStageFx.ts, Tests/PivotCornerScenario.ts.
