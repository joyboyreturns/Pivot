import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import type { PivotAnalysis } from "../PivotAnalysis";
import { check, goToScenario, has, tap, textOf } from "./PivotTestUtils";

const analysis = () => findSceneObjectByName("PIVOT Analysis").getComponent("Component.ScriptComponent") as unknown as PivotAnalysis;

/**
 * The workshop bench: it fits by 4 mm as measured, but that is too close to confirm if the measurements can be 5 mm out.
 * The double doors hold with the same error. Widening the hall flips the corner once it clears the stated error.
 */
@component
export class PivotToleranceScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(10);
    const verdict = () => textOf("Route Verdict Label");
    const detail = () => textOf("Gate Detail Label");
    check(has(textOf("PIVOT No-fit Label"), "FITS · 4 MM TO SPARE"), "as measured it still fits by 4 mm", textOf("PIVOT No-fit Label"));
    check(has(verdict(), "TOO CLOSE TO CONFIRM AT ±5 MM"), "the route is too close to confirm at the stated error", verdict());
    check(has(detail(), "AT ±5 MM: 8 MM SHORT"), "the corner is 8 mm short once the error is allowed for", detail());

    // The workshop door has room to spare either way.
    await tap("Gate chip 1");
    await sleep(1700);
    check(has(detail(), "AT ±5 MM: 4 CM LEFT"), "the door keeps 4 cm with the error", detail());
    await tap("Gate chip 2");
    await sleep(1700);

    // Widening the hall by a centimetre is not enough; two is.
    const a = analysis();
    check(a.dragHandle("gate:outWidth", new vec3(111, 15, 100)), "the hall handle exists on the L-turn");
    await sleep(600);
    check(has(textOf("Scenario Title"), "YOUR MOVE"), "grabbing the hall takes over the scenario", textOf("Scenario Title"));
    check(has(verdict(), "TOO CLOSE TO CONFIRM AT ±5 MM"), "1 cm wider is still too close", verdict());
    check(has(detail(), "AT ±5 MM: 3 MM SHORT"), "and 3 mm short", detail());
    check(a.dragHandle("gate:outWidth", new vec3(112, 15, 100)), "the hall handle moves again");
    await sleep(600);
    check(has(verdict(), "HOLDS WITH ±5 MM ERROR"), "2 cm wider holds with the error", verdict());
    check(has(detail(), "AT ±5 MM: 2 MM LEFT"), "with 2 mm to spare", detail());

    // The other route holds with room to spare.
    await tap("Mode target");
    await sleep(900);
    await goToScenario(10);
    await tap("Gate add target");
    await sleep(1700);
    check(has(textOf("Scenario Title"), "DOUBLE DOORS"), "the double doors are showing", textOf("Scenario Title"));
    check(has(verdict(), "HOLDS WITH ±5 MM ERROR"), "the double doors hold with the error", verdict());
    check(has(detail(), "AT ±5 MM: 15 CM LEFT"), "and keep 15 cm", detail());

    // No error is stated for the other scenarios, so they say nothing about it.
    await goToScenario(2);
    check(!has(verdict(), "±") && !has(detail(), "±"), "other scenarios carry no tolerance line", verdict() + " | " + detail());
  }
}
