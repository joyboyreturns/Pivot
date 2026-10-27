import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, setLifeSize, textOf } from "./PivotTestUtils";

/** Done criterion 1: real-scale sofa and doorway with labels, the route verdict and the gate chips. */
@component
export class PivotSceneScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const sofa = findSceneObjectByName("Sofa model").getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    // On the move table the room is a tenth of its size; at life size it is 210 x 85 x 90 cm.
    const small = sofa.worldAabbMax().x - sofa.worldAabbMin().x;
    expect(small).toBeCloseTo(21, 0);
    await setLifeSize(true);
    const min = sofa.worldAabbMin();
    const max = sofa.worldAabbMax();
    expect(max.x - min.x).toBeCloseTo(210, 0);
    expect(max.y - min.y).toBeCloseTo(85, 0);
    expect(max.z - min.z).toBeCloseTo(90, 0);
    await setLifeSize(false);
    check(findSceneObjectByName("Sofa Dimensions").enabled, "findSceneObjectByName('Sofa Dimensions').enabled");
    check(findSceneObjectByName("Doorway Dimensions").enabled, "findSceneObjectByName('Doorway Dimensions').enabled");
    check(has(textOf("Doorway Dimensions"), "0.80"), "has(textOf('Doorway Dimensions'), '0.80')");
    check(findSceneObjectByName("Restriction left").enabled, "findSceneObjectByName('Restriction left').enabled");
    check(findSceneObjectByName("Restriction right").enabled, "findSceneObjectByName('Restriction right').enabled");
    check(!(findSceneObjectByName("Analysis scan").enabled), "findSceneObjectByName('Analysis scan').enabled");
    check(has(textOf("Route Verdict Label"), "BLOCKED AT FLAT DOOR"), "has(textOf('Route Verdict Label'), 'BLOCKED AT FLAT DOOR')");
    check(has(textOf("Scenario Story"), "third-floor"), "has(textOf('Scenario Story'), 'third-floor')");
    check(findSceneObjectByName("Gate chip 1").enabled, "findSceneObjectByName('Gate chip 1').enabled");
    check(findSceneObjectByName("Gate chip 2").enabled, "findSceneObjectByName('Gate chip 2').enabled");
    check(!(findSceneObjectByName("Gate chip 3").enabled), "findSceneObjectByName('Gate chip 3').enabled");
  }
}
