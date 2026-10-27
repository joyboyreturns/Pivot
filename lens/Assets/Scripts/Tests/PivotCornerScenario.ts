import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, sofaRoot, step, textOf } from "./PivotTestUtils";

/** L-shaped hallway: the doorway frame gives way to the hall plan, the sofa swings round the corner, the marker shows the slack. */
@component
export class PivotCornerScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(5);
    check(has(textOf("Doorway Dimensions"), "L-TURN"), "has(textOf('Doorway Dimensions'), 'L-TURN')");
    check(has(textOf("Route Verdict Label"), "ONLY JUST"), "has(textOf('Route Verdict Label'), 'ONLY JUST')");
    check(has(textOf("PIVOT No-fit Label"), "1 CM TO SPARE"), "has(textOf('PIVOT No-fit Label'), '1 CM TO SPARE')");
    check(has(textOf("Gate Detail Label"), "47° INTO THE TURN"), "has(textOf('Gate Detail Label'), '47° INTO THE TURN')");
    check(!(findSceneObjectByName("Doorway left wall").enabled), "findSceneObjectByName('Doorway left wall').enabled");
    check(!(findSceneObjectByName("Restriction left").enabled), "findSceneObjectByName('Restriction left').enabled");
    const hall = findSceneObjectByName("Gate panel 0");
    check(hall.enabled, "hall.enabled");
    const sofa = sofaRoot();
    const start = sofa.getTransform().getLocalPosition();
    await step(5);
    const end = sofa.getTransform().getLocalPosition();
    check(end.x > start.x + 150, "end.x > start.x + 150");
    check(end.z > start.z + 150, "end.z > start.z + 150");
    // Its length now runs north-south: it has swung a quarter turn about the vertical.
    const along = sofa.getTransform().getLocalRotation().multiplyVec3(vec3.right());
    check(Math.abs(along.z) > 0.95 && Math.abs(along.x) < 0.2, "sofa length axis runs along z after the swing", along.toString());
    check(has(textOf("Unverified Maneuver Label"), "VERIFIED STEP"), "has(textOf('Unverified Maneuver Label'), 'VERIFIED STEP')");
  }
}
