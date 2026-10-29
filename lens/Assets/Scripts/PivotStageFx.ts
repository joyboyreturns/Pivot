import { extents, frameAt, maxProgress } from "./Planner/index";
import type { Gate, Plan, Scenario } from "./Planner/index";
import { poseTransform } from "./PivotPose";
import { TONES } from "./PivotGateView";
import { lengthText } from "./PivotLayout";
import type { Tone } from "./PivotGateView";

const CM = 100;
const TRAIL = 7;

interface Piece {
  object: SceneObject;
  material: Material;
}

/**
 * Drawn on the stage, on the thing each number is about: an onion-skin trail of the whole move, and
 * dimension lines at the gap where the object passes with the number beside them.
 */
export class StageFx {
  private trail: Piece[] = [];
  private bars: Piece[] = [];
  private barsUsed = 0;

  constructor(
    private stage: SceneObject,
    private mesh: RenderMesh,
    private ghost: Material,
    private glow: Material,
    private labels: Text3D[],
    private toWorld: (p: vec3) => vec3
  ) {}

  private piece(pool: Piece[], index: number, template: Material, name: string): Piece {
    let p = pool[index];
    if (!p) {
      const object = global.scene.createSceneObject(name + " " + index);
      object.setParent(this.stage);
      const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      visual.mesh = this.mesh;
      const material = template.clone();
      visual.mainMaterial = material;
      p = { object, material };
      pool[index] = p;
    }
    p.object.enabled = true;
    return p;
  }

  /** The whole move at once: faint copies of the bounding box along the plan, the tightest moment tinted. */
  showTrail(scenario: Scenario, plan: Plan, tone: Tone): void {
    if (!plan.fits) {
      this.hideTrail();
      return;
    }
    const limit = Math.min(1, maxProgress(plan));
    const tight = plan.steps.length > 1 && plan.bottleneckIndex >= 0 ? plan.bottleneckIndex / (plan.steps.length - 1) : -1;
    let nearest = -1;
    if (tight >= 0) {
      let best = 9;
      for (let i = 0; i < TRAIL; i++) {
        const d = Math.abs((i / (TRAIL - 1)) * limit - tight);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
    }
    const b = scenario.box;
    for (let i = 0; i < TRAIL; i++) {
      const p = this.piece(this.trail, i, this.ghost, "Trail");
      const t = poseTransform(b, frameAt(plan, (i / (TRAIL - 1)) * limit));
      const tr = p.object.getTransform();
      tr.setLocalPosition(t.position);
      tr.setLocalRotation(t.rotation);
      tr.setLocalScale(new vec3(b.length * CM, b.height * CM, b.depth * CM));
      const c = i === nearest ? TONES[tone] : TONES.info;
      p.material.mainPass.baseColor = new vec4(c.x, c.y, c.z, i === nearest ? 0.1 : 0.025);
    }
  }

  hideTrail(): void {
    for (const p of this.trail) p.object.enabled = false;
  }

  private bar(x: number, y: number, z: number, w: number, h: number, d: number, color: vec4): void {
    const p = this.piece(this.bars, this.barsUsed++, this.glow, "Dimension");
    const tr = p.object.getTransform();
    tr.setLocalPosition(new vec3(x, y, z));
    tr.setLocalScale(new vec3(Math.max(0.3, w), Math.max(0.3, h), Math.max(0.3, d)));
    p.material.mainPass.baseColor = color;
  }

  private tag(i: number, local: vec3, text: string): void {
    const label = this.labels[i].getSceneObject();
    label.enabled = true;
    this.labels[i].text = text;
    label.getTransform().setWorldPosition(this.toWorld(local));
  }

  /** Dimension lines at the gaps the object leaves at the gate, with the numbers on them. */
  showCallouts(scenario: Scenario, gate: Gate, plan: Plan, tone: Tone): void {
    this.barsUsed = 0;
    for (const l of this.labels) l.getSceneObject().enabled = false;
    const color = TONES[tone];
    if (gate.kind === "corner") {
      if (plan.turn) this.tag(0, new vec3(0, 56, 0), lengthText(Math.max(0, plan.clearance)));
    } else if (plan.fits) {
      const pass = plan.steps[plan.steps.length - 1];
      const e = extents(scenario.box, pass.pose);
      const w = gate.kind === "elevator" ? gate.door.width : gate.width;
      const h = gate.kind === "elevator" ? gate.door.height : gate.height;
      const sideGap = (w - e.x) / 2;
      const topGap = h - e.y;
      const y = Math.min(e.y, h) * CM * 0.5;
      const z = 9;
      const cap = 14;
      const th = 3;
      // Whole millimetres under a centimetre, so a real gap never reads "0 CM"; one decimal of a centimetre above that.
      const gapText = (m: number) => (m < 0.01 ? lengthText(Math.max(0, m)) : `${(m * 100).toFixed(1).replace(".0", "")} CM`);
      let n = 0;
      for (const side of [-1, 1]) {
        if (sideGap > 0.25) continue;
        const outer = (side * w * CM) / 2;
        const inner = (side * e.x * CM) / 2;
        this.bar((outer + inner) / 2, y, z, Math.abs(outer - inner), th, th, color);
        this.bar(outer, y, z, th, cap, th, color);
        this.bar(inner, y, z, th, cap, th, color);
        if (n < 2) this.tag(n++, new vec3((outer + inner) / 2, y + cap + 8, z), gapText(sideGap));
      }
      if (topGap < 0.25) {
        const x = w * CM * 0.5 - 14;
        this.bar(x, (e.y * CM + h * CM) / 2, z, th, Math.abs(h - e.y) * CM, th, color);
        this.bar(x, e.y * CM, z, cap, th, th, color);
        this.bar(x, h * CM, z, cap, th, th, color);
        this.tag(2, new vec3(x + 16, (e.y * CM + h * CM) / 2, z), gapText(topGap));
      }
    }
    for (let i = this.barsUsed; i < this.bars.length; i++) this.bars[i].object.enabled = false;
  }
}
