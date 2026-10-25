import { customerPayout, DISPLAY_DEDUCTION, DISPLAY_DEDUCTION_EXEMPT_PRICE, FIRST_TIME_COUPON_BONUS } from './payout';

/**
 * The owner's hard limit on what Fhoneify may pay above Cashify, applied to the amount the CUSTOMER RECEIVES:
 *
 *   customer payout <= Cashify-equivalent payout + min(8% of that payout, INR 2,000)
 *
 * It sits AFTER the existing uplift (applyCompetitorUplift is unchanged: 8% / 6% / 4% by price band, INR 2,000 cap) and
 * binds every other adjustment too - the INR 99 display fee, rounding, the first-time coupon, exact-quote bounds -
 * so none of them can push the payout over the ceiling. The 8% / 6% / 4% tiers are untouched; they were already at
 * or below 8%, and the uplift is applied exactly once.
 *
 * Three Cashify prices appear in the evidence and are never mixed up here:
 *   base price      what Cashify calls "Get Upto" for a clean device; the engine's Cashify-equivalent is on this basis
 *   selling price   the headline quote = base price - INR 20 IMEI validation fee (2,238 of 2,238 recorded quotes)
 *   payout          selling price - Cashify's processing fee (49 / 69 / 99): what the customer actually receives
 * Fhoneify charges its own INR 99 display fee and no IMEI fee, so with the same Cashify-equivalent a Fhoneify customer
 * is structurally ~INR 20 ahead before any uplift; the ceiling counts that as part of the extra.
 *
 * Browser-safe: no imports beyond ./payout.
 */
export const PAYOUT_CEILING_POLICY = {
  maxRate: 0.08,
  maxExtraRupees: 2000,
  /** Cashify's IMEI validation fee (selling price = base price - this). Set to 0 to compare base-to-quote instead. */
  cashifyImeiFee: 20,
} as const;

/**
 * Cashify's processing fee by headline selling price, from the collected quotes: 49 up to 2,880; 69 for 4,090-4,190;
 * 99 from 5,760 up (the largest quote, 164,980, is 99). The unobserved gaps (2,881-4,089, 4,191-5,759) use 99: a larger
 * Cashify fee means a smaller Cashify payout and therefore a tighter ceiling, never a looser one.
 */
export function cashifyProcessingFee(headlineSelling: number): number {
  if (headlineSelling <= 2880) return 49;
  if (headlineSelling >= 4090 && headlineSelling <= 4190) return 69;
  return 99;
}

/** What a customer receives from Cashify for a headline selling price. */
export function cashifyPayout(headlineSelling: number): number {
  return headlineSelling - cashifyProcessingFee(headlineSelling);
}

/** The most Fhoneify may pay for a given Cashify payout: payout + min(8%, INR 2,000). Whole rupees, rounded down. */
export function maxPayoutForCashifyPayout(cashifyPayoutAmount: number): number {
  const extra = Math.min(Math.floor(cashifyPayoutAmount * PAYOUT_CEILING_POLICY.maxRate), PAYOUT_CEILING_POLICY.maxExtraRupees);
  return cashifyPayoutAmount + Math.max(0, extra);
}

export const headlineFromBase = (basePrice: number) => basePrice - PAYOUT_CEILING_POLICY.cashifyImeiFee;

/** Smallest quote that still leaves the customer a non-negative payout after the INR 99 display fee. */
export const MIN_CEILING_QUOTE = 99;

export interface CeilingResult {
  /**
   * 'ok': `quote` satisfies the calculated limit (payout with no coupon <= maxCustomerPayout).
   * 'inspection': no quote can satisfy the limit (or an input is unusable); the caller must NOT show a price - it has to
   * return MANUAL_INSPECTION_REQUIRED. `quote` is then 0 and must never be displayed or signed.
   */
  status: 'ok' | 'inspection';
  inspectionReason: string | null;
  /** The quote to show and sign: the input unless the ceiling lowered it. 0 when status is 'inspection'. */
  quote: number;
  /** The input quote before the ceiling. */
  quoteBeforeCeiling: number;
  reduced: boolean;
  cashifyHeadlineEquivalent: number;
  cashifyPayoutEquivalent: number;
  /** Highest payout the customer may receive for this device and condition (against the ESTIMATED Cashify payout). */
  maxCustomerPayout: number;
  /** Customer payout with no coupon. */
  standardPayout: number;
  /** How much of the first-time coupon may be added without breaking the ceiling (0..299). */
  couponHeadroom: number;
}

const refuse = (input: { quote: number; cashifyHeadlineEquivalent: number }, reason: string): CeilingResult => ({
  status: 'inspection', inspectionReason: reason, quote: 0, quoteBeforeCeiling: input.quote, reduced: false,
  cashifyHeadlineEquivalent: input.cashifyHeadlineEquivalent, cashifyPayoutEquivalent: 0, maxCustomerPayout: 0, standardPayout: 0, couponHeadroom: 0,
});

/**
 * Finds the largest whole-rupee quote <= `quote` whose customer payout (no coupon) is within the ceiling, and reports how
 * much of the INR 299 first-time coupon still fits. It never raises a quote. If no usable quote exists it returns
 * status 'inspection' instead of a number that breaks the limit. `cashifyHeadlineEquivalent` is the Cashify headline
 * selling price the quote is matched to (engine equivalents are base prices: pass headlineFromBase(...)).
 *
 * The limit is against the ESTIMATED Cashify payout, so satisfying it says nothing about the real Cashify payout.
 */
export function applyPayoutCeiling(input: { quote: number; cashifyHeadlineEquivalent: number }): CeilingResult {
  const { quote: quoteBeforeCeiling, cashifyHeadlineEquivalent } = input;
  if (!Number.isFinite(quoteBeforeCeiling) || !Number.isFinite(cashifyHeadlineEquivalent)) return refuse(input, 'non-finite price input');
  if (quoteBeforeCeiling < MIN_CEILING_QUOTE) return refuse(input, 'quote below the minimum payable amount');
  if (cashifyHeadlineEquivalent <= 0) return refuse(input, 'no positive Cashify-equivalent price to bound the payout');
  const cashifyPayoutEquivalent = cashifyPayout(cashifyHeadlineEquivalent);
  const maxCustomerPayout = maxPayoutForCashifyPayout(cashifyPayoutEquivalent);
  // payout(q) = q - 99, except q = 1,200 where the display fee is waived (payout 1,200). Solve directly instead of searching.
  let quote = Math.min(Math.floor(quoteBeforeCeiling), maxCustomerPayout + DISPLAY_DEDUCTION);
  if (quote === DISPLAY_DEDUCTION_EXEMPT_PRICE && customerPayout(quote, false).payout > maxCustomerPayout) quote -= 1;
  if (quote < MIN_CEILING_QUOTE) return refuse(input, 'the ceiling leaves no payable quote');
  const standardPayout = customerPayout(quote, false).payout;
  if (standardPayout > maxCustomerPayout) return refuse(input, 'ceiling could not be satisfied'); // unreachable by construction; fail closed
  const couponHeadroom = Math.max(0, Math.min(FIRST_TIME_COUPON_BONUS, maxCustomerPayout - standardPayout));
  return {
    status: 'ok', inspectionReason: null, quote, quoteBeforeCeiling, reduced: quote !== quoteBeforeCeiling, cashifyHeadlineEquivalent,
    cashifyPayoutEquivalent, maxCustomerPayout, standardPayout, couponHeadroom,
  };
}

/** Test/audit helper: is the payout for this quote within the ceiling, with or without the coupon the customer claims? */
export function payoutWithinCeiling(quote: number, couponClaimed: boolean, cashifyHeadlineEquivalent: number, couponHeadroom?: number): boolean {
  const max = maxPayoutForCashifyPayout(cashifyPayout(cashifyHeadlineEquivalent));
  return customerPayout(quote, couponClaimed, couponHeadroom).payout <= max;
}
