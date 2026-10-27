import { applyFix, planRoute, scenarios, suggestFixes, maxScale } from "./Planner/index";
import type { Fix, Gate, Plan, RoutePlan, Scenario } from "./Planner/index";
import { StageFx } from "./PivotStageFx";
import { TapInteraction } from "./TapInteraction";
import { GateView, TONES, toneFor } from "./PivotGateView";
import { Sandbox, wireButton } from "./PivotSandbox";
import { ARROW_AT, MODEL_SCALE, RAIL_AT, RAIL_HALF, SIZES, TABLE_TOP, TABLE_Z, W, textWidth, tokenAt, tokenLabelAt } from "./PivotLayout";
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
  private camera: SceneObject | null = null;
  private billboards: SceneObject[] = [];
  private sandbox!: Sandbox;
  private lifeSize = false;
  private fx!: StageFx;
  private fixes: Fix[] = [];
  private fixTags: { object: SceneObject; label: Text3D; hideAt: number }[] = [];
  private sizeLabel!: Text3D;
  private storyUntil = 0;
  private table: SceneObject | null = null;
  private switchLabel!: Text3D;

  public scenarioIndex = 0;
  public gateIndex = 0;
  public scenario: Scenario = scenarios[0];
  public route!: RoutePlan;
  public currentPlan!: Plan;
  public currentGate!: Gate;
  /** Bumps whenever the scenario or the selected gate changes, so the maneuver restarts. */
  public revision = 0;
  /** True once the analysis scan has finished and the result is showing. */
  public get ready(): boolean {
    return this.finished;
  }

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
    this.setScenario(scenarios[this.scenarioIndex], -1, true);
  }

  /** Show any scenario: a curated one or the sandbox's. `gateIndex` -1 picks the first blocked gate, else the bottleneck. */
  public setScenario(scenario: Scenario, gateIndex: number, scan: boolean): void {
    this.scenario = scenario;
    this.route = planRoute(scenario.box, scenario.gates);
    const start = this.route.firstBlockedIndex >= 0 ? this.route.firstBlockedIndex : this.route.bottleneckIndex;
    this.selectGate(gateIndex >= 0 ? gateIndex : Math.max(0, start), false);
    if (scan) {
      this.restartScan(0.9);
      this.storyUntil = getTime() + 7;
    }
  }

  /** Called by the sandbox after every edit. */
  public applySandbox(scenario: Scenario, gateIndex: number): void {
    this.setScenario(scenario, Math.min(gateIndex, scenario.gates.length - 1), false);
  }

  private toggleSandbox(): void {
    if (this.sandbox.active) {
      this.sandbox.exit();
      this.selectScenario(this.scenarioIndex);
    } else {
      this.sandbox.enter();
      this.restartScan(0.9);
    }
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
    if (plan.fits) return `FITS · ${cm(plan.clearance)} TO SPARE\n${verified}`;
    if (plan.reason === "approach") {
      const need = plan.approachNeeded;
      const hall = gate.kind !== "corner" && gate.approach ? `HALL ${metres(gate.approach.depth)} · TURN NEEDS ${need ? metres(need.depth) : "MORE"}` : "";
      return `NO ROOM TO TURN\n${hall}`;
    }
    return `DOES NOT FIT\nBEST POSE IS ${cm(plan.clearance)} TOO TIGHT`;
  }

  private detailTextFor(gate: Gate, plan: Plan): string {
    if (plan.turn) return wrap(`TIGHTEST ${Math.abs(Math.round(plan.turn.tightestAngle))}° INTO THE TURN${plan.turn.tipped ? " · LAID ON ITS BACK" : ""}`, 28);
    if (plan.approachNeeded) return wrap(`TURNING SWEEPS ${metres(plan.approachNeeded.depth)} DEEP × ${metres(plan.approachNeeded.height)} HIGH`, 28);
    return "";
  }

  /** Pinch a fix tag: apply that change and carry on in your-move mode to see it work and keep editing. */
  private tryFix(index: number): void {
    const fix = this.fixes[index];
    if (!fix) return;
    const after = applyFix(this.scenario.box, this.currentGate, fix);
    const gates = this.scenario.gates.map((g, i) => (i === this.gateIndex ? after.gate : g));
    this.sandbox.adopt(this.scenario.boxName, after.box, gates, this.gateIndex);
    this.restartScan(0.9);
  }

  private refresh(): void {
    const s = this.scenario;
    const route = this.route;
    const gate = this.currentGate;
    const plan = this.currentPlan;

    this.titleText.text = this.sandbox.active ? `YOUR MOVE · ${s.boxName.replace(/ \d+ x \d+ x \d+ cm$/, "").toUpperCase()}` : `${this.scenarioIndex + 1}/${scenarios.length}  ${s.title.toUpperCase()}`;
    this.storyText.text = wrap(s.story, 46);
    const limiting = route.gates[route.bottleneckIndex];
    const verdictHead =
      route.verdict === "blocked"
        ? `ROUTE BLOCKED AT ${route.gates[route.firstBlockedIndex].gate.name.toUpperCase()}`
        : route.verdict === "tight"
          ? `ROUTE FITS, ONLY JUST · ${limiting.gate.name.toUpperCase()} ${cm(route.clearance)}`
          : `ROUTE CLEAR · TIGHTEST ${limiting.gate.name.toUpperCase()} ${cm(route.clearance)}`;
    const verifiedLine = route.fits ? (route.verified ? "EVERY STEP CHECKED" : `${route.unverifiedSteps} STEPS UNVERIFIED`) : "";
    const scale = maxScale(s.box, s.gates);
    const scaleLine = scale >= 1 ? `THIS ROUTE ALLOWS UP TO ${Math.min(180, Math.round(scale * 100))}% OF THIS SIZE` : scale > 0 ? `SHRINK TO ${Math.round(scale * 100)}% OF THIS SIZE TO FIT` : "NO SIZE FITS THIS ROUTE";
    this.verdictText.text = [verdictHead, verifiedLine, scaleLine].filter((l) => l).join("\n");

    this.view.show(gate, plan, this.gateTone(plan));
    this.placeStage(gate);
    if (this.table) this.table.enabled = !this.lifeSize;
    this.fx.showTrail(s, plan, this.gateTone(plan));
    this.fx.showCallouts(s, gate, plan, this.gateTone(plan));
    this.doorDimensions.text = describeGateShort(gate);
    this.result.text = this.resultText(gate, plan);
    this.detailText.text = this.detailTextFor(gate, plan);
    this.fixes = plan.fits ? [] : suggestFixes(s.box, gate).slice(0, 2);
    this.fixTags.forEach((tag, i) => {
      const fix = this.fixes[i];
      // A control that has done its job goes away a moment later, never under the pinch that used it.
      if (fix) {
        tag.object.enabled = true;
        tag.hideAt = 0;
      } else if (tag.hideAt === 0 && tag.object.enabled) {
        tag.hideAt = getTime() + 0.9;
      }
      tag.label.getSceneObject().enabled = !!fix;
      if (fix) tag.label.text = wrap(`${fix.kind === "shrink" ? "TRY: " : "TRY: "}${fix.short.toUpperCase()}`, 16);
    });

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
      chip.label.text = `${selected && !this.sandbox.editObject ? "› " : ""}${bottleneck}${entry.gate.name.toUpperCase()}`;
      chip.marker.getSceneObject().getTransform().setLocalScale(selected ? new vec3(3.2, 3.2, 3.2) : new vec3(2.2, 2.2, 2.2));
    }
    this.layout();
    this.sandbox.show();
  }

  /** The room sits on the move table at model scale, or at life size where the move happens. */
  private placeStage(gate: Gate): void {
    const stage = this.stage.getTransform();
    const corner = gate.kind === "corner";
    if (this.lifeSize) {
      stage.setLocalScale(vec3.one());
      stage.setLocalPosition(corner ? new vec3(45, 25, -300) : vec3.zero());
      stage.setLocalRotation(corner ? quat.angleAxis((62 * Math.PI) / 180, vec3.right()) : quat.quatIdentity());
      return;
    }
    const s = MODEL_SCALE;
    stage.setLocalScale(new vec3(s, s, s));
    // The door plane stands at the back of the table; an L-turn lies flat and tips toward the wearer like a plan.
    stage.setLocalPosition(corner ? W(6, TABLE_TOP + 7, TABLE_Z - 6) : W(0, TABLE_TOP, TABLE_Z - 4));
    stage.setLocalRotation(corner ? quat.angleAxis((58 * Math.PI) / 180, vec3.right()) : quat.quatIdentity());
  }

  /** World position of a stage-local point (cm of the room). */
  public stageToWorld(p: vec3): vec3 {
    return this.stage.getTransform().getWorldTransform().multiplyPoint(p);
  }

  public get isLifeSize(): boolean {
    return this.lifeSize;
  }

  /** Place the floating UI: everything within reach of the eye, nothing behind a shoulder. */
  private layout(): void {
    const put = (name: string, x: number, y: number, z: number = TABLE_Z) => this.find(name).getTransform().setLocalPosition(W(x, y, z));
    if (this.lifeSize) {
      const gate = this.currentGate;
      const corner = gate.kind === "corner";
      put("Scenario Title", 0, 96, -300);
      put("Route Verdict Label", 0, 82, -300);
      put("PIVOT No-fit Label", 0, corner ? 60 : 60, -300);
    } else {
      put("Scenario Title", 0, 22);
      put("Scenario Story", 0, 17.5);
      put("PIVOT No-fit Label", 0, 12);
      put("Route Verdict Label", 0, 6.5);
    }
    const k = this.lifeSize ? 3 : 1;
    for (const n of ["Scenario Title", "Scenario Story", "PIVOT No-fit Label", "Route Verdict Label"]) this.find(n).getTransform().setLocalScale(new vec3(k, k, k));
    put("Gate Detail Label", 22, this.sandbox.active ? -19 : 7.5);
    for (let i = 0; i < 2; i++) {
      const y = this.sandbox.active ? -15 - i * 6.5 : -1 - i * 8;
      this.find(`Fix tag ${i + 1}`).getTransform().setLocalPosition(W(15, y, -108));
      this.find(`Fix tag label ${i + 1}`).getTransform().setLocalPosition(W(18.5 + textWidth(this.fixTags[i].label.text, SIZES.tag) / 2, y, -108));
    }
    const rail = this.find("Timeline rail").getTransform();
    rail.setLocalPosition(RAIL_AT());
    rail.setLocalScale(new vec3(RAIL_HALF * 2, 0.5, 0.5));
    put("Doorway Dimensions", 22, 14);
    put("Sofa Dimensions", 22, this.sandbox.active ? 40 : -17);
    for (let i = 0; i < MAX_CHIPS; i++) {
      this.find(`Gate chip ${i + 1}`).getTransform().setLocalPosition(tokenAt(i));
      this.find(`Gate chip label ${i + 1}`).getTransform().setLocalPosition(tokenLabelAt(i));
    }
  }

  onAwake(): void {
    this.root = this.getSceneObject().getParent()!;
    this.createEvent("OnStartEvent").bind(() => {
      this.titleText = this.text("Scenario Title");
      this.storyText = this.text("Scenario Story");
      this.verdictText = this.text("Route Verdict Label");
      this.detailText = this.text("Gate Detail Label");
      this.titleText.size = SIZES.title;
      this.storyText.size = SIZES.small;
      this.verdictText.size = SIZES.line;
      this.detailText.size = SIZES.tag;
      this.result.size = SIZES.hero;
      this.text("Unverified Maneuver Label").size = SIZES.line;
      this.text("Sofa Dimensions").size = SIZES.small;
      this.doorDimensions.size = SIZES.small;
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
            this.switchLabel = this.text("Scenario switch label");
      this.switchLabel.size = SIZES.button;
      this.sandbox = new Sandbox(
        {
          apply: (scenario, gate) => this.applySandbox(scenario, gate),
          gateIndex: () => this.gateIndex,
          gateCount: () => this.route.gates.length,
          setSwitchLabel: (t) => { this.switchLabel.text = t; },
        },
        (n) => this.find(n),
        (n) => this.text(n)
      );
      for (let i = 0; i < MAX_CHIPS; i++) {
        const object = this.find(`Gate chip ${i + 1}`);
        const target = object.getComponent("Component.ScriptComponent") as unknown as TapInteraction;
        const marker = object.getChild(0).getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        const material = marker.mainMaterial.clone();
        marker.mainMaterial = material;
        const label = this.text(`Gate chip label ${i + 1}`);
        label.size = SIZES.small;
        this.chips.push({ target, object, marker, material, label });
        const index = i;
        target.onTap.add(() => {
          if (index >= this.route.gates.length) return;
          if (this.sandbox.active) this.sandbox.selectGate();
          this.selectGate(index);
        });
      }
      this.switchMaterial = this.switchVisual.mainMaterial.clone();
      this.switchVisual.mainMaterial = this.switchMaterial;
      this.switchVisual.getSceneObject().getTransform().setLocalScale(new vec3(3.6, 3.6, 3.6));
      this.switchDoor.onHoverStart.add(() => { this.switchMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.switchDoor.onHoverEnd.add(() => { this.switchMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.switchDoor.onTap.add(() => (this.sandbox.active ? this.sandbox.nextPlace() : this.selectScenario(this.scenarioIndex + 1)));
      this.switchLabel.text = "NEXT SCENARIO ›";
      this.sandbox.init(() => this.toggleSandbox());
      this.fx = new StageFx(this.stage, this.boxMesh, this.ghostPanelMaterial, this.glowMaterial, [1, 2, 3].map((i) => this.text(`Callout label ${i}`)), (p) => this.stageToWorld(p));
      for (const i of [1, 2, 3]) this.text(`Callout label ${i}`).size = SIZES.tag;
      for (const i of [0, 1]) {
        const wired = wireButton(this.find.bind(this), this.text.bind(this), `Fix tag ${i + 1}`, `Fix tag label ${i + 1}`, "", () => this.tryFix(i));
        wired.label.size = SIZES.tag;
        this.fixTags.push({ object: wired.object, label: wired.label, hideAt: 0 });
      }
      const size = wireButton(this.find.bind(this), this.text.bind(this), "Size target", "Size label", "LIFE SIZE", () => {
        this.lifeSize = !this.lifeSize;
        this.sizeLabel.text = this.lifeSize ? "MODEL SIZE" : "LIFE SIZE";
        this.refresh();
      });
      this.sizeLabel = size.label;
      this.table = global.scene.createSceneObject("Move table");
      this.table.setParent(this.root);
      const slab = this.table.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      slab.mesh = this.boxMesh;
      const slabMaterial = this.ghostPanelMaterial.clone();
      slabMaterial.mainPass.baseColor = new vec4(0.3, 0.95, 0.93, 0.1);
      slab.mainMaterial = slabMaterial;
      this.table.getTransform().setLocalPosition(W(0, TABLE_TOP - 0.4, TABLE_Z + 4));
      this.table.getTransform().setLocalScale(new vec3(60, 0.5, 46));
      this.result.getSceneObject().enabled = false;
      this.scan.enabled = false;
      // Labels turn about the vertical to face the wearer, so they stay readable while walking round the gate.
      const names = ["Callout label 1", "Callout label 2", "Callout label 3", "Fix tag label 1", "Fix tag label 2", "Size label", "Mode label", "Object label", "Gate add label", "Gate remove label", "Object chip label", "Param label 1", "Param label 2", "Param label 3", "Param label 4", "Param label 5", "Scenario Title", "Scenario Story", "Route Verdict Label", "PIVOT No-fit Label", "Gate Detail Label", "Unverified Maneuver Label", "Doorway Dimensions", "Sofa Dimensions", "Scenario switch label", "Gate chip label 1", "Gate chip label 2", "Gate chip label 3"];
      this.billboards = names.map((n) => this.find(n));
      for (let i = 0; i < global.scene.getRootObjectsCount(); i++) {
        const o = global.scene.getRootObject(i);
        if (o.getComponent("Component.Camera")) this.camera = o;
      }
      this.selectScenario(this.startScenario);
      this.finished = false;
      this.elapsed = 0;
      this.scanEnd = SCAN_END;
    });

    this.createEvent("UpdateEvent").bind(() => {
      this.storyText.getSceneObject().enabled = getTime() < this.storyUntil;
      for (const tag of this.fixTags) {
        if (tag.hideAt > 0 && getTime() > tag.hideAt) {
          tag.object.enabled = false;
          tag.hideAt = 0;
        }
      }
      if (this.camera) {
        const eye = this.camera.getTransform().getWorldPosition();
        for (const label of this.billboards) {
          const t = label.getTransform();
          const p = t.getWorldPosition();
          t.setWorldRotation(quat.angleAxis(Math.atan2(eye.x - p.x, eye.z - p.z), vec3.up()));
        }
      }
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
