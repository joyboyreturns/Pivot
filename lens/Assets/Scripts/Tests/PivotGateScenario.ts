import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { goToScenario, has, tap, textOf } from "./PivotTestUtils";

/** Gate chips: pinching a chip shows that gate at its own size, with its own result and the bottleneck marked. */
@component
export class PivotGateScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(2);
    expect(has(textOf("Gate chip label 2"), "◆")).toBe(true);
    expect(has(textOf("Gate chip label 2"), "›")).toBe(true);
    expect(has(textOf("Doorway Dimensions"), "0.95")).toBe(true);
    await tap("Gate chip 1");
    await sleep(1700);
    expect(has(textOf("Doorway Dimensions"), "1.00")).toBe(true);
    expect(has(textOf("Gate chip label 1"), "›")).toBe(true);
    expect(has(textOf("PIVOT No-fit Label"), "FITS · 10 CM TO SPARE")).toBe(true);
    expect(findSceneObjectByName("Doorway left wall").getTransform().getLocalPosition().x).toBeCloseTo(-80, 1);

    await goToScenario(3);
    expect(has(textOf("PIVOT No-fit Label"), "NO ROOM TO TURN")).toBe(true);
    expect(has(textOf("Gate Detail Label"), "TURNING SWEEPS") || has(textOf("PIVOT No-fit Label"), "HALL 1.20 M")).toBe(true);
    expect(has(textOf("PIVOT No-fit Label"), "TURN NEEDS 2.28 M")).toBe(true);
    await tap("Gate chip 1");
    await sleep(1700);
    expect(has(textOf("PIVOT No-fit Label"), "FITS")).toBe(true);
  }
}
