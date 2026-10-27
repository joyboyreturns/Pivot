import { planMove } from "./Planner/planner";
import { TapInteraction } from "./TapInteraction";
import type { Plan } from "./Planner/types";

@component
export class PivotAnalysis extends BaseScriptComponent {
  @input result!: Text3D;
  @input scan!: SceneObject;
  @input restrictionLeft!: SceneObject;
  @input restrictionRight!: SceneObject;
  @input doorLeft!: SceneObject;
  @input doorRight!: SceneObject;
  @input doorDimensions!: Text3D;
  @input switchDoor!: TapInteraction;
  @input switchVisual!: RenderMeshVisual;
  private elapsed = 0;
  private finished = false;
  private wide = false;
  public currentPlan!: Plan;
  public revision = 0;

  private updateExample(): void {
    const width = this.wide ? 0.95 : 0.80;
    const plan = planMove(
      { length: 2.10, depth: 0.90, height: 0.85 },
      { width, height: 2.05 }
    );
    this.currentPlan = plan;
    this.revision++;
    const pose = plan.fits ? plan.steps[plan.bottleneckIndex].pose : null;
    this.doorLeft.getTransform().setLocalPosition(new vec3(this.wide ? -77.5 : -70, 102.5, 0));
    this.doorRight.getTransform().setLocalPosition(new vec3(this.wide ? 77.5 : 70, 102.5, 0));
    this.doorDimensions.text = `DOORWAY  ${width.toFixed(2)} × 2.05 m`;
    this.result.text = plan.fits
      ? `BOX POSE FITS\nTIGHTEST TOTAL GAP: ${(plan.clearance * 100).toFixed(0)} cm\nTURN ${pose!.yaw}°  ·  PATH NOT VERIFIED`
      : `BOX MODEL: DOES NOT FIT\n0.85 m SOFA > 0.80 m DOOR\nBEST TESTED GAP: ${(plan.clearance * 100).toFixed(0)} cm`;
    if (this.finished) {
      this.restrictionLeft.enabled = !plan.fits;
      this.restrictionRight.enabled = !plan.fits;
    }
  }

  onAwake(): void {
    this.updateExample();
    this.createEvent("OnStartEvent").bind(() => {
      const material = this.switchVisual.mainMaterial.clone();
      this.switchVisual.mainMaterial = material;
      this.switchDoor.onHoverStart.add(() => { material.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
      this.switchDoor.onHoverEnd.add(() => { material.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
      this.switchDoor.onTap.add(() => { this.wide = !this.wide; this.updateExample(); });
    });
    this.result.getSceneObject().enabled = false;
    this.scan.enabled = false;
    this.restrictionLeft.enabled = false;
    this.restrictionRight.enabled = false;
    this.createEvent("UpdateEvent").bind(() => {
      if (this.finished) return;
      this.elapsed += getDeltaTime();
      if (this.elapsed >= 0.5 && this.elapsed < 2.0) {
        this.scan.enabled = true;
        const progress = (this.elapsed - 0.5) / 1.5;
        this.scan.getTransform().setLocalPosition(new vec3(0, 20 + 165 * progress, 10));
      } else if (this.elapsed >= 2.0) {
        this.scan.enabled = false;
        this.result.getSceneObject().enabled = true;
        this.finished = true;
        this.updateExample();
      }
    });
  }
}
