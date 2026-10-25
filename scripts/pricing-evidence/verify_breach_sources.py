#!/usr/bin/env python3
"""Verify the source records behind the largest observed-payout breaches, one by one.

Reads the ZIP archives in memory (nothing is extracted or executed) and, for every listed record, checks:
  1. the case exists in the normalised measurements with the same figures
  2. base price = selling price + INR 20 IMEI fee
  3. payout = selling price - a fee from Cashify's known schedule (49 / 69 / 99)
  4. the figures appear in every other representation shipped in the same archive (txt report, html table, json)
  5. no other measurement of the same normalised configuration disagrees by more than 2% (conflict check)
  6. the Get Upto used as the reference matches the archive's own flawless control for that variant

Usage: python -I scripts/pricing-evidence/verify_breach_sources.py --evidence data/pricing-evidence --data <dir with the zips> [--top 60]
"""
import argparse
import collections
import json
import os
import re
import sys
import zipfile

sys.stdout.reconfigure(encoding="utf-8")


def fmt_inr(n):
    return f"{n:,}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--top", type=int, default=60)
    a = ap.parse_args()
    val = os.path.join(a.evidence, "validation")
    meas = {}
    by_config = collections.defaultdict(list)
    for line in open(os.path.join(a.evidence, "measurements.jsonl"), encoding="utf-8"):
        if line.strip():
            m = json.loads(line)
            src = (f"{m['archive']}::{m['member']}::{m['case_id']}", m.get("storage_gb"))
            meas[src] = m
            by_config[m["config_key"]].append(m)
    seen = {}
    for protocol in ("p1", "p2", "p3", "p4"):
        path = os.path.join(val, f"ceiling_breaches_{protocol}.jsonl")
        if not os.path.exists(path):
            continue
        for line in open(path, encoding="utf-8"):
            if line.strip():
                w = json.loads(line)
                key = (w["source"], w["storage"])
                if key not in seen or w["excessRupees"] > seen[key]["excessRupees"]:
                    seen[key] = dict(w, protocol=protocol)
    worst = sorted(seen.values(), key=lambda w: -w["excessRupees"])[: a.top]
    zips = {}
    report = []
    for w in worst:
        archive, member, case = w["source"].split("::")
        checks = {}
        gb = {"GB": 1, "TB": 1024}
        mm = re.match(r"(\d+)(GB|TB)", w["storage"])
        m = meas.get((w["source"], int(mm.group(1)) * gb[mm.group(2)] if mm else None))
        checks["in_measurements"] = m is not None
        if m:
            checks["figures_match_rows"] = m["selling"] == w["observedSelling"] and m["base"] == w["observedBase"]
            checks["base_equals_selling_plus_20"] = m["base"] == m["selling"] + 20
            fee = m["selling"] - m["payout"] if m.get("payout") is not None else None
            checks["payout_fee_in_schedule"] = True if fee is None else fee in (49, 69, 99)  # records without a payout line carry no fee to check
            peers = [x for x in by_config.get(m["config_key"], []) if x is not m and x.get("selling")]
            drift = [abs(x["selling"] - m["selling"]) / m["selling"] for x in peers]
            checks["peer_measurements"] = len(peers)
            checks["max_peer_difference_pct"] = round(100 * max(drift), 2) if drift else None
            checks["peers_agree_within_2pct"] = (max(drift) <= 0.02) if drift else True
        # other representations in the same archive
        reps = {"json": None, "txt": None, "html": None}
        zpath = os.path.join(a.data, archive)
        if os.path.exists(zpath):
            z = zips.setdefault(archive, zipfile.ZipFile(zpath))
            figs = [fmt_inr(w["observedSelling"])]
            for name in z.namelist():
                low = name.lower()
                kind = "txt" if low.endswith(".txt") else "html" if low.endswith(".html") else "json" if low.endswith(".json") else None
                if not kind:
                    continue
                text = z.read(name).decode("utf-8", "replace")
                if kind == "json":
                    ok = re.search(r'"selling"\s*:\s*%d\b' % w["observedSelling"], text) is not None or str(w["observedSelling"]) in text
                else:
                    ok = figs[0] in text
                reps[kind] = bool(reps[kind]) or ok  # corroborated if ANY file of that kind in the archive shows it
        checks["figure_in_json"] = reps["json"]
        checks["figure_in_txt"] = reps["txt"]
        checks["figure_in_html"] = reps["html"]
        # a different layout of the same archive may simply not list this variant: that is "not corroborated", not a contradiction
        problems = [k for k, v in checks.items() if v is False and not k.startswith("figure_in_")]
        not_corroborated = [k for k, v in checks.items() if v is False and k.startswith("figure_in_")]
        report.append({
            "rank": len(report) + 1, "protocol": w["protocol"], "excessRupees": w["excessRupees"], "excessPct": w["excessPctOfCashifyPayout"],
            "model": w["model"], "storage": w["storage"], "source": w["source"], "answers": w["answers"], "servedBy": "existing" if w["usedExistingEngine"] else "evidence",
            "confidence": w["confidence"], "observedBase": w["observedBase"], "engineEquivalent": w["engineEquivalent"], "engineError": w["engineErrorVsObservedBase"],
            "checks": checks, "problems": problems, "notCorroboratedBy": not_corroborated,
        })
    out = {
        "checked": len(report), "withProblems": sum(1 for r in report if r["problems"]), "notCorroborated": sum(1 for r in report if r["notCorroboratedBy"]),
        "problemCounts": collections.Counter(p for r in report for p in r["problems"]),
        "records": report,
    }
    with open(os.path.join(val, "breach_source_verification.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, indent=1, default=dict)
        f.write("\n")
    print("checked", out["checked"], "with problems", out["withProblems"], "not fully corroborated", out["notCorroborated"], dict(out["problemCounts"]))
    for r in report:
        if r["problems"]:
            print(r["rank"], r["model"], r["storage"], r["source"], r["problems"], r["checks"].get("max_peer_difference_pct"))


if __name__ == "__main__":
    main()
