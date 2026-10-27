import { planRoute, scenarios, minDoorwayWidth } from "./Planner/index";
import type { Gate, Plan, RoutePlan, Scenario } from "./Planner/index";
import { TapInteraction } from "./TapInteraction";
import { GateView, TONES, toneFor } from "./PivotGateView";
import type { Tone } from "./PivotGateView";

const CM = 100;
const SCAN_START = 0.5;
const SCAN_END = 1.6;
const MAX_CHIPS = 3;

/** Wrap text on spaces; the Text3D has no wrapping of its own at this size. */
function wrap(text: string, width: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > width) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

const cm = (m: number) => `${Math.round(Math.abs(m) * 100)} CM`;
const metres = (m: number) => `${m.toFixed(2)} M`;

export function describeGateShort(gate: Gate): string {
  switch (gate.kind) {
    case "doorway":
      return `DOORWAY ${gate.width.toFixed(2)} × ${gate.height.toFixed(2)} m`;
    case "corridor":
      return `CORRIDOR ${gate.width.toFixed(2)} wide × ${gate.height.toFixed(2)} high × ${gate.length.toFixed(1)} long`;
    case "elevator":
      return `LIFT DOOR ${gate.door.width.toFixed(2)} × ${gate.door.height.toFixed(2)} · CABIN ${gate.cabin.width.toFixed(2)} × ${gate.cabin.depth.toFixed(2)} × ${gate.cabin.height.toFixed(2)} m`;
    case "corner":
      return `L-TURN ${gate.inWidth.toFixed(2)} in · ${gate.outWidth.toFixed(2)} out · CEILING ${gate.height.toFixed(2)} m`;
  }
}

@component
export class PivotAnalysis extends BaseScriptComponent {
  @input result!: Text3D;
  @input scan!: SceneObject;
  @input restrictionLeft!: SceneObject;
  @input restrictionRight!: SceneObject;
  @input doorLeft!: SceneObject;
  @input doorRight!: SceneObject;
  @input doorLintel!: SceneObject;
  @input doorDimensions!: Text3D;
  @input switchDoor!: TapInteraction;
  @input switchVisual!: RenderMeshVisual;
  @input boxMesh!: RenderMesh;
  @input wallMaterial!: Material;
  @input glowMaterial!: Material;
  @input ghostPanelMaterial!: Material;
  /** Index of the scenario shown first (0 = studio sofa). */
  @input startScenario: number = 0;

  private elapsed = 0;
  private finished = false;
  private scanEnd = SCAN_END;
  private view!: GateView;
  private chips: { target: TapInteraction; object: SceneObject; marker: RenderMeshVisual; material: Material; label: Text3D }[] = [];
  private titleText!: Text3D;
  private storyText!: Text3D;
  private verdictText!: Text3D;
  private detailText!: Text3D;
  private switchMaterial!: Material;
  private root!: SceneObject;
  private stage!: SceneObject;

  public scenarioIndex = 0;
  public gateIndex = 0;
  public scenario: Scenario = scenarios[0];
  public route!: RoutePlan;
  public currentPlan!: Plan;
  public currentGate!: Gate;
  /** Bumps whenever the scenario or the selected gate changes, so the maneuver restarts. */
  public revision = 0;

  private find(name: string): SceneObject {
    const search = (o: SceneObject): SceneObject | null => {
      if (o.name === name) return o;
      for (let i = 0; i < o.getChildrenCount(); i++) {
        const hit = search(o.getChild(i));
        if (hit) return hit;
      }
      return null;
    };
    const hit = search(this.root);
    if (!hit) throw new Error("Scene object not found: " + name);
    return hit;
  }

  private text(name: string): Text3D {
    return this.find(name).getComponent("Component.Text3D") as Text3D;
  }

  public selectScenario(index: number): void {
    this.scenarioIndex = ((index % scenarios.length) + scenarios.length) % scenarios.length;
    this.scenario = scenarios[this.scenarioIndex];
    this.route = planRoute(this.scenario.box, this.scenario.gates);
    const start = this.route.firstBlockedIndex >= 0 ? this.route.firstBlockedIndex : this.route.bottleneckIndex;
    this.selectGate(Math.max(0, start), false);
    this.restartScan(0.9);
  }

  public selectGate(index: number, restartScan = true): void {
    this.gateIndex = Math.max(0, Math.min(this.route.gates.length - 1, index));
    const entry = this.route.gates[this.gateIndex];
    this.currentGate = entry.gate;
    this.currentPlan = entry.plan;
    this.revision++;
    this.refresh();
    if (restartScan) this.restartScan(0.7);
  }

  private restartScan(seconds: number): void {
    if (!this.finished) return;
    this.finished = false;
    this.elapsed = SCAN_START - 0.2;
    this.scanEnd = SCAN_START + seconds;
    this.result.getSceneObject().enabled = false;
  }

  private gateTone(plan: Plan): Tone {
    if (plan.reason === "approach") return "blocked";
    return toneFor(plan.clearance);
  }

  private resultText(gate: Gate, plan: Plan): string {
    const verified = plan.verified ? "ALL STEPS CHECKED" : "SOME STEPS UNVERIFIED";
    if (plan.fits) {
      const pass = plan.steps[plan.bottleneckIndex];
      const where = gate.kind === "corner" ? "SWING THROUGH THE CORNER" : pass.kind === "pass" ? "TIGHTEST AT THE GATE" : "TIGHTEST WHILE TURNING";
      return `FITS · ${cm(plan.clearance)} TO SPARE\n${where}\n${verified}`;
    }
    if (plan.reason === "approach") {
      const need = plan.approachNeeded;
      return `OPENING OK, NO ROOM TO TURN\n${gate.kind !== "corner" && gate.approach ? `HALL ${metres(gate.approach.depth)} · TURN NEEDS ${need ? metres(need.depth) : "MORE"}` : ""}\nNOT CHECKED BEYOND THIS`;
    }
    return `DOES NOT FIT\nBEST POSE IS ${cm(plan.clearance)} TOO TIGHT\nNO ORIENTATION WORKS`;
  }

  private detailTextFor(gate: Gate, plan: Plan): string {
    if (!plan.fits && plan.reason === "gate" && (gate.kind === "doorway" || gate.kind === "corridor")) {
      const need = minDoorwayWidth(this.scenario.box, gate.height);
      if (need) return `NEEDS A DOORWAY ≥ ${cm(need.width)} · THIS ONE ${cm(gate.width)}`;
    }
    if (plan.turn) return `TIGHTEST ${Math.abs(Math.round(plan.turn.tightestAngle))}° INTO THE TURN${plan.turn.tipped ? " · LAID ON ITS BACK" : ""}`;
    if (plan.approachNeeded) return `TURNING SWEEPS ${metres(plan.approachNeeded.depth)} DEEP × ${metres(plan.approachNeeded.height)} HIGH`;
    return "";
  }

  private refresh(): void {
    const s = this.scenario;
    const route = this.route;
    const gate = this.currentGate;
    const plan = this.currentPlan;

    this.titleText.text = `${this.scenarioIndex + 1}/${scenarios.length}  ${s.title.toUpperCase()}`;
    this.storyText.text = wrap(s.story, 52);
    const limiting = route.gates[route.bottleneckIndex];
    const verdictHead =
      route.verdict === "blocked"
        ? `ROUTE BLOCKED AT ${route.gates[route.firstBlockedIndex].gate.name.toUpperCase()}`
        : route.verdict === "tight"
          ? `ROUTE FITS, ONLY JUST · ${limiting.gate.name.toUpperCase()} ${cm(route.clearance)}`
          : `ROUTE CLEAR · TIGHTEST ${limiting.gate.name.toUpperCase()} ${cm(route.clearance)}`;
    const verifiedLine = route.fits ? (route.verified ? "EVERY STEP CHECKED" : `${route.unverifiedSteps} STEPS UNVERIFIED`) : "";
    this.verdictText.text = verifiedLine ? `${verdictHead}\n${verifiedLine}` : verdictHead;

    this.view.show(gate, plan, this.gateTone(plan));
    const stage = this.stage.getTransform();
    const plan3d = gate.kind === "corner";
    stage.setLocalPosition(plan3d ? new vec3(45, 45, -300) : vec3.zero());
    stage.setLocalRotation(plan3d ? quat.angleAxis(62 * Math.PI / 180, vec3.right()) : quat.quatIdentity());
    this.doorDimensions.text = describeGateShort(gate);
    this.result.text = this.resultText(gate, plan);
    this.detailText.text = this.detailTextFor(gate, plan);

    for (let i = 0; i < MAX_CHIPS; i++) {
      const chip = this.chips[i];
      const entry = route.gates[i];
      chip.object.enabled = !!entry;
      chip.label.getSceneObject().enabled = !!entry;
      if (!entry) continue;
      const tone = this.gateTone(entry.plan);
      chip.material.mainPass.baseColor = TONES[tone];
      const selected = i === this.gateIndex;
      const bottleneck = i === route.bottleneckIndex ? "◆ " : "";
      chip.label.text = `${selected ? "› " : ""}${i + 1} ${bottleneck}${entry.gate.name.toUpperCase()}`;
      chip.marker.getSceneObject().getTransform().setLocalScale(selected ? new vec3(5.5, 5.5, 5.5) : new vec3(3.5, 3.5, 3.5));
    }
    this.layout();
  }

  /** Place the floating UI relative to the scene; everything sits in front of the gate at comfortable reading distance. */
  private layout(): void {
    const place = (name: string, x: number, y: number, z: number) => this.find(name).getTransform().setLocalPosition(new vec3(x, y, z));
    const gate = this.currentGate;
    place("Scenario Title", 0, 246, 200);
    place("Scenario Story", 0, 233, 200);
    place("Route Verdict Label", 0, 215, 200);
    for (let i = 0; i < MAX_CHIPS; i++) {
      place(`Gate chip ${i + 1}`, -84, 203 - i * 9, 195);
      place(`Gate chip label ${i + 1}`, -63, 203 - i * 9, 195);
    }
    place("Scenario switch target", 72, 246, 195);
    place("Scenario switch label", 50, 246, 195);
    place("PIVOT No-fit Label", 0, 172, 200);
    place("Gate Detail Label", 0, 152, 200);
    place("Unverified Maneuver Label", 0, 138, 200);
    place("Doorway Dimensions", 0, gate.kind === "corner" ? 118 : 192, gate.kind === "corner" ? 120 : 190);
  }

  onAwake(): void {
    this.root = this.getSceneObject().getParent()!;
    this.createEvent("OnStartEvent").bind(() => {
      this.titleText = this.text("Scenario Title");
      this.storyText = this.text("Scenario Story");
      this.verdictText = this.text("Route Verdict Label");
      this.detailText = this.text("Gate Detail Label");
      this.titleText.size = 190;
      this.storyText.size = 95;
      this.verdictText.size = 140;
      this.detailText.size = 120;
      // Everything that is physically in the room hangs off one stage, so an L-turn can be tipped toward the viewer like a plan.
      this.stage = global.scene.createSceneObject("Stage");
      this.stage.setParent(this.root);
      this.find("Doorway").setParent(this.stage);
      this.find("Sofa illustration").setParent(this.stage);
      this.view = new GateView(
        this.stage,
        { left: this.doorLeft, right: this.doorRight, lintel: this.doorLintel, restrictionLeft: this.restrictionLeft, restrictionRight: this.restrictionRight },
        this.boxMesh,
        { wall: this.wallMaterial, glow: this.glowMaterial, ghost: this.ghostPanelMaterial }
      );
      for (let i = 0; i < MAX_CHIPS; i++) {
        const object = this.find(`Gate chip ${i + 1}`);
        const target = object.getComponent("Component.ScriptComponent") as unknown as TapInteraction;
        const marker = object.getChild(0).getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        const material = marker.mainMaterial.clone();
        marker.mainMaterial = material;
        const label = this.text(`Gate chip label ${i + 1}`);
        label.size = 110;
        this.chips.push({ target, object, marker, material, label });
        const index = i;
        target.onTap.add(() => {
          if (index < this.route.gates.length) this.selectGate(index);
        });
      }
      this.switchMaterial = this.switchVisual.mainMaterial.clone();
      this.switchVisual.mainMaterial = this.switchMaterial;
      this.switchDoor.onHoverStart.add(() => { this.switchMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.switchDoor.onHoverEnd.add(() => { this.switchMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.switchDoor.onTap.add(() => this.selectScenario(this.scenarioIndex + 1));
      this.text("Scenario switch label").text = "NEXT SCENARIO ›";
      this.result.getSceneObject().enabled = false;
      this.scan.enabled = false;
      this.selectScenario(this.startScenario);
      this.finished = false;
      this.elapsed = 0;
      this.scanEnd = SCAN_END;
    });

    this.createEvent("UpdateEvent").bind(() => {
      if (this.finished) return;
      this.elapsed += getDeltaTime();
      const span = this.scanEnd - SCAN_START;
      if (this.elapsed >= SCAN_START && this.elapsed < this.scanEnd) {
        this.scan.enabled = true;
        const progress = (this.elapsed - SCAN_START) / span;
        const h = this.currentGate.kind === "corner" ? 100 : this.currentGate.kind === "elevator" ? this.currentGate.door.height * CM : (this.currentGate as { height: number }).height * CM;
        const w = this.currentGate.kind === "corner" ? 160 : this.currentGate.kind === "elevator" ? this.currentGate.door.width * CM : (this.currentGate as { width: number }).width * CM;
        this.scan.getTransform().setLocalScale(new vec3(w, 2, 2));
        this.scan.getTransform().setLocalPosition(new vec3(0, 20 + (h - 20) * progress, 10));
      } else if (this.elapsed >= this.scanEnd) {
        this.scan.enabled = false;
        this.result.getSceneObject().enabled = true;
        this.finished = true;
      }
    });
  }
}
