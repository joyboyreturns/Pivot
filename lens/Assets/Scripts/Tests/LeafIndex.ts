import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { PivotScenario } from "./PivotScenario";
import { PivotScrubScenario } from "./PivotScrubScenario";
import { PivotSceneScenario } from "./PivotSceneScenario";
import { PivotSwitchScenario } from "./PivotSwitchScenario";
import { PivotGateScenario } from "./PivotGateScenario";
import { PivotVerifiedScenario } from "./PivotVerifiedScenario";
import { PivotCornerScenario } from "./PivotCornerScenario";
import { PivotBoxScenario } from "./PivotBoxScenario";
import { PivotAutoplayScenario } from "./PivotAutoplayScenario";
import { PivotYourMoveScenario } from "./PivotYourMoveScenario";
import { PivotMoveTableScenario } from "./PivotMoveTableScenario";

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    { id: "pivot-scene", typename: PivotSceneScenario.getTypeName() },
    { id: "pivot-analysis-and-step", typename: PivotScenario.getTypeName() },
    { id: "pivot-scrub", typename: PivotScrubScenario.getTypeName() },
    { id: "pivot-scenario-switch", typename: PivotSwitchScenario.getTypeName() },
    { id: "pivot-gate-chips", typename: PivotGateScenario.getTypeName() },
    { id: "pivot-verified-vs-unverified", typename: PivotVerifiedScenario.getTypeName() },
    { id: "pivot-corner-turn", typename: PivotCornerScenario.getTypeName() },
    { id: "pivot-box-and-lift", typename: PivotBoxScenario.getTypeName() },
    { id: "pivot-autoplay", typename: PivotAutoplayScenario.getTypeName() },
    { id: "pivot-your-move", typename: PivotYourMoveScenario.getTypeName() },
    { id: "pivot-move-table", typename: PivotMoveTableScenario.getTypeName() },
  ];
}
