import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { goToScenario, has, sofaRoot, step, textOf } from "./PivotTestUtils";

/** Done criteria 2 and 3: the no-fit result, stepping with the arrow, and the fits result on the next scenario. */
@component
export class PivotScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const label = findSceneObjectByName("PIVOT No-fit Label");
    expect(label.enabled).toBe(true);
    expect(has(textOf("PIVOT No-fit Label"), "DOES NOT FIT")).toBe(true);
    expect(has(textOf("PIVOT No-fit Label"), "5 CM TOO TIGHT")).toBe(true);
    expect(has(textOf("Fix tag label 1"), "WIDEN TO 85")).toBe(true);
    const sofa = sofaRoot();
    const before = sofa.getTransform().getLocalPosition().z;
    await step(1);
    expect(sofa.getTransform().getLocalPosition().z < before).toBe(true);
    expect(has(textOf("Unverified Maneuver Label"), "UNVERIFIED MANEUVER")).toBe(true);
    expect(has(textOf("Unverified Maneuver Label"), "DOES NOT FIT")).toBe(true);

    await goToScenario(2);
    expect(has(textOf("PIVOT No-fit Label"), "FITS · 5 CM TO SPARE")).toBe(true);
    expect(has(textOf("PIVOT No-fit Label"), "ALL STEPS CHECKED")).toBe(true);
    expect(has(textOf("Route Verdict Label"), "ROUTE CLEAR")).toBe(true);
    expect(has(textOf("Unverified Maneuver Label"), "EVERY STEP CHECKED")).toBe(true);
    expect(findSceneObjectByName("Doorway left wall").getTransform().getLocalPosition().x).toBeCloseTo(-77.5, 1);
    await step(3);
    expect(sofa.getTransform().getLocalRotation().w < 0.99).toBe(true);
    expect(has(textOf("Unverified Maneuver Label"), "VERIFIED STEP")).toBe(true);
    expect(has(textOf("Unverified Maneuver Label"), "UNVERIFIED")).toBe(false);
    await goToScenario(1);
    expect(has(textOf("PIVOT No-fit Label"), "DOES NOT FIT")).toBe(true);
  }
}
