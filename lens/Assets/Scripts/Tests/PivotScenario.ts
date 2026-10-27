import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";

@component
export class PivotScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(2500);
    const label = findSceneObjectByName("PIVOT No-fit Label").getComponent("Component.Text3D") as Text3D;
    expect(label.getSceneObject().enabled).toBe(true);
    expect(label.text.includes("DOES NOT FIT")).toBe(true);
    const sofa = findSceneObjectByName("Sofa illustration");
    const before = sofa.getTransform().getLocalPosition().z;
    const arrow = findInteractablesByName("Next step target", undefined, true)[0];
    if (!arrow) throw new Error("Next step target is unavailable");
    await new DefaultLeafInteractor().trigger(arrow);
    await sleep(1500);
    expect(sofa.getTransform().getLocalPosition().z < before).toBe(true);
    const warning = findSceneObjectByName("Unverified Maneuver Label").getComponent("Component.Text3D") as Text3D;
    expect(warning.text.includes("UNVERIFIED")).toBe(true);
    const switchDoor = findInteractablesByName("Change doorway target", undefined, true)[0];
    if (!switchDoor) throw new Error("Change doorway target is unavailable");
    await new DefaultLeafInteractor().trigger(switchDoor);
    await sleep(300);
    expect(label.text.includes("BOX POSE FITS")).toBe(true);
    expect(label.text.includes("PATH NOT VERIFIED")).toBe(true);
    expect(findSceneObjectByName("Doorway left wall").getTransform().getLocalPosition().x).toBeCloseTo(-77.5, 1);
    await sleep(300);
    await new DefaultLeafInteractor().trigger(arrow);
    await sleep(1500);
    expect(sofa.getTransform().getLocalRotation().w < 0.99).toBe(true);
    await new DefaultLeafInteractor().trigger(switchDoor);
    await sleep(300);
    expect(label.text.includes("DOES NOT FIT")).toBe(true);
  }
}
