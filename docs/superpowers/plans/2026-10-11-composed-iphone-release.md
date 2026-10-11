# Composed iPhone release implementation plan

> For agentic workers: execute inline with one focused independent review subagent at completion.

Goal: one main-based frozen review commit containing approved c130458 and supported C1, with no live collection, writes, push or deployment.
Architecture: preserve c130's narrow storage dispatch and exact evidence guards; add C1 row/route to the existing lists. Make runtime exact-file overlays additive to packaged evidence so a C1-only override cannot discard it. Missing/conflicting overlays retain the packaged baseline with a logged error.
Tech stack: TypeScript, Express router, tsx/assert, Next build, sanitized API runtime artifact.
Spec: user request and prior frozen APPLY.txt files for c130458 and b412c03.

## Global constraints
- Keep 0dc2845 Claude/Meta and all nonpricing files unchanged.
- Preserve all historical evidence,13 prior c130 rows/12 unique profiles, scoped storage and acceptance safeguards.
- No collector/alias extension, coefficients, uplift,fees,coupon,age or reference DB changes.
- C2 ambiguous,C3/C4 unattempted remain excluded.

## Review focus
- C1-only override must add to, never replace, packaged evidence; conflicting duplicate IDs fail to packaged evidence.
- Existing profile/reference/answer/freshness guards must still decide eligibility.
- Build artifact must contain all three route files at the configured runtime paths.
- All 12 prior profiles must retain selected IDs/fingerprints/version/payout and siblings retain c130 fallback behavior.
- Old/missing/invalid repriced tokens require review before persistence; accepted commitments remain unchanged.

## Execution
- [x] Verify current main/API/reference/profile snapshots read-only; record any six-reference proposal drift.
- [x] Port approved c130 diff onto exact current main without a commit; baseline its two focused storage/router suites.
- [x] Add failing override/composition checks; verify RED for C1-only replacement.
- [x] Add C1 fixture and route/import additively. Port C1 router tests adjusted for combined51routes, leaving c130 dispatch untouched.
- [x] Implement additive exact-file overlay and fallback preservation, with duplicate-ID conflict checks.
- [x] Verify C1 actual router and all12prior profiles; compare sibling fallback and six proposed reference effects separately.
- [x] Build Next and sanitized API runtime artifact; test router from the extracted artifact and inventory/hash all configured route files.
- [x] Run safe regression/type checks, request independent read-only review, fix material findings and reverify affected tests.
- [x] Freeze one release commit, patch/archive/base/hashes, activation/CAS/rollback instructions; no push/deploy.

Ruling: one final commit only, per user; no intermediate commits, push, deployment, collection or production data updates. Focused independent review approves local freeze.
