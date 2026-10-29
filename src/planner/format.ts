/** Below a nanometre is floating-point noise (a sofa 85 cm tall in an 85 cm door gives -1.1e-16 m), not a margin. */
const NOISE = 1e-9;

/**
 * Length for people: millimetres under 1 cm so a real but small margin never reads as "0 cm",
 * otherwise whole centimetres. Takes metres and ignores the sign (callers say "to spare" or "too tight").
 * A value that is only floating-point noise is zero, so it reads "0 cm" rather than "1 mm".
 * Rounding is for reading only; it does not say the dimensions were measured this precisely.
 */
export function lengthText(metres: number): string {
  const d = Math.abs(metres);
  if (d >= NOISE && d < 0.01) return `${Math.max(1, Math.round(d * 1000))} mm`;
  return `${Math.round(d * 100)} cm`;
}
