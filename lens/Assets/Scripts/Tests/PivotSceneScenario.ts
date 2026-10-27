import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { goToScenario, has, textOf } from "./PivotTestUtils";

/** Done criterion 1: real-scale sofa and doorway with labels, the route verdict and the gate chips. */
@component
export class PivotSceneScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const sofa = findSceneObjectByName("Sofa model").getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    const min = sofa.worldAabbMin();
    const max = sofa.worldAabbMax();
    expect(max.x - min.x).toBeCloseTo(210, 0);
    expect(max.y - min.y).toBeCloseTo(85, 0);
    expect(max.z - min.z).toBeCloseTo(90, 0);
    expect(findSceneObjectByName("Sofa Dimensions").enabled).toBe(true);
    expect(findSceneObjectByName("Doorway Dimensions").enabled).toBe(true);
    expect(has(textOf("Doorway Dimensions"), "0.80")).toBe(true);
    expect(findSceneObjectByName("Restriction left").enabled).toBe(true);
    expect(findSceneObjectByName("Restriction right").enabled).toBe(true);
    expect(findSceneObjectByName("Analysis scan").enabled).toBe(false);
    expect(has(textOf("Route Verdict Label"), "BLOCKED AT FLAT DOOR")).toBe(true);
    expect(has(textOf("Scenario Story"), "third-floor studio")).toBe(true);
    expect(findSceneObjectByName("Gate chip 1").enabled).toBe(true);
    expect(findSceneObjectByName("Gate chip 2").enabled).toBe(true);
    expect(findSceneObjectByName("Gate chip 3").enabled).toBe(false);
  }
}
