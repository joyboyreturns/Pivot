import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import type { PivotAnalysis } from "../PivotAnalysis";
import { TOUR, tourSeconds } from "../PivotTour";
import { check, goToScenario, has, tap, textOf } from "./PivotTestUtils";

const analysis = () => findSceneObjectByName("PIVOT Analysis").getComponent("Component.ScriptComponent") as unknown as PivotAnalysis;
const title = () => textOf("Scenario Title");
const result = () => textOf("PIVOT No-fit Label");

/** Seconds into the tour at which beat `i` begins. */
const beatStart = (i: number) => TOUR.slice(0, i).reduce((sum, beat) => sum + beat.hold, 0);

/** The three-minute tour, in real time: every beat shows what it promises, inside its window, and the tour ends by itself. */
@component
export class PivotTourScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(500);
    await goToScenario(1);
    const a = analysis();
    check(tourSeconds() > 120 && tourSeconds() < 175, "the tour fits a three-minute video with room for a title and an outro", `${tourSeconds()} s`);
    check(textOf("Tour label").indexOf("TOUR") === 0 && !a.touring, "the Tour button is on screen and the tour is idle", textOf("Tour label"));

    await tap("Tour target");
    const began = getTime();
    check(a.touring && has(textOf("Tour label"), "STOP TOUR"), "pinching Tour starts it and the button turns into Stop", textOf("Tour label"));

    // Wait for a beat's state to show up: not before the beat starts, and no later than 5 s after it ends.
    const beat = async (i: number, what: string, done: () => boolean, seen: () => string) => {
      const from = began + beatStart(i) - 1;
      const by = began + beatStart(i) + TOUR[i].hold + 5;
      while (getTime() < by) {
        if (getTime() >= from && done()) return;
        await sleep(250);
      }
      check(false, `beat ${i + 1}: ${what}`, seen());
    };
    const summary = () => `${title()} | ${result()} | ${textOf("Scenario Story")}`;

    await beat(0, "the blocked sofa is captioned", () => has(textOf("Scenario Story"), "Can it get there") && has(result(), "DOES NOT FIT"), summary);
    await beat(1, "the fix is pinched and the door goes to 86", () => has(title(), "YOUR MOVE") && has(textOf("Param label 1"), "WIDTH 86") && has(result(), "FITS · 1 CM"), summary);
    await beat(2, "the door fits but the hall has no room to turn", () => has(title(), "3/12") && has(result(), "NO ROOM TO TURN"), summary);
    await beat(3, "the hallway corner fits", () => has(title(), "5/12") && has(result(), "FITS"), summary);
    await beat(4, "life size is on", () => has(textOf("Size label"), "MODEL SIZE"), summary);
    await beat(5, "back at model size, the wardrobe goes by lift", () => has(title(), "4/12") && has(textOf("Size label"), "LIFE SIZE") && has(result(), "FITS"), summary);
    await beat(6, "the gallery crate is blocked at the side entrance", () => has(title(), "9/12") && has(result(), "DOES NOT FIT"), summary);
    await beat(7, "the other route lets it through", () => has(title(), "GALLERY LOADING") && has(result(), "FITS"), summary);
    const verdict = () => textOf("Route Verdict Label");
    await beat(8, "the bench fits by millimetres but is too close to confirm at the stated error", () => has(title(), "10/12") && has(result(), "MM TO SPARE") && has(verdict(), "TOO CLOSE TO CONFIRM AT ±5 MM"), () => `${summary()} | ${verdict()}`);
    await beat(9, "the double doors hold with the same error", () => has(title(), "DOUBLE DOORS") && has(verdict(), "HOLDS WITH ±5 MM ERROR"), () => `${summary()} | ${verdict()}`);
    await beat(10, "the flight case", () => has(title(), "8/12") && has(result(), "FITS"), summary);
    await beat(11, "the aquarium", () => has(title(), "11/12") && has(result(), "FITS"), summary);
    await beat(12, "the load is swapped on the same route", () => has(title(), "YOUR MOVE") && !has(title(), "AQUARIUM"), summary);
    await beat(13, "back to the studio sofa", () => has(title(), "1/12") && has(result(), "DOES NOT FIT"), summary);
    await beat(14, "the door edge is pulled out and the sofa goes through", () => has(title(), "YOUR MOVE") && has(textOf("Param label 1"), "WIDTH 100") && has(result(), "FITS"), () => `${summary()} | ${textOf("Param label 1")}`);
    await beat(15, "the closing line over the widened door", () => has(title(), "2/12") && has(textOf("Scenario Story"), "before you lift it"), summary);

    const end = began + tourSeconds() + 6;
    while (a.touring && getTime() < end) await sleep(250);
    check(!a.touring && has(textOf("Tour label"), "TOUR ›"), "the tour ends by itself and the button comes back", textOf("Tour label"));
    const took = getTime() - began;
    check(took < tourSeconds() + 6, "the tour keeps to its script", `${took.toFixed(1)} s of ${tourSeconds()} s`);

    // A hand takes over: pinching any control stops the tour and clears its caption.
    await tap("Tour target");
    await sleep(3000);
    check(a.touring && has(textOf("Scenario Story"), "Can it get there"), "a second tour starts from the top", textOf("Scenario Story"));
    await tap("Scenario switch target");
    await sleep(800);
    check(!a.touring && has(textOf("Tour label"), "TOUR ›"), "pinching a control hands the Lens back", textOf("Tour label"));
    check(!has(textOf("Scenario Story"), "Can it get there"), "and the caption goes", textOf("Scenario Story"));
    await sleep(600);
    check(has(title(), "2/12"), "the scenario the wearer chose is the one on screen", title());
  }
}
