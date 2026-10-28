/** Small, reusable solid parts inside the measured unit box. No texture downloads or
 * extra scene wiring: every preset keeps its silhouette when its dimensions change. */
type Color = "wood" | "cream" | "metal" | "blue" | "coral" | "teal" | "glass";

export class ObjectModel {
  private parts: SceneObject[] = [];
  private used = 0;
  private materials: { [name: string]: Material } = {};
  private visible = true;

  constructor(private parent: SceneObject, private mesh: RenderMesh, private solid: Material, private ghost: Material) {}

  private material(color: Color): Material {
    if (!this.materials[color]) {
      const palette: { [name: string]: vec4 } = {
        wood: new vec4(0.8, 0.58, 0.34, 1), cream: new vec4(1, 0.93, 0.78, 1),
        metal: new vec4(0.68, 0.8, 0.9, 1), blue: new vec4(0.32, 0.55, 0.8, 1),
        coral: new vec4(1, 0.55, 0.4, 1), teal: new vec4(0.28, 0.85, 0.77, 1),
        glass: new vec4(0.55, 0.92, 1, 0.12),
      };
      const material = (color === "glass" ? this.ghost : this.solid).clone();
      material.mainPass.baseColor = palette[color];
      this.materials[color] = material;
    }
    return this.materials[color];
  }

  private part(x: number, y: number, z: number, w: number, h: number, d: number, color: Color): void {
    let object = this.parts[this.used];
    if (!object) {
      object = global.scene.createSceneObject("Object craft " + this.used);
      object.setParent(this.parent);
      const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      visual.mesh = this.mesh;
      this.parts.push(object);
    }
    this.used++;
    object.enabled = this.visible;
    const visual = object.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mainMaterial = this.material(color);
    object.getTransform().setLocalPosition(new vec3(x, y, z));
    object.getTransform().setLocalScale(new vec3(w, h, d));
  }

  private legs(top: number, color: Color = "wood"): void {
    const height = top + 0.5;
    for (const x of [-0.43, 0.43]) for (const z of [-0.4, 0.4]) this.part(x, -0.5 + height / 2, z, 0.1, height, 0.12, color);
  }

  private rim(y: number, color: Color): void {
    this.part(0, y, -0.48, 1, 0.035, 0.04, color);
    this.part(0, y, 0.48, 1, 0.035, 0.04, color);
    this.part(-0.48, y, 0, 0.04, 0.035, 0.92, color);
    this.part(0.48, y, 0, 0.04, 0.035, 0.92, color);
  }

  show(name: string): void {
    this.used = 0;
    this.visible = true;
    const n = name.toLowerCase();
    if (n.includes("bench") || n.includes("desk") || n.includes("table")) {
      this.part(0, 0.44, 0, 1, 0.12, 1, "wood");
      this.legs(0.38, n.includes("bench") ? "metal" : "wood");
      this.part(0, 0.25, 0.37, 0.7, 0.2, 0.2, "cream");
      this.part(0, 0.25, 0.48, 0.18, 0.035, 0.025, "metal");
      if (n.includes("bench")) this.part(0, -0.25, 0, 0.82, 0.06, 0.72, "blue");
    } else if (n.includes("armchair")) {
      this.legs(-0.3);
      this.part(0, -0.12, 0.04, 0.78, 0.28, 0.8, "coral");
      this.part(0, 0.16, -0.38, 0.94, 0.68, 0.24, "coral");
      for (const x of [-0.42, 0.42]) this.part(x, 0.02, 0.04, 0.16, 0.5, 0.92, "coral");
      this.part(0, 0.04, 0.07, 0.62, 0.08, 0.64, "cream");
    } else if (n.includes("bed")) {
      this.legs(-0.25);
      this.part(0, -0.2, 0, 1, 0.16, 1, "wood");
      this.part(0, -0.02, 0.01, 0.95, 0.2, 0.92, "cream");
      this.part(-0.47, 0.12, 0, 0.06, 0.76, 1, "wood");
      this.part(0.1, 0.11, 0, 0.62, 0.06, 0.92, "blue");
      for (const z of [-0.23, 0.23]) this.part(-0.29, 0.12, z, 0.2, 0.1, 0.38, "cream");
    } else if (n.includes("mattress")) {
      this.part(0, 0, 0, 1, 0.92, 1, "cream");
      this.rim(-0.3, "blue"); this.rim(0.3, "blue");
      for (const x of [-0.3, 0, 0.3]) for (const z of [-0.3, 0, 0.3]) this.part(x, 0.47, z, 0.07, 0.035, 0.07, "metal");
    } else if (n.includes("aquarium")) {
      this.part(0, -0.47, 0, 1, 0.06, 1, "metal");
      this.rim(0.48, "metal");
      for (const x of [-0.48, 0.48]) for (const z of [-0.48, 0.48]) this.part(x, 0, z, 0.04, 0.94, 0.04, "metal");
      for (const z of [-0.48, 0.48]) this.part(0, 0, z, 0.92, 0.9, 0.02, "glass");
      for (const x of [-0.48, 0.48]) this.part(x, 0, 0, 0.02, 0.9, 0.92, "glass");
    } else if (n.includes("flight case")) {
      this.part(0, 0.04, 0, 0.95, 0.9, 0.95, "blue");
      this.rim(-0.4, "metal"); this.rim(0.25, "metal"); this.rim(0.48, "metal");
      for (const x of [-0.46, 0.46]) for (const z of [-0.46, 0.46]) this.part(x, 0.04, z, 0.07, 0.85, 0.07, "metal");
      for (const x of [-0.28, 0.28]) this.part(x, 0.25, 0.49, 0.08, 0.14, 0.02, "cream");
      this.part(0, -0.01, 0.49, 0.24, 0.06, 0.02, "metal");
      for (const x of [-0.35, 0.35]) for (const z of [-0.33, 0.33]) this.part(x, -0.45, z, 0.1, 0.1, 0.12, "metal");
    } else if (n.includes("crate")) {
      this.part(0, 0, 0, 0.96, 0.96, 0.96, "wood");
      for (const x of [-0.43, 0.43]) this.part(x, 0, 0.49, 0.1, 1, 0.02, "cream");
      for (const y of [-0.44, 0.44]) this.part(0, y, 0.49, 0.8, 0.1, 0.02, "cream");
      for (const x of [-0.2, 0.2]) this.part(x, 0, 0.49, 0.045, 0.8, 0.02, "cream");
      this.part(0, 0.1, 0.5, 0.26, 0.28, 0.001, n.includes("art") ? "coral" : "teal");
      this.part(0, 0.14, 0.5, 0.13, 0.04, 0.001, "cream");
    } else if (n.includes("piano")) {
      this.part(0, 0.08, -0.13, 1, 0.84, 0.74, "wood");
      this.part(0, 0.46, -0.08, 1, 0.08, 0.84, "cream");
      this.part(0, -0.05, 0.33, 0.94, 0.09, 0.34, "wood");
      for (let i = 0; i < 12; i++) this.part(-0.4125 + i * 0.075, 0.01, 0.33, 0.067, 0.035, 0.3, "cream");
      for (const i of [1, 2, 4, 5, 6, 8, 9]) this.part(-0.45 + i * 0.075, 0.04, 0.24, 0.032, 0.025, 0.16, "blue");
      for (const x of [-0.42, 0.42]) this.part(x, -0.28, 0.24, 0.12, 0.44, 0.18, "wood");
    } else if (n.includes("bookcase")) {
      for (const x of [-0.46, 0.46]) this.part(x, 0, 0, 0.08, 1, 1, "wood");
      this.part(0, 0, -0.47, 0.84, 1, 0.06, "wood");
      for (let i = 0; i < 5; i++) {
        const y = -0.47 + i * 0.235;
        this.part(0, y, 0, 0.84, 0.04, 0.94, "cream");
        if (i < 4) for (let j = 0; j < 3; j++) this.part(-0.25 + j * 0.18, y + 0.1, 0.12, 0.12, 0.16, 0.6, j % 2 ? "teal" : "coral");
      }
    } else if (n.includes("treadmill")) {
      this.part(0, -0.4, 0, 1, 0.2, 1, "metal");
      this.part(0.05, -0.28, 0, 0.82, 0.04, 0.76, "blue");
      for (const z of [-0.4, 0.4]) this.part(-0.35, 0, z, 0.08, 0.8, 0.08, "metal");
      this.part(-0.35, 0.43, 0, 0.24, 0.14, 1, "blue");
      this.part(-0.35, 0.49, 0, 0.18, 0.02, 0.35, "teal");
    } else {
      // Wardrobe and appliances retain full box silhouettes with inset doors and hardware.
      this.part(0, 0, 0, 1, 1, 0.96, n.includes("wardrobe") ? "wood" : "cream");
      if (n.includes("washing")) {
        this.part(0, -0.07, 0.49, 0.64, 0.64, 0.02, "metal");
        this.part(0, -0.07, 0.5, 0.46, 0.46, 0.001, "blue");
        this.part(-0.17, 0.37, 0.49, 0.4, 0.08, 0.02, "metal");
        this.part(0.32, 0.37, 0.49, 0.1, 0.1, 0.02, "teal");
      } else if (n.includes("fridge")) {
        this.part(0, 0.18, 0.49, 0.96, 0.018, 0.02, "metal");
        for (const y of [0.33, -0.12]) this.part(0.35, y, 0.49, 0.035, 0.23, 0.02, "metal");
      } else {
        this.part(0, 0, 0.49, 0.012, 0.96, 0.02, "cream");
        for (const x of [-0.07, 0.07]) this.part(x, 0.02, 0.49, 0.018, 0.14, 0.02, "cream");
      }
    }
    for (let i = this.used; i < this.parts.length; i++) this.parts[i].enabled = false;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    for (let i = 0; i < this.used; i++) this.parts[i].enabled = visible;
  }
}
