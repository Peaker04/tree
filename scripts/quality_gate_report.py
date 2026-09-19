#!/usr/bin/env python3
"""
NOVYX Quality Gate Report & Aggregation Engine
Fail-closed Two-Layer Architecture:
  Layer 1: Authoritative Checklist Definition Parser & Structure Validator
  Layer 2: Machine-Readable Evidence Cross-Check & Effective Status Evaluator
"""

import sys
import os
import re
import json
import hashlib
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

CANONICAL_TASK_STATUSES = {
    "PENDING", "IN_PROGRESS", "BLOCKED", "WAITING_REVIEW", "REWORK_REQUIRED", "COMPLETED", "CANCELLED"
}

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

def compute_definition_hash(gate):
    """
    Computes a deterministic SHA-256 hash (first 16 hex chars) of the normalized gate definition:
    gate_id, title, oracle, method, blocking, type.
    """
    gid = gate.get("id", "").strip()
    title = gate.get("title", "").strip()
    oracle = gate.get("oracle", "").strip()
    method = gate.get("method", "").strip()
    blocking = str(gate.get("blocking", True)).strip().upper()
    gtype = gate.get("type", "AUTOMATED").strip().upper()

    norm_str = "|".join([
        gid,
        re.sub(r'\s+', ' ', title),
        re.sub(r'\s+', ' ', oracle),
        re.sub(r'\s+', ' ', method),
        blocking,
        gtype
    ])
    return hashlib.sha256(norm_str.encode("utf-8")).hexdigest()[:16]

def check_ancestor(from_sha):
    """
    Verifies if from_sha is an ancestor of HEAD using git merge-base --is-ancestor.
    """
    if not from_sha or from_sha in ["unknown", ""]:
        return False
    try:
        r = subprocess.run(["git", "merge-base", "--is-ancestor", from_sha, "HEAD"], capture_output=True)
        return r.returncode == 0
    except Exception:
        return False

def check_dependency_scope_unchanged(from_sha, dependency_scope):
    """
    Verifies whether all files in dependency_scope remain completely unchanged between from_sha and HEAD.
    Handles globs and directory paths.
    """
    if not from_sha or from_sha in ["unknown", ""]:
        return False
    if not dependency_scope:
        return True
    try:
        if "*" in dependency_scope:
            r = subprocess.run(["git", "diff", from_sha, "HEAD"], capture_output=True, text=True)
            return r.returncode == 0 and len(r.stdout.strip()) == 0

        cmd = ["git", "diff", from_sha, "HEAD", "--"] + [s for s in dependency_scope if s != "*"]
        r = subprocess.run(cmd, capture_output=True, text=True)
        return r.returncode == 0 and len(r.stdout.strip()) == 0
    except Exception:
        return False

def check_artifact_exists(artifact_refs):
    """
    Validates that every referenced artifact path exists on disk.
    """
    if not artifact_refs:
        return True, ""
    missing = []
    for ref in artifact_refs:
        if not ref:
            continue
        p = Path(ref)
        if not p.exists():
            missing.append(ref)
    if missing:
        return False, f"Missing required artifact(s): {', '.join(missing)}"
    return True, ""

def check_surface_unchanged(from_sha):
    """
    Legacy helper: checks apps/mobile/src and packages surfaces.
    """
    return check_dependency_scope_unchanged(from_sha, ["apps/mobile/src", "packages"])

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

# ==============================================================================
# LAYER 1: CHECKLIST DEFINITION PARSER & STRUCTURE VALIDATOR
# ==============================================================================

def parse_checklist_file(category_name, file_path):
    """
    Parses gates from a checklist markdown table.
    Enforces structure validation: Gate ID, Acceptance Oracle, Method, Blocking, Status.
    """
    gates = []
    p = Path(file_path)
    if not p.exists():
        return gates

    lines = p.read_text(encoding="utf-8").splitlines()
    in_table = False
    headers = []

    for line_idx, line in enumerate(lines, 1):
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

            if gate_id in ["ID", "Mã", "Mã ID"]:
                continue

            # Check essential columns exist in row
            title_col = next((k for k in headers if any(w in k for w in [
                "Hạng mục", "Tiêu chí kiểm soát", "Tiêu chí công cụ", "Tiêu chuẩn kiến trúc",
                "Chỉ tiêu NFR", "Ranh giới", "Yêu cầu Nghiệp vụ", "Lệnh kiểm tra", "Tên lệnh kiểm tra", "Tiêu chí"
            ])), None)
            oracle_col = next((k for k in headers if any(w in k for w in [
                "Acceptance Oracle", "Tiêu chí nghiệm thu (Oracle)", "Oracle", "Tiêu chuẩn"
            ])), None)
            method_col = next((k for k in headers if any(w in k for w in [
                "Phương pháp kiểm chứng", "Lệnh thực thi thực tế", "Bằng chứng kỹ thuật thực thi",
                "Phương pháp", "Bằng chứng thực nghiệm", "Bằng chứng đo đạc", "Bằng chứng tài liệu",
                "Bằng chứng mã nguồn", "Bằng chứng yêu cầu"
            ])), None)
            blocking_col = next((k for k in headers if any(w in k for w in ["Khóa cổng", "Blocking"])), None)
            status_col = next((k for k in headers if any(w in k for w in ["Trạng thái", "Status"])), None)
            type_col = next((k for k in headers if any(w in k for w in ["Loại cổng", "Type"])), None)

            title = row.get(title_col, "").strip() if title_col else ""
            oracle = row.get(oracle_col, "").strip() if oracle_col else ""
            method = row.get(method_col, "").strip() if method_col else ""
            blocking_str = row.get(blocking_col, "").strip() if blocking_col else ""
            status_val = row.get(status_col, "").strip().upper() if status_col else ""
            gate_type = row.get(type_col, "AUTOMATED").strip().upper() if type_col else "AUTOMATED"
            if gate_type not in ["AUTOMATED", "MANUAL", "HYBRID"]:
                gate_type = "AUTOMATED"

            # Check structure integrity
            invalid_structure = False
            structure_errors = []
            if not title:
                invalid_structure = True
                structure_errors.append("Missing title / requirement")
            if not oracle:
                invalid_structure = True
                structure_errors.append("Missing Acceptance Oracle")
            if not method:
                invalid_structure = True
                structure_errors.append("Missing Verification Method")
            if not status_val:
                invalid_structure = True
                structure_errors.append("Missing Status cell")

            # Determine blocking
            is_blocking = True
            if blocking_col:
                is_blocking = "YES" in blocking_str.upper()

            # Parse declared status
            if invalid_structure:
                declared_status = "UNKNOWN"
            elif "PASS" in status_val:
                declared_status = "PASS"
            elif "FAIL" in status_val:
                declared_status = "FAIL"
            elif "WARN" in status_val:
                declared_status = "WARN"
            elif "INCONCLUSIVE" in status_val:
                declared_status = "INCONCLUSIVE"
            elif "NOT_RUN" in status_val:
                declared_status = "NOT_RUN"
            elif "N/A" in status_val or "NOT_APPLICABLE" in status_val:
                declared_status = "NOT_APPLICABLE"
            else:
                declared_status = "UNKNOWN"

            # Semantic Regression Check: DG-SEM-005 & CAN-012
            if gate_id == "DG-SEM-005":
                # Must list all 7 canonical statuses
                missing_in_oracle = [s for s in CANONICAL_TASK_STATUSES if s not in oracle]
                if missing_in_oracle:
                    declared_status = "FAIL"
                    structure_errors.append(f"DG-SEM-005 Acceptance Oracle lacks canonical status: {', '.join(missing_in_oracle)}.")
                # Must NOT list ASSIGNED as a status in the status tuple
                if re.search(r'\([^\)]*ASSIGNED[^\)]*\)', oracle):
                    declared_status = "FAIL"
                    structure_errors.append("DG-SEM-005 Acceptance Oracle contains forbidden status 'ASSIGNED'.")
            elif gate_id == "CAN-012":
                missing_in_oracle = [s for s in CANONICAL_TASK_STATUSES if s not in oracle]
                if missing_in_oracle:
                    declared_status = "FAIL"
                    structure_errors.append(f"CAN-012 Acceptance Oracle lacks canonical status: {', '.join(missing_in_oracle)}.")
                if re.search(r'\([^\)]*ASSIGNED[^\)]*\)', oracle):
                    declared_status = "FAIL"
                    structure_errors.append("CAN-012 Acceptance Oracle contains forbidden status 'ASSIGNED'.")

            gates.append({
                "id": gate_id,
                "category": category_name,
                "file": p.name,
                "line": line_idx,
                "title": title,
                "oracle": oracle,
                "method": method,
                "blocking": is_blocking,
                "type": gate_type,
                "declared_status": declared_status,
                "invalid_structure": invalid_structure,
                "structure_errors": structure_errors
            })

    return gates

# ==============================================================================
# LAYER 2: EVIDENCE CROSS-CHECK & EFFECTIVE STATUS RESOLUTION
# ==============================================================================

def load_evidence_registry(registry_path="docs/quality-gates/evidence-index.json"):
    p = Path(registry_path)
    # Prefer generated dist evidence if default requested and dist exists
    if registry_path == "docs/quality-gates/evidence-index.json":
        dist_p = Path("dist/quality-evidence/evidence-index.json")
        if dist_p.exists():
            p = dist_p
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as ex:
        print(f"[WARN] Failed to read evidence registry {p}: {ex}")
        return {}

def resolve_effective_status(gate, evidence, current_sha, ancestor_checker=None, scope_checker=None):
    """
    Derives the true effective status from:
    1. declared_status from checklist
    2. structural validity & duplicate check
    3. evidence record validity (status == PASS, exit_code == 0)
    4. verification type matching (AUTOMATED vs MANUAL vs HYBRID)
    5. definition_hash consistency
    6. artifact existence on disk
    7. commit SHA matching or dependency-scoped inheritance with ancestor verification
    """
    if ancestor_checker is None:
        ancestor_checker = check_ancestor
    if scope_checker is None:
        scope_checker = check_dependency_scope_unchanged

    declared = gate.get("declared_status", "UNKNOWN")
    gid = gate.get("id", "")
    gtype = gate.get("type", "AUTOMATED")

    # If gate has structural defects or is duplicate
    if gate.get("invalid_structure") or gate.get("is_duplicate"):
        return {
            "evidence_status": "STRUCTURE_ERROR",
            "effective_status": "UNKNOWN",
            "evidence_ref": "NONE",
            "is_inherited": False,
            "evidence_note": "; ".join(gate.get("structure_errors", ["Checklist definition error"]))
        }

    if not evidence:
        return {
            "evidence_status": "MISSING",
            "effective_status": "NOT_RUN" if declared == "PASS" else declared,
            "evidence_ref": "NONE",
            "is_inherited": False,
            "evidence_note": "No evidence record found in registry"
        }

    ev_status = evidence.get("status", "UNKNOWN")
    ev_code = evidence.get("exit_code", 1)
    ev_sha = evidence.get("commit_sha", "")
    ev_origin = evidence.get("evidence_origin", "")
    ev_exec_type = evidence.get("execution_type", "")
    art_refs = evidence.get("artifact_refs", [])
    ev_ref = ", ".join(art_refs) if isinstance(art_refs, list) else str(art_refs)
    allow_inheritance = evidence.get("allow_inheritance", False)
    dep_scope = evidence.get("dependency_scope", [])

    # Circular evidence rejection: no auto-PASS from checklist declarations alone
    if ev_origin in ["GENERATED_FROM_CHECKLIST", "CHECKLIST_MARKER"] or ev_exec_type == "CHECKLIST_DECLARATION":
        return {
            "evidence_status": "REJECTED_ORIGIN",
            "effective_status": "NOT_RUN",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": "Circular evidence rejected: cannot generate evidence from checklist marker alone"
        }

    # Verification type matching
    if gtype == "AUTOMATED":
        if ev_origin == "MANUAL_REVIEW" and ev_exec_type == "MANUAL_INSPECTION":
            return {
                "evidence_status": "TYPE_MISMATCH",
                "effective_status": "FAIL",
                "evidence_ref": ev_ref,
                "is_inherited": False,
                "evidence_note": "AUTOMATED gate rejected: manual-only evidence provided"
            }
    elif gtype == "MANUAL":
        if ev_origin != "MANUAL_REVIEW" and ev_exec_type != "MANUAL_INSPECTION":
            return {
                "evidence_status": "MANUAL_MISSING",
                "effective_status": "NOT_RUN",
                "evidence_ref": ev_ref,
                "is_inherited": False,
                "evidence_note": "MANUAL gate requires explicit manual review evidence"
            }
    elif gtype == "HYBRID":
        if ev_exec_type != "HYBRID_INSPECTION":
            return {
                "evidence_status": "HYBRID_INCOMPLETE",
                "effective_status": "NOT_RUN",
                "evidence_ref": ev_ref,
                "is_inherited": False,
                "evidence_note": "HYBRID gate requires both automated execution and manual inspection records"
            }

    # Definition hash validation
    current_def_hash = compute_definition_hash(gate)
    ev_def_hash = evidence.get("definition_hash")
    if ev_def_hash and ev_def_hash != current_def_hash:
        return {
            "evidence_status": "DEFINITION_HASH_MISMATCH",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Stale evidence: definition hash mismatch (expected {current_def_hash}, got {ev_def_hash})"
        }

    # Status and exit code
    if ev_status != "PASS" or ev_code != 0:
        return {
            "evidence_status": "FAIL",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Evidence reported {ev_status} with exit code {ev_code}"
        }

    # Artifact validation
    art_ok, art_err = check_artifact_exists(art_refs)
    if not art_ok:
        return {
            "evidence_status": "INVALID_ARTIFACT",
            "effective_status": "INCONCLUSIVE",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": art_err
        }

    # SHA and lineage evaluation
    if ev_sha == current_sha or current_sha in ["unknown", ""]:
        return {
            "evidence_status": "FINAL_SHA_EXECUTED",
            "effective_status": declared,
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Directly executed on final SHA {ev_sha[:7]}"
        }

    # Differing SHA: Check inheritance policy
    if not allow_inheritance:
        return {
            "evidence_status": "WRONG_SHA",
            "effective_status": "INCONCLUSIVE",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Evidence SHA {ev_sha[:7]} does not match current SHA {current_sha[:7]} without inheritance flag"
        }

    # Ancestor check
    if not ancestor_checker(ev_sha):
        return {
            "evidence_status": "WRONG_LINEAGE",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Evidence SHA {ev_sha[:7]} is not an ancestor of current HEAD {current_sha[:7]}"
        }

    # Dependency scope check
    scope_clean = scope_checker(ev_sha, dep_scope)
    if not scope_clean:
        return {
            "evidence_status": "DEPENDENCY_SCOPE_CHANGED",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Inheritance rejected: dependency scope modified between {ev_sha[:7]} and HEAD"
        }

    return {
        "evidence_status": "INHERITED_PASS",
        "effective_status": declared,
        "evidence_ref": ev_ref,
        "is_inherited": True,
        "evidence_note": f"Inherited from verified ancestor {ev_sha[:7]}; dependency scope unchanged"
    }

# ==============================================================================
# AGGREGATION & REPORTING
# ==============================================================================

def generate_quality_report(registry_path="docs/quality-gates/evidence-index.json"):
    sha, tree, branch = get_git_info()
    now_iso = datetime.now(timezone.utc).astimezone().isoformat()
    evidence_index = load_evidence_registry(registry_path)

    all_gates = []
    category_summaries = {}
    seen_ids = {}

    for cat_name, file_rel in CHECKLIST_FILES:
        cat_gates = parse_checklist_file(cat_name, file_rel)
        for g in cat_gates:
            seen_ids.setdefault(g["id"], []).append(g)
        all_gates.extend(cat_gates)

    # Duplicate Gate ID detection
    duplicate_ids = [gid for gid, lst in seen_ids.items() if len(lst) > 1]
    for g in all_gates:
        if g["id"] in duplicate_ids:
            g["is_duplicate"] = True
            g["declared_status"] = "UNKNOWN"
            g["structure_errors"].append(f"Duplicate Gate ID '{g['id']}' across checklist files")
        else:
            g["is_duplicate"] = False

    # Layer 2: Resolve effective status for each gate
    for g in all_gates:
        ev = evidence_index.get(g["id"])
        res = resolve_effective_status(g, ev, sha)
        g["evidence_status"] = res["evidence_status"]
        g["effective_status"] = res["effective_status"]
        g["evidence_ref"] = res["evidence_ref"]
        g["is_inherited"] = res["is_inherited"]
        g["evidence_note"] = res["evidence_note"]
        g["definition_hash"] = compute_definition_hash(g)

    # Category summaries
    for cat_name, file_rel in CHECKLIST_FILES:
        cat_gates = [g for g in all_gates if g["category"] == cat_name]
        cat_counts = {
            "TOTAL": len(cat_gates),
            "BLOCKING": sum(1 for g in cat_gates if g["blocking"]),
            "PASS": sum(1 for g in cat_gates if g["effective_status"] == "PASS"),
            "FAIL": sum(1 for g in cat_gates if g["effective_status"] == "FAIL"),
            "WARN": sum(1 for g in cat_gates if g["effective_status"] == "WARN"),
            "NOT_RUN": sum(1 for g in cat_gates if g["effective_status"] == "NOT_RUN"),
            "INCONCLUSIVE": sum(1 for g in cat_gates if g["effective_status"] == "INCONCLUSIVE"),
            "UNKNOWN": sum(1 for g in cat_gates if g["effective_status"] == "UNKNOWN"),
            "NOT_APPLICABLE": sum(1 for g in cat_gates if g["effective_status"] == "NOT_APPLICABLE"),
        }
        category_summaries[cat_name] = {
            "file": file_rel,
            "counts": cat_counts
        }

    active_diagrams = parse_active_diagrams("docs/diagrams/README.md")

    # Global aggregation
    total_gates = len(all_gates)
    blocking_gates = [g for g in all_gates if g["blocking"]]

    counts = {
        "PASS": sum(1 for g in all_gates if g["effective_status"] == "PASS"),
        "FAIL": sum(1 for g in all_gates if g["effective_status"] == "FAIL"),
        "WARN": sum(1 for g in all_gates if g["effective_status"] == "WARN"),
        "NOT_RUN": sum(1 for g in all_gates if g["effective_status"] == "NOT_RUN"),
        "INCONCLUSIVE": sum(1 for g in all_gates if g["effective_status"] == "INCONCLUSIVE"),
        "UNKNOWN": sum(1 for g in all_gates if g["effective_status"] == "UNKNOWN"),
        "NOT_APPLICABLE": sum(1 for g in all_gates if g["effective_status"] == "NOT_APPLICABLE"),
    }

    blocking_counts = {
        "PASS": sum(1 for g in blocking_gates if g["effective_status"] == "PASS"),
        "FAIL": sum(1 for g in blocking_gates if g["effective_status"] == "FAIL"),
        "WARN": sum(1 for g in blocking_gates if g["effective_status"] == "WARN"),
        "NOT_RUN": sum(1 for g in blocking_gates if g["effective_status"] == "NOT_RUN"),
        "INCONCLUSIVE": sum(1 for g in blocking_gates if g["effective_status"] == "INCONCLUSIVE"),
        "UNKNOWN": sum(1 for g in blocking_gates if g["effective_status"] == "UNKNOWN"),
        "NOT_APPLICABLE": sum(1 for g in blocking_gates if g["effective_status"] == "NOT_APPLICABLE"),
    }

    # Provenance metrics
    provenance = {
        "direct_evidence": sum(1 for g in all_gates if g["evidence_status"] == "FINAL_SHA_EXECUTED" and g["type"] == "AUTOMATED"),
        "manual_evidence": sum(1 for g in all_gates if g["type"] == "MANUAL" and g["evidence_status"] in ["FINAL_SHA_EXECUTED", "INHERITED_PASS"]),
        "hybrid_evidence": sum(1 for g in all_gates if g["type"] == "HYBRID" and g["evidence_status"] in ["FINAL_SHA_EXECUTED", "INHERITED_PASS"]),
        "inherited_evidence": sum(1 for g in all_gates if g.get("is_inherited", False)),
        "rejected_inherited_evidence": sum(1 for g in all_gates if g["evidence_status"] in ["DEPENDENCY_SCOPE_CHANGED", "WRONG_LINEAGE", "WRONG_SHA"]),
        "missing_evidence": sum(1 for g in all_gates if g["evidence_status"] == "MISSING"),
        "stale_evidence": sum(1 for g in all_gates if g["evidence_status"] == "DEFINITION_HASH_MISMATCH"),
        "wrong_sha": sum(1 for g in all_gates if g["evidence_status"] == "WRONG_SHA"),
        "wrong_lineage": sum(1 for g in all_gates if g["evidence_status"] == "WRONG_LINEAGE"),
        "invalid_artifact": sum(1 for g in all_gates if g["evidence_status"] == "INVALID_ARTIFACT"),
        "definition_hash_mismatch": sum(1 for g in all_gates if g["evidence_status"] == "DEFINITION_HASH_MISMATCH"),
        "dependency_scope_changed": sum(1 for g in all_gates if g["evidence_status"] == "DEPENDENCY_SCOPE_CHANGED"),
        "rejected_origin": sum(1 for g in all_gates if g["evidence_status"] == "REJECTED_ORIGIN"),
    }

    # FAIL-CLOSED DECISION RULE:
    # Every blocking gate MUST have effective_status == "PASS".
    # Any blocking FAIL, WARN, NOT_RUN, INCONCLUSIVE, UNKNOWN -> FAIL / NOT READY.
    # Any duplicate ID -> FAIL / NOT READY.
    is_ready = (
        len(blocking_gates) > 0 and
        len(duplicate_ids) == 0 and
        all(g["effective_status"] == "PASS" for g in blocking_gates)
    )

    if is_ready:
        status_str = "PASS"
        verdict = "BASELINE QUALITY GATE PASS — READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION"
    else:
        status_str = "FAIL"
        failed_reasons = []
        if duplicate_ids:
            failed_reasons.append(f"DUPLICATE_IDS({', '.join(duplicate_ids)})")
        for g in blocking_gates:
            if g["effective_status"] != "PASS":
                failed_reasons.append(f"{g['id']}({g['effective_status']})")
        verdict = f"NOT READY — [{', '.join(failed_reasons)}]"

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
        "duplicate_gate_ids": duplicate_ids,
        "provenance": provenance,
        "missing_evidence_count": provenance["missing_evidence"],
        "wrong_sha_evidence_count": provenance["wrong_sha"],
        "inherited_evidence_count": provenance["inherited_evidence"],
        "category_summaries": category_summaries,
        "active_diagrams_count": len(active_diagrams),
        "active_diagrams": active_diagrams,
        "gates": [
            {
                "id": g["id"],
                "category": g["category"],
                "file": g["file"],
                "blocking": g["blocking"],
                "declared_status": g["declared_status"],
                "evidence_status": g["evidence_status"],
                "effective_status": g["effective_status"],
                "evidence_ref": g["evidence_ref"],
                "verification_type": g["type"],
                "is_inherited": g["is_inherited"],
                "definition_hash": g.get("definition_hash", ""),
                "evidence_note": g.get("evidence_note", "")
            }
            for g in all_gates
        ]
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
    print(f"{'Category':<30} | {'Tot':<4} | {'Blk':<4} | {'PASS':<4} | {'FAIL':<4} | {'WARN':<4} | {'NOTR':<4} | {'INCO':<4}")
    print("--------------------------------------------------------------------------------")

    for cat_name, cat_data in report["category_summaries"].items():
        c = cat_data["counts"]
        print(f"{cat_name:<30} | {c['TOTAL']:<4} | {c['BLOCKING']:<4} | {c['PASS']:<4} | {c['FAIL']:<4} | {c['WARN']:<4} | {c['NOT_RUN']:<4} | {c['INCONCLUSIVE']:<4}")

    print("================================================================================")
    b = report["blocking_counts"]
    c = report["counts"]
    p = report.get("provenance", {})
    print(f"{'TOTAL GATES':<30} | {report['total']:<4} | {report['blocking']:<4} | {c['PASS']:<4} | {c['FAIL']:<4} | {c['WARN']:<4} | {c['NOT_RUN']:<4} | {c['INCONCLUSIVE']:<4}")
    print("--------------------------------------------------------------------------------")
    print(f"BLOCKING STATUS: PASS={b['PASS']}, FAIL={b['FAIL']}, WARN={b['WARN']}, NOT_RUN={b['NOT_RUN']}, INCON={b['INCONCLUSIVE']}, UNK={b['UNKNOWN']}")
    print(f"EVIDENCE PROVENANCE AUDIT:")
    print(f"  - Direct Final-SHA Automated  : {p.get('direct_evidence', 0)}")
    print(f"  - Manual Inspection Records   : {p.get('manual_evidence', 0)}")
    print(f"  - Hybrid Verified Records     : {p.get('hybrid_evidence', 0)}")
    print(f"  - Valid Inherited Evidence    : {p.get('inherited_evidence', 0)}")
    print(f"  - Rejected Inherited Evidence : {p.get('rejected_inherited_evidence', 0)}")
    print(f"  - Missing Evidence Records    : {p.get('missing_evidence', 0)}")
    print(f"  - Invalid Artifact References : {p.get('invalid_artifact', 0)}")
    print(f"  - Definition Hash Mismatches  : {p.get('definition_hash_mismatch', 0)}")
    print(f"  - Dependency Scope Modified   : {p.get('dependency_scope_changed', 0)}")
    print(f"  - Rejected Circular Origins   : {p.get('rejected_origin', 0)}")
    print(f"  - Duplicate Gate IDs          : {len(report.get('duplicate_gate_ids', []))}")
    print("--------------------------------------------------------------------------------")
    print("FINAL QUALITY GATE VERDICT:")
    print(f"==> {report['verdict']}")
    print("================================================================================\n")

# ==============================================================================
# ENGINE SELF-TEST SUITE
# ==============================================================================

def run_self_test():
    """
    Executes 12 self-test cases verifying the fail-closed machine evidence provenance engine:
    CASE 1: declared PASS + no evidence -> NOT_RUN
    CASE 2: evidence auto-created from checklist marker only -> rejected (REJECTED_ORIGIN -> NOT_RUN)
    CASE 3: wrong artifact path -> FAIL/INCONCLUSIVE (INVALID_ARTIFACT)
    CASE 4: wrong SHA non-ancestor -> FAIL (WRONG_LINEAGE)
    CASE 5: ancestor + unchanged dependency scope -> inherited PASS
    CASE 6: ancestor + relevant doc/tool changed -> inheritance rejected (DEPENDENCY_SCOPE_CHANGED)
    CASE 7: oracle changed -> definition_hash mismatch
    CASE 8: AUTOMATED gate with manual-only evidence -> reject (TYPE_MISMATCH)
    CASE 9: MANUAL gate without manual review evidence -> NOT_RUN (MANUAL_MISSING)
    CASE 10: HYBRID missing one side -> NOT_RUN (HYBRID_INCOMPLETE)
    CASE 11: direct final-SHA command exit 0 -> PASS
    CASE 12: direct final-SHA command exit !=0 -> FAIL
    """
    print("\n==================================================")
    print("RUNNING QUALITY GATE REPORT ENGINE SELF-TEST SUITE")
    print("==================================================")

    current_sha = "aabbcc11223344556677889900"
    all_passed = True

    cases = [
        {
            "id": 1,
            "name": "CASE 1: declared PASS + no evidence -> NOT_RUN",
            "gate": {"id": "C-01", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": None,
            "expect_effective": "NOT_RUN",
            "expect_evidence": "MISSING"
        },
        {
            "id": 2,
            "name": "CASE 2: evidence auto-created from checklist marker only -> rejected",
            "gate": {"id": "C-02", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "GENERATED_FROM_CHECKLIST", "execution_type": "CHECKLIST_DECLARATION"},
            "expect_effective": "NOT_RUN",
            "expect_evidence": "REJECTED_ORIGIN"
        },
        {
            "id": 3,
            "name": "CASE 3: wrong artifact path -> INCONCLUSIVE (INVALID_ARTIFACT)",
            "gate": {"id": "C-03", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "artifact_refs": ["nonexistent_path_xyz/artifact.txt"]},
            "expect_effective": "INCONCLUSIVE",
            "expect_evidence": "INVALID_ARTIFACT"
        },
        {
            "id": 4,
            "name": "CASE 4: wrong SHA non-ancestor -> FAIL (WRONG_LINEAGE)",
            "gate": {"id": "C-04", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": "diff_sha_999", "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True},
            "ancestor_mock": False,
            "scope_mock": True,
            "expect_effective": "FAIL",
            "expect_evidence": "WRONG_LINEAGE"
        },
        {
            "id": 5,
            "name": "CASE 5: ancestor + unchanged dependency scope -> inherited PASS",
            "gate": {"id": "C-05", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": "parent_sha_123", "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True, "dependency_scope": ["docs/WORKFLOWS.md"]},
            "ancestor_mock": True,
            "scope_mock": True,
            "expect_effective": "PASS",
            "expect_evidence": "INHERITED_PASS"
        },
        {
            "id": 6,
            "name": "CASE 6: ancestor + relevant doc/tool changed -> inheritance rejected",
            "gate": {"id": "C-06", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": "parent_sha_123", "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True, "dependency_scope": ["docs/WORKFLOWS.md"]},
            "ancestor_mock": True,
            "scope_mock": False,
            "expect_effective": "FAIL",
            "expect_evidence": "DEPENDENCY_SCOPE_CHANGED"
        },
        {
            "id": 7,
            "name": "CASE 7: oracle changed -> definition_hash mismatch",
            "gate": {"id": "C-07", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "NEW_ORACLE", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "definition_hash": "OLD_HASH_123"},
            "expect_effective": "FAIL",
            "expect_evidence": "DEFINITION_HASH_MISMATCH"
        },
        {
            "id": 8,
            "name": "CASE 8: AUTOMATED gate with manual-only evidence -> reject",
            "gate": {"id": "C-08", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "MANUAL_REVIEW", "execution_type": "MANUAL_INSPECTION"},
            "expect_effective": "FAIL",
            "expect_evidence": "TYPE_MISMATCH"
        },
        {
            "id": 9,
            "name": "CASE 9: MANUAL gate without manual review evidence -> NOT_RUN",
            "gate": {"id": "C-09", "declared_status": "PASS", "blocking": True, "type": "MANUAL", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "NOT_RUN",
            "expect_evidence": "MANUAL_MISSING"
        },
        {
            "id": 10,
            "name": "CASE 10: HYBRID missing one side -> NOT_RUN",
            "gate": {"id": "C-10", "declared_status": "PASS", "blocking": True, "type": "HYBRID", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "NOT_RUN",
            "expect_evidence": "HYBRID_INCOMPLETE"
        },
        {
            "id": 11,
            "name": "CASE 11: direct final-SHA command exit 0 -> PASS",
            "gate": {"id": "C-11", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "PASS",
            "expect_evidence": "FINAL_SHA_EXECUTED"
        },
        {
            "id": 12,
            "name": "CASE 12: direct final-SHA command exit !=0 -> FAIL",
            "gate": {"id": "C-12", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "FAIL", "exit_code": 1, "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "FAIL",
            "expect_evidence": "FAIL"
        }
    ]

    for c in cases:
        idx = c["id"]
        print(f"[{idx:02d}/12] Running {c['name']}...")
        gate = c["gate"]
        ev = c["evidence"]

        # Ensure definition_hash matches gate unless specifically testing mismatch
        if ev and "definition_hash" not in ev:
            ev["definition_hash"] = compute_definition_hash(gate)

        anc_fn = (lambda s: c["ancestor_mock"]) if "ancestor_mock" in c else None
        scp_fn = (lambda s, sc: c["scope_mock"]) if "scope_mock" in c else None

        res = resolve_effective_status(gate, ev, current_sha, ancestor_checker=anc_fn, scope_checker=scp_fn)
        act_eff = res["effective_status"]
        act_ev = res["evidence_status"]

        passed = (act_eff == c["expect_effective"] and act_ev == c["expect_evidence"])
        if passed:
            print(f"  ==> [PASS] Effective={act_eff}, Evidence={act_ev}")
        else:
            print(f"  ==> [FAIL] Expected effective={c['expect_effective']}, got {act_eff}; expected evidence={c['expect_evidence']}, got {act_ev}")
            all_passed = False

    print("\n==================================================")
    print(f"SELF-TEST SUMMARY: {'12/12 TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print("==================================================\n")
    return all_passed

def main():
    parser = argparse.ArgumentParser(description="NOVYX Quality Gate Report & Aggregation")
    parser.add_argument("--json", action="store_true", help="Output raw JSON to stdout")
    parser.add_argument("--out", default="dist/quality-gates/final-gate.json", help="Path to write final-gate.json")
    parser.add_argument("--registry", default="docs/quality-gates/evidence-index.json", help="Path to evidence-index.json")
    parser.add_argument("--quiet", action="store_true", help="Suppress human readable print")
    parser.add_argument("command", nargs="?", default="", help="Subcommand: 'self-test' or empty")

    args = parser.parse_args()

    if args.command == "self-test":
        success = run_self_test()
        sys.exit(0 if success else 1)

    report = generate_quality_report(registry_path=args.registry)
    json_path = write_json_output(report, args.out)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    elif not args.quiet:
        print_human_report(report)
        print(f"Machine-readable evidence saved to: {json_path}")

    sys.exit(0 if report["status"] == "PASS" else 1)

if __name__ == "__main__":
    main()
