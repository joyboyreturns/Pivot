import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { goToScenario, has, SCENARIO_COUNT, tap, textOf } from "./PivotTestUtils";

const VERDICTS = ["ROUTE BLOCKED", "ROUTE CLEAR", "ROUTE BLOCKED", "ROUTE CLEAR", "ROUTE FITS, ONLY JUST", "ROUTE BLOCKED", "ROUTE CLEAR"];

/** Scenario switcher: pinching cycles all scenarios, each with the verdict the planner gives, and wraps round. */
@component
export class PivotSwitchScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    for (let i = 1; i <= SCENARIO_COUNT; i++) {
      expect(textOf("Scenario Title").indexOf(i + "/" + SCENARIO_COUNT) === 0).toBe(true);
      expect(has(textOf("Route Verdict Label"), VERDICTS[i - 1])).toBe(true);
      expect(textOf("Scenario Story").length > 30).toBe(true);
      await tap("Scenario switch target");
      await sleep(400);
    }
    expect(textOf("Scenario Title").indexOf("1/" + SCENARIO_COUNT) === 0).toBe(true);
  }
}
