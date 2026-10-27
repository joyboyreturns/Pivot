import { TapInteraction } from "./TapInteraction";
import { DragInteraction } from "./DragInteraction";
import { PivotAnalysis } from "./PivotAnalysis";
import { extents, frameAt, maxProgress } from "./Planner/index";
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

  /** Number of step intervals the arrow and rail move through. */
  private stepCount(plan: Plan): number {
    return plan.steps.length > 1 ? plan.steps.length - 1 : 3;
  }

  private limit(): number {
    return Math.min(1, maxProgress(this.analysis.currentPlan));
  }

  private applyRevision(): void {
    this.revision = this.analysis.revision;
    this.progress = 0;
    this.target = 0;
    this.lastLabel = "";
    const s = this.analysis.scenario;
    const isSofa = s.boxName.toLowerCase().indexOf("sofa") >= 0;
    this.sofaVisual.enabled = isSofa;
    this.boxVisual.enabled = !isSofa;
    this.activeVisual = isSofa ? this.sofaVisual : this.boxVisual;
    this.boxVisual.getSceneObject().getTransform().setLocalScale(new vec3(s.box.length * CM, s.box.height * CM, s.box.depth * CM));
    this.activeVisual.mainMaterial = isSofa ? this.originalMaterial : this.solidMaterial;
    this.showingGhost = false;
    (this.sofaDimensions.getComponent("Component.Text3D") as Text3D).text = s.boxName.toUpperCase();
  }

  private warningText(plan: Plan, step: number): string {
    if (!plan.fits) return "UNVERIFIED MANEUVER\nILLUSTRATION ONLY · IT DOES NOT FIT";
    if (this.target < 0.005 && this.progress < 0.005) return (plan.verified ? "EVERY STEP CHECKED" : "UNVERIFIED MANEUVER") + "\n" + HINT;
    const s = plan.steps[step];
    const head = s.verified ? "VERIFIED STEP" : "UNVERIFIED MANEUVER";
    const spare = s.clearance !== null && s.clearance < 100 ? ` · ${Math.max(0, Math.round(s.clearance * 100))} CM SPARE` : "";
    return `${head}\n${s.hint.toUpperCase()}${spare}`;
  }

  private place(frame: Frame): void {
    const t = this.sofa.getTransform();
    const box = this.analysis.scenario.box;
    const height = extents(box, frame.pose).y;
    t.setLocalPosition(new vec3(frame.position.x * CM, height * CM / 2 + frame.position.y * CM, frame.position.z * CM));
    const rx = quat.angleAxis(frame.pose.pitch * RAD, vec3.right());
    const ry = quat.angleAxis(frame.pose.yaw * RAD, vec3.up());
    const rz = quat.angleAxis(frame.pose.roll * RAD, vec3.forward());
    t.setLocalRotation(rz.multiply(ry).multiply(rx));
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
      const rail = this.scrubber.getSceneObject().getTransform().getLocalPosition();
      this.railCenterX = rail.x;
      this.railY = rail.y;
      this.railZ = rail.z;
      this.arrow.onTap.add(() => {
        const count = this.stepCount(this.analysis.currentPlan);
        const limit = this.limit();
        if (this.target >= limit - 0.001) {
          this.target = 0;
          return;
        }
        this.target = Math.min(limit, (Math.floor(this.target * count + 0.001) + 1) / count);
      });
      this.arrow.onHoverStart.add(() => { this.arrowVisual.getTransform().setLocalScale(new vec3(21, 21, 21)); this.arrowMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.arrow.onHoverEnd.add(() => { this.arrowVisual.getTransform().setLocalScale(new vec3(16, 16, 16)); this.arrowMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.scrubber.onHoverStart.add(() => { this.handleMaterial.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.scrubber.onHoverEnd.add(() => { this.handleMaterial.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.scrubber.onDragStart.add(() => { this.dragging = true; this.handleVisual.getTransform().setLocalScale(new vec3(14, 14, 14)); });
      this.scrubber.onDragEnd.add(() => { this.dragging = false; this.handleVisual.getTransform().setLocalScale(new vec3(10, 10, 10)); });
      this.scrubber.onDragUpdate.add(() => {
        const t = this.scrubber.getSceneObject().getTransform();
        const q = t.getLocalPosition();
        const x = Math.max(this.railCenterX - 30, Math.min(this.railCenterX + 30, q.x));
        t.setLocalPosition(new vec3(x, this.railY, this.railZ));
        this.target = Math.min(this.limit(), (x - this.railCenterX + 30) / 60);
      });
    });

    this.createEvent("UpdateEvent").bind(() => {
      if (!this.analysis.currentPlan || !this.boxVisual) return;
      if (this.revision !== this.analysis.revision) this.applyRevision();
      const plan = this.analysis.currentPlan;
      const blend = Math.min(1, getDeltaTime() * 4);
      this.progress += (this.target - this.progress) * blend;
      const showGhost = this.progress > 0.01 || this.target > 0;
      if (showGhost !== this.showingGhost) {
        const isSofa = this.activeVisual === this.sofaVisual;
        this.activeVisual.mainMaterial = showGhost ? this.ghostMaterial : isSofa ? this.originalMaterial : this.solidMaterial;
        this.showingGhost = showGhost;
      }
      this.place(frameAt(plan, this.progress));

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
        this.scrubber.getSceneObject().getTransform().setLocalPosition(new vec3(this.railCenterX - 30 + 60 * this.progress, this.railY, this.railZ));
      }
    });
  }
}
