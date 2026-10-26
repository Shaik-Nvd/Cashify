# Reference-first bonus release - 26 October 2026

The owner explicitly selected: calculate the tier bonus on the original reference, cap it at INR2,000, then subtract Cashify deductions.

## Active policy

Let R be the original database reference and C the Cashify condition equivalent after age, defects and missing components. The quote before the existing customer fee is:

`round(C + min(R * tier(R), 2000))`

The existing INR100 engine floor remains, and nonpayable Cashify outcomes still require inspection. Tiers remain 8% for R<=20,000,6% for R<=50,000,otherwise 4%. Cashify base/Selling fee semantics remain explicit and unchanged. All brand calculators use the shared approved bonus helper.

The production payout safeguard now uses this same reference-based budget. It no longer trims the bonus using8% of the damaged condition value. Ordinary offers use their entire bonus budget in the signed quote, so the additional coupon allowance is zero; the existing UI hides unavailable coupons. Signed quote, reload and lead consistency are preserved.

Examples before customer fee:

| Reference | Cashify condition value | Bonus | Quote |
|---|---:|---:|---:|
|10,000|5,000|800|5,800|
|20,000|5,000|1,600|6,600|
|30,000|10,000|1,800|11,800|
|50,000|10,000|2,000|12,000|
|100,000|1,000|2,000|3,000|

The bonus may exceed 8% of the damaged value. This is the intended consequence of the owner's selected reference-first rule, replacing the former ceiling on damaged value. No defect, age or accessory coefficient changed in this release.

## Validation

- New regression failed before implementation:10,000reference/5,000condition returned5,400 instead of5,800.
- 4,065new arithmetic/service/property checks passed. They exercise damaged quotes across tier boundaries and coupon budget enforcement.
- Independent review:65service/arithmetic checks and256additional base/Selling, low-value and INR1,200fee-edge checks passed.
- 2,284complete archive cases through the configured hybrid service:0Cashify condition-equivalent mismatches and0breaches of the new reference-based budget.
- Existing Cashify condition golden values retained. Nineteen final-offer golden values deliberately changed using those unchanged condition values plus the approved reference bonus; percentage invariants now compare the bonus with the reference.
- Golden27,production40,evidence27,exact6,HTTPquote/lead10,signedcoupon3,legacyphysical1,390,ceiling17,reference-data28,consistency10,GetUpto5,INRdeductions22: pass.
- Next production build and both TypeScript configurations: pass.
- Database-writing integration tests were not run against production. Offline logs are in release-test-logs/reference-bonus-*.

Historical percentage-ceiling helpers remain only for retrospective comparisons; the production service uses applyReferenceBonusCeiling.
