import { TapInteraction } from "./TapInteraction";
import { LEFT_X, RIGHT_X, SIZES, W, leftColumn, textWidth } from "./PivotLayout";
import { boxParams, customScenario, gateParams, nextGate, objectLibrary, placeLibrary, withBoxParam, withGateParam } from "./Planner/index";
import type { Box, Gate, Param, Scenario } from "./Planner/index";
import type { ObjectPreset } from "./Planner/index";

const MAX_ROWS = 5;
const MAX_GATES = 3;

/** Wire one of the editor-authored pinch buttons: a marker cube, a label, hover glow and a tap handler. */
export function wireButton(find: (n: string) => SceneObject, text: (n: string) => Text3D, target: string, label: string, caption: string, onTap: () => void): Button {
  const object = find(target);
  const tap = object.getComponent("Component.ScriptComponent") as unknown as TapInteraction;
  const marker = object.getChild(0).getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
  const material = marker.mainMaterial.clone();
  marker.mainMaterial = material;
  marker.getSceneObject().getTransform().setLocalScale(new vec3(3.6, 3.6, 3.6));
  const t = text(label);
  t.size = SIZES.button;
  t.text = caption;
  tap.onHoverStart.add(() => { material.mainPass.baseColor = new vec4(0.6, 1, 1, 1); });
  tap.onHoverEnd.add(() => { material.mainPass.baseColor = new vec4(0.32, 0.53, 0.58, 1); });
  tap.onTap.add(onTap);
  return { object, label: t, tap, material };
}

/** What the sandbox needs from the analysis it drives. */
export interface SandboxHost {
  apply(scenario: Scenario, gateIndex: number): void;
  gateIndex(): number;
  gateCount(): number;
  setSwitchLabel(text: string): void;
}

export interface Button {
  object: SceneObject;
  label: Text3D;
  tap: TapInteraction;
  material: Material;
}

/**
 * "Your move": any object from the library (or your own sizes) through any place or a route you build, with
 * steppers for every number. It only edits an object and a list of gates and hands the result to the analysis,
 * so the planner stays the single source of truth.
 */
export class Sandbox {
  public active = false;
  public editObject = false;
  private presetIndex = 0;
  private preset: ObjectPreset = objectLibrary[0];
  private placeIndex = 0;
  private box: Box = objectLibrary[0].box;
  private gates: Gate[] = placeLibrary[0].gates.slice();
  private buttons: { [name: string]: Button } = {};
  private rows: { minus: Button; plus: Button; label: Text3D; param: Param | null; lastTap: number; lastDir: number }[] = [];
  private shown: Param[] = [];

  constructor(
    private host: SandboxHost,
    private find: (name: string) => SceneObject,
    private text: (name: string) => Text3D
  ) {}

  private button(target: string, label: string, text: string, onTap: () => void): Button {
    return wireButton(this.find, this.text, target, label, text, onTap);
  }

  /** Wire up the buttons; the scene objects are authored in the editor. */
  init(onToggle: () => void): void {
    this.buttons.mode = this.button("Mode target", "Mode label", "YOUR MOVE ›", onToggle);
    this.buttons.object = this.button("Object target", "Object label", "NEXT OBJECT ›", () => this.nextObject());
    this.buttons.add = this.button("Gate add target", "Gate add label", "+ GATE", () => this.addGate());
    this.buttons.remove = this.button("Gate remove target", "Gate remove label", "– GATE", () => this.removeGate());
    this.buttons.objectChip = this.button("Object chip", "Object chip label", "OBJECT", () => { this.editObject = true; this.push(); });
    for (let i = 0; i < MAX_ROWS; i++) {
      const dir = (d: number) => () => this.step(i, d);
      this.rows.push({
        minus: this.button(`Param minus ${i + 1}`, `Param label ${i + 1}`, "", dir(-1)),
        plus: this.button(`Param plus ${i + 1}`, `Param label ${i + 1}`, "", dir(1)),
        label: this.text(`Param label ${i + 1}`),
        param: null,
        lastTap: -9,
        lastDir: 0,
      });
    }
    this.show();
  }

  public enter(): void {
    this.active = true;
    this.editObject = false;
    this.presetIndex = 0;
    this.placeIndex = 0;
    this.preset = objectLibrary[0];
    this.box = objectLibrary[0].box;
    this.gates = placeLibrary[0].gates.slice();
    this.push(0);
  }

  /** Take over the scenario on screen, with a change applied (a suggested fix): the wearer can keep editing from there. */
  public adopt(boxName: string, box: Box, gates: Gate[], gateIndex: number): void {
    const name = boxName.replace(/ \d+ x \d+ x \d+ cm$/, "");
    const found = objectLibrary.findIndex((o) => o.name === name);
    this.presetIndex = found >= 0 ? found : 0;
    this.preset = found >= 0 ? objectLibrary[found] : { id: "custom", name, box, look: name.toLowerCase().indexOf("sofa") >= 0 ? "sofa" : "box" };
    this.active = true;
    this.editObject = false;
    this.box = box;
    this.gates = gates.slice();
    this.push(gateIndex);
  }

  public exit(): void {
    this.active = false;
    this.show();
  }

  /** Called by the analysis when a gate chip was pinched while in your-move mode. */
  public selectGate(): void {
    this.editObject = false;
    this.show();
  }

  public nextObject(): void {
    this.presetIndex = (this.presetIndex + 1) % objectLibrary.length;
    this.preset = objectLibrary[this.presetIndex];
    this.box = this.preset.box;
    this.push();
  }

  public nextPlace(): void {
    this.placeIndex = (this.placeIndex + 1) % placeLibrary.length;
    this.gates = placeLibrary[this.placeIndex].gates.slice();
    this.push(0);
  }

  private addGate(): void {
    if (this.gates.length >= MAX_GATES) return;
    this.gates = this.gates.concat([nextGate(this.gates)]);
    this.editObject = false;
    this.push(this.gates.length - 1);
  }

  private removeGate(): void {
    if (this.gates.length <= 1) return;
    const at = this.host.gateIndex();
    this.gates = this.gates.filter((_, i) => i !== at);
    this.editObject = false;
    this.push(Math.max(0, at - 1));
  }

  private current(): Scenario {
    const scenario = customScenario(this.preset, this.gates, this.box);
    scenario.title = "Your move";
    return scenario;
  }

  private push(gate?: number): void {
    this.host.apply(this.current(), gate === undefined ? this.host.gateIndex() : gate);
    this.show();
  }

  /** One tap on a stepper: 1 cm, or 5 cm when tapped again quickly in the same direction. */
  private step(row: number, dir: number): void {
    const r = this.rows[row];
    const p = this.shown[row];
    if (!p) return;
    const now = getTime();
    const fast = now - r.lastTap < 0.7 && r.lastDir === dir;
    r.lastTap = now;
    r.lastDir = dir;
    let v = p.value + dir * (fast ? 0.05 : 0.01);
    if (p.optional) {
      if (dir > 0 && p.value < 0.3) v = 1.0;
      else if (dir < 0 && p.value <= 1.0 + 1e-6) v = 0;
    }
    if (this.editObject) {
      this.box = withBoxParam(this.box, p.id, v);
    } else {
      const at = this.host.gateIndex();
      this.gates = this.gates.map((g, i) => (i === at ? withGateParam(g, p.id, v) : g));
    }
    this.push();
  }

  public params(): Param[] {
    if (this.editObject) return boxParams(this.box);
    const at = Math.min(this.host.gateIndex(), this.gates.length - 1);
    return gateParams(this.gates[at]);
  }

  private display(p: Param): string {
    if (p.optional && p.value < 0.3) return "—";
    return `${Math.round(p.value * 100)}`;
  }

  /** Position and fill every sandbox control; hide all of them when the sandbox is off. */
  public show(): void {
    const on = this.active;
    const place = (name: string, x: number, y: number, z: number) => this.find(name).getTransform().setLocalPosition(W(x, y, z));
    for (const key of Object.keys(this.buttons)) {
      const b = this.buttons[key];
      b.object.enabled = key === "mode" ? true : on;
      b.label.getSceneObject().enabled = key === "mode" ? true : on;
    }
    const at = (target: string, label: string, row: number) => {
      place(target, LEFT_X, leftColumn(row), -108);
      place(label, LEFT_X + 3 + textWidth(this.text(label).text, SIZES.button) / 2, leftColumn(row), -108);
    };
    this.buttons.mode.label.text = on ? "‹ SCENARIOS" : "YOUR MOVE ›";
    this.host.setSwitchLabel(on ? "NEXT PLACE ›" : "NEXT SCENARIO ›");
    at("Mode target", "Mode label", 0);
    at("Scenario switch target", "Scenario switch label", 1);
    at("Size target", "Size label", 2);
    this.shown = on ? this.params() : [];
    const object = this.buttons.objectChip;
    object.label.text = `${this.editObject ? "› " : ""}${this.preset.name.toUpperCase()}`;
    at("Object chip", "Object chip label", 3);
    object.material.mainPass.baseColor = this.editObject ? new vec4(0.6, 1, 1, 1) : new vec4(0.32, 0.53, 0.58, 1);
    // The gate buttons stay put (a control that vanishes under the wearer's pinch feels broken); at the limits they do nothing.
    this.buttons.add.label.text = this.gates.length < MAX_GATES ? "+ GATE" : "3 GATES MAX";
    this.buttons.remove.label.text = this.gates.length > 1 ? "– GATE" : "1 GATE MIN";
    at("Object target", "Object label", 4);
    at("Gate add target", "Gate add label", 5);
    at("Gate remove target", "Gate remove label", 6);
    for (let i = 0; i < MAX_ROWS; i++) {
      const row = this.rows[i];
      const p = this.shown[i];
      const y = 14 - i * 6;
      row.param = p || null;
      for (const b of [row.minus, row.plus]) b.object.enabled = !!p;
      row.label.getSceneObject().enabled = !!p;
      place(`Param minus ${i + 1}`, RIGHT_X - 7.5, y, -108);
      place(`Param plus ${i + 1}`, RIGHT_X + 7.5, y, -108);
      place(`Param label ${i + 1}`, RIGHT_X + 0.5, y, -108);
      if (p) row.label.text = `– ${p.label} ${this.display(p)} +`;
    }
  }
}
