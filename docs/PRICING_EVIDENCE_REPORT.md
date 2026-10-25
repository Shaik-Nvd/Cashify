# iPhone pricing from Cashify quote evidence: executive report

Status: local, uncommitted-to-remote work in the `fhoneify-evidence` worktree. Nothing pushed, merged, deployed or written to production. All suites run with the database unreachable.

## 1. What was built

| piece | where |
|---|---|
| Normalised, deduplicated dataset with conflict and coverage reports | `data/pricing-evidence/`, `docs/PRICING_EVIDENCE_DATASET.md` |
| Rules derived from matched comparisons | `docs/PRICING_EVIDENCE_RULES.md` |
| Held-out validation, existing vs evidence engine | `docs/PRICING_EVIDENCE_VALIDATION.md`, `data/pricing-evidence/validation/` |
| Deterministic, explainable engine (logic separate from calibration data) | `lib/pricing/appleCashifyModel/` (`model.ts`, `template.json`, `calibration.json`, `scope.json`) |
| Payout ceiling, applied once after the uplift | `lib/pricing/payoutCeiling.ts`, wired in `lib/pricing/pricingService.ts` and `payout.ts` |
| Inspection instead of a made-up price | `lib/pricing/inspectionRequired.ts` (HTTP 422 `MANUAL_INSPECTION_REQUIRED`) |
| Next quotes to collect (400 for iPhone 12/13 plus gap list) | `docs/PRICING_EVIDENCE_NEXT_QUOTES.md`, `docs/next-quotes/*.csv` |
| Tests | `pricing.apple-evidence` (27), `pricing.payout-ceiling` (11), `pricing.apple-evidence-flow` (8) |

## 2. Dataset (audit counts verified, not trusted)

The audit's 3,131 = 2,926 + 205 reproduces. 2,283 rows are retained; 2,234 are independent measurements and 2,158 are unique configurations. The 36 non-additive pairs in the audit are explained by two rules (age applied once; the largest screen fault wins) plus body damage being absorbed under cracked glass. Pending/untested items are excluded from price evidence and no-offer outcomes are kept as outcomes, never as ₹0. See the dataset report for duplicates, conflicts and the coverage matrix.

Effective sample size is far below row count: the data is roughly 30 condition shapes repeated across storages and models. This is why leakage control is by shape.

## 3. Accuracy vs the existing engine (held-out)

Error is against Cashify's base price. "Evidence" means rows the model priced; the remainder were sent to inspection.

| protocol | what is held out | existing mean error | evidence mean error | evidence median / p90 / p95 | priced |
|---|---|---:|---:|---|---:|
| p1 | unseen condition shapes | ₹10,222 | ₹520 | ₹10 / ₹770 / ₹2,240 | 2,173 / 2,233 |
| p2 | unseen storage variants | ₹10,412 | ₹141 | ₹0 / ₹270 / ₹740 | 2,137 / 2,182 |
| p3 | later dates (train ≤ 17 Oct, test ≥ 22 Oct) | ₹12,022 | ₹993 | ₹0 / ₹3,240 / ₹6,010 | 1,057 / 1,157 |
| p4 | unseen models (zero-shot) | ₹10,222 | ₹454 | ₹80 / ₹1,170 / ₹2,000 | 2,183 / 2,233 |

Caveats stated plainly:
- The model **structure** was found using the whole dataset, so p1–p4 test the fitted values, not the discovery of the structure.
- p3 is the weakest honest result: the training window is small and mostly one variant per model.
- p4 over-quotes 40% of the time. Zero-shot transfer is **not** a licence to price models without their own quotes.
- The weak region is touch-failure and other multi-fault combinations, where few shapes exist per model. The model's own `inferred` label separates them well (inferred p95 ≈ 10% vs ≈ 1% for measured on held-out rows).

## 4. Scope: where the evidence engine is allowed to price

Thresholds were fixed before per-model results were read and are applied identically to every model (T1 median ≤ 1%, T2 p90 ≤ 5%, T3 p95 over-quote ≤ 3%, T4 mean error ≤ 50% of existing, T5 ≥ 100 held-out quotes over ≥ 10 shapes, T6 declined ≤ 15%, T7 worst over-quote ≤ 10% of Get Upto). Two thresholds need your sign-off because I added or relaxed them:
- **T7** was added after seeing first results, because percentiles hid single large over-quotes.
- **T5 for the measured/inferred subsets** is ≥ 30 quotes over ≥ 5 shapes. Applying the model-level 100/10 floor to a subset would have excluded accurate models for sample size alone.

Result (`lib/pricing/appleCashifyModel/scope.json`):
- **all** (price every supported combination): iPhone 16, 16 Plus, 16 Pro Max, 17 Pro, 18 Pro, 18 Pro Max, Air.
- **measured-only** (unmeasured combinations go to inspection): iPhone 14, 14 Pro, 15 Plus, 15 Pro, 16 Pro, 16e, 17, 17 Pro Max, 17e.
- **off** (existing engine unchanged): iPhone 15, 15 Pro Max, X. iPhone 12/13 and older are untouched.

## 5. Payout ceiling (the owner's rule)

Rule implemented: payout ≤ matched Cashify payout + min(8%, ₹2,000). The uplift is applied once, then the ceiling is applied after fees, rounding and the ₹299 coupon (the coupon is clamped by remaining headroom). The ceiling only ever lowers a quote. Base price, headline selling price (base − ₹20) and payout (after Cashify's fee schedule) are kept distinct.

Flow verified through the real service and HTTP layer: the server quote is authoritative, the signed token binds device and answers, the lead stores the exact quote, reload restores it, and the frontend displays the server number.

**Important finding.** The ceiling is computed from the engine's own estimate of Cashify. Measured against the *true* Cashify payout on held-out quotes (`scripts/pricing-evidence/ceiling-compliance.ts`, `validation/ceiling_compliance.json`), shipped scope still exceeds the allowed maximum on a minority of quotes:

| scenario (no coupon) | p1 | p2 | p3 | p4 |
|---|---:|---:|---:|---:|
| existing engine as shipped | 47% | 47% | 46% | 47% |
| existing engine + ceiling | 37% | 38% | 32% | 37% |
| evidence engine + ceiling, as shipped scope | 16% | 15% | 6% | 30% |

Most remaining breaches are small (p1: 154 of 1,803 priced quotes exceed the allowance by more than ₹100, and 56 by more than ₹1,000). The guarantee therefore holds against our estimate of Cashify, not against Cashify's live payout. It cannot be fully guaranteed unless the estimate is exact. If you want the ceiling to be a hard guarantee, the safer lever is more inspection, or a safety margin on the estimate, and that is a business decision, not something I will pick.

## 6. Verification

- `tsc` clean for `tsconfig.next.json` and `tsconfig.server.json`.
- Full pricing suite loop, database unreachable: 48 passed, 6 failed. The 6 failures (`generalization-properties`, `iphone12-captured-profile`, `questionnaire-metadata`, `scoped-storage`, `team-qa`, `team-text-wiring`) also fail on pristine `origin/main` (log: `data/pricing-evidence/baseline_suites_origin_main.log`). The seventh baseline failure, `test_iphone18pm_2tb`, now passes. No new failures.
- Tests I edited to expect `MANUAL_INSPECTION_REQUIRED` for evidence-model iPhones on unmeasured combinations: `pricing.hybrid`, `pricing.team-workbook-service`, `pricing.get-upto`, plus the release/flow suites listed in `git status`. Please review these as policy changes, not just test fixes.
- Not done: `next build` and a browser check of the quote page.

## 7. Decisions needing your approval

1. **₹20 IMEI-fee basis.** Base = headline + ₹20 holds for 2,238 of 2,238 quotes; the ceiling uses the headline (base − 20). Confirm.
2. **Get Upto is not capped**, only the final quote. Confirm this matches the documented Get Upto definition you want.
3. **Coupon clamp.** The ₹299 first-time coupon is reduced when it would breach the ceiling. Accept the UX, or drop the coupon for those quotes.
4. **Inferred-combination policy** per model: `inspect` (default here), `price`, or `legacy`. Inspection rate is the cost; see section 4 and the validation report.
5. **Excluded models**: iPhone 15, 15 Pro Max and X stay on the existing engine until more quotes exist.
6. **Warranty-void rule change** in the form, and the **extreme-fault inspection rule** (≥ 10 functional faults).
7. **Catalog fixes** found along the way: RAM values, iPhone 18 storage spelling, stale base prices.
8. **iPhone 18 round-price caveat**: those quotes show round numbers that may not be genuine Cashify output; treat them as lower-confidence until re-checked.
9. **T5 subset floor and added T7** (section 4).
10. **Tier selection (4/6/8%)** is unchanged and documented, no change proposed. Say if you want one.
11. **Approve the 400-quote iPhone 12/13 collection plan** (`docs/next-quotes/iphone12_13_plan.csv`) and the gap list for existing models.

## 8. Remaining uncertainty

- Calibration reflects Cashify quotes dated 16–24 Oct 2026; nothing shows the tables stay stable. Evidence expiry and a re-fit routine should follow the weekly Cashify refresh.
- Touch-failure combinations and multi-fault stacks are thinly sampled on most models.
- The ceiling guarantee depends on estimate quality (section 5).
