#!/usr/bin/env bash
# Runs every pricing regression suite with the production database made unreachable (no writes possible).
# Usage: bash scripts/pricing-evidence/run-pricing-suites.sh
# Never runs scripts/test/pricing.quote-integration.test.ts (it writes to the database) or the browser-driven suites.
export DATABASE_URL="postgresql://nobody:x@127.0.0.1:1/none"
export DIRECT_URL="$DATABASE_URL"
unset SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
pass=0; fail=0
for f in scripts/test/pricing.*.test.ts scripts/test/referencePricing.*.test.ts scripts/test/test_iphone*.ts; do
  s=$(basename "$f" .ts)
  case "$s" in pricing.quote-integration.test|pricing.agent-z-browser.test) echo "SKIP  $s (writes to the database / needs a browser)"; continue;; esac
  out=$(timeout 900 npx tsx "$f" 2>&1); code=$?
  summary=$(echo "$out" | grep -E "[0-9]+ passed" | tail -1)
  printf '%-52s exit=%s  %s\n' "$s" "$code" "$summary"
  if [ $code -ne 0 ]; then fail=$((fail+1)); echo "$out" | grep -E "FAIL|Error|AssertionError" | head -6 | sed 's/^/      /'; else pass=$((pass+1)); fi
done
echo "suites passed: $pass, failed: $fail"
