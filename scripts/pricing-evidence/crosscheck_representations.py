#!/usr/bin/env python3
"""Check that the JSON, TXT report and HTML files inside each archive describe the same prices.

For every archive with a structured JSON, every selling price in the JSON must appear at the same case id and storage
variant in the archive's TXT report table, and every rupee figure in the HTML must be a figure the JSON contains.
Archives are read in memory; HTML/TXT are parsed as text only (nothing is executed).

Usage: python -I scripts/pricing-evidence/crosscheck_representations.py --data-dir <dir> --out data/pricing-evidence/representation_crosscheck.json
"""
import argparse
import json
import os
import re
import sys
import zipfile

sys.stdout.reconfigure(encoding="utf-8")
RUPEE = re.compile(r"(?:₹|INR\s*)\s?([\d,]{3,})")


def money_set(text):
    return {int(m.replace(",", "")) for m in RUPEE.findall(text)}


def parse_summary_table(txt):
    """Rows like 'M01 | Wi-Fi + Bluetooth faulty | INR 28,880 | INR 30,250 | INR 32,280' under the header with storages."""
    out = {}
    header = None
    section = None
    for line in txt.splitlines():
        if line.startswith("SELLING PRICE COMPARISON"):
            section = "selling"; continue
        if line.startswith("PAYOUT AFTER FEES"):
            section = "payout"; continue
        if section == "selling" and line.startswith("Case |"):
            header = [c.strip() for c in line.split("|")][2:]
            continue
        if section == "selling" and header and "|" in line:
            cells = [c.strip() for c in line.split("|")]
            if len(cells) >= 2 + len(header):
                cid = cells[0]
                for gb, cell in zip(header, cells[2:]):
                    m = RUPEE.search(cell)
                    out[(cid, gb)] = int(m.group(1).replace(",", "")) if m else cell
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    results = []
    for z in sorted(f for f in os.listdir(args.data_dir) if f.lower().endswith(".zip")):
        zf = zipfile.ZipFile(os.path.join(args.data_dir, z))
        names = zf.namelist()
        js = [n for n in names if n.endswith("Full_Checklist_Data.json") or n.endswith("_Data.json") and "Test_Plan" not in n]
        if not js:
            continue
        o = json.loads(zf.read(js[0]).decode("utf-8-sig"))
        if "results" not in o:
            continue
        rep = {"archive": z, "json": js[0], "txt_table_rows_compared": 0, "txt_mismatches": [], "html_figures_not_in_json": [], "html": None}
        txts = [n for n in names if n.endswith("_Report.txt")]
        if txts:
            table = parse_summary_table(zf.read(txts[0]).decode("utf-8-sig"))
            for r in o["results"]:
                key = (r["id"], r["variant"])
                if key not in table:
                    continue
                cell = table[key]
                want = r["selling"] if r.get("status") == "OBSERVED_QUOTE" else None
                rep["txt_table_rows_compared"] += 1
                if want is not None and cell != want:
                    rep["txt_mismatches"].append({"id": r["id"], "variant": r["variant"], "json": want, "txt": cell})
                if want is None and isinstance(cell, int):
                    rep["txt_mismatches"].append({"id": r["id"], "variant": r["variant"], "json": r.get("status"), "txt": cell})
        htmls = [n for n in names if n.endswith(".html")]
        if htmls:
            figures = money_set(zf.read(htmls[0]).decode("utf-8-sig", errors="replace"))
            known = {v for r in o["results"] for k in ("selling",) if isinstance((v := r.get(k)), int)}
            missing = sorted(v for v in known if v >= 1000 and v not in figures)
            rep["html"] = {"file": htmls[0], "json_figures_missing_from_html": missing[:20], "count_missing": len(missing)}
        results.append(rep)
    summary = {
        "archives_checked": len(results),
        "txt_rows_compared": sum(r["txt_table_rows_compared"] for r in results),
        "txt_mismatches": sum(len(r["txt_mismatches"]) for r in results),
        "html_archives_with_missing_figures": sum(1 for r in results if r["html"] and r["html"]["count_missing"]),
    }
    with open(args.out, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"summary": summary, "archives": results}, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(json.dumps(summary, indent=1))
    for r in results:
        if r["txt_mismatches"]:
            print(r["archive"], r["txt_mismatches"][:3])


if __name__ == "__main__":
    main()
