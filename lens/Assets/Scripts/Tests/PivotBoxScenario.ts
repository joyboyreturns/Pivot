import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, setLifeSize, tap, textOf } from "./PivotTestUtils";

/** Elevator and low-ceiling corridor scenarios use a plain box for the object, drawn at its real size. */
@component
export class PivotBoxScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(6);
    check(has(textOf("Route Verdict Label"), "BLOCKED AT LIFT"), "has(textOf('Route Verdict Label'), 'BLOCKED AT LIFT')");
    check(has(textOf("PIVOT No-fit Label"), "DOES NOT FIT"), "has(textOf('PIVOT No-fit Label'), 'DOES NOT FIT')");
    check(has(textOf("Doorway Dimensions"), "CABIN 1.10 × 1.40 × 2.30"), "has(textOf('Doorway Dimensions'), 'CABIN 1.10 × 1.40 × 2.30')");
    const box = findSceneObjectByName("Box model").getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    check(!box.enabled, "solid model hides the bounding-box fill at rest");
    check(findSceneObjectByName("Object craft 0").enabled, "recognizable solid parts are visible");
    check(!((findSceneObjectByName("Sofa model").getComponent("Component.RenderMeshVisual") as RenderMeshVisual).enabled), "(findSceneObjectByName('Sofa model').getComponent('Component.RenderMeshVisual') as RenderMeshVisual).enabled");
    await setLifeSize(true);
    const dimensions = box.getSceneObject().getTransform().getLocalScale();
    expect(dimensions.x).toBeCloseTo(203, 0);
    expect(dimensions.y).toBeCloseTo(30, 0);
    expect(dimensions.z).toBeCloseTo(152, 0);

    await setLifeSize(false);
    await goToScenario(7);
    check(has(textOf("Route Verdict Label"), "ROUTE CLEAR"), "has(textOf('Route Verdict Label'), 'ROUTE CLEAR')");
    check(has(textOf("Doorway Dimensions"), "CORRIDOR"), "has(textOf('Doorway Dimensions'), 'CORRIDOR')");
    await goToScenario(9);
    check(has(textOf("Route Verdict Label"), "ROUTE BLOCKED"), "art crate blocks the side entrance");
    await tap("Gate add target");
    await sleep(1700);
    check(has(textOf("Route Verdict Label"), "ROUTE CLEAR"), "loading route clears the same crate");
    check(has(textOf("Sofa Dimensions"), "ART CRATE"), "route comparison preserves the object");
    await tap("Gate add target");
    await sleep(1700);
    check(has(textOf("Route Verdict Label"), "ROUTE BLOCKED"), "comparison can return to the original route");
    await tap("Object target");
    await sleep(1700);
    check(has(textOf("Scenario Title"), "YOUR MOVE"), "object swap enters editable mode");
    check(has(textOf("Gate chip label 1"), "SIDE ENTRANCE"), "object swap keeps the measured route");
    await tap("Mode target");
    await goToScenario(7);
    await tap("Gate chip 1");
    await sleep(500);
    check(has(textOf("PIVOT No-fit Label"), "FITS"), "has(textOf('PIVOT No-fit Label'), 'FITS')");
  }
}
