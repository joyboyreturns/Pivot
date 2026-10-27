import type { Gate, Plan } from "./Planner/types";

const CM = 100;

export type Tone = "ok" | "tight" | "blocked" | "info";

export const TONES: Record<Tone, vec4> = {
  ok: new vec4(0.45, 1, 0.7, 1),
  tight: new vec4(1, 0.8, 0.3, 1),
  blocked: new vec4(1, 0.32, 0.28, 1),
  info: new vec4(0.3, 0.95, 0.93, 1),
};

export function toneFor(clearance: number, tight = 0.03): Tone {
  return clearance < 0 ? "blocked" : clearance < tight ? "tight" : "ok";
}

export interface DoorObjects {
  left: SceneObject;
  right: SceneObject;
  lintel: SceneObject;
  restrictionLeft: SceneObject;
  restrictionRight: SceneObject;
}

interface Panel {
  object: SceneObject;
  visual: RenderMeshVisual;
  material: Material;
  kind: "wall" | "glow" | "ghost";
}

/**
 * Draws the current gate at real scale (cm) in front of the viewer: the doorway frame for
 * doorways, corridors and lifts, plus pooled panels for corridor walls, the lift cabin and the L-turn.
 * Everything is derived from the planner's gate and plan, nothing is authored per scenario.
 */
export class GateView {
  private panels: Panel[] = [];
  private used = 0;
  private lineMaterials: Material[] = [];

  constructor(
    private parent: SceneObject,
    private door: DoorObjects,
    private mesh: RenderMesh,
    private templates: { wall: Material; glow: Material; ghost: Material }
  ) {
    for (const o of [door.restrictionLeft, door.restrictionRight]) {
      const v = o.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      const m = v.mainMaterial.clone();
      v.mainMaterial = m;
      this.lineMaterials.push(m);
    }
  }

  private panel(kind: Panel["kind"]): Panel {
    let p = this.panels[this.used];
    if (!p || p.kind !== kind) {
      if (p) p.object.destroy();
      const object = global.scene.createSceneObject("Gate panel " + this.used);
      object.setParent(this.parent);
      const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      visual.mesh = this.mesh;
      const material = this.templates[kind].clone();
      visual.mainMaterial = material;
      p = { object, visual, material, kind };
      this.panels[this.used] = p;
    }
    this.used++;
    p.object.enabled = true;
    return p;
  }

  /** Box centred at (x, y, z) with size (w, h, d), all in cm. */
  private box(kind: Panel["kind"], x: number, y: number, z: number, w: number, h: number, d: number, color?: vec4) {
    const p = this.panel(kind);
    const t = p.object.getTransform();
    t.setLocalPosition(new vec3(x, y, z));
    t.setLocalScale(new vec3(Math.max(0.1, w), Math.max(0.1, h), Math.max(0.1, d)));
    if (color) p.material.mainPass.baseColor = kind === "ghost" ? new vec4(color.x, color.y, color.z, 0.2) : color;
  }

  private hideDoor(hidden: boolean) {
    for (const o of [this.door.left, this.door.right, this.door.lintel, this.door.restrictionLeft, this.door.restrictionRight]) o.enabled = !hidden;
  }

  private frame(width: number, height: number, tone: Tone) {
    this.hideDoor(false);
    const w = width * CM;
    const h = height * CM;
    const wallW = 60;
    this.door.left.getTransform().setLocalPosition(new vec3(-(w / 2 + wallW / 2), h / 2, 0));
    this.door.left.getTransform().setLocalScale(new vec3(wallW, h, 15));
    this.door.right.getTransform().setLocalPosition(new vec3(w / 2 + wallW / 2, h / 2, 0));
    this.door.right.getTransform().setLocalScale(new vec3(wallW, h, 15));
    this.door.lintel.getTransform().setLocalPosition(new vec3(0, h + 10, 0));
    this.door.lintel.getTransform().setLocalScale(new vec3(w + wallW * 2, 20, 15));
    this.door.restrictionLeft.getTransform().setLocalPosition(new vec3(-w / 2, h / 2, 8));
    this.door.restrictionLeft.getTransform().setLocalScale(new vec3(2.5, h, 2.5));
    this.door.restrictionRight.getTransform().setLocalPosition(new vec3(w / 2, h / 2, 8));
    this.door.restrictionRight.getTransform().setLocalScale(new vec3(2.5, h, 2.5));
    for (const m of this.lineMaterials) m.mainPass.baseColor = TONES[tone];
  }

  /** Rebuild the view for a gate. `tone` colours the bottleneck marker for this gate. */
  show(gate: Gate, plan: Plan, tone: Tone) {
    this.used = 0;
    switch (gate.kind) {
      case "doorway":
        this.frame(gate.width, gate.height, tone);
        break;
      case "corridor": {
        this.frame(gate.width, gate.height, tone);
        const w = gate.width * CM;
        const h = gate.height * CM;
        const len = Math.min(gate.length * CM, 420);
        this.box("ghost", -(w / 2 + 3), h / 2, -len / 2, 6, h, len, TONES.info);
        this.box("ghost", w / 2 + 3, h / 2, -len / 2, 6, h, len, TONES.info);
        this.box("ghost", 0, h + 3, -len / 2, w + 12, 6, len, TONES.info);
        break;
      }
      case "elevator": {
        this.frame(gate.door.width, gate.door.height, tone);
        const c = gate.cabin;
        const w = c.width * CM;
        const d = c.depth * CM;
        const h = c.height * CM;
        this.box("ghost", -(w / 2 + 2), h / 2, -d / 2, 4, h, d, TONES.info);
        this.box("ghost", w / 2 + 2, h / 2, -d / 2, 4, h, d, TONES.info);
        this.box("ghost", 0, h / 2, -(d + 2), w + 8, h, 4, TONES.info);
        this.box("ghost", 0, h + 2, -d / 2, w + 8, 4, d, TONES.info);
        break;
      }
      case "corner":
        this.hideDoor(true);
        this.corner(gate.inWidth * CM, gate.outWidth * CM, tone);
        break;
    }
    this.approachBar(gate, plan);
    for (let i = this.used; i < this.panels.length; i++) this.panels[i].object.enabled = false;
  }

  /** Floor line where the room in front of the gate runs out; red when the turn does not fit in it. */
  private approachBar(gate: Gate, plan: Plan) {
    if (gate.kind === "corner" || !gate.approach) return;
    const blocked = plan.reason === "approach";
    this.box("glow", 0, 0.8, gate.approach.depth * CM, 260, 1.6, 3, blocked ? TONES.blocked : TONES.info);
  }

  /** Cutaway plan of an L-shaped hall: walls 100 cm high so the whole turn can be seen from above eye level. */
  private corner(a: number, b: number, tone: Tone) {
    const wall = 30;
    const t = 6;
    const reach = 200;
    const west = -reach;
    this.box("wall", (west + b + t) / 2, wall / 2, -a - t / 2, b - west + t, wall, t);
    this.box("wall", b + t / 2, wall / 2, (reach - a - t) / 2, t, wall, reach + a + t);
    this.box("wall", west / 2, wall / 2, t / 2, -west, wall, t);
    this.box("wall", -t / 2, wall / 2, reach / 2, t, wall, reach);
    this.box("ghost", (west + b) / 2, 0.5, -a / 2, b - west, 1, a, TONES.info);
    this.box("ghost", b / 2, 0.5, reach / 2, b, 1, reach, TONES.info);
    this.box("glow", 0, wall / 2, 0, 3, wall + 10, 3, TONES[tone]);
  }
}
