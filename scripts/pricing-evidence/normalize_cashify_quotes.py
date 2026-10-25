#!/usr/bin/env python3
"""Normalize the collected Cashify iPhone quotation archives into one traceable dataset.

Safety: archives are read in memory with zipfile. Only .json/.jsonl/.txt members are
parsed; .py and .html members are never executed or imported (they are only hashed).
Source archives are never modified.

Usage:
  python -I scripts/pricing-evidence/normalize_cashify_quotes.py --data-dir <dir with zips> --out-dir data/pricing-evidence

Outputs (all deterministic, sorted):
  observations.jsonl      one row per parsed record occurrence (before de-duplication)
  inventory.json          archives, members, hashes, representation roles, parse warnings
  parse_report.json       per-archive counts and cross-representation checks
"""
import argparse
import hashlib
import json
import os
import re
import sys
import zipfile
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")

MONTHS = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"])}

# ---------------------------------------------------------------- catalog
CATALOG = {}          # code -> {"name":..., "group":...}
NAME2CODE = {}


def norm_name(s):
    s = s.lower().replace("’", "'")
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"less than \d+%", "less than 80%", s) if "battery in service" in s else s
    return s


def register_catalog(cat, where, warnings):
    for code, v in cat.items():
        name = v["name"]
        if code in CATALOG and CATALOG[code]["name"] != name:
            warnings.append({"kind": "catalog_conflict", "code": code, "a": CATALOG[code]["name"], "b": name, "where": where})
            continue
        CATALOG[code] = {"name": name, "group": v.get("group")}
        NAME2CODE[norm_name(name)] = code


ALIASES = {
    "speaker faulty (speaker not working)": "F06",
    "face sensor not working": "F08",
    "bluetooth not working": "F14",
    "wifi not working": "F05",
    "wi-fi not working": "F05",
    "vibrator not working": "F15",
}


def name_to_code(name):
    n = norm_name(name)
    return NAME2CODE.get(n) or ALIASES.get(n)


# ---------------------------------------------------------------- helpers
def sha256(b):
    return hashlib.sha256(b).hexdigest()


def money(s):
    """'₹1,40,000' / 'INR 42,200' / '₹164,980' -> int ; None if not a number."""
    if s is None:
        return None
    m = re.search(r"([\d][\d,]*)", str(s))
    if not m:
        return None
    return int(m.group(1).replace(",", ""))


def parse_storage(s):
    s = s.upper().replace(" ", "")
    m = re.match(r"(\d+)(GB|TB)$", s)
    if not m:
        return None, None
    gb = int(m.group(1)) * (1024 if m.group(2) == "TB" else 1)
    return f"{m.group(1)}{m.group(2)}", gb


def model_key(label):
    """'Apple iPhone 15 Pro (8 GB/512 GB)' -> 'iPhone 15 Pro'. Preserve casing of known words."""
    s = re.sub(r"\(.*?\)", "", label).strip()
    s = re.sub(r"(?i)^apple\s+", "", s).strip()
    s = re.sub(r"(?i)^iphone", "iPhone", s)
    s = re.sub(r"(?i)\bpro max\b", "Pro Max", s)
    s = re.sub(r"(?i)\bpro\b", "Pro", s)
    s = re.sub(r"(?i)\bplus\b", "Plus", s)
    s = re.sub(r"(?i)\bair\b", "Air", s)
    s = re.sub(r"(?<=\d)E\b", "e", s)
    return re.sub(r"\s+", " ", s)


def parse_ram_storage(label):
    m = re.search(r"\((\d+)\s*GB\s*/\s*(\d+\s*(?:GB|TB))\)", label, re.I)
    if m:
        return int(m.group(1)), m.group(2)
    return None, None


def ram_from_url(url):
    m = re.search(r"-(\d+)-gb-(\d+)-(gb|tb)$", url or "")
    if m:
        return int(m.group(1)), f"{m.group(2)} {m.group(3).upper()}"
    return None, None


def parse_date_text(text):
    """Return (start_iso, end_iso, precision). Handles '17 October 2026' and '16–17 October 2026'."""
    m = re.search(r"(\d{1,2})\s*[–-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", text)
    if m and m.group(3).lower() in MONTHS:
        mo = MONTHS[m.group(3).lower()]
        y = int(m.group(4))
        return f"{y}-{mo:02d}-{int(m.group(1)):02d}", f"{y}-{mo:02d}-{int(m.group(2)):02d}", "range"
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", text)
    if m and m.group(2).lower() in MONTHS:
        d = f"{int(m.group(3))}-{MONTHS[m.group(2).lower()]:02d}-{int(m.group(1)):02d}"
        return d, d, "day"
    return None, None, "unknown"


TRI = {True: "yes", False: "no", None: "not_asked"}

# ---------------------------------------------------------------- record builder
def blank_inputs():
    return {k: {"value": "unknown", "basis": "unknown"} for k in
            ("calls", "touch", "original_screen", "warranty", "bill", "box", "charger", "esim", "age")}


def setin(inp, key, value, basis):
    inp[key] = {"value": value, "basis": basis}


def make_record(**kw):
    r = {
        "archive": None, "member": None, "case_id": None, "family": None, "role": "primary",
        "model_label": None, "model_key": None, "ram_gb": None, "ram_basis": None,
        "storage": None, "storage_gb": None,
        "observed_date": None, "observed_date_end": None, "date_basis": "unknown",
        "source_url": None, "variant_get_upto": None, "origin": None,
        "inputs": blank_inputs(), "defect_codes": [], "defect_names": [],
        "age_requested": None, "age_effective": None,
        "outcome": None, "outcome_reason": None,
        "selling": None, "base": None, "imei_fee": None, "processing_fee": None, "payout": None,
        "options_available": {}, "flags": [], "raw_status": None,
    }
    r.update(kw)
    return r


def apply_defaults_and_codes(rec, codes, basis_default):
    """Q-codes override calls/touch/original; remaining codes are listed defects."""
    inp = rec["inputs"]
    qs = [c for c in codes if c.startswith("Q")]
    rest = sorted(c for c in codes if not c.startswith("Q"))
    setin(inp, "calls", "no" if "Q01" in qs else "yes", "explicit_code" if "Q01" in qs else basis_default)
    setin(inp, "touch", "no" if "Q02" in qs else "yes", "explicit_code" if "Q02" in qs else basis_default)
    setin(inp, "original_screen", "no" if "Q03" in qs else "yes", "explicit_code" if "Q03" in qs else basis_default)
    rec["defect_codes"] = rest
    rec["defect_names"] = [CATALOG[c]["name"] for c in rest if c in CATALOG]


def tri(v, notasked_value="not_asked"):
    if v is True:
        return "yes"
    if v is False:
        return "no"
    return notasked_value


def age_from_json(a):
    if a in (None, "not_shown"):
        return "not_shown"
    return a


def outcome_from_json(r, wh):
    st = r.get("status")
    sel = r.get("selling")
    if st == "NO_OFFER":
        return "NO_OFFER", r.get("reason")
    if st == "NOT_APPLICABLE":
        return "NOT_APPLICABLE", r.get("reason")
    if st in ("OBSERVED_QUOTE", None) and isinstance(sel, (int, float)):
        return "NUMERIC_QUOTE", None
    return "AMBIGUOUS", f"unrecognised status={st!r} selling={sel!r} at {wh}"


# ---------------------------------------------------------------- JSON checklist family (Full_Checklist_Data.json)
def parse_checklist_json(o, archive, member, warnings):
    out = []
    register_catalog(o.get("defect_catalog", {}), f"{archive}/{member}", warnings)
    device = o["device"]
    date = o.get("observed_date")
    url = o.get("source_url")
    cfg_by_id = {c["id"]: c for c in o.get("configs", [])}
    cov = o.get("coverage", {})
    # baseline per variant = Get Upto proxy
    base_by_variant = {}
    for r in o["results"]:
        if r["id"] == "LIVE_B00" and isinstance(r.get("base"), (int, float)):
            base_by_variant[r["variant"]] = r["base"]
    for r in o["results"]:
        inp = r["inputs"]
        rec = make_record(archive=archive, member=member, case_id=r["id"], family="checklist_json",
                          model_label=device, model_key=model_key(device), origin="checklist_json",
                          observed_date=date, observed_date_end=date, date_basis="file_observed_date" if date else "unknown",
                          source_url=url)
        st, sg = parse_storage(r["variant"])
        rec["storage"], rec["storage_gb"] = st, sg
        rec["variant_get_upto"] = base_by_variant.get(r["variant"])
        apply_defaults_and_codes(rec, inp.get("defects", []), "file_default")
        i = rec["inputs"]
        setin(i, "warranty", tri(inp.get("warranty")), "file_default_or_explicit")
        setin(i, "bill", tri(inp.get("bill")), "file_default_or_explicit")
        setin(i, "box", tri(inp.get("box")), "file_default_or_explicit")
        # charger is not part of this checklist; absent key = not asked in the flow (cases X01/X03 were NOT_APPLICABLE)
        setin(i, "charger", "not_asked", "not_in_checklist")
        e = inp.get("esim")
        setin(i, "esim", "not_asked" if e is None else e, "explicit" if e else "model_does_not_ask")
        a = age_from_json(inp.get("age"))
        setin(i, "age", a, "recorded_per_outcome")
        rec["age_effective"] = a
        cfg = cfg_by_id.get(r["id"], {})
        rec["age_requested"] = cfg.get("age")
        rec["outcome"], rec["outcome_reason"] = outcome_from_json(r, f"{archive}/{member}/{r['id']}")
        rec["raw_status"] = r.get("status")
        for k in ("selling", "base", "payout"):
            rec[k] = r.get(k)
        rec["options_available"] = {"charger_offered": False, "esim_asked": e is not None}
        out.append(rec)
    for x in o.get("not_applicable_charger_cases", []):
        st, sg = parse_storage(x["variant"])
        rec = make_record(archive=archive, member=member, case_id=x["id"], family="checklist_json",
                          model_label=device, model_key=model_key(device), origin="checklist_json",
                          observed_date=date, observed_date_end=date, date_basis="file_observed_date",
                          source_url=url, storage=st, storage_gb=sg, outcome="NOT_APPLICABLE",
                          outcome_reason=x.get("reason"), raw_status=x.get("status"))
        rec["flags"].append("inputs_not_recorded_for_unavailable_option")
        rec["options_available"] = {"charger_offered": False}
        out.append(rec)
    return out, cov


# ---------------------------------------------------------------- JSON variants family (pricing_data.json)
def parse_variants_json(o, archive, member, warnings):
    out = []
    register_catalog(o.get("catalog", {}), f"{archive}/{member}", warnings)
    device = o["device"]
    variants = o.get("variants", {})
    for r in o["observations"]:
        inp = r["inputs"]
        vlabel = variants.get(r["variant"], {}).get("device", device)
        ram, _ = parse_ram_storage(vlabel)
        url = variants.get(r["variant"], {}).get("source_url")
        rec = make_record(archive=archive, member=member, case_id=r["id"], family="variants_json",
                          model_label=device, model_key=model_key(device), origin=r.get("origin"),
                          observed_date=r.get("observed_date"), observed_date_end=r.get("observed_date"),
                          date_basis="record_observed_date", source_url=url)
        if ram:
            rec["ram_gb"], rec["ram_basis"] = ram, "variant_device_label"
        st, sg = parse_storage(r["variant"])
        rec["storage"], rec["storage_gb"] = st, sg
        apply_defaults_and_codes(rec, inp.get("defects", []), "file_default")
        i = rec["inputs"]
        setin(i, "warranty", tri(inp.get("warranty")), "file_default_or_explicit")
        setin(i, "bill", tri(inp.get("bill")), "file_default_or_explicit")
        setin(i, "box", tri(inp.get("box")), "file_default_or_explicit")
        c = inp.get("charger", "absent")
        setin(i, "charger", "not_asked" if c in (None, "absent") else tri(c), "explicit" if c not in (None, "absent") else "model_does_not_offer")
        e = inp.get("esim")
        setin(i, "esim", "not_asked" if e is None else e, "explicit" if e else "model_does_not_ask")
        a = age_from_json(inp.get("age"))
        setin(i, "age", a, "recorded_per_outcome")
        rec["age_effective"] = a
        rec["outcome"], rec["outcome_reason"] = outcome_from_json(r, f"{archive}/{member}/{r['id']}")
        rec["raw_status"] = r.get("status")
        for k in ("selling", "base", "payout", "imei_fee", "processing_fee"):
            rec[k] = r.get(k)
        out.append(rec)
    for x in o.get("not_applicable_cases", []):
        st, sg = parse_storage(x["variant"])
        rec = make_record(archive=archive, member=member, case_id=x["id"], family="variants_json",
                          model_label=device, model_key=model_key(device), origin="variants_json",
                          observed_date=o.get("observed_date"), observed_date_end=o.get("observed_date"),
                          date_basis="file_observed_date" if o.get("observed_date") else "unknown",
                          storage=st, storage_gb=sg, outcome="NOT_APPLICABLE", outcome_reason=x.get("reason"),
                          raw_status=x.get("status"))
        rec["flags"].append("inputs_not_recorded_for_unavailable_option")
        out.append(rec)
    return out, o.get("coverage")


# ---------------------------------------------------------------- pair family
def parse_pairs(jsonl_text, plan, archive, member_jsonl, member_plan, baseline_price, source_url, warnings):
    out = []
    seen = set()
    for ln, line in enumerate(jsonl_text.splitlines(), 1):
        if not line.strip():
            continue
        r = json.loads(line)
        rec = make_record(archive=archive, member=member_jsonl, case_id=r["id"], family="pair_jsonl",
                          model_label="Apple iPhone 18 Pro Max (12 GB/2 TB)", model_key="iPhone 18 Pro Max",
                          ram_gb=12, ram_basis="pair_report_label", storage="2TB", storage_gb=2048,
                          origin="pair_live", observed_date=r["observedAt"][:10], observed_date_end=r["observedAt"][:10],
                          date_basis="record_observed_at", source_url=source_url,
                          variant_get_upto=baseline_price + 20 if baseline_price else None)
        codes = list(r["defectIds"])
        apply_defaults_and_codes(rec, codes, "explicit")
        i = rec["inputs"]
        setin(i, "calls", tri(r["calls"]), "explicit"); setin(i, "touch", tri(r["touch"]), "explicit")
        setin(i, "original_screen", tri(r["original"]), "explicit")
        setin(i, "warranty", tri(r["warranty"]), "explicit"); setin(i, "bill", tri(r["bill"]), "explicit")
        setin(i, "box", tri(r["box"]), "explicit"); setin(i, "charger", tri(r["charger"]), "explicit")
        setin(i, "esim", "not_asked", "model_does_not_ask")
        shown_age = r.get("actualAge") or r["age"]
        if str(shown_age).strip().lower() == "not shown":
            shown_age = "not_shown"   # Cashify skipped the age question for this answer set
        setin(i, "age", shown_age, "recorded_per_outcome")
        rec["age_requested"] = r["age"]; rec["age_effective"] = shown_age
        rec["outcome"] = "NUMERIC_QUOTE"
        rec["selling"], rec["base"], rec["imei_fee"], rec["processing_fee"], rec["payout"] = (
            r["selling"], r["basePrice"], r["imeiFee"], r["processingFee"], r["total"])
        rec["extra"] = {"singleDeductions": r.get("singleDeductions"), "claimedDifferenceFromAdding": r.get("differenceFromAddingSingles"),
                        "claimedFullyApplied": r.get("fullyApplied"), "claimedAdditivePrediction": r.get("additivePrediction")}
        seen.add(r["id"])
        out.append(rec)
    for p in plan["plan"]:
        if p["id"] in seen:
            continue
        rec = make_record(archive=archive, member=member_plan, case_id=p["id"], family="pair_plan",
                          model_label="Apple iPhone 18 Pro Max (12 GB/2 TB)", model_key="iPhone 18 Pro Max",
                          ram_gb=12, ram_basis="pair_report_label", storage="2TB", storage_gb=2048,
                          origin="pair_plan", source_url=source_url, outcome="PENDING",
                          outcome_reason="planned pair; no verified quote")
        apply_defaults_and_codes(rec, list(p["defectIds"]), "explicit")
        i = rec["inputs"]
        setin(i, "warranty", tri(p["warranty"]), "explicit"); setin(i, "bill", tri(p["bill"]), "explicit")
        setin(i, "box", tri(p["box"]), "explicit"); setin(i, "charger", tri(p["charger"]), "explicit")
        setin(i, "esim", "not_asked", "model_does_not_ask"); setin(i, "age", p["age"], "requested")
        rec["age_requested"] = p["age"]
        out.append(rec)
    return out


# ---------------------------------------------------------------- single-defect TXT table (secondary representation)
ROW = re.compile(r"^([QFSDCP]\d\d|B\d\d|N\d\d|[A-Z]+\d*)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*₹([\d,]+)\s*\|\s*₹([\d,]+)\s*\|\s*₹([\d,]+)\s*\|\s*₹([\d,]+)\s*\|\s*₹([\d,]+)\s*\|\s*(.*)$")


def parse_single_defect_table(text):
    rows = []
    for line in text.splitlines():
        m = ROW.match(line.strip())
        if m:
            rows.append({"id": m.group(1), "group": m.group(2), "name": m.group(3), "selling": money(m.group(4)),
                         "deduction": money(m.group(5)), "processing_fee": money(m.group(6)), "payout": money(m.group(7)),
                         "age_step": m.group(9)})
    return rows


# ---------------------------------------------------------------- TXT case blocks
SEP = re.compile(r"^[=\-.']{5,}$")


def clean_lines(block):
    return [l.strip() for l in block.splitlines() if l.strip() and not SEP.match(l.strip())]


def find_val(lines, label_re, take_next=True):
    """Value after 'label : value' or on the next line."""
    for idx, l in enumerate(lines):
        m = re.match(rf"^{label_re}\s*:?\s*(.*)$", l, re.I)
        if m:
            v = m.group(1).strip()
            if not v and take_next and idx + 1 < len(lines):
                v = lines[idx + 1].strip()
            return v, idx
    return None, None


def yn(v):
    if v is None:
        return "unknown"
    v = v.strip().lower()
    if v.startswith("not shown") or v.startswith("not asked"):
        return "not_asked"
    if v.startswith("yes"):
        return "yes"
    if v == "no" or v.startswith("no ") or v.startswith("no("):
        return "no"
    return "unknown"


def parse_txt_header(text, member):
    h = text.split("TEST CASE")[0]
    info = {"get_upto": None, "date_start": None, "date_end": None, "date_prec": "unknown", "url": None, "label": None,
            "case_dates": [], "model_scope": None}
    m = re.search(r"Cashify's Get Upto:\s*₹([\d,]+)", h)
    if m:
        info["get_upto"] = money(m.group(1))
    m = re.search(r"^Tested:\s*(.+)$", h, re.M)
    if m:
        info["date_start"], info["date_end"], info["date_prec"] = parse_date_text(m.group(1))
        info["tested_line"] = m.group(1).strip()
    m = re.search(r"(https://www\.cashify\.in/\S+)", h)
    if m:
        info["url"] = m.group(1)
    m = re.search(r"^(?:MODEL|Model):\s*(.+)$", h, re.M)
    if m:
        info["label"] = m.group(1).strip()
    m = re.search(r"Model scope:\s*(.+)$", h, re.M)
    if m:
        info["model_scope"] = m.group(1).strip()
    # per-case date statements
    m = re.search(r"cases\s+(\d+)\s*[–-]\s*(\d+)\s+on\s+(\d{1,2})\s+([A-Za-z]+);\s*remaining cases on\s+(\d{1,2})\s+([A-Za-z]+)", h, re.I)
    if m:
        y = 2026
        info["case_dates"].append(("range", int(m.group(1)), int(m.group(2)), f"{y}-{MONTHS[m.group(4).lower()]:02d}-{int(m.group(3)):02d}", "stated"))
        info["case_dates"].append(("rest", None, None, f"{y}-{MONTHS[m.group(6).lower()]:02d}-{int(m.group(5)):02d}", "stated"))
    m = re.search(r"Cases\s+([\d–\- and]+)\s+were tested on\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", h)
    if m:
        info["case_dates"].append(("listed", m.group(1), None, f"{m.group(4)}-{MONTHS[m.group(3).lower()]:02d}-{int(m.group(2)):02d}", "stated"))
    return info


def expand_case_list(s):
    nums = set()
    for part in re.split(r"\s*and\s*|,", s):
        part = part.strip()
        m = re.match(r"(\d+)\s*[–-]\s*(\d+)$", part)
        if m:
            nums.update(range(int(m.group(1)), int(m.group(2)) + 1))
        elif part.isdigit():
            nums.add(int(part))
    return nums


def parse_txt_cases(text, archive, member, warnings):
    out = []
    info = parse_txt_header(text, member)
    parts = re.split(r"\nTEST CASE", text)
    label_default = info["label"]
    if len(parts) < 2:
        return out, info
    # per-case date tables
    listed = {}
    for kind, a, b, d, basis in info["case_dates"]:
        if kind == "range":
            for n in range(a, b + 1):
                listed[n] = d
        elif kind == "listed":
            for n in expand_case_list(a):
                listed[n] = d
    head_text = text.split("TEST CASE")[0]
    header_not_shown = bool(re.search(r"(?i)(manufacturer warranty:\s*question not shown|questions:\s*not shown in the tested flow)", head_text))
    for part in parts[1:]:
        m0 = re.match(r"\s*(\d+)", part)
        if not m0:
            continue
        cid = int(m0.group(1))
        lines = clean_lines(part.split("\n", 1)[1] if "\n" in part else "")
        label = next((l for l in lines if re.match(r"(?i)^apple iphone", l)), label_default or "")
        ram, stor_txt = parse_ram_storage(label)
        if not stor_txt:
            m = re.search(r"Storage variant:\s*(\d+\s*(?:GB|TB))", text, re.I)
            stor_txt = m.group(1) if m else None
        if ram is None:
            ram, _ = ram_from_url(info["url"])
        rec = make_record(archive=archive, member=member, case_id=f"{cid:02d}", family="case_txt",
                          model_label=label or None, model_key=model_key(label or info["label"] or ""),
                          origin="case_txt", source_url=info["url"])
        if ram:
            rec["ram_gb"], rec["ram_basis"] = ram, "case_label_or_url"
        if stor_txt:
            rec["storage"], rec["storage_gb"] = parse_storage(stor_txt)
        # date
        mo = None
        for l in lines:
            mm = re.match(r"(?i)^observed on:\s*(\d{4}-\d{2}-\d{2})", l)
            if mm:
                mo = mm.group(1)
        if mo:
            rec["observed_date"] = rec["observed_date_end"] = mo; rec["date_basis"] = "case_observed_on"
        elif cid in listed:
            rec["observed_date"] = rec["observed_date_end"] = listed[cid]; rec["date_basis"] = "header_case_list"
        elif info["date_start"]:
            rec["observed_date"], rec["observed_date_end"] = info["date_start"], info["date_end"]
            rec["date_basis"] = "header_tested_" + info["date_prec"]
            if info["date_prec"] == "range" and info["case_dates"] == []:
                rec["flags"].append("date_range_case_date_not_resolvable")
        else:
            rec["flags"].append("no_date_in_source")
        # Get Upto (case level)
        gu, gi = find_val(lines, r"Cashify's Get Upto")
        rec["variant_get_upto"] = money(gu) if gu and "VERIFY" not in gu else info["get_upto"]
        i = rec["inputs"]
        for key, q in (("calls", r"Are you able to make and receive calls\?"), ("touch", r"Is your device's touch screen working properly\?"),
                       ("original_screen", r"Is your phone's screen original\?"), ("warranty", r"Is your device under manufacturer warranty\?"),
                       ("bill", r"Do you have GST valid bill with the same IMEI\?")):
            v, ix = find_val(lines, q)
            if key in ("warranty", "bill") and header_not_shown:
                # The header says this model's flow never shows the question; a recorded value is a default, not an answer.
                setin(i, key, "not_asked", "header_states_question_not_shown")
                if ix is not None and yn(v) in ("yes", "no"):
                    rec["flags"].append(f"{key}_value_{yn(v)}_recorded_but_header_says_question_not_shown")
            else:
                setin(i, key, yn(v) if ix is not None else "unknown", "explicit" if ix is not None else "unknown")
        # defects: screen
        codes = []
        unknown_defect_text = []
        v, ix = find_val(lines, r"Broken/scratch on device screen", take_next=False)
        screen_flag = None
        if v is not None:
            screen_flag = v
        v2, ix2 = find_val(lines, r"Check physical condition of Display Screen", take_next=False)
        if v2:
            c = name_to_code(v2)
            if c:
                codes.append(c)
            else:
                unknown_defect_text.append(v2)
        if screen_flag and screen_flag.upper() not in ("NONE", "SELECTED", "BROKEN/SCRATCH ON DEVICE SCREEN") and not name_to_code(screen_flag):
            unknown_defect_text.append(screen_flag)
        if screen_flag and screen_flag.upper() in ("SELECTED", "BROKEN/SCRATCH ON DEVICE SCREEN") and not v2:
            rec["flags"].append("screen_defect_selected_without_condition")
        for lab in (r"Dead Spot/Visible line and Discoloration on screen", r"Scratch/Dent on device body", r"Device panel missing/broken", r"Other screen/body defects"):
            vv, _ = find_val(lines, lab, take_next=False)
            if vv and vv.lower() not in ("not selected", "none"):
                c = name_to_code(vv)
                if c:
                    codes.append(c)
                else:
                    unknown_defect_text.append(f"{lab}: {vv}")
        # functional list
        fidx = next((k for k, l in enumerate(lines) if re.match(r"(?i)^Functional or Physical Problems", l)), None)
        if fidx is not None:
            for l in lines[fidx + 1:]:
                if re.match(r"(?i)^(Other functional problems|Do you have|Original |Mobile age|What is your|eSIM|How many|Apple iPhone|Cashify)", l):
                    break
                item = re.sub(r"^(?:-\s*|\d+\)\s*)", "", l).strip()
                if not item or item.upper() == "NONE":
                    continue
                c = name_to_code(item)
                if c:
                    codes.append(c)
                else:
                    unknown_defect_text.append(item)
        for u in unknown_defect_text:
            rec["flags"].append(f"unmapped_defect_text:{u}")
        # accessories
        v, ix = find_val(lines, r"Original Box with same IMEI")
        setin(i, "box", yn(v) if ix is not None else "unknown", "explicit" if ix is not None else "unknown")
        v, ix = find_val(lines, r"Original Charger of Device")
        if ix is None:
            setin(i, "charger", "not_asked", "line_absent")
        else:
            if v and "option unavailable" in v.lower():
                setin(i, "charger", "not_applicable", "requested_but_option_unavailable")
            else:
                setin(i, "charger", yn(v), "explicit")
        # age
        v, ix = find_val(lines, r"Mobile age question", take_next=False)
        age_val = None
        if v is not None:
            age_val = "not_shown"
        else:
            ai = next((k for k, l in enumerate(lines) if re.match(r"(?i)^What is your mobile age\?", l)), None)
            if ai is not None:
                for l in lines[ai + 1:]:
                    if l.startswith("("):
                        continue
                    age_val = re.sub(r"\s*:\s*Yes$", "", l).strip()
                    break
        if age_val is None:
            age_val = "not_shown"
            rec["flags"].append("age_line_absent_assumed_not_shown")
        setin(i, "age", age_val, "recorded_per_outcome"); rec["age_effective"] = age_val
        # eSIM
        v, ix = find_val(lines, r"eSIM question", take_next=False)
        if v is not None:
            setin(i, "esim", "not_asked", "model_does_not_ask")
        else:
            ei = next((k for k, l in enumerate(lines) if re.match(r"(?i)^How many eSIMs", l)), None)
            if ei is not None and ei + 1 < len(lines):
                setin(i, "esim", lines[ei + 1].strip(), "explicit")
            else:
                setin(i, "esim", "not_asked", "line_absent_header_states_" + ("single" if re.search(r"Single eSIM", text.split("TEST CASE")[0]) else "none"))
                if re.search(r"Additional input in every executed case: Single eSIM|Single eSIM in every case", text.split("TEST CASE")[0]):
                    setin(i, "esim", "Single eSIM", "header_all_cases")
        # fix calls/touch/original from answers; add Q-codes for 'No'
        # Q-style booleans stay in inputs; defect_codes carry F/S/D/C/P codes only
        rec["defect_codes"] = sorted(set(codes))
        rec["defect_names"] = [CATALOG[c]["name"] for c in rec["defect_codes"] if c in CATALOG]
        # prices
        sv, sidx = find_val(lines, r"Cashify's\s*Selling price")
        if sv is None:
            rec["outcome"], rec["outcome_reason"] = "AMBIGUOUS", "selling price line missing"
        elif "PENDING" in sv.upper():
            rec["outcome"], rec["outcome_reason"] = "PENDING", "no verified quote (pending live test)"
        elif sv.upper().startswith("N/A"):
            rec["outcome"], rec["outcome_reason"] = "NOT_APPLICABLE", next((l for l in lines if l.lower().startswith("reason:")), "option unavailable")
        else:
            rec["outcome"] = "NUMERIC_QUOTE"; rec["selling"] = money(sv)
        stv, _ = find_val(lines, r"Status", take_next=False)
        rec["raw_status"] = stv
        if stv and "NOT EXECUTABLE" in stv.upper():
            rec["outcome"] = "NOT_APPLICABLE"
            rec["outcome_reason"] = next((l for l in lines if l.lower().startswith("reason:")), "not executable as written")
        for key, lab in (("base", r"Base Price"), ("imei_fee", r"IMEI Validation Fee"), ("processing_fee", r"Processing Fee"), ("payout", r"Total Amount")):
            vv, _ = find_val(lines, lab, take_next=False)
            rec[key] = money(vv) if vv else None
        if rec["outcome"] == "NUMERIC_QUOTE" and rec["base"] is None:
            rec["flags"].append("fees_not_recorded_in_source")
        if re.search(r"FLAWLESS", part[:0]):
            pass
        out.append(rec)
    return out, info


def is_flawless(r):
    i = r["inputs"]
    return (not r["defect_codes"] and r["outcome"] == "NUMERIC_QUOTE" and r["base"] is not None
            and i["calls"]["value"] == "yes" and i["touch"]["value"] == "yes" and i["original_screen"]["value"] == "yes"
            and i["warranty"]["value"] in ("yes", "not_asked") and i["bill"]["value"] in ("yes", "not_asked")
            and i["box"]["value"] in ("yes", "not_asked") and i["charger"]["value"] in ("yes", "not_asked")
            and i["age"]["value"] in ("Below 3 months", "not_shown"))


def assign_get_upto(recs):
    """Cashify's Get Upto for a variant equals the flawless quote's base price (verified in the data).
    Header values (TXT) are kept; otherwise use the flawless base from the same file, variant and date."""
    base = {}
    for r in recs:
        if is_flawless(r):
            base.setdefault((r["member"], r["storage"], r["observed_date"]), r["base"])
    for r in recs:
        if r["variant_get_upto"] is not None:
            r["get_upto_basis"] = "header_or_pair_baseline"
        else:
            v = base.get((r["member"], r["storage"], r["observed_date"]))
            r["variant_get_upto"] = v
            r["get_upto_basis"] = "flawless_base_same_file_variant_date" if v is not None else "unavailable"


# ---------------------------------------------------------------- driver
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", required=True)
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()
    warnings = []
    inventory = {"archives": []}
    records = []
    report = {"per_archive": {}, "cross_checks": []}

    zips = sorted(f for f in os.listdir(args.data_dir) if f.lower().endswith(".zip"))
    # pass 1: catalog from JSON files
    cache = {}
    for z in zips:
        path = os.path.join(args.data_dir, z)
        raw = open(path, "rb").read()
        zf = zipfile.ZipFile(path)
        members = {}
        for info in zf.infolist():
            if info.is_dir():
                continue
            members[info.filename] = zf.read(info.filename)
        cache[z] = {"sha256": sha256(raw), "size": len(raw), "members": members}
    for z, c in cache.items():
        for n, b in c["members"].items():
            if n.lower().endswith(".json") and not n.endswith("Pair_Test_Plan.json"):
                try:
                    o = json.loads(b.decode("utf-8-sig"))
                except Exception as ex:
                    warnings.append({"kind": "json_error", "archive": z, "member": n, "error": str(ex)}); continue
                for key in ("defect_catalog", "catalog"):
                    if isinstance(o, dict) and key in o:
                        register_catalog({k: v for k, v in o[key].items()}, f"{z}/{n}", warnings)

    pair_state = {}
    for z in zips:
        c = cache[z]
        arch = {"archive": z, "sha256": c["sha256"], "size": c["size"], "members": [], "primary": None}
        names = sorted(c["members"])
        per = Counter()
        for n in names:
            b = c["members"][n]
            base = os.path.basename(n.replace("\\", "/"))
            ext = base.rsplit(".", 1)[-1].lower() if "." in base else ""
            role = "ignored"
            if ext in ("py",):
                role = "not_executed_hash_only"
            elif ext == "html":
                role = "alternative_representation_hash_only"
            arch["members"].append({"member": n, "sha256": sha256(b), "size": len(b), "role": role})
        mnames = {os.path.basename(n.replace("\\", "/")): n for n in names}
        recs = []
        # choose primary representation
        jsons = [n for n in names if n.lower().endswith(".json") and os.path.basename(n.replace("\\", "/")) not in ("test_case_counts.json", "Pair_Test_Plan.json")]
        txt_cases = [n for n in names if re.search(r"(Test_Cases|Controls?_Test_Cases|Pending)\.txt$", os.path.basename(n.replace("\\", "/")))
                     and "764_Mixed" not in n and "45_Single_Defect" not in n]
        try:
            if "Verified_Pair_Results.jsonl" in mnames:
                plan = json.loads(c["members"][mnames["Pair_Test_Plan.json"]].decode("utf-8-sig"))
                recs = parse_pairs(c["members"][mnames["Verified_Pair_Results.jsonl"]].decode("utf-8-sig"), plan, z,
                                   mnames["Verified_Pair_Results.jsonl"], mnames["Pair_Test_Plan.json"],
                                   plan.get("baselinePrice"), plan.get("source"), warnings)
                arch["primary"] = "Verified_Pair_Results.jsonl + Pair_Test_Plan.json"
                # secondary: single-defect table
                if "Single_Defect_Deductions.txt" in mnames:
                    rows = parse_single_defect_table(c["members"][mnames["Single_Defect_Deductions.txt"]].decode("utf-8-sig"))
                    report["cross_checks"].append({"archive": z, "kind": "single_defect_table_rows", "rows": len(rows)})
                    pair_state["single_rows_pair_zip"] = rows
            elif jsons:
                for jn in jsons:
                    o = json.loads(c["members"][jn].decode("utf-8-sig"))
                    if "results" in o and "configs" in o:
                        r2, cov = parse_checklist_json(o, z, jn, warnings)
                        recs += r2
                    elif "observations" in o:
                        r2, cov = parse_variants_json(o, z, jn, warnings)
                        recs += r2
                    else:
                        continue
                    arch["primary"] = jn
                    arch["declared_coverage"] = cov
            elif txt_cases:
                for tn in txt_cases:
                    r2, info = parse_txt_cases(c["members"][tn].decode("utf-8-sig"), z, tn, warnings)
                    recs += r2
                    arch["primary"] = tn
                    arch["header"] = {k: v for k, v in info.items() if k != "case_dates"}
            elif "45_Single_Defect" in z:
                tn = [n for n in names if n.endswith(".txt") and "README" not in n][0]
                rows = parse_single_defect_table(c["members"][tn].decode("utf-8-sig"))
                pair_state["single_rows_45_zip"] = rows
                arch["primary"] = "(secondary only) " + tn
        except Exception as ex:
            warnings.append({"kind": "parse_error", "archive": z, "error": repr(ex)})
        assign_get_upto(recs)
        for r in recs:
            r["archive_sha256"] = c["sha256"]
        records += recs
        per = Counter(r["outcome"] for r in recs)
        report["per_archive"][z] = {"records": len(recs), "by_outcome": dict(per)}
        inventory["archives"].append(arch)

    # secondary single-defect representations: compare to variants_json uploaded_report rows
    sd = [r for r in records if r["origin"] == "uploaded_report"]
    for key in ("single_rows_pair_zip", "single_rows_45_zip"):
        rows = pair_state.get(key)
        if rows is None:
            continue
        byid = {r["case_id"]: r for r in sd if r["storage"] == "2TB"}
        mism = []
        for row in rows:
            r = byid.get(row["id"])
            if r is None:
                mism.append({"id": row["id"], "issue": "not in uploaded_report json"}); continue
            if r["selling"] != row["selling"] or r["payout"] != row["payout"]:
                mism.append({"id": row["id"], "json": [r["selling"], r["payout"]], "txt": [row["selling"], row["payout"]]})
        report["cross_checks"].append({"kind": f"{key}_vs_uploaded_report_json", "rows": len(rows), "json_rows": len(byid), "mismatches": mism})

    # stable ids
    for r in records:
        r["obs_id"] = hashlib.sha1(f"{r['archive']}|{r['member']}|{r['case_id']}|{r['storage']}|{r['family']}".encode()).hexdigest()[:12]
    records.sort(key=lambda r: (r["model_key"] or "", r["storage_gb"] or 0, r["archive"], r["member"], str(r["case_id"])))
    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, "observations.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n")
    inventory["catalog"] = CATALOG
    inventory["warnings"] = warnings
    inventory["archive_hash_duplicates"] = [
        sorted(a["archive"] for a in inventory["archives"] if a["sha256"] == h)
        for h, n in Counter(a["sha256"] for a in inventory["archives"]).items() if n > 1]
    with open(os.path.join(args.out_dir, "inventory.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(inventory, f, ensure_ascii=False, indent=1, sort_keys=True)
    with open(os.path.join(args.out_dir, "parse_report.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(f"archives={len(zips)} records={len(records)} warnings={len(warnings)}")
    print(Counter(r["outcome"] for r in records))
    print(Counter(r["family"] for r in records))


if __name__ == "__main__":
    main()
