import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { check, fromEye, goToScenario, has, setLifeSize, tap, textOf } from "./PivotTestUtils";

const CONTROLS = ["Mode target", "Scenario switch target", "Size target", "Next step target", "Timeline handle", "Gate chip 1", "Gate chip 2"];
const LABELS = ["Scenario Title", "PIVOT No-fit Label", "Route Verdict Label", "Gate Detail Label", "Fix tag label 1"];

/** Design rules: everything within reach of the eye, on a model of the room, with the numbers on the thing they describe. */
@component
export class PivotMoveTableScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    await setLifeSize(false);

    // The room is a model on a table about a metre ahead and a little below the eye.
    const stage = findSceneObjectByName("Stage").getTransform();
    check(Math.abs(stage.getWorldScale().x - 0.1) < 0.001, "the room is a tenth of its size on the table", stage.getWorldScale().toString());
    const table = fromEye("Stage");
    check(table.z < -90 && table.z > -140 && table.y < 0 && table.y > -40, "the table is 0.9 to 1.4 m ahead and below eye level", table.toString());

    // Every control and label sits inside the narrow field of view, 0.6 to 1.6 m away.
    for (const name of CONTROLS.concat(LABELS)) {
      const p = fromEye(name);
      check(Math.abs(p.x) <= 36 && Math.abs(p.y) <= 28 && p.z <= -60 && p.z >= -160, name + " is inside the glasses' view and reach", p.toString());
    }

    // The tight spot is annotated where it is: lines and numbers at the gap, and the whole move drawn as a trail.
    await goToScenario(2);
    await sleep(8000);
    check(findSceneObjectByName("Callout label 1").enabled && has(textOf("Callout label 1"), "2.5 CM"), "gap label on the left jamb", textOf("Callout label 1"));
    check(findSceneObjectByName("Callout label 2").enabled, "gap label on the right jamb");
    let trail = 0;
    for (let i = 0; i < 7; i++) if (findSceneObjectByName("Trail " + i).enabled) trail++;
    check(trail === 7, "seven ghost frames show the whole move", String(trail));

    // Life size: the same room at 1:1, one pinch.
    await tap("Size target");
    await sleep(500);
    check(Math.abs(stage.getWorldScale().x - 1) < 0.001, "life size is 1:1");
    check(has(textOf("Size label"), "MODEL SIZE"), "and the button offers the model again", textOf("Size label"));
    await setLifeSize(false);
    check(Math.abs(stage.getWorldScale().x - 0.1) < 0.001, "back to the model");
  }
}
