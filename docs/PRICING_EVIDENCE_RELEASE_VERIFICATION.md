# iPhone evidence pricing release verification

Verified 25 October 2026 against production baseline a8c571c and candidate a154b04 plus targeted release fixes.

## Release fixes

- Coupon allowance is authenticated in the signed quote and honored for the accepted token lifetime, keeping the displayed and saved payout identical when references move. Pricing-version changes invalidate older offers in every mode.
- Quote reacceptance compares coupon allowance as well as price. Coupon UI shows the available amount and hides offers with zero allowance.
- Historical reviewed 512GB hybrid formulas return headline selling amounts. Their ceiling now uses that basis, avoiding a second INR 20 IMEI-fee deduction.

## Verification

- Next production build and Next/server typechecks passed.
- Full offline regression run: 50 suites passed and six failed before the final fee-basis fix. All six failures independently reproduced as assertion failures on unchanged a8c571c in fhoneify-evidence-base.
- Existing failing suites: generalization-properties, iphone12-captured-profile, questionnaire-metadata, scoped-storage, team-qa, team-text-wiring. No production-writing integration tests were run.
- Signed-coupon regression reproduced the original defect before correction; three acceptance checks pass after correction. Independent reviewer found no remaining blocker in coupon fixes.
- Production-configured hybrid service reconciliation: 2,284 complete supplied archive cases; 79 INR 20 basis discrepancies reproduced before correction and zero remain after correction. Historical 512GB isolation (21 tests) and hybrid (18 groups) pass after correction.
- Supplied-case reconciliation: all 2,271 unambiguous priced cases match; 51 no-offers retained; zero recorded payout-ceiling breaches with or without coupon.
- Answer sweep: 1,450 requests over 58 enabled variants, 1,323 prices and 127 inspection outcomes, zero problems.
- OTP regression suite: 18 passed with database access disabled. HTTP quote/lead flow uses in-memory persistence; no real lead created.
- Built browser page: iPhone 17 Pro Max 512GB front-camera-fault flow renders a final payout and hides a zero-headroom coupon. Reload verification is recorded in the release session.

## Limits

Exact supplied-case reconciliation is distinct from generalization. Unrecorded conditions remain estimates, and a ceiling against that estimate does not guarantee exact parity with an unknown Cashify quote. Real WhatsApp OTP delivery and a production lead submission were not exercised; no personal phone number or unnecessary production test lead was used.

Deployment authorization: owner explicitly requested verification, bug fixes, and production push in this chat. No schema, authentication, or refresh changes are included.
