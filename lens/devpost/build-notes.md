# Build notes

How PIVOT was built, for the Technical Implementation criterion and the disclosure the rules ask for.

## Process
1. **Brief.** `design-brief.md` states the one spatial moment, where things live, hands and input, and the done criteria; it grew an update note when the project moved from one doorway to whole routes.
2. **Planner first.** The planning logic is pure TypeScript in `src/planner` with Vitest tests (78), so it can be proven outside Lens Studio and synced into the project (`npm run sync`). The Lens only draws what the plan says.
3. **Lens built through the Lens Studio MCP.** The agent worked in the open project using the MCP tools, not by editing files blind:
   - `scene-graphql` and `VirtualScene` to duplicate objects, rename, wire script inputs (`startScenario`, materials, meshes) and save;
   - `asset-graphql` and `QueryRuntimeSceneTool` to read materials and live scene state;
   - `RecompileTypeScriptTool` and `RunAndCollectLogsTool` after every change, reading the log for errors;
   - `CapturePanelScreenshotTool`, `MovePreviewCamera` and `PreviewInteractTool` to look at every scenario, walk round the gate and pinch, drag and hover;
   - `ExecuteEditorCode` to save the project.
4. **LEAF.** Twelve scenarios under `Assets/Scripts/Tests` drive the Lens with SIK interactions and assert on labels, positions and scale (scene and scale, no-fit and stepping, scrub, scenario switch, gate chips, verified versus unverified, corner turn, box and lift, hands-free replay, your-move sandbox, dragging the edge handles, the move table's placement and callouts). A failure message names the check and what was seen.

## Redesign against the design rules
After a first working version (flat labels at 5 m, small chips) the Lens was re-read against the SPECS design habits and rebuilt: a 1:10 model on a table 1.1 m ahead and below eye level, numbers on the thing they describe, a trail of the whole move, fix tags you can pinch, few large targets. All placement numbers are in `PivotLayout.ts`; `PivotMoveTableScenario` asserts that every control and label is inside the view and reach.

## Things the tooling taught us
- The Interactive Preview's simulated hand accepted one pinch per refresh; LEAF's interactor is the reliable way to test repeated pinches.
- A control that disappears under a pinch (the "+ Gate" button at the gate limit) hangs LEAF's trigger and feels broken on a device; controls now stay put and say why they do nothing.
- Collider size matters when controls sit close together: `TapInteraction` takes a `colliderSize` input so 9 cm spaced chips do not overlap.

## Disclosure of pre-existing and third-party material
- Written during the Submission Period (first commit 27 Oct 2026): everything under `src/`, `tests/`, `scripts/`, and the Lens scripts `PivotAnalysis.ts`, `PivotGateView.ts`, `PivotManeuver.ts`, `PivotSandbox.ts`, `Tests/*`, the scene setup and the planner copy in `Assets/Scripts/Planner`.
- Adapted from Snap's SPECS interaction recipes: `TapInteraction.ts` and `DragInteraction.ts` (Apache-2.0 headers kept).
- Libraries and assets: Spectacles Interaction Kit, LEAF, the Interior Props package (the sofa mesh), Lens Studio default Text3D materials.
- No third-party SDKs, APIs or data. No music.
