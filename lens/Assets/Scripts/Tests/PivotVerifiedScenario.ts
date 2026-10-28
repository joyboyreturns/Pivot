import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, step, tap, textOf } from "./PivotTestUtils";

/** Verified versus unverified: a gate with a measured hall says VERIFIED STEP, one without says UNVERIFIED MANEUVER. */
@component
export class PivotVerifiedScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(4);
    check(has(textOf("Route Verdict Label"), "2 STEPS UNVERIFIED") === true, "Route Verdict Label contains 2 STEPS UNVERIFIED = true", textOf("Route Verdict Label"));
    check(has(textOf("Gate chip label 3"), "FLAT DOOR") === true, "Gate chip label 3 contains FLAT DOOR = true", textOf("Gate chip label 3"));
    expect(findSceneObjectByName("Gate chip 3").enabled).toBe(true);

    await tap("Gate chip 2");
    await sleep(1700);
    check(has(textOf("Doorway Dimensions"), "LIFT DOOR") === true, "Doorway Dimensions contains LIFT DOOR = true", textOf("Doorway Dimensions"));
    check(has(textOf("Unverified Maneuver Label"), "EVERY STEP CHECKED") === true, "Unverified Maneuver Label contains EVERY STEP CHECKED = true", textOf("Unverified Maneuver Label"));
    await step(3);
    check(has(textOf("Unverified Maneuver Label"), "VERIFIED STEP") === true, "Unverified Maneuver Label contains VERIFIED STEP = true", textOf("Unverified Maneuver Label"));
    check(has(textOf("Unverified Maneuver Label"), "UNVERIFIED") === false, "Unverified Maneuver Label contains UNVERIFIED = false", textOf("Unverified Maneuver Label"));

    await tap("Gate chip 3");
    await sleep(1700);
    check(has(textOf("Unverified Maneuver Label"), "UNVERIFIED MANEUVER") === true, "Unverified Maneuver Label contains UNVERIFIED MANEUVER = true", textOf("Unverified Maneuver Label"));
    await step(1);
    check(has(textOf("Unverified Maneuver Label"), "UNVERIFIED MANEUVER") === true, "Unverified Maneuver Label contains UNVERIFIED MANEUVER = true", textOf("Unverified Maneuver Label"));
    check(has(textOf("Unverified Maneuver Label"), "TURN IT 90 DEGREES") === true, "Unverified Maneuver Label contains TURN IT 90 DEGREES = true", textOf("Unverified Maneuver Label"));
  }
}
