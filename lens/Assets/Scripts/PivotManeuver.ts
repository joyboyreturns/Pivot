import { TapInteraction } from "./TapInteraction";
import { DragInteraction } from "./DragInteraction";
import { PivotAnalysis } from "./PivotAnalysis";

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
  @input analysis!: PivotAnalysis;
  private originalMaterial!: Material;
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

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.originalMaterial = this.sofaVisual.mainMaterial;
      const arrowMesh = this.arrowVisual.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      const handleMesh = this.handleVisual.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      this.arrowMaterial = arrowMesh.mainMaterial.clone();
      this.handleMaterial = handleMesh.mainMaterial.clone();
      arrowMesh.mainMaterial = this.arrowMaterial;
      handleMesh.mainMaterial = this.handleMaterial;
      const p = this.scrubber.getSceneObject().getTransform().getLocalPosition();
      this.railCenterX = p.x;
      this.railY = p.y;
      this.railZ = p.z;
      this.arrow.onTap.add(() => {
        const count = this.analysis.currentPlan.fits ? this.analysis.currentPlan.steps.length - 1 : 3;
        this.target = Math.min(1, (Math.floor(this.target * count + 0.001) + 1) / count);
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
        this.target = (x - this.railCenterX + 30) / 60;
      });
    });
    this.createEvent("UpdateEvent").bind(() => {
      if (this.revision !== this.analysis.revision) {
        this.revision = this.analysis.revision;
        this.progress = 0;
        this.target = 0;
      }
      const blend = Math.min(1, getDeltaTime() * 4);
      this.progress += (this.target - this.progress) * blend;
      const showGhost = this.progress > 0.01 || this.target > 0;
      if (showGhost !== this.showingGhost) {
        this.sofaVisual.mainMaterial = showGhost ? this.ghostMaterial : this.originalMaterial;
        this.showingGhost = showGhost;
      }
      const t = this.sofa.getTransform();
      const plan = this.analysis.currentPlan;
      if (plan.fits) {
        const n = plan.steps.length - 1;
        const cursor = this.progress * n;
        const i = Math.min(n - 1, Math.floor(cursor));
        const fraction = cursor - i;
        const a = plan.steps[i];
        const b = plan.steps[i + 1];
        const lerp = (x: number, y: number) => x + (y - x) * fraction;
        const z = (kind: string) => kind === "pass" ? -55 : kind === "slide" ? 25 : 55;
        const rad = Math.PI / 180;
        const rx = quat.angleAxis(lerp(a.pose.pitch, b.pose.pitch) * rad, vec3.right());
        const ry = quat.angleAxis(lerp(a.pose.yaw, b.pose.yaw) * rad, vec3.up());
        const rz = quat.angleAxis(lerp(a.pose.roll, b.pose.roll) * rad, vec3.forward());
        t.setLocalPosition(new vec3(0, 0, lerp(z(a.kind), z(b.kind))));
        t.setLocalRotation(rz.multiply(ry).multiply(rx));
      } else {
        t.setLocalPosition(new vec3(0, 18 * this.progress, 55 - 20 * this.progress));
        t.setLocalRotation(quat.fromEulerAngles(0, 0.55 * this.progress, 1.1 * this.progress));
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
