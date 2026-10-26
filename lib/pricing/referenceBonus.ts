/** Owner-approved 26 October 2026: bonus is based on the original database reference. */
export function referenceBonus(reference: number): number {
  const rate = reference <= 20000 ? 0.08 : reference <= 50000 ? 0.06 : 0.04;
  return Math.min(reference * rate, 2000);
}
