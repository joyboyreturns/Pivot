import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, tap, textOf } from "./PivotTestUtils";

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
    check(box.enabled, "box.enabled");
    check(!((findSceneObjectByName("Sofa model").getComponent("Component.RenderMeshVisual") as RenderMeshVisual).enabled), "(findSceneObjectByName('Sofa model').getComponent('Component.RenderMeshVisual') as RenderMeshVisual).enabled");
    const min = box.worldAabbMin();
    const max = box.worldAabbMax();
    expect(max.x - min.x).toBeCloseTo(203, 0);
    expect(max.y - min.y).toBeCloseTo(30, 0);
    expect(max.z - min.z).toBeCloseTo(152, 0);

    await goToScenario(7);
    check(has(textOf("Route Verdict Label"), "ROUTE CLEAR"), "has(textOf('Route Verdict Label'), 'ROUTE CLEAR')");
    check(has(textOf("Doorway Dimensions"), "CORRIDOR"), "has(textOf('Doorway Dimensions'), 'CORRIDOR')");
    await tap("Gate chip 1");
    await sleep(500);
    check(has(textOf("PIVOT No-fit Label"), "FITS"), "has(textOf('PIVOT No-fit Label'), 'FITS')");
  }
}
