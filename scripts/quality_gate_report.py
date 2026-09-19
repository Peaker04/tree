#!/usr/bin/env python3
"""
NOVYX Quality Gate Report & Aggregator
Parses authoritative checklists, active diagram inventories, and execution records
to deterministically compute gate statistics and final readiness disposition.
"""

import sys
import os
import re
import json
import subprocess
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 on Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

CHECKLIST_FILES = [
    ("A. Canonical Baseline", "docs/quality-gates/BASELINE-ACCEPTANCE-CHECKLIST.md"),
    ("B. Requirements Traceability", "docs/quality-gates/REQUIREMENTS-TRACEABILITY-CHECKLIST.md"),
    ("C. Architecture Governance", "docs/quality-gates/ARCHITECTURE-NFR-CHECKLIST.md"),
    ("D. Implementation & Build", "docs/quality-gates/IMPLEMENTATION-READINESS-CHECKLIST.md"),
    ("E. Diagram Quality & Tooling", "docs/quality-gates/DIAGRAM-QUALITY-CHECKLIST.md"),
]

def get_git_info():
    sha = "unknown"
    tree = "unknown"
    branch = "unknown"
    try:
        r_sha = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True)
        if r_sha.returncode == 0:
            sha = r_sha.stdout.strip()
        r_tree = subprocess.run(["git", "rev-parse", "HEAD^{tree}"], capture_output=True, text=True)
        if r_tree.returncode == 0:
            tree = r_tree.stdout.strip()
        r_br = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True)
        if r_br.returncode == 0:
            branch = r_br.stdout.strip()
    except Exception:
        pass
    return sha, tree, branch

def parse_active_diagrams(inventory_md_path):
    active_diagrams = []
    p = Path(inventory_md_path)
    if not p.exists():
        return active_diagrams

    lines = p.read_text(encoding="utf-8").splitlines()
    in_active_table = False
    headers = []

    for line in lines:
        s = line.strip()
        if "## 1. Danh mục biểu đồ dẫn xuất" in s:
            in_active_table = True
            continue
        if in_active_table and s.startswith("## 2."):
            break
        if in_active_table and s.startswith("|"):
            parts = [c.strip() for c in s.split("|")[1:-1]]
            if not headers:
                if any("File" in h for h in parts):
                    headers = parts
            elif not all(re.match(r'^:?-+:?$', c) for c in parts):
                row = dict(zip(headers, parts))
                file_cell = row.get("File", "")
                m = re.search(r'\[`?([^`\]]+)`?\]', file_cell)
                file_name = m.group(1) if m else file_cell
                if file_name.endswith(".html"):
                    active_diagrams.append({
                        "file": file_name,
                        "title": row.get("Tên biểu đồ", ""),
                        "type": row.get("Loại trực quan (Visual Type)", ""),
                        "classification": row.get("Phân loại & Thẩm quyền", ""),
                        "source": row.get("Nguồn chuẩn tắc (`SOURCE`)", "")
                    })
    return active_diagrams

def parse_checklist_file(category_name, file_path):
    gates = []
    p = Path(file_path)
    if not p.exists():
        return gates

    lines = p.read_text(encoding="utf-8").splitlines()
    in_table = False
    headers = []

    for line in lines:
        s = line.strip()
        if not s.startswith("|"):
            in_table = False
            headers = []
            continue

        parts = [c.strip() for c in s.split("|")[1:-1]]
        if not in_table:
            if any("Mã ID" in h or "Mã Check" in h for h in parts):
                headers = parts
                in_table = True
            continue
        else:
            if all(re.match(r'^:?-+:?$', c) for c in parts):
                continue

            row = dict(zip(headers, parts))
            id_col = next((k for k in headers if "Mã ID" in k or "Mã Check" in k), None)
            if not id_col:
                continue

            raw_id = row.get(id_col, "")
            m = re.search(r'\*\*([A-Z0-9_-]+)\*\*', raw_id)
            if not m:
                m = re.search(r'\[`?([A-Z0-9_.-]+)`?\]', raw_id)
            if not m:
                m = re.match(r'^[A-Z0-9_-]+$', raw_id)

            if not m:
                continue
            gate_id = m.group(1) if hasattr(m, 'group') and m.groups() else raw_id

            # Skip header re-matches or empty
            if gate_id in ["ID", "Mã", "Mã ID"]:
                continue

            # Title / requirement
            title_col = next((k for k in headers if any(w in k for w in ["Hạng mục", "Tiêu chí", "Lệnh", "Tên tệp"])), None)
            title = row.get(title_col, "") if title_col else ""

            # Blocking
            blocking_col = next((k for k in headers if "Khóa cổng" in k or "Blocking" in k), None)
            is_blocking = True
            if blocking_col:
                is_blocking = "YES" in row.get(blocking_col, "").upper()

            # Type: AUTOMATED, MANUAL, HYBRID
            type_col = next((k for k in headers if "Loại cổng" in k or "Type" in k), None)
            gate_type = row.get(type_col, "AUTOMATED").strip().upper() if type_col else "AUTOMATED"
            if gate_type not in ["AUTOMATED", "MANUAL", "HYBRID"]:
                gate_type = "AUTOMATED"

            # Status
            status_col = next((k for k in headers if "Trạng thái" in k or "Status" in k), None)
            status_val = row.get(status_col, "").upper() if status_col else ""

            if "PASS" in status_val:
                status = "PASS"
            elif "FAIL" in status_val:
                status = "FAIL"
            elif "WARN" in status_val:
                status = "WARN"
            elif "INCONCLUSIVE" in status_val:
                status = "INCONCLUSIVE"
            elif "NOT_RUN" in status_val:
                status = "NOT_RUN"
            elif "N/A" in status_val or "NOT_APPLICABLE" in status_val:
                status = "NOT_APPLICABLE"
            else:
                status = "UNKNOWN"

            gates.append({
                "id": gate_id,
                "category": category_name,
                "file": p.name,
                "title": title,
                "blocking": is_blocking,
                "type": gate_type,
                "status": status
            })

    return gates

def generate_quality_report():
    sha, tree, branch = get_git_info()
    now_iso = datetime.now(timezone.utc).astimezone().isoformat()

    all_gates = []
    category_summaries = {}

    for cat_name, file_rel in CHECKLIST_FILES:
        cat_gates = parse_checklist_file(cat_name, file_rel)
        all_gates.extend(cat_gates)

        cat_counts = {
            "TOTAL": len(cat_gates),
            "BLOCKING": sum(1 for g in cat_gates if g["blocking"]),
            "PASS": sum(1 for g in cat_gates if g["status"] == "PASS"),
            "FAIL": sum(1 for g in cat_gates if g["status"] == "FAIL"),
            "WARN": sum(1 for g in cat_gates if g["status"] == "WARN"),
            "NOT_RUN": sum(1 for g in cat_gates if g["status"] == "NOT_RUN"),
            "INCONCLUSIVE": sum(1 for g in cat_gates if g["status"] == "INCONCLUSIVE"),
            "NOT_APPLICABLE": sum(1 for g in cat_gates if g["status"] == "NOT_APPLICABLE"),
        }
        category_summaries[cat_name] = {
            "file": file_rel,
            "counts": cat_counts
        }

    # Active diagram inventory
    active_diagrams = parse_active_diagrams("docs/diagrams/README.md")

    # Global aggregation
    total_gates = len(all_gates)
    blocking_gates = [g for g in all_gates if g["blocking"]]
    non_blocking_gates = [g for g in all_gates if not g["blocking"]]

    counts = {
        "PASS": sum(1 for g in all_gates if g["status"] == "PASS"),
        "FAIL": sum(1 for g in all_gates if g["status"] == "FAIL"),
        "WARN": sum(1 for g in all_gates if g["status"] == "WARN"),
        "NOT_RUN": sum(1 for g in all_gates if g["status"] == "NOT_RUN"),
        "INCONCLUSIVE": sum(1 for g in all_gates if g["status"] == "INCONCLUSIVE"),
        "NOT_APPLICABLE": sum(1 for g in all_gates if g["status"] == "NOT_APPLICABLE"),
    }

    blocking_counts = {
        "PASS": sum(1 for g in blocking_gates if g["status"] == "PASS"),
        "FAIL": sum(1 for g in blocking_gates if g["status"] == "FAIL"),
        "WARN": sum(1 for g in blocking_gates if g["status"] == "WARN"),
        "NOT_RUN": sum(1 for g in blocking_gates if g["status"] == "NOT_RUN"),
        "INCONCLUSIVE": sum(1 for g in blocking_gates if g["status"] == "INCONCLUSIVE"),
        "NOT_APPLICABLE": sum(1 for g in blocking_gates if g["status"] == "NOT_APPLICABLE"),
    }

    # Overall disposition rule (Section 17):
    # Overall PASS only if: Blocking FAIL = 0, Blocking NOT_RUN = 0, Blocking INCONCLUSIVE = 0.
    is_ready = (
        blocking_counts["FAIL"] == 0 and
        blocking_counts["NOT_RUN"] == 0 and
        blocking_counts["INCONCLUSIVE"] == 0 and
        len(blocking_gates) > 0
    )

    if is_ready:
        status_str = "PASS"
        verdict = "BASELINE QUALITY GATE PASS — READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION"
    else:
        status_str = "FAIL"
        failed_ids = [g["id"] for g in blocking_gates if g["status"] in ["FAIL", "NOT_RUN", "INCONCLUSIVE"]]
        verdict = f"NOT READY — [{', '.join(failed_ids)}]"

    report = {
        "sha": sha,
        "tree": tree,
        "branch": branch,
        "timestamp": now_iso,
        "total": total_gates,
        "blocking": len(blocking_gates),
        "status": status_str,
        "verdict": verdict,
        "counts": counts,
        "blocking_counts": blocking_counts,
        "category_summaries": category_summaries,
        "active_diagrams_count": len(active_diagrams),
        "active_diagrams": active_diagrams,
        "gates": all_gates
    }

    return report

def write_json_output(report, out_path="dist/quality-gates/final-gate.json"):
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return p

def print_human_report(report):
    print("\n================================================================================")
    print("                      NOVYX QUALITY GATE AGGREGATION REPORT                     ")
    print("================================================================================")
    print(f"Commit SHA : {report['sha']}")
    print(f"Tree Hash  : {report['tree']}")
    print(f"Branch     : {report['branch']}")
    print(f"Timestamp  : {report['timestamp']}")
    print(f"Active Diagrams Inventory: {report['active_diagrams_count']} diagrams derived from docs/diagrams/README.md")
    print("--------------------------------------------------------------------------------")
    print(f"{'Category':<32} | {'Total':<5} | {'Block':<5} | {'PASS':<5} | {'FAIL':<5} | {'WARN':<5} | {'INCON':<5}")
    print("--------------------------------------------------------------------------------")

    for cat_name, cat_data in report["category_summaries"].items():
        c = cat_data["counts"]
        print(f"{cat_name:<32} | {c['TOTAL']:<5} | {c['BLOCKING']:<5} | {c['PASS']:<5} | {c['FAIL']:<5} | {c['WARN']:<5} | {c['INCONCLUSIVE']:<5}")

    print("================================================================================")
    b = report["blocking_counts"]
    c = report["counts"]
    print(f"{'TOTAL GATES':<32} | {report['total']:<5} | {report['blocking']:<5} | {c['PASS']:<5} | {c['FAIL']:<5} | {c['WARN']:<5} | {c['INCONCLUSIVE']:<5}")
    print("--------------------------------------------------------------------------------")
    print(f"BLOCKING GATES BREAKDOWN: PASS={b['PASS']}, FAIL={b['FAIL']}, WARN={b['WARN']}, NOT_RUN={b['NOT_RUN']}, INCONCLUSIVE={b['INCONCLUSIVE']}")
    print("--------------------------------------------------------------------------------")
    print("FINAL QUALITY GATE VERDICT:")
    print(f"==> {report['verdict']}")
    print("================================================================================\n")

def main():
    parser = argparse.ArgumentParser(description="NOVYX Quality Gate Report & Aggregation")
    parser.add_argument("--json", action="store_true", help="Output raw JSON to stdout")
    parser.add_argument("--out", default="dist/quality-gates/final-gate.json", help="Path to write final-gate.json")
    parser.add_argument("--quiet", action="store_true", help="Suppress human readable print")

    args = parser.parse_args()

    report = generate_quality_report()
    json_path = write_json_output(report, args.out)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    elif not args.quiet:
        print_human_report(report)
        print(f"Machine-readable evidence saved to: {json_path}")

    sys.exit(0 if report["status"] == "PASS" else 1)

if __name__ == "__main__":
    main()
