#!/usr/bin/env python3
"""Layer the normalized observations into occurrence -> measurement -> configuration, and report.

occurrence   one parsed record from one archive member (observations.jsonl)
measurement  occurrences that are the SAME observation exported more than once
             (same configuration, same date, same prices; per-source counts are
             max-merged so a baseline deliberately measured twice stays two)
configuration unique normalized condition inputs (model, storage, answers, defects),
             regardless of date. This is also the leakage-safe partition unit.

Prices are never used as the only reason to merge two records.

Usage: python -I scripts/pricing-evidence/analyze_dataset.py --in-dir data/pricing-evidence
"""
import argparse
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")

BASE_AGE = "Below 3 months"


def cfg_key(r):
    i = r["inputs"]
    return "|".join([
        r["model_key"] or "?", str(r["storage_gb"]),
        i["calls"]["value"], i["touch"]["value"], i["original_screen"]["value"],
        i["warranty"]["value"], i["bill"]["value"], i["box"]["value"], i["charger"]["value"],
        str(i["esim"]["value"]), str(i["age"]["value"]), ",".join(r["defect_codes"]),
    ])


def q_codes(r):
    i = r["inputs"]
    out = []
    if i["calls"]["value"] == "no": out.append("Q01")
    if i["touch"]["value"] == "no": out.append("Q02")
    if i["original_screen"]["value"] == "no": out.append("Q03")
    return out


def deviations(r):
    """Ways this configuration departs from the flawless baseline, as labelled tokens."""
    i = r["inputs"]
    dev = list(q_codes(r)) + list(r["defect_codes"])
    if i["warranty"]["value"] == "no": dev.append("WARRANTY_NO")
    if i["bill"]["value"] == "no": dev.append("BILL_NO")
    if i["box"]["value"] == "no": dev.append("BOX_NO")
    if i["charger"]["value"] == "no": dev.append("CHARGER_NO")
    if i["esim"]["value"] == "Dual eSIM": dev.append("ESIM_DUAL")
    a = i["age"]["value"]
    if a not in (BASE_AGE, "not_shown", "unknown", "not_asked") : dev.append("AGE:" + str(a))
    return dev


def group_of(code):
    return {"Q": "basic", "F": "functional", "S": "screen_physical", "D": "display", "C": "body", "P": "panel"}.get(code[0], "other")


def classify(r):
    dev = deviations(r)
    codes = [d for d in dev if len(d) == 3 and d[0] in "QFSDCP" and d[1:].isdigit()]
    others = [d for d in dev if d not in codes]
    n = len(dev)
    if n == 0:
        return "baseline", 0
    if codes and not others:
        return ("single_defect" if len(codes) == 1 else ("pair" if len(codes) == 2 else "combo_3plus")), len(codes)
    if others and not codes:
        if all(o.startswith("AGE:") or o in ("WARRANTY_NO",) for o in others):
            return "warranty_age", n
        if all(o in ("BOX_NO", "CHARGER_NO") for o in others):
            return "accessory", n
        return "answers_only", n
    return ("defect_plus_answers" if len(codes) == 1 else "combo_with_answers"), n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-dir", required=True)
    args = ap.parse_args()
    obs = [json.loads(l) for l in open(os.path.join(args.in_dir, "observations.jsonl"), encoding="utf-8")]
    inv = json.load(open(os.path.join(args.in_dir, "inventory.json"), encoding="utf-8"))

    for r in obs:
        r["config_key"] = cfg_key(r)
        r["config_id"] = hashlib.sha1(r["config_key"].encode()).hexdigest()[:10]
        r["class"], r["n_dev"] = classify(r)
        r["deviations"] = deviations(r)

    # ---- measurement layer (numeric + no-offer + NA); PENDING never enters
    evid = [r for r in obs if r["outcome"] in ("NUMERIC_QUOTE", "NO_OFFER")]
    def date_key(r):
        return r["observed_date"] or "unknown"
    def price_key(r):
        # Headline selling price is the one number every source records; fee fields are
        # compared separately (see consistency check) because some exports omit them.
        return (r["selling"], r["outcome"])
    def richness(r):
        return sum(r[k] is not None for k in ("base", "payout", "imei_fee", "processing_fee"))
    groups = defaultdict(list)
    for r in evid:
        groups[(r["config_key"], date_key(r), r["observed_date_end"] or "unknown", price_key(r))].append(r)
    measurements = []
    field_conflicts = []
    for k, rs in groups.items():
        per_source = Counter((r["archive"], r["member"]) for r in rs)
        # Sources are different exports of the same measurements: max-merge their per-source
        # counts, so a baseline deliberately measured twice in ONE file stays two measurements.
        n_unique = max(per_source.values())
        best = sorted(per_source.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
        reps = [r for r in sorted(rs, key=lambda r: (-richness(r), r["archive"], r["member"], str(r["case_id"]))) if (r["archive"], r["member"]) == best][:n_unique]
        # a more complete export of the same measurement supplies missing fee fields
        donors = sorted([r for r in rs if (r["archive"], r["member"]) != best], key=lambda r: -richness(r))
        others = [r for r in rs if r not in reps]
        for rep in reps:
            m = dict(rep)
            for fld in ("base", "payout", "imei_fee", "processing_fee"):
                if m[fld] is None:
                    for d in donors:
                        if d[fld] is not None:
                            m[fld] = d[fld]; m.setdefault("fields_from_other_export", []).append(fld); break
            for fld in ("base", "payout"):
                vals = {r[fld] for r in rs if r[fld] is not None}
                if len(vals) > 1:
                    field_conflicts.append({"config_key": k[0], "date": k[1], "field": fld, "values": sorted(vals)})
            if m["base"] is None and m["selling"] is not None:
                # Cashify's base price is always the selling price + the INR 20 IMEI fee (2,238 of 2,238 records
                # that record both). Derived, flagged, and never used to claim a payout or processing fee.
                m["base"] = m["selling"] + 20
                m.setdefault("derived_fields", []).append("base=selling+20")
            m["measurement_id"] = hashlib.sha1((rep["obs_id"] + "m").encode()).hexdigest()[:12]
            m["also_in"] = sorted({f"{o['archive']}::{o['member']}::{o['case_id']}" for o in others})
            m["export_duplicate_count"] = len(rs)
            measurements.append(m)
    measurements.sort(key=lambda m: (m["model_key"], m["storage_gb"] or 0, m["observed_date"] or "", m["config_key"], str(m["case_id"])))

    # date-unknown records twin check (possible duplicates of a dated measurement)
    dated_by_cfgprice = defaultdict(list)
    for m in measurements:
        if m["observed_date"]:
            dated_by_cfgprice[(m["config_key"], price_key(m))].append(m)
    for m in measurements:
        if not m["observed_date"]:
            tw = dated_by_cfgprice.get((m["config_key"], price_key(m)), [])
            m["possible_duplicate_of_dated"] = [t["measurement_id"] for t in tw]

    # ---- configuration layer
    cfgs = defaultdict(list)
    for m in measurements:
        cfgs[m["config_key"]].append(m)
    conflicts = []
    for ck, ms in cfgs.items():
        priced = [m for m in ms if m["outcome"] == "NUMERIC_QUOTE"]
        outcomes = {m["outcome"] for m in ms}
        sig = {(m["selling"]) for m in priced}
        if len(sig) > 1 or len(outcomes) > 1:
            kind_dates = {m["observed_date"] for m in ms}
            conflicts.append({
                "config_key": ck, "n_measurements": len(ms), "outcomes": sorted(outcomes),
                "selling_values": sorted(x for x in sig if x is not None),
                "same_day": len(kind_dates) < len(ms) and any(c > 1 for c in Counter(m["observed_date"] for m in ms).values()),
                "measurements": [{"id": m["measurement_id"], "date": m["observed_date"], "selling": m["selling"], "base": m["base"],
                                  "outcome": m["outcome"], "source": f"{m['archive']}::{m['member']}::{m['case_id']}"} for m in ms],
            })

    # ---- baselines by (model, storage, date)
    baselines = defaultdict(list)
    for m in measurements:
        if m["class"] == "baseline" and m["outcome"] == "NUMERIC_QUOTE":
            baselines[(m["model_key"], m["storage"], m["observed_date"])].append(m["selling"])

    # ---- counts
    def cnt(fn, rows):
        c = Counter(fn(r) for r in rows)
        return {str(k): v for k, v in sorted(c.items(), key=lambda kv: str(kv[0]))}
    occ_numeric = [r for r in obs if r["outcome"] == "NUMERIC_QUOTE"]
    meas_numeric = [m for m in measurements if m["outcome"] == "NUMERIC_QUOTE"]
    cfg_numeric = {m["config_key"] for m in meas_numeric}
    report = {
        "occurrences": {"total": len(obs), "by_outcome": cnt(lambda r: r["outcome"], obs), "by_family": cnt(lambda r: r["family"], obs)},
        "measurements": {"total_numeric_or_no_offer": len(measurements), "numeric": len(meas_numeric),
                         "no_offer": sum(1 for m in measurements if m["outcome"] == "NO_OFFER")},
        "configurations": {"unique_numeric": len(cfg_numeric), "unique_with_no_offer_only": len({m["config_key"] for m in measurements} - cfg_numeric),
                           "configs_with_multiple_measurements": sum(1 for ms in cfgs.values() if len(ms) > 1)},
        "numeric_by_model_primary": cnt(lambda r: r["model_key"], occ_numeric),
        "numeric_measurements_by_model": cnt(lambda r: r["model_key"], meas_numeric),
        "unique_numeric_configs_by_model": {k: len({m['config_key'] for m in meas_numeric if m['model_key'] == k}) for k in sorted({m['model_key'] for m in meas_numeric})},
        "numeric_measurements_by_variant": cnt(lambda r: f"{r['model_key']} {r['storage']}", meas_numeric),
        "unique_numeric_configs_by_variant": {k: len({m['config_key'] for m in meas_numeric if f"{m['model_key']} {m['storage']}" == k}) for k in sorted({f"{m['model_key']} {m['storage']}" for m in meas_numeric})},
        "numeric_measurements_by_date": cnt(lambda r: r["observed_date"] or "unknown", meas_numeric),
        "numeric_measurements_by_date_basis": cnt(lambda r: r["date_basis"], meas_numeric),
        "numeric_measurements_by_class": cnt(lambda r: r["class"], meas_numeric),
        "no_offer_by_model": cnt(lambda r: r["model_key"], [m for m in measurements if m["outcome"] == "NO_OFFER"]),
        "export_field_conflicts": len(field_conflicts),
        "conflicts": {"configs_with_differing_outcome_or_price": len(conflicts),
                      "same_day": sum(1 for c in conflicts if c["same_day"]),
                      "cross_date": sum(1 for c in conflicts if not c["same_day"])},
    }
    # generation families for headline audit labels
    fam = lambda k: ("iPhone 14-18" if any(k.startswith(p) for p in ("iPhone 14", "iPhone 15", "iPhone 16", "iPhone 17", "iPhone 18")) else ("Air" if "Air" in k else ("iPhone X" if k == "iPhone X" else "other")))
    report["audit_groups_numeric_measurements"] = cnt(lambda r: fam(r["model_key"]), meas_numeric)
    report["audit_groups_numeric_occurrences"] = cnt(lambda r: fam(r["model_key"]), occ_numeric)

    # coverage matrix: model/storage x class (unique configs)
    cov = defaultdict(lambda: defaultdict(set))
    for m in meas_numeric:
        cov[f"{m['model_key']} {m['storage']}"][m["class"]].add(m["config_key"])
    report["coverage_unique_configs"] = {k: {c: len(v) for c, v in sorted(d.items())} for k, d in sorted(cov.items())}
    # defect-code coverage (single-defect and any)
    code_any = defaultdict(lambda: defaultdict(set))
    code_single = defaultdict(set)
    for m in meas_numeric:
        for d in m["deviations"]:
            code_any[f"{m['model_key']} {m['storage']}"][d].add(m["config_key"])
        if m["class"] == "single_defect":
            code_single[f"{m['model_key']} {m['storage']}"].add(m["deviations"][0])
    report["single_defect_codes_covered"] = {k: sorted(v) for k, v in sorted(code_single.items())}
    all_codes = sorted(inv["catalog"].keys())
    report["single_defect_codes_missing"] = {k: [c for c in all_codes if c not in v] for k, v in sorted(code_single.items())}
    report["baseline_by_variant_date"] = {f"{k[0]} {k[1]} {k[2]}": sorted(set(v)) for k, v in sorted(baselines.items(), key=lambda kv: str(kv[0]))}

    # pair claim check
    pairs = [m for m in measurements if m["family"] == "pair_jsonl"]
    claimed = sum(1 for m in pairs if (m["extra"].get("claimedDifferenceFromAdding") or 0) != 0)
    report["pair_claims"] = {"observed_pairs": len(pairs), "claimed_nonadditive": claimed,
                             "pending_pairs": sum(1 for r in obs if r["family"] == "pair_plan"),
                             "claimed_fullyApplied_true": sum(1 for m in pairs if m["extra"].get("claimedFullyApplied") is True)}

    os.makedirs(args.in_dir, exist_ok=True)
    with open(os.path.join(args.in_dir, "measurements.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for m in measurements:
            f.write(json.dumps(m, ensure_ascii=False, sort_keys=True) + "\n")
    with open(os.path.join(args.in_dir, "export_field_conflicts.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(field_conflicts, f, ensure_ascii=False, indent=1, sort_keys=True)
    with open(os.path.join(args.in_dir, "conflicts.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(conflicts, f, ensure_ascii=False, indent=1, sort_keys=True)
    with open(os.path.join(args.in_dir, "dataset_report.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(json.dumps({k: report[k] for k in ("occurrences", "measurements", "configurations", "conflicts", "audit_groups_numeric_measurements", "audit_groups_numeric_occurrences", "pair_claims")}, indent=1))


if __name__ == "__main__":
    main()
