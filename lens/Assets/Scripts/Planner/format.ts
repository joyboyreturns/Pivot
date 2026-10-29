/**
 * Length for people: millimetres under 1 cm so a real but small margin never reads as "0 cm",
 * otherwise whole centimetres. Takes metres and ignores the sign (callers say "to spare" or "too tight").
 * Rounding is for reading only; it does not say the dimensions were measured this precisely.
 */
export function lengthText(metres: number): string {
  const d = Math.abs(metres);
  if (d > 0 && d < 0.01) return `${Math.max(1, Math.round(d * 1000))} mm`;
  return `${Math.round(d * 100)} cm`;
}
