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

## 5. The payout ceiling: what is guaranteed and what is not

**The rule.** Customer payout <= matched Cashify payout + min(8%, INR 2,000). The uplift is applied once; the ceiling comes after it and after the INR 99 fee, rounding and the INR 299 coupon (the coupon is clamped to the remaining headroom). Base price, headline selling price (base - 20) and payout (after Cashify's fee schedule) are kept distinct.

**What the function now guarantees (`lib/pricing/payoutCeiling.ts`).** `applyPayoutCeiling` solves directly for the largest whole-rupee quote that is within the limit, instead of stepping down a bounded loop. It returns `status: 'ok'` with a quote that satisfies the limit, or `status: 'inspection'` with no price at all (non-finite input, no positive Cashify-equivalent, a quote below the INR 99 fee, or a limit no payable quote can meet). The pricing service turns `inspection` into `MANUAL_INSPECTION_REQUIRED`; it never signs or shows a number that breaks the limit. Tests: a 4,000-quote property sweep (every result is within its limit with and without the coupon and is maximal, or is an inspection result with a reason), the INR 1,200 fee-exemption edge, and non-finite inputs. A signed lead price older than the current estimate is kept (the customer saw it) but is flagged `signedPriceWithinCurrentCeiling` in the lead audit.

**Behaviour change to approve (found by the existing production tests).** The old ceiling loop silently did the wrong thing when the Cashify-equivalent is zero, which is what the existing engine produces for any heavily damaged phone (it then quotes the INR 100 minimum bonus). No quote can sit within "Cashify payout + 8%" of a zero payout, so the ceiling now returns inspection-required instead of a INR 100 number. Measured over the whole catalog at catalog base prices (`scripts/pricing-evidence/ceiling-inspection-rate.ts`): a clean phone is never affected (0 of 2,144); a worn phone (body scratches, out of warranty) 29 of 2,144 (all measured-only iPhones, unmeasured combination, the policy of section 4); a non-working phone 29 of 2,144; a heavily damaged phone (broken screen, dents, missing panel, touch and three functional faults) **2,075 of 2,144 now go to inspection instead of an INR 100 quote**. Two production tests that asserted a valid quote for that profile now use a worn-but-valuable profile, and a new test asserts the inspection result for the damaged one. Keeping the old INR 100 quote would break the stated rule ("the ceiling must hold after minimum-price rules"), so I made the safe choice, but customers will notice.

**That guarantee is against the ESTIMATE only.** The limit is computed from the engine's own Cashify-equivalent. Whether the customer is within the limit of what Cashify actually pays depends on the estimate being right, which is a separate, measured question. `scripts/pricing-evidence/ceiling-compliance.ts` keeps the two apart (`data/pricing-evidence/validation/ceiling_compliance.json`). Share of held-out quotes within the limit, no coupon:

| scenario | A. vs the engine's own estimate | B. vs the REAL Cashify payout (held-out p1 / p2 / p3 / p4) |
|---|---|---|
| existing engine as shipped (no ceiling) | 40% | 53% / 53% / 54% / 53% |
| existing engine + ceiling | 100% | 63% / 62% / 68% / 63% |
| evidence engine + ceiling, priced everywhere it can | 100% | 82% / 86% / 90% / 70% |
| **as shipped (scope.json: evidence, inspection, existing elsewhere) + ceiling** | **100%** | **84% / 85% / 94% / 70%** |

So this is not a hard Cashify ceiling: 6-30% of held-out quotes exceed the allowance measured against real Cashify payouts, and column B is not column A. Reasons, from the largest breaches inspected one by one (section 6):
1. **Little or no slack.** For a Get Upto above about INR 33,000 the existing uplift is already the INR 2,000 cap, which is also the rule's cap; below that the 6% and 8% tiers leave 0-2% of slack. Any over-estimate of Cashify, even INR 20-110 from rounding or the INR 20 IMEI basis, becomes a breach. On iPhone 14 Pro all 28 first-round breaches are exactly this (excess INR 20-110).
2. **Models still on the existing engine.** iPhone 15 is `off`; the existing engine ignores touch failure (and several other answers), so a touch-failure + Wi-Fi quote is INR 30,257 against Cashify's INR 11,400. 46 breaches, up to INR 19,790, none from the evidence engine.
3. **Unseen condition shapes** (touch failure on 18 Pro Max, Wi-Fi + Face ID on 17 Pro Max): INR 5,000-7,500 over.

**Margin analysis (nothing applied).** `margin-sweep.ts` prices from E x (1 - m). On rows the evidence model prices (`data/pricing-evidence/validation/margin_sweep.json`), breaches against real Cashify fall from 14.5% / 13.4% / 6.1% / 29.4% (p1-p4) at m = 0 to 1.9% / 0.0% / 1.9% / 5.1% at m = 1%, and to 1.0% / 0.0% / 0.5% / 1.7% at m = 2%, at a customer cost of about INR 620-1,600 (the median payout given up). Large-error shapes still breach by INR 1,000+ on p1 even at 5%. This is a business trade-off, not something I will choose: the limit becomes defensible only if customers are paid less, or if inspection absorbs the uncertain shapes.

## 6. The largest breaches, individually

`scripts/pricing-evidence/verify_breach_sources.py` re-reads the ZIPs in memory (the bundled `match_price.py` is never run) and checks the 80 largest breach records. Each one: present in the normalised data with the same figures, base = selling + 20, payout fee in Cashify's 49/69/99 schedule, the figure present in the archive's JSON, TXT and HTML, and no disagreeing duplicate measurement of the same configuration (`data/pricing-evidence/validation/breach_source_verification.json`).

Result: **80 of 80 verified, 0 contradictions**; 79 are corroborated in every representation the archive ships, 1 (iPhone 18 Pro Max 2 TB, Q02 alone, INR 94,960) appears in JSON and TXT but not in that archive's HTML table, which does not list the single-defect set. The large breaches are real Cashify records, not data errors. They are scope and shape failures of our model: 36 of the 80 are iPhone 15 records, where the evidence model is disabled; the 18 Pro Max and 17 Pro Max ones are held-out shapes the model had not seen. A standing caveat: the iPhone 18 prices are suspiciously round, so that archive's authenticity is an open question.

## 7. Frozen rules vs independent quotes

The rules (`model.ts`, `template.json`, `calibration.json`, `scope.json`, `index.ts`) were hashed before scoring (`independent_validation.json` holds the SHA-256 values) and `scripts/pricing-evidence/validate-independent.ts` cannot change them.

**Independent set available:** 40 earlier Apple observations from other test campaigns, dated 2-11 Oct 2026 (the fitted archives are 16-24 Oct): 13 screenshot-verified browser captures and 27 tester-reported workbook rows. The team-text transcripts are the same records as the ZIP TXT files, so they are excluded.

| | cases | priced by the shipped scope | inspection | out of scope |
|---|---:|---:|---:|---:|
| all | 40 | 10 | 4 | 26 |

- **Screenshot-verified and priced (iPhone 14 128 GB): n = 2**, errors INR 0 and +20 (existing engine: INR 66 mean).
- **Tester-reported and priced: n = 8.** iPhone 14 256 GB: INR 0 on both. iPhone 16 256 GB: 0 / +140 / +440. **iPhone 17 256 GB: +2,460 (clean, aged) and -2,630 (two defects). iPhone 17 Pro Max 512 GB: +2,530 (clean, aged).** Over all 10 priced rows: mean absolute error INR 822 vs the existing engine's 1,917; median relative error 0.1%, p90 5.3%, max 7.5%.
- The iPhone 17-family aged clean baselines are over-estimated by 3-5% and were labelled `measured`. That is the clearest sign the age rule may not be stable over time (or that those tester rows saw different questions). It is 3 records and not conclusive.

**Fresh, new Cashify quotes could not be collected.** I tried to drive Cashify's quote flow in the browser. The questionnaire could be completed without a login, but the page froze at the last step (renderer unresponsive after the accessories "Continue", on two separate tabs), so no price was read. Going further would likely mean the site's sign-in; I will not enter credentials or create accounts. So the frozen-rule validation uses earlier independent data only (n = 10 priced) and must not be quoted as fresh-quote validation. The validator accepts new captures (`{"rows":[{id, model, storage, getUpto, sellingPrice, observedAt, diagnostics}]}`) without changing any rule: `npx tsx scripts/pricing-evidence/validate-independent.ts new.json`.

## 8. Coverage and error limits

`docs/PRICING_EVIDENCE_COVERAGE.md` has the per-model table (generated by `coverage-limits.ts`). Pooled over the held-out rows of protocols 1 and 2 (4,415 quotes), under what `scope.json` serves:
- **75.4%** of requests get an evidence-engine price, **5.5%** stay on the existing engine (iPhone 15, 15 Pro Max, X: no evidence model), **19.1%** go to inspection.
- Estimate error on evidence-priced rows: median 0.0-0.2%, p90 0.0-2.6%, p95 up to 15.8% (15 Plus) and 8.4% (17 Pro Max), worst single rows up to 80% of the price on unseen shapes. These tails are why the measured/inferred split exists; on rows labelled `measured` the p95 is about 1%.
- Against the real Cashify payout: **557 of 3,573 priced quotes (15.6%)** exceed the allowance; most by under INR 700, a minority far more (17 Pro Max INR 5,160 and 18 Pro Max INR 7,500 on unseen shapes; iPhone 15 INR 19,790 on the existing engine).

Coverage limits, stated explicitly:
- Only iPhones listed in `scope.json`, only the storage variants measured, only the questionnaire the quotes were collected with, dated 16-24 Oct 2026.
- Measured-only models refuse any answer combination their own quotes did not contain: iPhone 15 Plus, 15 Pro, 16 Pro, 16e, 17, 17 Pro Max and 17e send 39-57% of held-out requests to inspection, iPhone 14 and 14 Pro 10-14%. That is the price of not guessing.
- iPhone 12 and 13 are not modelled; the 400-quote plan is the route to cover them.

## 9. Build and browser verification

- `npx next build` succeeds (`data/pricing-evidence/next_build.log`). `tsc` is clean for the Next and server configs.
- Local browser check with no database and no production data: the real Express API (`NODE_ENV=development`, throwaway secrets, file-backed reference store) and the built frontend, driven in Chrome. The server returned the signed quote (`POST /api/quote/price`, 200, `fhoneifyPrice` 29,047, `couponHeadroom` 299). The page showed INR 28,948 = server price - the INR 99 display fee, with no price computed in the browser, and a reload restored the same INR 28,948. A condition the evidence model refuses rendered the "Inspection required" page with the WhatsApp request link.
- Not verified in the browser: lead creation and OTP login. Both need the database (the OTP store is Prisma-backed), which I did not touch; I seeded a locally signed test token instead of logging in. Lead creation is covered at the service layer by `pricing.apple-evidence-flow` (signed token binds device and answers, the lead keeps the exact quote and payout, headroom clamps the coupon).
- The local API, as in production config, runs in `hybrid` release mode and reports `freshReleaseRoutes: 0` (its release-route evidence expired 15 Oct). That is pre-existing and unchanged by this work.

## 10. Verification summary

Final suite loop with the database unreachable: `data/pricing-evidence/suites_final.log`. The failures listed there also fail on pristine `origin/main` (`baseline_suites_origin_main.log`).

## 11. Decisions needing your approval

1. **Do you want a hard Cashify ceiling?** It cannot be given from an estimate. Options: (a) keep the ceiling against the estimate and publish the observed-compliance figures above; (b) price from E x (1 - m) with m taken from the margin sweep (1-2% removes most small breaches at about INR 620-1,600 per quote); (c) send uncertain shapes to inspection; (d) lower the uplift so there is slack. I would suggest (b) with m = 1-2% plus (c), but each changes customer prices, so this is yours to decide.
2. **iPhone 15 and 15 Pro Max on the existing engine.** It ignores touch failure and similar answers (INR 17-20k over). Decide whether those answers go to inspection until an evidence model passes.
3. **INR 20 IMEI-fee basis** in the ceiling, and that Get Upto is not capped (only the final quote).
4. **Coupon clamp** UX (the INR 299 coupon is reduced to the remaining headroom).
5. **Inferred-combination policy** per model (`inspect` today); the coverage table shows the inspection rate it costs.
6. **Warranty-void form rule** and the **extreme-fault inspection** rule (>= 10 functional faults).
7. **Catalog fixes** found on the way (RAM values, iPhone 18 storage spelling, stale base prices) and the **iPhone 18 round-price** authenticity question.
8. **T5 subset floor and the added T7** thresholds.
9. **Age law stability**: earlier independent iPhone 17-family aged baselines are 3-5% below the model's; collect fresh dated quotes before relying on `measured` labels there.
10. **Approve the 400-quote iPhone 12/13 plan** and the gap list, and a small fresh in-scope set (iPhone 16, 17, 17 Pro Max, aged and clean) captured by a person, so the frozen rules can be tested on genuinely new quotes.
11. **Heavily damaged phones: inspection instead of the INR 100 minimum quote** (section 5). Approve, or say how a zero Cashify-equivalent should be treated.
12. Tier selection (4/6/8%) is unchanged; say if you want a change.

## 12. Remaining uncertainty

- Estimate error limits every claim about the real Cashify ceiling; the ceiling function does not remove it.
- Calibration reflects 16-24 Oct 2026 Cashify tables; earlier independent rows suggest drift on the age rule.
- Touch-failure, multi-fault and unseen-shape combinations remain thin on most models.
- Frozen-rule validation on independent data is n = 10 priced rows from earlier campaigns; there is no fresh-quote validation yet.
