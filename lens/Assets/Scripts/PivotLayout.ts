/**
 * Where everything sits. The wearer's eye is the world origin looking down -z; the glasses' display is
 * narrow (about 32 x 37 degrees) and focuses near 1 m, so the whole experience lives on a "move table"
 * about 1.1 m ahead and a little below eye level, inside roughly +-38 cm sideways and +-26 cm up and down.
 * Numbers are centimetres in world space; `W` converts to the local space of the PIVOT Scene root.
 */
export const ROOT = new vec3(0, -150, -500);
export const W = (x: number, y: number, z: number): vec3 => new vec3(x - ROOT.x, y - ROOT.y, z - ROOT.z);

/** Model scale of the stage: 1 m of room is 10 cm on the table. */
export const MODEL_SCALE = 0.1;
export const TABLE_Z = -110;
export const TABLE_TOP = -20;

export const SIZES = {
  title: 46,
  hero: 78,
  line: 40,
  small: 34,
  button: 42,
  tag: 36,
};

/** Rough width (cm) of a line of Text3D at a size, for left-aligning a label beside its marker. */
export const textWidth = (text: string, size: number): number => {
  let longest = 0;
  for (const line of text.split("\n")) longest = Math.max(longest, line.length);
  return longest * size * 0.0155;
};

export const RAIL_HALF = 16;

/** Gate tokens along the front edge of the table. */
export const tokenAt = (i: number): vec3 => W(-22 + i * 15, TABLE_TOP - 2, TABLE_Z + 22);
export const tokenLabelAt = (i: number): vec3 => W(-22 + i * 15 + 7, TABLE_TOP - 2, TABLE_Z + 22);

/** The scrub rail under the tokens and the next-step arrow at its right end. */
export const RAIL_AT = (): vec3 => W(0, TABLE_TOP - 5.5, TABLE_Z + 22);
export const ARROW_AT = (): vec3 => W(19, TABLE_TOP - 5.5, TABLE_Z + 22);

/** Left column: modes and sandbox buttons. Right column: steppers. */
export const leftColumn = (row: number): number => 14 - row * 6;
export const LEFT_X = -27;
export const RIGHT_X = 22;
