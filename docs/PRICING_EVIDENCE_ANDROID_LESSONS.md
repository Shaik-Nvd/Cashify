# Lessons from the iPhone work that apply to Android brands

Recorded so the Android rollout does not start from zero. Nothing here changes Android pricing today, and this is not a plan to roll anything out now.

## What transfers (and is already in the code)

1. **The payout ceiling is brand-neutral.** `applyPayoutCeiling` runs for every brand in `pricingService`. It already changes Android behaviour in one visible way: a condition whose Cashify-equivalent comes out at zero or below (the legacy engines quote the INR 100 minimum bonus there) now returns inspection-required, because no payout can be bounded by "Cashify payout + 8%" of nothing. Measured over the catalog at its base prices, the heavily damaged profile of the production test changes from a INR 100 quote to inspection for most legacy devices (`scripts/pricing-evidence/ceiling-inspection-rate.ts`). A clean phone is never affected.
2. **Record every quote with its Get Upto, date and the exact answers, and keep "not shown" apart from "No".** Most early errors in the iPhone data came from reading an unasked question as an answer. The normaliser (`normalize_cashify_quotes.py`) already keeps `No`, `not asked`, `not applicable` and `unknown` separate.
3. **Match exact recorded configurations first, then use rules for the rest.** The exact layer (`exact.ts`) reproduces every recorded quote; the rules only price what was not recorded. For Android this is the fastest way to be right on the popular variants while the rules mature.
4. **Cashify condition prices are a small set of rules, not a lookup table.** What held on iPhones and is worth testing on Android first:
   - the age / out-of-warranty effect is applied once, however many answers imply it;
   - some screen answers (touch not working, non-original screen, cracked glass, broken or missing panel) skip the age question and force the aged state;
   - damage in the same area shares one deduction (the largest applies) while independent functional faults add up; Wi-Fi and Bluetooth overlap;
   - a deduction is either a fixed rupee amount or a share of the variant's price, and which one changes by generation, not by storage;
   - the minimum price (floor) belongs to functional faults on an aged phone, and it is a share of the reference (about 17% for the iPhone 16 generation onwards);
   - the box deduction is smaller on an aged phone; the charger is usually free, except on a few old models (iPhone X: INR 300);
   - Cashify refuses a few combinations outright (no calls plus other faults, a phone with every functional fault); those are explicit no-offers, not prices.
5. **Collect single defects on one flagship per generation, then pairs on the same model.** Combinations alone cannot separate Wi-Fi from Face ID; the single-defect report for one phone (iPhone 18 Pro Max 2 TB) is what made the whole family fit. Android needs the same "one fully measured model per brand family".
6. **Dated reference prices drift.** Anchor recorded quotes to the Get Upto they were collected against; carry them to the current reference by the model's movement, never by averaging dates.
7. **Held-out validation by condition shape.** Keep a repeated or cross-storage copy of a shape in the same partition, and report exact-match reconciliation (recorded cases) separately from held-out combinations. Fitting the recorded cases says nothing about unrecorded ones.

## What does not transfer

- The iPhone fixed-vs-share table, the age percentages (about 11% / 14% / 24% for 3-6 / 6-11 / over 11 months on the 17 generation) and the 17% floor are measured on Apple flows only. Samsung, Xiaomi and Oppo ask different questions (some have no age question at all) and their legacy engines already carry brand-specific rules that were calibrated on their own quotes; do not apply the iPhone numbers to them.
- iPhone 12 and 13 and older are not in the supplied evidence either: they keep the existing engine plus the exact recorded rows from earlier captures.

## When Android is taken up

Reuse `scripts/pricing-evidence/` unchanged (normaliser, exact index builder, fitter, validator, reconciliation); only the questionnaire code tables in `model.ts` (answer strings and condition codes) and the template classes need a per-brand version.
