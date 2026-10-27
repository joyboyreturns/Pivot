import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import type { PivotManeuver } from "../PivotManeuver";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";

export const SCENARIO_COUNT = 7;

export function textOf(name: string): string {
  return (findSceneObjectByName(name).getComponent("Component.Text3D") as Text3D).text;
}

export async function tap(name: string): Promise<void> {
  const target = findInteractablesByName(name, undefined, true)[0];
  if (!target) throw new Error(name + " is unavailable");
  await new DefaultLeafInteractor().trigger(target);
}

/** Pinch the scenario switch until scenario `n` (1-based) is showing, then let the analysis scan finish. */
export async function goToScenario(n: number): Promise<void> {
  // The tests drive the ghost themselves, so switch off the hands-free replay.
  const maneuver = findSceneObjectByName("PIVOT Maneuver").getComponent("Component.ScriptComponent") as unknown as PivotManeuver;
  maneuver.autoPlay = false;
  for (let i = 0; i <= SCENARIO_COUNT && textOf("Scenario Title").indexOf(n + "/") !== 0; i++) {
    await tap("Scenario switch target");
    await sleep(300);
  }
  expect(textOf("Scenario Title").indexOf(n + "/") === 0).toBe(true);
  await sleep(1700);
}

/** Pinch the next-step arrow `count` times and let the ghost settle. */
export async function step(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await tap("Next step target");
    await sleep(200);
  }
  await sleep(1800);
}

export const sofaRoot = () => findSceneObjectByName("Sofa illustration");

export function has(text: string, part: string): boolean {
  return text.indexOf(part) >= 0;
}

/** Like expect(...).toBe(true), but the failure names what was being checked and what was seen. */
export function check(condition: boolean, what: string, seen?: string): void {
  if (!condition) throw new Error("CHECK FAILED: " + what + (seen !== undefined ? " (saw: " + seen.replace(/\n/g, " | ") + ")" : ""));
}
