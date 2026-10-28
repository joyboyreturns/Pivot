import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, goToScenario, has, tap, textOf, SCENARIO_COUNT } from "./PivotTestUtils";

/** Any object, any place: your-move mode swaps objects and places, edits every number and builds routes. */
@component
export class PivotYourMoveScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    // What would make it fit, on the curated scenario.
    check(has(textOf("Fix tag label 1"), "WIDEN TO 85"), "widen fix tag", textOf("Fix tag label 1"));
    check(has(textOf("Fix tag label 2"), "5 CM LOWER"), "legs fix tag", textOf("Fix tag label 2"));
    check(has(textOf("Route Verdict Label"), "SHRINK TO 94%"), "scale line", textOf("Route Verdict Label"));
    check(!findSceneObjectByName("Param plus 1").enabled, "steppers are hidden in scenario mode");

    // Pinching a fix tag tries it: the door is widened to 85 cm and the whole route turns clear.
    await tap("Fix tag 1");
    await sleep(1700);
    check(has(textOf("Scenario Title"), "YOUR MOVE"), "a fix tag opens your-move mode", textOf("Scenario Title"));
    check(has(textOf("Route Verdict Label"), "ROUTE CLEAR") || has(textOf("Route Verdict Label"), "ROUTE FITS"), "and the widened door lets the sofa through", textOf("Route Verdict Label"));
    await tap("Mode target");
    await sleep(900);
    check(has(textOf("Scenario Title"), "1/" + SCENARIO_COUNT), "back to the scenarios", textOf("Scenario Title"));

    await tap("Mode target");
    await sleep(1700);
    check(has(textOf("Scenario Title"), "YOUR MOVE · 3-SEAT SOFA"), "sandbox title", textOf("Scenario Title"));
    check(has(textOf("Route Verdict Label"), "BLOCKED AT FRONT DOOR"), "old flat blocks the sofa", textOf("Route Verdict Label"));
    check(findSceneObjectByName("Param plus 1").enabled, "steppers show in your-move mode");
    check(has(textOf("Param label 1"), "WIDTH 80"), "door width row", textOf("Param label 1"));
    check(has(textOf("Scenario switch label"), "NEXT PLACE"), "switch now changes place", textOf("Scenario switch label"));

    await tap("Param plus 1");
    await sleep(400);
    check(has(textOf("Param label 1"), "WIDTH 81"), "plus widens by 1 cm", textOf("Param label 1"));
    await tap("Param minus 1");
    await sleep(400);
    check(has(textOf("Param label 1"), "WIDTH 80"), "minus narrows by 1 cm", textOf("Param label 1"));

    await tap("Scenario switch target");
    await sleep(600);
    check(has(textOf("Route Verdict Label"), "ROUTE FITS") || has(textOf("Route Verdict Label"), "ROUTE CLEAR"), "new build lets the sofa through", textOf("Route Verdict Label"));
    check(has(textOf("Gate chip label 2"), "HALL TURN"), "second gate is the hall turn", textOf("Gate chip label 2"));

    await tap("Object target");
    await sleep(600);
    check(has(textOf("Scenario Title"), "ARMCHAIR"), "next object", textOf("Scenario Title"));
    await tap("Object chip");
    await sleep(400);
    check(has(textOf("Param label 1"), "LENGTH 85"), "object rows show its sizes", textOf("Param label 1"));
    await tap("Param plus 1");
    await sleep(400);
    check(has(textOf("Param label 1"), "LENGTH 86"), "object length can be edited", textOf("Param label 1"));
    check(has(textOf("Sofa Dimensions"), "86 X 90 X 85") || has(textOf("Sofa Dimensions"), "86 X"), "object label follows the edit", textOf("Sofa Dimensions"));

    // Build a longer route and take a gate away again.
    await tap("Gate add target");
    await sleep(600);
    check(findSceneObjectByName("Gate chip 3").enabled, "a third gate was added");
    await tap("Gate add target");
    await sleep(400);
    check(has(textOf("Gate add label"), "3 GATES MAX"), "the add button says when the route is full", textOf("Gate add label"));
    await tap("Gate remove target");
    await sleep(600);
    check(!findSceneObjectByName("Gate chip 3").enabled, "and removed");

    // Next place: the lift move starts at the lobby door.
    await tap("Scenario switch target");
    await sleep(600);
    check(has(textOf("Gate chip label 1"), "LOBBY DOOR"), "lift move starts with the lobby door", textOf("Gate chip label 1"));
    check(has(textOf("Gate chip label 2"), "LIFT"), "and then the lift", textOf("Gate chip label 2"));

    await tap("Mode target");
    await sleep(1700);
    check(has(textOf("Scenario Title"), "1/" + SCENARIO_COUNT), "back to the scenarios", textOf("Scenario Title"));
    check(!findSceneObjectByName("Param plus 1").enabled, "steppers hidden again");
  }
}
