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
3. The handle guide line and a cyan handle show in almost every scenario even with the mouse elsewhere; I did not establish whether that is the preview's simulated hand hovering them or a stale hover state.
4. 10/12 reads "FITS - 0 CM TO SPARE" for a route the story calls "only just". Not checked whether the planner value rounds from a small positive number; worth a look before the demo.

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
