import type { Box, Doorway, Pose } from "./types";

const rad = (d: number) => (d * Math.PI) / 180;

type Mat3 = [number, number, number, number, number, number, number, number, number];

function mul(a: Mat3, b: Mat3): Mat3 {
  const r = new Array<number>(9).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) r[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!;
  return r as Mat3;
}

export function rotationMatrix(p: Pose): Mat3 {
  const [cx, sx] = [Math.cos(rad(p.pitch)), Math.sin(rad(p.pitch))];
  const [cy, sy] = [Math.cos(rad(p.yaw)), Math.sin(rad(p.yaw))];
  const [cz, sz] = [Math.cos(rad(p.roll)), Math.sin(rad(p.roll))];
  const rx: Mat3 = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const ry: Mat3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const rz: Mat3 = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mul(rz, mul(ry, rx));
}

/** Axis-aligned extent of the posed box along world x (across the wall), y (up) and z (the carry direction). */
export function extents(box: Box, pose: Pose): { x: number; y: number; z: number } {
  const m = rotationMatrix(pose);
  const dims = [box.length, box.height, box.depth];
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < 3; i++) {
    x += Math.abs(m[i]!) * dims[i]!;
    y += Math.abs(m[3 + i]!) * dims[i]!;
    z += Math.abs(m[6 + i]!) * dims[i]!;
  }
  return { x, y, z };
}

/**
 * Extent of the box's silhouette along the door's width (x) and height (y) axes
 * when carried through along z in the given pose.
 */
export function silhouette(box: Box, pose: Pose): { width: number; height: number } {
  const e = extents(box, pose);
  return { width: e.x, height: e.y };
}

/** Spare room in the tightest axis; negative means it does not fit. */
export function clearance(box: Box, door: Doorway, pose: Pose): number {
  const s = silhouette(box, pose);
  return Math.min(door.width - s.width, door.height - s.height);
}
