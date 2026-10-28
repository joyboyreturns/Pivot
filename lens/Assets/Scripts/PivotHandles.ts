import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";
import type { HandleSpec } from "./Planner/index";
import { SIZES } from "./PivotLayout";

const CM = 100;
/** A drag is passed on at most this often (s); the planner answers in a few milliseconds. */
const PUSH_EVERY = 0.05;
const LABEL_LINGER = 1.4;

const IDLE_GATE = new vec4(0.3, 0.95, 0.93, 1);
const IDLE_BOX = new vec4(1, 0.86, 0.5, 1);
const HOVER = new vec4(1, 1, 1, 1);
const HELD = new vec4(1, 0.72, 0.2, 1);

interface Grip {
  object: SceneObject;
  material: Material;
  interactable: Interactable;
  manipulation: InteractableManipulation;
  spec: HandleSpec | null;
  hovered: boolean;
  dragging: boolean;
  /** The handle as it was when the drag began: every drag is measured against it, so re-planning never drifts it. */
  from: HandleSpec | null;
  lastCm: number;
  lastPush: number;
}

/**
 * Grab points on the edges of the object and the gate. Pinch one and pull it along its axis: the number
 * changes under the hand, the planner answers on every step, and the verdict, trail and fix tags follow.
 * The planner describes the handles (`gateHandles`, `boxHandles`); this class only draws them and turns hand
 * movement into a distance along each handle's axis.
 */
export class Handles {
  private grips: Grip[] = [];
  private shownLabel: Grip | null = null;
  private labelUntil = 0;
  private size = 0;

  constructor(
    private parent: SceneObject,
    private mesh: RenderMesh,
    private template: Material,
    private label: Text3D,
    private toWorld: (p: vec3) => vec3,
    private toStage: (p: vec3) => vec3,
    private onDrag: (from: HandleSpec, delta: number, begin: boolean) => void
  ) {
    label.size = SIZES.tag;
    label.getSceneObject().enabled = false;
  }

  private make(): Grip {
    const object = global.scene.createSceneObject("Handle " + this.grips.length);
    object.setParent(this.parent);
    const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mesh = this.mesh;
    const material = this.template.clone();
    visual.mainMaterial = material;
    const collider = object.createComponent("Physics.ColliderComponent");
    const shape = Shape.createBoxShape();
    shape.size = new vec3(5, 5, 5);
    collider.shape = shape;
    const interactable = object.createComponent(Interactable.getTypeName()) as Interactable;
    interactable.targetingMode = 3;
    const manipulation = object.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
    manipulation.setCanRotate(false);
    manipulation.setCanScale(false);
    const grip: Grip = { object, material, interactable, manipulation, spec: null, hovered: false, dragging: false, from: null, lastCm: 0, lastPush: 0 };
    interactable.onHoverEnter.add(() => { grip.hovered = true; this.showLabel(grip); });
    interactable.onHoverExit.add(() => { grip.hovered = false; });
    manipulation.onManipulationStart.add(() => this.begin(grip));
    manipulation.onManipulationEnd.add(() => this.end(grip));
    return grip;
  }

  private showLabel(grip: Grip): void {
    this.shownLabel = grip;
    this.labelUntil = getTime() + LABEL_LINGER;
  }

  private begin(grip: Grip): void {
    if (!grip.spec) return;
    grip.dragging = true;
    grip.from = grip.spec;
    grip.lastCm = 0;
    grip.lastPush = 0;
    this.showLabel(grip);
    this.onDrag(grip.spec, 0, true);
  }

  private end(grip: Grip): void {
    if (!grip.dragging) return;
    this.push(grip, true);
    grip.dragging = false;
    grip.from = null;
    this.showLabel(grip);
  }

  /** Metres the hand has pulled the handle along its axis since the drag began. */
  private pulled(grip: Grip): number {
    const from = grip.from!;
    const local = this.toStage(grip.object.getTransform().getWorldPosition());
    return local[from.axis] / CM - from.at[from.axis];
  }

  private push(grip: Grip, force: boolean): void {
    if (!grip.from) return;
    const delta = this.pulled(grip);
    const cm = Math.round(delta * CM);
    if (cm === grip.lastCm && !force) return;
    if (!force && getTime() - grip.lastPush < PUSH_EVERY) return;
    grip.lastCm = cm;
    grip.lastPush = getTime();
    this.onDrag(grip.from, cm / CM, false);
  }

  /** Place one handle per spec on the stage; `scale` is the handle's size in world cm. */
  show(specs: HandleSpec[], scale: number): void {
    while (this.grips.length < specs.length) this.grips.push(this.make());
    if (scale !== this.size) {
      this.size = scale;
      for (const grip of this.grips) this.resize(grip);
    }
    this.grips.forEach((grip, i) => {
      const spec = specs[i];
      grip.spec = spec || null;
      grip.object.enabled = !!spec;
      if (!spec) return;
      // Handles keep their kind from slot to slot only by index, so a slot's look is set whenever its spec changes.
      grip.object.getTransform().setWorldPosition(this.toWorld(new vec3(spec.at.x * CM, spec.at.y * CM, spec.at.z * CM)));
    });
  }

  private resize(grip: Grip): void {
    grip.object.getTransform().setWorldScale(new vec3(this.size, this.size, this.size));
    grip.object.getTransform().setLocalRotation(quat.fromEulerAngles(0.6, 0.78, 0));
    const collider = grip.object.getComponent("Physics.ColliderComponent");
    const shape = Shape.createBoxShape();
    // The collider is generous: it is in the object's own units, which carry the cube's size already.
    shape.size = new vec3(1.9, 1.9, 1.9);
    collider.shape = shape;
  }

  /** Hide everything (while the wearer is not editing anything). */
  hide(): void {
    for (const grip of this.grips) grip.object.enabled = false;
    this.label.getSceneObject().enabled = false;
  }

  /** Grab the handle for a parameter from code (used by the tests: the hand drives the same path). */
  gripFor(key: string): SceneObject | null {
    const grip = this.grips.find((g) => g.spec && g.spec.key === key && g.object.enabled);
    return grip ? grip.object : null;
  }

  /** Simulate a drag from code: move the handle to a stage point and run the same path a hand would. */
  dragTo(key: string, stagePoint: vec3): boolean {
    const grip = this.grips.find((g) => g.spec && g.spec.key === key && g.object.enabled);
    if (!grip || !grip.spec) return false;
    this.begin(grip);
    grip.object.getTransform().setWorldPosition(this.toWorld(stagePoint));
    this.push(grip, true);
    this.end(grip);
    return true;
  }

  /** Call every frame after the interaction kit has moved the handles. */
  late(): void {
    const now = getTime();
    for (const grip of this.grips) {
      if (!grip.spec || !grip.object.enabled) continue;
      if (grip.dragging) {
        this.push(grip, false);
        // Keep the handle on its axis and on the edge it changes, whatever the hand does sideways.
        const spec = grip.spec;
        const hand = this.toStage(grip.object.getTransform().getWorldPosition());
        const snapped = new vec3(spec.at.x * CM, spec.at.y * CM, spec.at.z * CM);
        snapped[spec.axis] = hand[spec.axis];
        grip.object.getTransform().setWorldPosition(this.toWorld(snapped));
      }
      const idle = grip.spec.scope === "box" ? IDLE_BOX : IDLE_GATE;
      const colour = grip.dragging ? HELD : grip.hovered ? HOVER : idle;
      grip.material.mainPass.baseColor = new vec4(colour.x, colour.y, colour.z, grip.spec.proposal ? 0.55 : 1);
    }
    const grip = this.shownLabel;
    const live = grip && grip.spec && grip.object.enabled && (grip.dragging || grip.hovered || now < this.labelUntil);
    const object = this.label.getSceneObject();
    object.enabled = !!live;
    if (live && grip && grip.spec) {
      const spec = grip.spec;
      this.label.text = spec.proposal ? `${spec.label}\nPULL TO SET` : `${spec.label}\n${Math.round(spec.value * CM)} CM`;
      const p = grip.object.getTransform().getWorldPosition();
      object.getTransform().setWorldPosition(new vec3(p.x, p.y + this.size * 2.4, p.z + this.size * 2));
    }
  }
}
