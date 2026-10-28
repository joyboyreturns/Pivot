import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import type { PivotAnalysis } from "../PivotAnalysis";
import { check, goToScenario, has, tap, textOf } from "./PivotTestUtils";

const analysis = () => findSceneObjectByName("PIVOT Analysis").getComponent("Component.ScriptComponent") as unknown as PivotAnalysis;

/** Pull the edges of the object and the gate by hand: the numbers, the verdict and the handles follow. */
@component
export class PivotHandlesScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const a = analysis();
    check(has(textOf("Route Verdict Label"), "BLOCKED AT FLAT DOOR"), "the old flat blocks the sofa", textOf("Route Verdict Label"));
    check(findSceneObjectByName("Handle 0").enabled && findSceneObjectByName("Handle 3").enabled, "handles show on the object and the door");
    check(!findSceneObjectByName("Param plus 1").enabled, "no steppers yet: nothing is being edited");

    // Pulling the right jamb out to 50 cm from the middle makes the door 100 cm wide, and the sofa goes through.
    check(a.dragHandle("gate:width", new vec3(50, 102.5, 0)), "the door width handle exists");
    await sleep(500);
    check(has(textOf("Scenario Title"), "YOUR MOVE"), "grabbing an edge takes over the scenario", textOf("Scenario Title"));
    check(has(textOf("Param label 1"), "WIDTH 100"), "the door is now 100 cm wide", textOf("Param label 1"));
    check(has(textOf("Route Verdict Label"), "ROUTE CLEAR") || has(textOf("Route Verdict Label"), "ROUTE FITS"), "and the route opens", textOf("Route Verdict Label"));
    check(has(textOf("Handle label"), "100 CM"), "the handle reads out the number", textOf("Handle label"));
    const jamb = findSceneObjectByName("Handle 3").getTransform().getWorldPosition();
    const edge = a.stageToWorld(new vec3(50, 102.5, 0));
    check(jamb.sub(edge).length < 0.2, "the handle sits on the new edge", jamb.sub(edge).toString());

    // Pull the door back in: the sofa jams again.
    check(a.dragHandle("gate:width", new vec3(40, 102.5, 0)), "and back");
    await sleep(500);
    check(has(textOf("Param label 1"), "WIDTH 80"), "door is 80 cm again", textOf("Param label 1"));
    check(has(textOf("Route Verdict Label"), "BLOCKED"), "and blocks again", textOf("Route Verdict Label"));

    // Dragging past the limits stops at them.
    check(a.dragHandle("gate:height", new vec3(0, 900, 0)), "the lintel handle exists");
    await sleep(400);
    check(has(textOf("Param label 2"), "HEIGHT 300"), "height stops at 3 m", textOf("Param label 2"));
    check(a.dragHandle("gate:height", new vec3(0, 205, 0)), "back down");
    await sleep(400);

    // The room in front: the hall handle sets how far back the sofa may swing.
    check(a.dragHandle("gate:hallDepth", new vec3(-115, 3, 310)), "the hall handle exists");
    await sleep(400);
    check(has(textOf("Param label 3"), "HALL DEPTH 310"), "hall depth follows the handle", textOf("Param label 3"));

    // The object has handles too: pull the sofa's end in to make it 20 cm shorter.
    const before = textOf("Sofa Dimensions");
    check(a.dragHandle("box:length", new vec3(95, 45, 55)), "the sofa length handle exists");
    await sleep(400);
    check(textOf("Sofa Dimensions") !== before && has(textOf("Sofa Dimensions"), "190"), "the sofa is 190 cm long", textOf("Sofa Dimensions"));

    // An L-turn has handles on both halls.
    await tap("Mode target");
    await sleep(900);
    await goToScenario(5);
    check(a.dragHandle("gate:outWidth", new vec3(170, 15, 100)), "the hall handle exists on an L-turn");
    await sleep(500);
    check(has(textOf("Param label 2"), "HALL OUT 170"), "the second hall is 170 cm wide", textOf("Param label 2"));
    check(a.dragHandle("gate:inWidth", new vec3(-100, 15, -150)), "and the first hall");
    await sleep(500);
    check(has(textOf("Param label 1"), "HALL IN 150"), "the first hall is 150 cm wide", textOf("Param label 1"));
  }
}
