import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import type { PivotManeuver } from "../PivotManeuver";
import { check, goToScenario, has, sofaRoot, tap, textOf } from "./PivotTestUtils";

/** Hands-free flow: after the analysis the ghost plays the whole maneuver by itself; a pinch takes over. */
@component
export class PivotAutoplayScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const maneuver = findSceneObjectByName("PIVOT Maneuver").getComponent("Component.ScriptComponent") as unknown as PivotManeuver;
    maneuver.autoPlay = true;
    await tap("Scenario switch target");
    await sleep(600);
    check(textOf("Scenario Title").indexOf("2/") === 0, "moved to scenario 2", textOf("Scenario Title"));
    const sofa = sofaRoot();
    const start = sofa.getTransform().getLocalPosition().z;
    await sleep(9000);
    const end = sofa.getTransform().getLocalPosition().z;
    check(end < start - 80, "ghost carried itself through the doorway without any pinch", `${start} -> ${end}`);
    check(has(textOf("Unverified Maneuver Label"), "VERIFIED STEP"), "ends on a verified step", textOf("Unverified Maneuver Label"));
    const rail = findSceneObjectByName("Timeline handle").getTransform().getLocalPosition().x;
    expect(rail > -25).toBe(true);

    // A pinch takes over: switching scenario and stepping once stops the replay at that step.
    await tap("Scenario switch target");
    await sleep(2200);
    await tap("Next step target");
    await sleep(3500);
    const held = sofa.getTransform().getLocalPosition().z;
    await sleep(3000);
    check(Math.abs(sofa.getTransform().getLocalPosition().z - held) < 1, "after a pinch the replay stays where the wearer left it");
    maneuver.autoPlay = false;
  }
}
