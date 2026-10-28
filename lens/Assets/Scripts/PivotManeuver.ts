import { TapInteraction } from "./TapInteraction";
import { DragInteraction } from "./DragInteraction";
import { PivotAnalysis } from "./PivotAnalysis";
import { ObjectModel } from "./PivotObjectModel";
import { extents, frameAt, gateHandles, maxProgress } from "./Planner/index";
import { poseTransform } from "./PivotPose";
import { ARROW_AT, RAIL_AT, RAIL_HALF, lengthText } from "./PivotLayout";
import type { Frame, Plan } from "./Planner/index";

const CM = 100;
const RAD = Math.PI / 180;
const HINT = "PINCH ARROW  •  PULL AN EDGE";
/** Step label against a gate handle, in room cm: half the label's width plus the handle's, and half their heights plus a margin. */
const LABEL_REACH = 55;
const LABEL_CLEAR = 32;
/** The wall panels around a doorway, corridor or lift are 15 cm deep and centred on the gate plane; the label stays in front of them. */
const LABEL_FRONT = 12;

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
  private objectModel!: ObjectModel;
  private playbackMaterial!: Material;
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
    this.bodyMaterial.mainPass.baseColor = new vec4(0.6, 0.85, 0.9, 1);
    this.playbackMaterial.mainPass.baseColor = this.analysis.currentPlan.fits ? new vec4(0.3, 0.95, 0.93, 0.32) : new vec4(1, 0.55, 0.4, 0.32);
    this.activeVisual.mainMaterial = isSofa ? this.originalMaterial : this.bodyMaterial;
    this.showingGhost = false;
    this.touched = false;
    this.autoClock = 0;
    this.objectModel.show(s.boxName);
    this.objectModel.setVisible(!isSofa);
    this.boxVisual.enabled = false;
    (this.sofaDimensions.getComponent("Component.Text3D") as Text3D).text = s.boxName.toUpperCase();
  }

  /**
   * The step label is about 70 cm wide in the room and the gate's grab points sit on its jambs and lintel, so a
   * label centred at a handle's height would cover the handle. Lift it just above any handle it would touch (room cm).
   */
  private clearOfHandles(x: number, y: number): number {
    if (this.analysis.isLifeSize) return y;
    const handles = gateHandles(this.analysis.currentGate).map((h) => ({ x: h.at.x * CM, y: h.at.y * CM })).sort((a, b) => a.y - b.y);
    for (const h of handles) if (Math.abs(h.x - x) < LABEL_REACH && Math.abs(y - h.y) < LABEL_CLEAR) y = h.y + LABEL_CLEAR;
    return y;
  }

  /** Depth for the step label: at the ghost, but never inside the wall panels, which would hide the text beyond the opening. */
  private labelDepth(z: number): number {
    return this.analysis.currentGate.kind === "corner" ? z : Math.max(z, LABEL_FRONT);
  }

  private warningText(plan: Plan, step: number): string {
    if (!plan.fits) return "UNVERIFIED MANEUVER\nILLUSTRATION ONLY · IT DOES NOT FIT";
    if (this.target < 0.005 && this.progress < 0.005) return (plan.verified ? "EVERY STEP CHECKED" : "UNVERIFIED MANEUVER") + "\n" + HINT;
    const s = plan.steps[step];
    const head = s.verified ? "VERIFIED STEP" : "UNVERIFIED MANEUVER";
    const hint = s.hint.toUpperCase();
    const spare = hint.indexOf("TO SPARE") < 0 && s.clearance !== null ? ` · ${lengthText(Math.max(0, s.clearance))} SPARE` : "";
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
      this.bodyMaterial = this.solidMaterial.clone();
      this.playbackMaterial = this.ghostMaterial.clone();
      this.boxVisual.mainMaterial = this.bodyMaterial;
      this.objectModel = new ObjectModel(boxObject, this.boxMesh, this.propMaterial, this.ghostMaterial);
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
        this.activeVisual.mainMaterial = showGhost ? this.playbackMaterial : isSofa ? this.originalMaterial : this.bodyMaterial;
        this.boxVisual.enabled = showGhost && !isSofa;
        this.showingGhost = showGhost;
        this.objectModel.setVisible(!showGhost && !isSofa);
      }
      this.place(frameAt(plan, this.progress));
      // The step label rides on the ghost it describes.
      const ghost = this.sofa.getTransform().getLocalPosition();
      const top = extents(this.analysis.scenario.box, frameAt(plan, this.progress).pose).y * 50 + 26;
      const tag = this.warning.getSceneObject().getTransform();
      const tagPosition = this.analysis.stageToWorld(new vec3(ghost.x, this.clearOfHandles(ghost.x, ghost.y + top), this.labelDepth(ghost.z)));
      if (!this.analysis.isLifeSize) tagPosition.y = Math.min(-5, tagPosition.y);
      tag.setWorldPosition(tagPosition);
      const k = this.analysis.isLifeSize ? 3 : 1;
      tag.setLocalScale(new vec3(k, k, k));

      const n = this.stepCount(plan);
      const step = Math.max(0, Math.min(plan.steps.length - 1, Math.round(this.progress * n)));
      const label = this.warningText(plan, step);
      if (label !== this.lastLabel) {
        this.lastLabel = label;
        this.warning.text = label;
      }

      // The object's handles belong to the object at rest at the start, not to the ghost on its way through.
      this.analysis.setAtStart(this.progress < 0.02 && this.target < 0.02);
      const settled = Math.abs(this.target - this.progress) < 0.005 && !this.dragging;
      this.sofaDimensions.enabled = settled;
      this.doorDimensions.enabled = settled;
      if (!this.dragging) {
        this.scrubber.getSceneObject().getTransform().setLocalPosition(new vec3(this.railCenterX - RAIL_HALF + 2 * RAIL_HALF * this.progress, this.railY, this.railZ));
      }
    });
  }
}
