# iPhone deduction correction and uplift audit - 26 October 2026

## Confirmed behavior

`applyCompetitorUplift(reference, conditionValue)` chooses the tier from the unmodified reference: 8% at or below INR20,000, 6% at or below INR50,000, otherwise4%. The extra is calculated on the condition value, capped at INR2,000. It is not a permanent bonus calculated on the undamaged reference. The service additionally constrains customer payout after fees and coupon against the estimated Cashify payout plus min(8%, INR2,000).

Examples before customer fees: reference/condition 10,000/10,000 ->10,800;30,000/10,000 ->10,600;50,000/50,000 ->52,000;100,000/100,000 ->102,000. The uplift basis has not changed in this correction. The owner's proposed reference-bonus-first policy is awaiting clarification because it can conflict with the original ceiling on final condition value.

## Bug and correction

Older specialized formulas for iPhone X, XR, XS,11,12,12 Pro Max and13 omitted screen/body fields. The new fallback uses the existing shared physical constants and model scales when a recorded or calibrated evidence route does not handle the quote. It compares existing and restored charges per repair group; it does not add two screen replacement charges. Clean labels are normalized so explicit No spots/No scratches/Phone not bent answers cannot create a false damage deduction. Calling-failure outcomes are preserved.

These are existing fallback deductions, not newly measured Cashify coefficients for every older model. This release establishes that meaningful answers affect prices and preserves the supplied measured records; it does not establish universal Cashify accuracy for unmeasured combinations.

## Fresh verification

- Regression reproduced before fix: iPhone X128GB cracked glass at reference8,000 had zero deduction.
-1,390 focused checks across21older variants and references at80%,100%,120% of catalog reference, including physical singles, combinations and explicit-clean labels: pass.
- Production-configured service archive replay:2,284cases,0mismatches,0recorded payout ceiling breaches.
- Evidence27,exact6,quote/lead flow10,signed coupon3,ceiling17: pass.
- Golden regression27,production40,reference-data28,consistency9,GetUpto5,INRdeductions22: pass (see actual logs for suite output).
- Next production build and both TypeScript configurations: pass.
- Full `test:pricing:all` stops at its database integration suite:9failures because the test database is deliberately unreachable. No production-writing integration test was allowed to connect to production. The subsequent offline GetUpto and INR suites were run separately and pass.
- Broader single-input audit:6,946conditions across151Apple catalog variants/46modelnames. After correction no ignored cracked/chipped/light-scratch/large-spot/panel/bent/body-scratch/major-dent singles remain in this audit. This is a behavior audit, not independent price-parity validation.
-194same-date/reference clean/single-defect pairs in supplied observations: calibrated-rules-only mean absolute price error about INR87. Exact lookup is bypassed for this calculation. This is an in-sample diagnostic, not a held-out accuracy claim.
- Independent review identified the explicit-clean-label edge case; corrected and independently rechecked the1,390focused cases. No remaining blocker reported.

Logs remain local under `release-test-logs/legacy-physical-*`; broader audit inputs/results are in the main checkout's `scratch/iphone-live-audit/`. Live smoke will be recorded after deployment. No OTP, leads, reference refresh, schema or authentication changes are included.
