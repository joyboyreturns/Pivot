import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { PivotScenario } from "./PivotScenario";
import { PivotScrubScenario } from "./PivotScrubScenario";
import { PivotSceneScenario } from "./PivotSceneScenario";

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    { id: "pivot-scene", typename: PivotSceneScenario.getTypeName() },
    { id: "pivot-analysis-and-step", typename: PivotScenario.getTypeName() },
    { id: "pivot-scrub", typename: PivotScrubScenario.getTypeName() },
  ];
}
