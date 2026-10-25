/**
 * What the customer is shown on the final quote screen, derived from the
 * signed quote price. The rules are the quote page's existing ones, moved
 * here unchanged so the screen and the stored lead use the same code:
 *
 *   - ₹99 is deducted from the displayed estimate, except when the quote is
 *     exactly ₹1,200. (NOTE: a non-working device's quote is ₹1,200 AFTER
 *     the uplift, i.e. ₹1,248-₹1,296, so this exemption never matches today.
 *     Kept as-is: changing it is a business decision.)
 *   - A first-time-user coupon adds ₹299. The coupon is generated and checked
 *     in the browser only, so the server records it as a customer claim.
 *     The bonus is limited to the headroom the server computed under the
 *     owner's payout ceiling (lib/pricing/payoutCeiling.ts), so a coupon can
 *     never carry the payout past it. Callers without that headroom (older
 *     sessions, research tools) keep the full ₹299.
 *
 * Browser-safe: no imports.
 */
export const DISPLAY_DEDUCTION = 99;
export const DISPLAY_DEDUCTION_EXEMPT_PRICE = 1200;
export const FIRST_TIME_COUPON_BONUS = 299;

export interface CustomerPayout {
  quotePrice: number;
  deduction: number;
  couponBonus: number;
  payout: number;
}

export function customerPayout(quotePrice: number, couponApplied: boolean, couponHeadroom?: number): CustomerPayout {
  const deduction = quotePrice === DISPLAY_DEDUCTION_EXEMPT_PRICE ? 0 : DISPLAY_DEDUCTION;
  const allowed = typeof couponHeadroom === 'number' && Number.isFinite(couponHeadroom)
    ? Math.max(0, Math.min(FIRST_TIME_COUPON_BONUS, Math.floor(couponHeadroom)))
    : FIRST_TIME_COUPON_BONUS;
  const couponBonus = couponApplied ? allowed : 0;
  return { quotePrice, deduction, couponBonus, payout: quotePrice - deduction + couponBonus };
}

/**
 * What a lead stores in `answers`: the verified diagnostics, the pricing
 * audit, and the figure the quote screen showed (customerPayout), derived from
 * the verified price by the same function the screen uses - so the admin sees
 * both numbers and why they differ (₹99 fee / coupon).
 */
export function buildLeadAnswers(
  verified: { price: number; diagnostics: object; audit: object; couponHeadroom?: number },
  couponClaimed: boolean
) {
  return {
    ...verified.diagnostics,
    pricing: { ...verified.audit, customerPayout: customerPayout(verified.price, couponClaimed, verified.couponHeadroom), couponClaimed },
  };
}
