import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { goToScenario } from "./PivotTestUtils";

/** Done criterion 3: dragging the rail scrubs the maneuver forwards and backwards. */
@component
export class PivotScrubScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(2);
    const sofa = findSceneObjectByName("Sofa illustration");
    const before = sofa.getTransform().getLocalPosition().z;
    const handle = findInteractablesByName("Timeline handle", undefined, true)[0];
    if (!handle) throw new Error("Timeline handle is unavailable");
    await new DefaultLeafInteractor().drag(handle, new vec3(40, 0, 0), 1000);
    await sleep(1500);
    const advanced = sofa.getTransform().getLocalPosition().z;
    expect(advanced < before).toBe(true);
    await new DefaultLeafInteractor().drag(handle, new vec3(-40, 0, 0), 1000);
    await sleep(1500);
    expect(sofa.getTransform().getLocalPosition().z > advanced).toBe(true);
  }
}
