# Audit of the new Cashify data — 28 October 2026

The supplied files have been inspected and normalized for a pricing implementation handoff. No production pricing, reference data, authentication or leads changed during this audit.

## What is in the folder

| Measure | Count |
|---|---:|
| Files | 69 |
| ZIP files | 67 |
| ZIP contents after byte-level duplicate removal | 62 |
| Priced case records after case/export deduplication | 5,218 |
| iPhone priced records | 4,948 |
| Samsung priced records, retained separately | 270 |
| iPhone model names with new priced records | 37 |
| iPhone model/storage identities with new priced records | 121 |
| Priced iPhone 12–18 case records | 3,090 |
| Deduplicated eligible iPhone single-functional baseline comparisons | 1,246 |
| Of those, positive observed deductions | 1,203 |
| Pending/prepared/unresolved records | 1,396 |
| Explicit unavailable records | 181 |

Case-record counts are not independent condition counts. Repeated template cases and separately documented control/session observations remain traceable. Baseline/single-fault statistics further group duplicate exports and repeat conditions. Availability and actual selected inputs must be checked before treating a no-change control as a zero-cost defect.

## What the data tells us

Many repair deductions are fixed rupee values across capacities of the same model. Other deductions track value. One percentage for every functional defect will not reproduce these observations. The final phone price can remain reference-driven while using fitted fixed component costs.

Observed deduction from the same-variant flawless Selling quote:

| Model | Front camera | Back camera | Battery service | Battery 80–85% |
|---|---:|---:|---:|---:|
| iPhone 12 | ₹1,000 | ₹2,000 | ₹1,800 | ₹540 |
| iPhone 13 | ₹1,000 | ₹3,000 | ₹3,000 | ₹900 |
| iPhone 15 Pro Max | ₹2,000 | ₹4,600 | ₹4,000 | ₹1,200 |
| iPhone 16 | ₹3,000 | ₹6,000 | ₹4,000 | ₹1,200 |
| iPhone 16 Pro | ₹3,500 | ₹6,200 | ₹4,200 | ₹1,260 |
| iPhone 18 Pro | ₹3,500 | ₹6,500 | ₹4,200 | ₹1,260 |

iPhone 16 Wi-Fi deductions vary as ₹16,500 / ₹17,100 / ₹17,400 across the tested capacities. A proportional candidate fits those cross-storage observations much better than one fixed amount. Front/back camera ratios also differ by model; a shared global ratio should not override that model’s own labels.

Across 349 iPhone model/fault groups, 283 favor fixed rupees and 66 favor a fraction of the flawless Selling baseline in the exploratory candidate comparison. These are candidate-selection results, not independent validation of a finished engine. The denominator is the recorded flawless Selling amount; it must not be silently relabeled as database Get Upto.

## Coverage and how to use it

Individual-reference reports and 30-case combination reports are different experiment families. The latter still help identify conditional marginal deductions and overlap. Screen, body, age and missing-component comparisons are retained in baseline-deductions.jsonl and controlled-contrasts.jsonl.

New files for 15 Plus, 17, 17 Pro, 17 Pro Max, 17e, Air and 18 Pro Max include prepared scenarios with prices explicitly pending. Their earlier completed measurements are available in the existing pricing-evidence dataset. The handoff requires merging them, not inventing prices or stopping for another collection round.

The new and earlier datasets together contain measurements for 45 of 46 Apple catalog model names at some level. iPhone 12 Mini lacks its own measurements in those two datasets. That is an inference boundary, not a reason to claim the entire pricing engine is perfect. Model and storage coverage still differ.

| Model | Priced records | Priced capacities in GB | Eligible single-functional code labels |
|---|---:|---|---:|
| iPhone 11 | 90 | 64, 128, 256 | 7 |
| iPhone 11 Pro | 90 | 64, 256, 512 | 0 |
| iPhone 11 Pro Max | 90 | 64, 256, 512 | 7 |
| iPhone 12 | 90 | 64, 128, 256 | 7 |
| iPhone 12 Pro | 90 | 128, 256, 512 | 7 |
| iPhone 12 Pro Max | 90 | 128, 256, 512 | 7 |
| iPhone 13 | 90 | 128, 256, 512 | 7 |
| iPhone 13 Mini | 90 | 128, 256, 512 | 7 |
| iPhone 13 Pro | 120 | 128, 256, 512, 1024 | 7 |
| iPhone 13 Pro Max | 320 | 128, 256, 512, 1024 | 18 |
| iPhone 14 | 237 | 128, 256, 512 | 18 |
| iPhone 14 Plus | 90 | 128, 256, 512 | 7 |
| iPhone 14 Pro | 200 | 128, 256, 512, 1024 | 18 |
| iPhone 14 Pro Max | 120 | 128, 256, 512, 1024 | 7 |
| iPhone 15 Plus | 0 | — | 0 |
| iPhone 15 Pro | 228 | 128, 256, 512, 1024 | 18 |
| iPhone 15 Pro Max | 174 | 256, 512, 1024 | 18 |
| iPhone 16 | 171 | 128, 256, 512 | 18 |
| iPhone 16 Plus | 171 | 128, 256, 512 | 18 |
| iPhone 16 Pro | 232 | 128, 256, 512, 1024 | 18 |
| iPhone 16 Pro Max | 174 | 256, 512, 1024 | 18 |
| iPhone 16e | 171 | 128, 256, 512 | 18 |
| iPhone 17 | 0 | — | 0 |
| iPhone 17 Pro | 0 | — | 0 |
| iPhone 17 Pro Max | 0 | — | 0 |
| iPhone 17e | 0 | — | 0 |
| iPhone 18 Pro | 232 | 256, 512, 1024, 2048 | 18 |
| iPhone 18 Pro Max | 0 | — | 0 |
| iPhone 6 | 120 | 16, 32, 64, 128 | 7 |
| iPhone 6 Plus | 91 | 16, 64, 128 | 7 |
| iPhone 6S | 120 | 16, 32, 64, 128 | 7 |
| iPhone 6S Plus | 120 | 16, 32, 64, 128 | 7 |
| iPhone 7 | 90 | 32, 128, 256 | 7 |
| iPhone 7 Plus | 90 | 32, 128, 256 | 0 |
| iPhone 8 | 90 | 64, 128, 256 | 7 |
| iPhone 8 Plus | 90 | 64, 128, 256 | 7 |
| iPhone Air | 0 | — | 0 |
| iPhone SE 1st Generation | 120 | 16, 32, 64, 128 | 7 |
| iPhone SE 2020 | 90 | 64, 128, 256 | 7 |
| iPhone SE 2022 | 237 | 64, 128, 256 | 18 |
| iPhone X | 60 | 64, 256 | 0 |
| iPhone XR | 90 | 64, 128, 256 | 0 |
| iPhone XS | 90 | 64, 256, 512 | 0 |
| iPhone XS Max | 90 | 64, 256, 512 | 0 |

Code-label coverage is not a claim that every label is a physically available fault on that model. Some reports preserve requested template labels as controls for absent fingerprint/eSIM/charger choices.

## Verification performed

- All 69 original source-file hashes verified unchanged.
- 2,540 JSON price comparisons passed.
- 6,782 structured JSON input-field comparisons passed, including hardware selections.
- 2,885 independently parsed summary-table prices matched their case blocks.
- 4,496 complete fee calculations reconciled.
- 15 parser regression checks passed.
- Complementary export answers enriched 74 records with source pointers; zero unresolved input conflicts remain.
- Independent review caught missing compact-form inputs and ISO timestamps. Those and an empty-heading parsing edge case were corrected and verified.
- The prior importer returned zero records with zero warnings for this folder; its unsupported formats must be fixed before production import.
- This was a local evidence audit. No new production model, deployment, live Cashify collection or OTP/lead test is being claimed.

## Deliverables

- CLAUDE_HANDOFF.md: detailed implementation and release instructions, preserving the approved reference-first bonus.
- case-records.jsonl: source-linked cases and execution status.
- baseline-deductions.jsonl, single-functional-pairs.jsonl, controlled-contrasts.jsonl: supervised comparisons.
- functional-patterns.json: exploratory fixed/proportional candidates and storage holdout diagnostics.
- source-inventory.json, summary.json, analysis-summary.json, verification.json, json-crosschecks.json: audit evidence.
- audit.py, analyse.py, verify_audit.py, test_audit.py: reproducible scripts.

Run in order: audit.py, analyse.py, verify_audit.py, test_audit.py. Scripts read source ZIP members as data and never execute code from them.
