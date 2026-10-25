# iPhone pricing from the supplied Cashify quotations: final report

Local only: nothing pushed, merged, deployed or written to production. The supplied quotations are treated as real Cashify results (owner confirmation, 2026-10-25). Every test and script ran with the database unreachable.

## 1. How a quote is built now

1. **Reference** R: Cashify's Get Upto for the variant (existing reference-price path, unchanged).
2. **Cashify-equivalent E** (before any uplift), in this order:
   1. an **exact recorded quote** for the same model, capacity and answers (`lib/pricing/appleCashifyModel/exact.ts`, `exact.json`: 2,081 configurations, 51 recorded no-offers). The record collected against the same Get Upto wins; otherwise the newest is carried to today's reference by the model's own movement between the two references. Records are never averaged;
   2. the **calibrated rules** for the model (`model.ts`, `template.json`, `calibration.json`) for every combination that was not recorded;
   3. otherwise the existing engine (only models with no supplied quotations: iPhone 12/13 and older, 14 Plus, 14 Pro Max, XS/XR/11 families, iPhone X for unrecorded answers).
3. **Existing uplift** once (`applyCompetitorUplift`: 8% to a Get Upto of INR 20,000, 6% to 50,000, else 4%, extra capped at INR 2,000), unchanged.
4. **Payout ceiling** (`payoutCeiling.ts`): payout, after the INR 99 fee and including the INR 299 coupon, never above the Cashify-equivalent payout + min(8%, INR 2,000); it returns a quote that satisfies the limit or inspection-required. INR 10,000 -> 10,800 and INR 50,000 -> 52,000 are tested.

No blanket safety deduction exists anywhere: E is corrected first, then uplift, then the ceiling.

## 2. Check 1: supplied-case reconciliation (the evidence itself, not a validation)

`scripts/pricing-evidence/reconcile-supplied.ts` -> `data/pricing-evidence/validation/supplied_case_reconciliation.json`. Every supplied case goes through the evidence entry point at the Get Upto it was collected against, then uplift, ceiling and fee, with and without the coupon.

| | |
|---|---:|
| supplied cases (57 archives + 2026-10-10 captures + tester workbook) | 2,324 |
| unambiguous priced cases | 2,271 |
| **reproduce the recorded Cashify-equivalent exactly** | **2,271 (100%)** |
| recorded Cashify no-offers kept as explicit no-offers | 51 of 51 |
| payout above recorded Cashify payout + min(8%, INR 2,000), no coupon / with coupon | **0 / 0** |
| not unambiguous, reported instead | 2 |

The two excluded records (both from the hand-entered tester workbook, dated 2 Oct):
- **iPhone 15 Pro Max 512 GB aged baseline** (Get Upto 72,480): the workbook says 57,130, the archive of 17 Oct says 58,850 at the same Get Upto. Both are served at their own dates; at a given Get Upto the archive record is used. The 2 Oct figure is below the later one by 2.4 points of the price, the same direction as the iPhone 17 aged baselines of 2 Oct, so Cashify's age deduction appears to have changed between 2 and 17 Oct. The newest record is what is served.
- **iPhone 11 Pro Max 256 GB clean** (Get Upto 18,740): the workbook records 19,480, above its own Get Upto, which cannot be a quote for a variant whose Get Upto is the highest price. Not served; the existing engine and its baseline-inconsistency guard keep this device.

## 3. Check 2: generalization to combinations that were not recorded

The exact layer is disabled in these runs. Each protocol refits the rules on a training partition only and predicts the held-out quotes (`validate-evidence-engine.ts`; the unit kept together is the condition shape, so repeats and other storages of a shape never straddle the split).

| protocol | what is held out | existing engine MAE | rules MAE | rules median / p90 / p95 | priced / quotes |
|---|---|---:|---:|---|---:|
| p1 | unseen condition shapes (5 folds) | INR 10,222 | **INR 193** | 0 / 470 / 880 | 2,185 / 2,233 |
| p2 | unseen storage variants | INR 10,412 | **INR 123** | 0 / 290 / 610 | 2,137 / 2,182 |
| p3 | later dates (train to 17 Oct, test from 22 Oct) | INR 12,022 | INR 993 | 0 / 3,240 / 6,010 | 1,057 / 1,157 |
| p4 | whole model unseen (zero-shot from siblings) | INR 10,222 | INR 422 | 90 / 1,170 / 1,910 | 2,180 / 2,233 |

p1 and p2 are the measure for "price an unrecorded combination of a supported model". p3 and p4 are harder (little training data; no data of that model at all) and are reported unchanged. The structure of the rules was found using all the data, so these numbers are honest about parameter estimation but optimistic about structure.

Per model (p1, MAE rules vs existing engine): 14 132 vs 657; 14 Pro 130 vs 2,761; 15 585 vs 4,774; 15 Plus 676 vs 5,110; 15 Pro 557 vs 8,353; 15 Pro Max 96 vs 4,436; 16 196 vs 6,006; 16 Plus 162 vs 6,264; 16 Pro 301 vs 11,954; 16 Pro Max 144 vs 9,696; 16e 214 vs 4,948; 17 324 vs 6,907; 17 Pro 112 vs 16,209; 17 Pro Max 114 vs 18,087; 17e 254 vs 7,804; 18 Pro 15 vs 17,075; 18 Pro Max 0 vs 14,648; Air 71 vs 10,843. iPhone X: rules 358 vs existing 11, so iPhone X keeps the existing engine for unrecorded answers (its 27 recorded cases are exact).

### What was corrected in the rules to get there
- **Floor** (Cashify's minimum price) belongs to functional faults on an aged phone, not to any damage: iPhone 15 touch+screen+panel quotes below the plateau, but every touch+functional combination sits on it. With that, iPhone 15 explains its quotes to within INR 1,700 (was INR 9,400) and the floor is found for 15 / 15 Plus / 15 Pro / 16 / 17 families.
- **Family floor fallback:** when a model's own data cannot show the plateau, the siblings' plateau (about 17% of the reference from the iPhone 16 generation on, 26% for the 15) applies instead of none. This removed the large over-estimates on 17 Pro Max, 18 Pro and 18 Pro Max touch/multi-fault shapes (17 Pro Max p1 MAE 2,581 -> 114; 18 Pro 549 -> 15).
- **iPhone 17 / 17 Pro Max age baselines:** the age law (about 11% / 14% / 24% of the reference for 3-6 / 6-11 / over 11 months) matches the newest quotes; the older 2 Oct tester rows are the superseded record (section 2).
- **iPhone 15 legacy over-quotes** (INR 17-20k on touch failure) are gone: the rules replace the existing engine for the whole 15 family.
- iPhone X charger (INR 300) is part of its exact key.

### Weak spots that remain (unrecorded combinations)
- **Cracked glass + cracked back panel on the iPhone 15 family** (INR 8,500-9,300 under-estimate on 15 / 15 Plus / 15 Pro): Cashify's data only fixes the sum of the glass and panel deductions, not each, and the held-out split lands on the wrong side. Recorded combinations are exact; a different glass/panel mix on a 15 can be off by that much.
- Non-original screen with other faults on 16 / 16 Plus (about INR 5,000) and a few multi-defect mixes on 17 (up to INR 4,400).
- iPhone 15 Pro Max has only 24 recorded quotes (one storage); its other storages use sibling-borrowed values.

## 4. Coverage

Catalog iPhone variants and what answers them (`data/pricing-evidence/catalog_coverage.md`):
- **Rules + recorded quotes (all catalog variants of these models):** iPhone 14, 14 Pro, 15, 15 Plus, 15 Pro, 15 Pro Max (256 GB and 1 TB by the rules only), 16, 16 Plus, 16 Pro, 16 Pro Max, 16e, 17, 17 Pro, 17 Pro Max, 17e, 18 Pro, 18 Pro Max, iPhone Air.
- **Recorded quotes only, other answers on the existing engine:** iPhone X (256 GB; rules measured worse than the existing engine), 8, 12 Pro Max, 13, 14 Pro Max, XS Max, 11 Pro Max (a few recorded rows each from earlier captures).
- **Existing engine, no supplied quotations:** iPhone 6 to 7 Plus, 8 Plus, XR, XS, 11, 11 Pro, SE, 12, 12 Mini, 12 Pro, 13 Mini / Pro / Pro Max, 14 Plus.

Held-out unrecorded combinations (p1+p2, 4,415 quotes, `docs/PRICING_EVIDENCE_COVERAGE.md`): **97.3%** priced by the rules, **0.6%** on the existing engine (iPhone X), **2.0%** inspection. Estimate error on priced rows: median 0.0-0.5%, p90 0.0-13% (13% only on iPhone 15 and 7% on 15 Plus; 3% or less for everything from the 16 generation up except 17e 3.9%), p95 up to 22% on iPhone 15.

## 5. What still goes to inspection, and why

Only explicit no-offers and contradictory conditions (99 of 2,233 held-out rows in p1, 4.4%):
- **Cannot make or receive calls together with other faults** (48 rows): Cashify's outcome is not one thing: no offer (38 recorded), INR 420 (17 Pro Max 1 TB) or INR 1,200 (18 Pro Max, 17 Pro Max 2 TB). The call-failure-alone scrap quote of INR 1,200 is priced.
- **Ten or more functional faults at once** (48 rows): Cashify quoted INR 970 to INR 49,030 (0.6-30% of the price) depending on model; no rule is readable, so unrecorded ones are inspected. The recorded ones per model and capacity are exact.
- **Deductions that exceed the price** (3 rows).
- **Cashify's recorded no-offers** (51 supplied cases) stay no-offers.
- **A zero or negative Cashify-equivalent from the existing engine** (heavily damaged phones on models still on it) cannot be bounded by "Cashify payout + 8%": inspection-required. The original heavily damaged production tests are kept and assert exactly this outcome.

## 6. Payout ceiling against what Cashify actually paid

The ceiling guarantees the limit against the engine's own estimate (0 breaches in every scenario). Against the payout Cashify actually paid:
- **Supplied recorded cases: 0 of 2,271 above the allowance** (section 2).
- **Held-out unrecorded combinations** (rules only): 13.4% (p1), 15.3% (p2), 10.3% (p3), 29.5% (p4) of priced quotes exceed the allowance, median excess small; p95 extra over Cashify's payout 6.4% / 6.3% / 6.6% / 8.0%. This is estimate error: no live Cashify price for an unrecorded condition is claimed to be exact, and the 8% / INR 2,000 rule cannot be guaranteed from an estimate. The ceiling analysis scripts (`ceiling-compliance.ts`, `margin-sweep.ts`) keep the two questions separate.

## 7. Server authority and agreement (tests, no browser needed)

`pricing.apple-evidence-flow` (HTTP, real controllers, 18 enabled models, no database): the displayed payout, the signed token's price, the saved lead's price and payout (with and without the coupon) and the restored session's payout agree for every enabled model; changed answers or another device are re-priced and never honoured; production release mode (hybrid) returns the same quote as the plain service; the evidence quote is exactly evidence + uplift once + ceiling.

## 8. Verification

- `tsc` clean (Next and server configs); `next build` succeeds (`data/pricing-evidence/next_build.log`).
- Regression: see `data/pricing-evidence/suites_final.log`. The suites that fail there also fail on pristine `origin/main` (`baseline_suites_origin_main.log`).
- Browser (local API + built frontend, no database, throwaway secrets; token seeded locally): iPhone 17 Pro Max 512 GB with body scratches + charging port + front camera + single eSIM, a combination that was never recorded, was priced by the rules; the server returned `fhoneifyPrice` 96,820 and the page showed INR 96,721 = server price - the INR 99 fee; a reload restored the same INR 96,721. An earlier check showed the inspection page rendering for a refused condition.
- **Not possible locally: OTP login and lead creation.** Both use the Prisma database (the OTP store, the lead table); I did not touch the production database. Lead creation and the saved payout are covered at the service level by the flow test above; the live OTP login and saving a lead through the real page remain untested end to end.

## 9. Decisions and remaining uncertainty

- The iPhone X, the iPhone 15 Pro Max storages without quotes, and 15 glass/panel mixes are the least certain rules; adding recorded quotes for them is the only fix.
- Cashify's age deduction changed between 2 and 17 Oct on at least the iPhone 15 Pro Max and 17; the rules and the exact layer follow the newest records. A new change would need new quotes; the exact layer then wins at recorded references and the rules drift until refit.
- iPhone 12/13 and older are not covered because no quotations for them were supplied beyond a few capture rows.
- The Android lessons are in `docs/PRICING_EVIDENCE_ANDROID_LESSONS.md`; no Android pricing was changed (except that the brand-neutral ceiling now routes a zero-valued equivalent to inspection).
