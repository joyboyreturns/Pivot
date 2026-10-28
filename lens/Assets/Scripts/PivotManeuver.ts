import { TapInteraction } from "./TapInteraction";
import { DragInteraction } from "./DragInteraction";
import { PivotAnalysis } from "./PivotAnalysis";
import { extents, frameAt, maxProgress } from "./Planner/index";
import { poseTransform } from "./PivotPose";
import { ARROW_AT, RAIL_AT, RAIL_HALF } from "./PivotLayout";
import type { Frame, Plan } from "./Planner/index";

const CM = 100;
const RAD = Math.PI / 180;
const HINT = "PINCH ARROW  •  DRAG RAIL";

@component
export class PivotManeuver extends BaseScriptComponent {
  @input sofa!: SceneObject;
  @input arrow!: TapInteraction;
  @input scrubber!: DragInteraction;
  @input arrowVisual!: SceneObject;
  @input handleVisual!: SceneObject;
  @input sofaDimensions!: SceneObject;
  @input doorDimensions!: SceneObject;
  @input sofaVisual!: RenderMeshVisual;
  @input ghostMaterial!: Material;
  @input solidMaterial!: Material;
  @input boxMesh!: RenderMesh;
  @input propMaterial!: Material;
  /** Plays the maneuver once by itself after each analysis; the first pinch or drag takes over. */
  public autoPlay = true;
  @input warning!: Text3D;
  @input analysis!: PivotAnalysis;
  private originalMaterial!: Material;
  private boxVisual!: RenderMeshVisual;
  private activeVisual!: RenderMeshVisual;
  private showingGhost = false;
  private arrowMaterial!: Material;
  private handleMaterial!: Material;

  private progress = 0;
  private target = 0;
  private dragging = false;
  private railCenterX = 0;
  private railY = 0;
  private railZ = 0;
  private revision = -1;
  private lastLabel = "";
  private props: SceneObject[] = [];
  private bodyMaterial!: Material;
  private baseScale = new vec3(1, 1, 1);
  private baseOffset = vec3.zero();
  private touched = false;
  private autoClock = 0;

  /** Number of step intervals the arrow and rail move through. */
  private stepCount(plan: Plan): number {
    return plan.steps.length > 1 ? plan.steps.length - 1 : 3;
  }

  private limit(): number {
    return Math.min(1, maxProgress(this.analysis.currentPlan));
  }

  /** Stop the hands-free replay and put the ghost back at the start (the tests drive it themselves from there). */
  public rewind(): void {
    this.autoPlay = false;
    this.autoClock = 0;
    this.target = 0;
    this.progress = 0;
  }

  private applyRevision(): void {
    this.revision = this.analysis.revision;
    this.progress = 0;
    this.target = 0;
    this.lastLabel = "";
    const s = this.analysis.scenario;
    const isSofa = s.boxName.toLowerCase().indexOf("sofa") >= 0;
    if (isSofa) {
      // The sofa mesh is 2.10 x 0.85 x 0.90 m; stretch it to whatever box was asked for.
      const f = new vec3(s.box.length / 2.1, s.box.height / 0.85, s.box.depth / 0.9);
      const model = this.sofaVisual.getSceneObject().getTransform();
      model.setLocalScale(new vec3(this.baseScale.x * f.x, this.baseScale.y * f.y, this.baseScale.z * f.z));
      model.setLocalPosition(new vec3(this.baseOffset.x * f.x, this.baseOffset.y * f.y, this.baseOffset.z * f.z));
    }
    this.sofaVisual.enabled = isSofa;
    this.boxVisual.enabled = !isSofa;
    this.activeVisual = isSofa ? this.sofaVisual : this.boxVisual;
    this.boxVisual.getSceneObject().getTransform().setLocalScale(new vec3(s.box.length * CM, s.box.height * CM, s.box.depth * CM));
    const n = s.boxName.toLowerCase();
    this.bodyMaterial = this.solidMaterial.clone();
    this.bodyMaterial.mainPass.baseColor = this.bodyColor(n);
    this.activeVisual.mainMaterial = isSofa ? this.originalMaterial : this.bodyMaterial;
    this.showingGhost = false;
    this.touched = false;
    this.autoClock = 0;
    this.buildProps(s.boxName);
    (this.sofaDimensions.getComponent("Component.Text3D") as Text3D).text = s.boxName.toUpperCase();
  }

  private addProp(x: number, y: number, z: number, w: number, h: number, d: number, color: vec4): void {
    const object = global.scene.createSceneObject("Box detail");
    object.setParent(this.boxVisual.getSceneObject());
    const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mesh = this.boxMesh;
    const material = this.propMaterial.clone();
    material.mainPass.baseColor = color;
    visual.mainMaterial = material;
    object.getTransform().setLocalPosition(new vec3(x, y, z));
    object.getTransform().setLocalScale(new vec3(w, h, d));
    this.props.push(object);
  }

  /** Light details so a box reads as a wardrobe or a mattress; they sit in unit-cube space of the scaled box. */
  private buildProps(name: string): void {
    for (const p of this.props) p.destroy();
    this.props = [];
    const n = name.toLowerCase();
    const cream = new vec4(1, 0.92, 0.75, 1);
    if (n.indexOf("wardrobe") >= 0) {
      this.addProp(0, 0, 0.5, 0.012, 0.94, 0.03, cream);
      this.addProp(-0.07, 0.02, 0.5, 0.018, 0.14, 0.05, cream);
      this.addProp(0.07, 0.02, 0.5, 0.018, 0.14, 0.05, cream);
      this.addProp(0, 0.5, 0, 1.02, 0.02, 1.02, cream);
    } else if (n.indexOf("mattress") >= 0) {
      this.addProp(0, 0.5, 0, 0.92, 0.12, 0.94, new vec4(0.75, 0.88, 1, 1));
      this.addProp(-0.25, 0.57, 0, 0.012, 0.02, 0.94, cream);
      this.addProp(0.25, 0.57, 0, 0.012, 0.02, 0.94, cream);
      this.addProp(0, 0.57, -0.25, 0.92, 0.02, 0.012, cream);
      this.addProp(0, 0.57, 0.25, 0.92, 0.02, 0.012, cream);
    } else if (n.indexOf("fridge") >= 0) {
      this.addProp(0, 0.2, 0.5, 0.98, 0.012, 0.03, cream);
      this.addProp(0.38, 0.38, 0.5, 0.025, 0.28, 0.06, cream);
      this.addProp(0.38, -0.02, 0.5, 0.025, 0.36, 0.06, cream);
    } else if (n.indexOf("piano") >= 0) {
      this.addProp(0, 0.05, 0.5, 0.9, 0.09, 0.04, cream);
      this.addProp(0, 0.5, 0, 1.02, 0.03, 1.02, cream);
    } else if (n.indexOf("washing") >= 0) {
      this.addProp(0, -0.05, 0.5, 0.62, 0.62, 0.03, new vec4(0.6, 0.85, 1, 1));
      this.addProp(0, 0.4, 0.5, 0.7, 0.08, 0.03, cream);
    } else if (n.indexOf("bookcase") >= 0) {
      for (let i = 0; i < 5; i++) this.addProp(0, -0.4 + i * 0.2, 0.5, 0.94, 0.015, 0.03, cream);
    } else if (n.indexOf("desk") >= 0 || n.indexOf("table") >= 0) {
      this.addProp(0, 0.5, 0, 1.02, 0.1, 1.04, cream);
    } else if (n.indexOf("bed") >= 0) {
      this.addProp(0, 0.5, 0, 0.96, 0.12, 0.96, new vec4(0.8, 0.88, 1, 1));
      this.addProp(-0.46, 0.2, 0, 0.06, 1.0, 1.02, cream);
    }
  }

  private bodyColor(n: string): vec4 {
    if (n.indexOf("wardrobe") >= 0 || n.indexOf("bookcase") >= 0 || n.indexOf("desk") >= 0 || n.indexOf("table") >= 0) return new vec4(0.85, 0.6, 0.35, 1);
    if (n.indexOf("mattress") >= 0 || n.indexOf("fridge") >= 0 || n.indexOf("washing") >= 0) return new vec4(0.9, 0.92, 1, 1);
    if (n.indexOf("piano") >= 0) return new vec4(0.45, 0.35, 0.3, 1);
    if (n.indexOf("armchair") >= 0) return new vec4(0.9, 0.55, 0.45, 1);
    if (n.indexOf("treadmill") >= 0) return new vec4(0.55, 0.6, 0.7, 1);
    return new vec4(0.6, 0.85, 0.9, 1);
  }

  private setProps(visible: boolean): void {
    for (const p of this.props) p.enabled = visible;
  }

  private warningText(plan: Plan, step: number): string {
    if (!plan.fits) return "UNVERIFIED MANEUVER\nILLUSTRATION ONLY · IT DOES NOT FIT";
    if (this.target < 0.005 && this.progress < 0.005) return (plan.verified ? "EVERY STEP CHECKED" : "UNVERIFIED MANEUVER") + "\n" + HINT;
    const s = plan.steps[step];
    const head = s.verified ? "VERIFIED STEP" : "UNVERIFIED MANEUVER";
    const hint = s.hint.toUpperCase();
    const spare = hint.indexOf("TO SPARE") < 0 && s.clearance !== null ? ` · ${Math.max(0, Math.round(s.clearance * 100))} CM SPARE` : "";
    const body = hint.length + spare.length > 46 ? hint.replace(": ", "\n") : hint;
    return `${head}\n${body}${spare}`;
  }

  private place(frame: Frame): void {
    const t = this.sofa.getTransform();
    const pose = poseTransform(this.analysis.scenario.box, frame);
    t.setLocalPosition(pose.position);
    t.setLocalRotation(pose.rotation);
  }

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.originalMaterial = this.sofaVisual.mainMaterial;

      // Rotate about the middle of the volume, as the planner does, not the base of the mesh.
      const min = this.sofaVisual.worldAabbMin();
      const max = this.sofaVisual.worldAabbMax();
      const centre = new vec3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      const origin = this.sofa.getTransform().getWorldPosition();
      const model = this.sofaVisual.getSceneObject().getTransform();
      const p = model.getLocalPosition();
      model.setLocalPosition(new vec3(p.x + origin.x - centre.x, p.y + origin.y - centre.y, p.z + origin.z - centre.z));
      this.baseScale = model.getLocalScale();
      this.baseOffset = model.getLocalPosition();

      const boxObject = global.scene.createSceneObject("Box model");
      boxObject.setParent(this.sofa);
      this.boxVisual = boxObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      this.boxVisual.mesh = this.boxMesh;
      this.boxVisual.mainMaterial = this.solidMaterial;
      this.activeVisual = this.sofaVisual;

      const arrowMesh = this.arrowVisual.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      const handleMesh = this.handleVisual.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      this.arrowMaterial = arrowMesh.mainMaterial.clone();
      this.handleMaterial = handleMesh.mainMaterial.clone();
      arrowMesh.mainMaterial = this.arrowMaterial;
      handleMesh.mainMaterial = this.handleMaterial;
      // The controls sit on the front edge of the move table.
      this.arrow.getSceneObject().getTransform().setLocalPosition(ARROW_AT());
      this.scrubber.getSceneObject().getTransform().setLocalPosition(RAIL_AT());
      this.arrowVisual.getTransform().setLocalScale(new vec3(5, 5, 5));
      this.handleVisual.getTransform().setLocalScale(new vec3(3, 3, 3));
      const rail = this.scrubber.getSceneObject().getTransform().getLocalPosition();
      this.railCenterX = rail.x;
      this.railY = rail.y;
      this.railZ = rail.z;
      this.arrow.onTap.add(() => {
        this.touched = true;
        const count = this.stepCount(this.analysis.currentPlan);
        const limit = this.limit();
        if (this.target >= limit - 0.001) {
          this.target = 0;
          return;
        }
        this.target = Math.min(limit, (Math.floor(this.target * count + 0.001) + 1) / count);
      });
      this.arrow.onHoverStart.add(() => { this.arrowVisual.getTransform().setLocalScale(new vec3(6.5, 6.5, 6.5)); this.arrowMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.arrow.onHoverEnd.add(() => { this.arrowVisual.getTransform().setLocalScale(new vec3(5, 5, 5)); this.arrowMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.scrubber.onHoverStart.add(() => { this.handleMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.scrubber.onHoverEnd.add(() => { this.handleMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.scrubber.onDragStart.add(() => { this.touched = true; this.dragging = true; this.handleVisual.getTransform().setLocalScale(new vec3(4.2, 4.2, 4.2)); });
      this.scrubber.onDragEnd.add(() => { this.dragging = false; this.handleVisual.getTransform().setLocalScale(new vec3(3, 3, 3)); });
      this.scrubber.onDragUpdate.add(() => {
        const t = this.scrubber.getSceneObject().getTransform();
        const q = t.getLocalPosition();
        const x = Math.max(this.railCenterX - RAIL_HALF, Math.min(this.railCenterX + RAIL_HALF, q.x));
        t.setLocalPosition(new vec3(x, this.railY, this.railZ));
        this.target = Math.min(this.limit(), (x - this.railCenterX + RAIL_HALF) / (2 * RAIL_HALF));
      });
    });

    this.createEvent("UpdateEvent").bind(() => {
      if (!this.analysis.currentPlan || !this.boxVisual) return;
      if (this.revision !== this.analysis.revision) this.applyRevision();
      const plan = this.analysis.currentPlan;
      if (this.autoPlay && !this.touched && this.analysis.ready && !this.dragging) {
        this.autoClock += getDeltaTime();
        const run = Math.max(1, this.stepCount(plan)) * 1.4;
        if (this.autoClock > 0.8) this.target = Math.min(this.limit(), (this.autoClock - 0.8) / run);
      }
      const blend = Math.min(1, getDeltaTime() * 4);
      this.progress += (this.target - this.progress) * blend;
      const showGhost = this.progress > 0.01 || this.target > 0;
      if (showGhost !== this.showingGhost) {
        const isSofa = this.activeVisual === this.sofaVisual;
        this.activeVisual.mainMaterial = showGhost ? this.ghostMaterial : isSofa ? this.originalMaterial : this.bodyMaterial;
        this.showingGhost = showGhost;
        this.setProps(!showGhost && !isSofa);
      }
      this.place(frameAt(plan, this.progress));
      // The step label rides on the ghost it describes.
      const ghost = this.sofa.getTransform().getLocalPosition();
      const top = extents(this.analysis.scenario.box, frameAt(plan, this.progress).pose).y * 50 + 26;
      const tag = this.warning.getSceneObject().getTransform();
      tag.setWorldPosition(this.analysis.stageToWorld(new vec3(ghost.x, ghost.y + top, ghost.z)));
      const k = this.analysis.isLifeSize ? 3 : 1;
      tag.setLocalScale(new vec3(k, k, k));

      const n = this.stepCount(plan);
      const step = Math.max(0, Math.min(plan.steps.length - 1, Math.round(this.progress * n)));
      const label = this.warningText(plan, step);
      if (label !== this.lastLabel) {
        this.lastLabel = label;
        this.warning.text = label;
      }

      const settled = Math.abs(this.target - this.progress) < 0.005 && !this.dragging;
      this.sofaDimensions.enabled = settled;
      this.doorDimensions.enabled = settled;
      if (!this.dragging) {
        this.scrubber.getSceneObject().getTransform().setLocalPosition(new vec3(this.railCenterX - RAIL_HALF + 2 * RAIL_HALF * this.progress, this.railY, this.railZ));
      }
    });
  }
}
