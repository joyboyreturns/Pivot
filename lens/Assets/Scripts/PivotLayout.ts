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
  title: 44,
  hero: 60,
  line: 32,
  small: 32,
  button: 38,
  tag: 32,
};

/** Rough width (cm) of a line of Text3D at a size, for left-aligning a label beside its marker. */
export const textWidth = (text: string, size: number): number => {
  let longest = 0;
  for (const line of text.split("\n")) longest = Math.max(longest, line.length);
  return longest * size * 0.0155;
};

/** A gap or margin as text: whole centimetres, but millimetres under 1 cm so a real 4 mm margin never reads "0 CM". */
export const lengthText = (m: number): string => {
  const d = Math.abs(m);
  if (d > 0 && d < 0.01) return `${Math.max(1, Math.round(d * 1000))} MM`;
  return `${Math.round(d * 100)} CM`;
};

export const RAIL_HALF = 16;

/**
 * The row of controls just beyond the table's front edge (the table is 46 cm deep, centred 4 cm in front of
 * TABLE_Z). A hall 2.4 to 3 m deep ends at the table edge, so its limit bar and handle would sit on the tokens
 * if the row were on the table.
 */
export const FRONT_Z = TABLE_Z + 27;

/** Gate tokens along the front edge of the table. */
export const tokenAt = (i: number): vec3 => W(-22 + i * 15, TABLE_TOP - 2, FRONT_Z);
export const tokenLabelAt = (i: number): vec3 => W(-22 + i * 15 + 7, TABLE_TOP - 2, FRONT_Z);

/**
 * The scrub rail under the tokens and the next-step arrow past its right end. The rail's handle is 16 cm wide, so at the
 * end of the rail it reaches x = RAIL_HALF + 8; the arrow sits beyond that so it can still be pinched to replay.
 */
export const RAIL_AT = (): vec3 => W(0, TABLE_TOP - 5.5, FRONT_Z);
export const ARROW_AT = (): vec3 => W(RAIL_HALF + 13, TABLE_TOP - 5.5, FRONT_Z);

/** Left column: modes and sandbox buttons. Right column: steppers. */
export const leftColumn = (row: number): number => 14 - row * 6;
export const LEFT_X = -27;
export const RIGHT_X = 22;
