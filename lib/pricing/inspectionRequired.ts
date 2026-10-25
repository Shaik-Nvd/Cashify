/**
 * Raised by a price calculator when the honest answer is "no instant price": Cashify itself declines this condition, or
 * the combination is outside the evidence the calculator was calibrated on. The quote service turns it into the existing
 * MANUAL_INSPECTION_REQUIRED outcome; it must never be turned into a number.
 */
export class InspectionRequiredError extends Error {
  constructor(readonly reason: string) {
    super(`manual inspection required: ${reason}`);
    this.name = 'InspectionRequiredError';
  }
}
