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
import ast
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

def get_file_hash(path_str):
    p = Path(path_str)
    if not p.exists() or not p.is_file():
        return ""
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()[:16]

def get_tool_hashes():
    """Computes verification implementation fingerprint across quality scripts."""
    return {
        "evidence_runner": get_file_hash("scripts/run_quality_evidence.py"),
        "aggregator": get_file_hash("scripts/quality_gate_report.py"),
        "diagram_validator": get_file_hash("scripts/diagram_tool.py")
    }

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
                        "source": row.get("Source", ""),
                        "category": row.get("Nhóm", "")
                    })
    return active_diagrams

# ==============================================================================
# LAYER 1: CHECKLIST FILE PARSER
# ==============================================================================

def parse_checklist_file(category_name, file_rel_path):
    """
    Parses a markdown checklist table into structured Gate objects.
    Enforces required columns, valid status regex, and default fields.
    """
    p = Path(file_rel_path)
    if not p.exists():
        return []

    lines = p.read_text(encoding="utf-8").splitlines()
    gates = []
    headers = []
    in_table = False

    for line_idx, line in enumerate(lines, 1):
        s = line.strip()
        if not s.startswith("|"):
            if in_table and s and not s.startswith("#") and not s.startswith(">"):
                continue
            in_table = False
            headers = []
            continue

        parts = [c.strip() for c in s.split("|")[1:-1]]
        if not headers:
            if any("Mã ID" in h or "Mã Gate" in h or "Gate ID" in h for h in parts):
                headers = parts
                in_table = True
            continue

        if all(re.match(r'^:?-+:?$', c) for c in parts):
            continue

        if len(parts) < len(headers):
            continue

        row = dict(zip(headers, parts))
        gid_raw = row.get("Mã ID") or row.get("Mã Gate") or row.get("Gate ID", "")
        m_id = re.search(r'\*\*([A-Z0-9_\-]+)\*\*', gid_raw) or re.search(r'([A-Z0-9_\-]+)', gid_raw)
        gid = m_id.group(1) if m_id else gid_raw.strip()

        if not gid:
            continue

        # Status parser
        status_raw = row.get("Trạng thái hiện tại") or row.get("Trạng thái") or row.get("Status", "")
        m_status = re.search(r'`\[([A-Z_]+)\]`', status_raw) or re.search(r'\[([A-Z_]+)\]', status_raw)
        status = m_status.group(1) if m_status else "UNKNOWN"

        # Blocking parser
        blocking_raw = row.get("Khóa cổng?") or row.get("Khóa cổng") or row.get("Blocking?", "")
        blocking = ("YES" in blocking_raw.upper() or "TRUE" in blocking_raw.upper() or "**YES**" in blocking_raw.upper())

        # Method / Verification type
        method = row.get("Phương pháp kiểm chứng") or row.get("Phương pháp") or row.get("Method", "")
        title = row.get("Tiêu chí kiểm soát") or row.get("Tiêu chí") or row.get("Title", "")
        oracle = row.get("Acceptance Oracle") or row.get("Oracle", "")

        # Infer verification type
        m_lower = method.lower()
        if "hybrid" in m_lower or "thủ công kết hợp" in m_lower or "kết hợp" in m_lower:
            gtype = "HYBRID"
        elif "thủ công" in m_lower or "quan sát" in m_lower or "manual" in m_lower:
            gtype = "MANUAL"
        else:
            gtype = "AUTOMATED"

        # Explicit gate overrides
        if gid in ["DG-VIS-001", "DG-VIS-002", "DG-VIS-003", "DG-VIS-004", "DG-VIS-006"]:
            gtype = "MANUAL"
        elif gid in ["DG-TYP-005", "DG-LAY-007", "RTM-007", "RTM-009"]:
            gtype = "HYBRID"

        gates.append({
            "id": gid,
            "category": category_name,
            "file": file_rel_path,
            "line": line_idx,
            "title": title,
            "oracle": oracle,
            "method": method,
            "blocking": blocking,
            "declared_status": status,
            "type": gtype,
            "structure_errors": []
        })

    return gates

# ==============================================================================
# LAYER 2: MACHINE-READABLE EVIDENCE CROSS-CHECK & EFFECTIVE STATUS RESOLVER
# ==============================================================================

def load_evidence_registry(registry_path="docs/quality-gates/evidence-index.json"):
    p = Path(registry_path)
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data
        elif isinstance(data, list):
            return {item["gate_id"]: item for item in data if "gate_id" in item}
    except Exception as e:
        print(f"Warning: Failed to load evidence index from {registry_path}: {e}")
    return {}

def resolve_effective_status(gate, evidence, current_sha, ancestor_checker=None, scope_checker=None, tool_hash_provider=None):
    """
    Fail-closed Two-Layer resolution algorithm with tool hash fingerprint enforcement.
    """
    if ancestor_checker is None:
        ancestor_checker = check_ancestor
    if scope_checker is None:
        scope_checker = check_dependency_scope_unchanged
    if tool_hash_provider is None:
        tool_hash_provider = get_tool_hashes

    gid = gate["id"]
    declared = gate["declared_status"]
    is_blocking = gate["blocking"]
    gtype = gate["type"]

    if not evidence:
        return {
            "evidence_status": "MISSING",
            "effective_status": "NOT_RUN",
            "evidence_ref": None,
            "is_inherited": False,
            "evidence_note": "No machine evidence record found"
        }

    ev_sha = evidence.get("commit_sha", "")
    ev_tree = evidence.get("tree_hash", "")
    ev_status = evidence.get("status", "UNKNOWN")
    ev_code = evidence.get("exit_code", -1)
    ev_ref = evidence.get("evidence_ref") or evidence.get("gate_id")
    ev_origin = evidence.get("evidence_origin", "DIRECT_EXECUTION")
    ev_exec_type = evidence.get("execution_type", "AUTOMATED_EXECUTION")
    art_refs = evidence.get("artifact_refs", [])
    dep_scope = evidence.get("dependency_scope", [])
    allow_inheritance = evidence.get("allow_inheritance", True)

    # Rejection of circular checklist declarations
    if ev_origin == "GENERATED_FROM_CHECKLIST" or ev_exec_type == "CHECKLIST_DECLARATION":
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

    # Status and exit code
    if ev_status != "PASS" or ev_code != 0:
        return {
            "evidence_status": "FAIL",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Evidence reported {ev_status} with exit code {ev_code}"
        }

    # Oracle execution validation
    ev_oracle_exec = evidence.get("oracle_execution")
    if ev_oracle_exec in ["HARDCODED_PASS", "PARTIALLY_EXECUTED", "NOT_IMPLEMENTED"]:
        return {
            "evidence_status": "ORACLE_EXECUTION_FAILURE",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"Rejected: oracle_execution={ev_oracle_exec} violates acceptance criteria"
        }
    if gtype == "AUTOMATED" and ev_oracle_exec and ev_oracle_exec != "FULLY_EXECUTED":
        return {
            "evidence_status": "ORACLE_EXECUTION_MISMATCH",
            "effective_status": "FAIL",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"AUTOMATED gate requires oracle_execution=FULLY_EXECUTED (got {ev_oracle_exec})"
        }
    elif gtype == "MANUAL" and ev_oracle_exec and ev_oracle_exec != "MANUAL_VERIFIED":
        return {
            "evidence_status": "ORACLE_EXECUTION_MISMATCH",
            "effective_status": "NOT_RUN",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"MANUAL gate requires oracle_execution=MANUAL_VERIFIED (got {ev_oracle_exec})"
        }
    elif gtype == "HYBRID" and ev_oracle_exec and ev_oracle_exec != "HYBRID_VERIFIED":
        return {
            "evidence_status": "ORACLE_EXECUTION_MISMATCH",
            "effective_status": "NOT_RUN",
            "evidence_ref": ev_ref,
            "is_inherited": False,
            "evidence_note": f"HYBRID gate requires oracle_execution=HYBRID_VERIFIED (got {ev_oracle_exec})"
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

    # Tool hash fingerprint check on inherited evidence
    ev_tool_hashes = evidence.get("tool_hashes")
    if ev_tool_hashes:
        cur_tool_hashes = tool_hash_provider()
        if ev_tool_hashes != cur_tool_hashes:
            return {
                "evidence_status": "TOOL_HASH_MISMATCH",
                "effective_status": "FAIL",
                "evidence_ref": ev_ref,
                "is_inherited": False,
                "evidence_note": f"Inheritance rejected: verification tool implementation fingerprint changed between {ev_sha[:7]} and HEAD"
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
# STATIC ORACLE COVERAGE AUDIT
# ==============================================================================

def audit_oracle_coverage(runner_path="scripts/run_quality_evidence.py"):
    """
    Performs an AST-based audit of scripts/run_quality_evidence.py.
    Inspects all check_* functions to detect unvalidated/hardcoded PASS branches:
    Detects any gate branch whose body has no failure path or unconditionally returns True.
    """
    p = Path(runner_path)
    if not p.exists():
        return False, f"{runner_path} missing"
    try:
        tree = ast.parse(p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"Failed to parse AST of {runner_path}: {e}"

    def get_gate_ids_from_test(test_node):
        gids = []
        if isinstance(test_node, ast.Compare):
            left = test_node.left
            if isinstance(left, ast.Name) and left.id == "gate_id":
                for comp in test_node.comparators:
                    if isinstance(comp, ast.Constant) and isinstance(comp.value, str):
                        gids.append(comp.value)
                    elif isinstance(comp, (ast.List, ast.Set, ast.Tuple)):
                        for elt in comp.elts:
                            if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                                gids.append(elt.value)
        return gids

    def branch_can_fail(stmts):
        for s in stmts:
            for n in ast.walk(s):
                if isinstance(n, ast.Return):
                    val = n.value
                    if isinstance(val, ast.Tuple) and len(val.elts) > 0:
                        first = val.elts[0]
                        if isinstance(first, ast.Constant) and first.value is False:
                            return True
                        elif not isinstance(first, ast.Constant):
                            return True
                    elif isinstance(val, ast.Constant) and val.value is False:
                        return True
                    elif not isinstance(val, ast.Constant):
                        return True
        return False

    suspicious = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name.startswith("check_"):
            for child in ast.walk(node):
                if isinstance(child, ast.If):
                    gids = get_gate_ids_from_test(child.test)
                    if gids:
                        if not branch_can_fail(child.body):
                            suspicious.append(f"Function {node.name}, line {child.lineno}: {', '.join(gids)}")

    if suspicious:
        return False, f"AST Audit detected unconditional hardcoded pass branches:\n  " + "\n  ".join(suspicious)
    return True, "AST Acceptance Oracle Coverage Audit PASSED: 0 hardcoded return True branches across all check functions"

# ==============================================================================
# AGGREGATION & REPORTING
# ==============================================================================

def generate_quality_report(registry_path="dist/quality-evidence/evidence-index.json"):
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

    duplicate_ids = [gid for gid, lst in seen_ids.items() if len(lst) > 1]
    for g in all_gates:
        if g["id"] in duplicate_ids:
            g["is_duplicate"] = True
            g["declared_status"] = "UNKNOWN"
            g["structure_errors"].append(f"Duplicate Gate ID '{g['id']}' across checklist files")
        else:
            g["is_duplicate"] = False

    for g in all_gates:
        ev = evidence_index.get(g["id"])
        res = resolve_effective_status(g, ev, sha)
        g["evidence_status"] = res["evidence_status"]
        g["effective_status"] = res["effective_status"]
        g["evidence_ref"] = res["evidence_ref"]
        g["is_inherited"] = res["is_inherited"]
        g["evidence_note"] = res["evidence_note"]
        g["definition_hash"] = compute_definition_hash(g)

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
        "rejected_inherited_evidence": sum(1 for g in all_gates if g["evidence_status"] in ["DEPENDENCY_SCOPE_CHANGED", "WRONG_LINEAGE", "WRONG_SHA", "TOOL_HASH_MISMATCH"]),
        "missing_evidence": sum(1 for g in all_gates if g["evidence_status"] == "MISSING"),
        "stale_evidence": sum(1 for g in all_gates if g["evidence_status"] == "DEFINITION_HASH_MISMATCH"),
        "wrong_sha": sum(1 for g in all_gates if g["evidence_status"] == "WRONG_SHA"),
        "wrong_lineage": sum(1 for g in all_gates if g["evidence_status"] == "WRONG_LINEAGE"),
        "tool_hash_mismatch": sum(1 for g in all_gates if g["evidence_status"] == "TOOL_HASH_MISMATCH"),
        "invalid_artifact": sum(1 for g in all_gates if g["evidence_status"] == "INVALID_ARTIFACT"),
        "definition_hash_mismatch": sum(1 for g in all_gates if g["evidence_status"] == "DEFINITION_HASH_MISMATCH"),
        "dependency_scope_changed": sum(1 for g in all_gates if g["evidence_status"] == "DEPENDENCY_SCOPE_CHANGED"),
        "rejected_origin": sum(1 for g in all_gates if g["evidence_status"] == "REJECTED_ORIGIN"),
    }

    # Oracle Execution Coverage metrics derived directly from machine evidence records
    fully_executed = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") == "FULLY_EXECUTED")
    hybrid_verified = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") == "HYBRID_VERIFIED")
    manual_verified = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") == "MANUAL_VERIFIED")
    partially_executed = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") == "PARTIALLY_EXECUTED")
    hardcoded_pass = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") == "HARDCODED_PASS")
    not_implemented_oracle = sum(1 for g in all_gates if evidence_index.get(g["id"], {}).get("oracle_execution") in [None, "NOT_IMPLEMENTED"])

    oracle_coverage = {
        "fully_executed": fully_executed,
        "hybrid_verified": hybrid_verified,
        "manual_verified": manual_verified,
        "partially_executed": partially_executed,
        "hardcoded_pass": hardcoded_pass,
        "not_implemented": not_implemented_oracle,
        "coverage_rate": f"{(fully_executed + hybrid_verified + manual_verified) / total_gates * 100:.1f}%" if total_gates else "0%"
    }

    # FAIL-CLOSED DECISION RULE:
    # All blocking effective_status == PASS
    # AND all blocking gate oracle_execution in [FULLY_EXECUTED, MANUAL_VERIFIED, HYBRID_VERIFIED]
    # AND hardcoded_pass == 0
    # AND partially_executed == 0
    # AND not_implemented == 0
    # AND missing_evidence == 0
    # AND duplicate_ids == 0
    blocking_oracle_valid = all(
        evidence_index.get(g["id"], {}).get("oracle_execution") in ["FULLY_EXECUTED", "MANUAL_VERIFIED", "HYBRID_VERIFIED"]
        for g in blocking_gates
    )
    is_ready = (
        len(blocking_gates) > 0 and
        len(duplicate_ids) == 0 and
        hardcoded_pass == 0 and
        partially_executed == 0 and
        not_implemented_oracle == 0 and
        provenance["missing_evidence"] == 0 and
        blocking_oracle_valid and
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
        if hardcoded_pass > 0:
            failed_reasons.append(f"HARDCODED_PASS({hardcoded_pass})")
        if partially_executed > 0:
            failed_reasons.append(f"PARTIALLY_EXECUTED({partially_executed})")
        if not_implemented_oracle > 0:
            failed_reasons.append(f"NOT_IMPLEMENTED({not_implemented_oracle})")
        if not blocking_oracle_valid:
            invalid_oracles = [f"{g['id']}({evidence_index.get(g['id'], {}).get('oracle_execution')})"
                               for g in blocking_gates if evidence_index.get(g["id"], {}).get("oracle_execution") not in ["FULLY_EXECUTED", "MANUAL_VERIFIED", "HYBRID_VERIFIED"]]
            failed_reasons.append(f"INVALID_ORACLE_EXECUTION({', '.join(invalid_oracles)})")
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
        "oracle_coverage": oracle_coverage,
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
    oc = report.get("oracle_coverage", {})
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
    print(f"  - Tool Hash Mismatches        : {p.get('tool_hash_mismatch', 0)}")
    print(f"  - Rejected Circular Origins   : {p.get('rejected_origin', 0)}")
    print(f"  - Duplicate Gate IDs          : {len(report.get('duplicate_gate_ids', []))}")
    print("--------------------------------------------------------------------------------")
    print(f"ACCEPTANCE ORACLE EXECUTION COVERAGE AUDIT:")
    print(f"  - FULLY_EXECUTED              : {oc.get('fully_executed', 0)}")
    print(f"  - HYBRID_VERIFIED             : {oc.get('hybrid_verified', 0)}")
    print(f"  - MANUAL_VERIFIED             : {oc.get('manual_verified', 0)}")
    print(f"  - PARTIALLY_EXECUTED          : {oc.get('partially_executed', 0)}")
    print(f"  - HARDCODED_PASS              : {oc.get('hardcoded_pass', 0)}")
    print(f"  - NOT_IMPLEMENTED             : {oc.get('not_implemented', 0)}")
    print(f"  - Oracle Coverage Rate        : {oc.get('coverage_rate', '0%')}")
    print("--------------------------------------------------------------------------------")
    print("FINAL QUALITY GATE VERDICT:")
    print(f"==> {report['verdict']}")
    print("================================================================================\n")

# ==============================================================================
# ENGINE SELF-TEST SUITE
# ==============================================================================

def run_self_test():
    """
    Executes 14 self-test cases verifying the fail-closed machine evidence provenance engine
    and Acceptance Oracle Execution Coverage.
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
            "evidence": {"commit_sha": "parent_sha_123", "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True, "dependency_scope": ["docs/WORKFLOWS.md"]},
            "ancestor_mock": True,
            "scope_mock": True,
            "expect_effective": "PASS",
            "expect_evidence": "INHERITED_PASS"
        },
        {
            "id": 6,
            "name": "CASE 6: ancestor + relevant doc/tool changed -> inheritance rejected",
            "gate": {"id": "C-06", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": "parent_sha_123", "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True, "dependency_scope": ["docs/WORKFLOWS.md"]},
            "ancestor_mock": True,
            "scope_mock": False,
            "expect_effective": "FAIL",
            "expect_evidence": "DEPENDENCY_SCOPE_CHANGED"
        },
        {
            "id": 7,
            "name": "CASE 7: oracle changed -> definition_hash mismatch",
            "gate": {"id": "C-07", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "NEW_ORACLE", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "definition_hash": "OLD_HASH_123"},
            "expect_effective": "FAIL",
            "expect_evidence": "DEFINITION_HASH_MISMATCH"
        },
        {
            "id": 8,
            "name": "CASE 8: AUTOMATED gate with manual-only evidence -> reject",
            "gate": {"id": "C-08", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "oracle_execution": "MANUAL_VERIFIED", "evidence_origin": "MANUAL_REVIEW", "execution_type": "MANUAL_INSPECTION"},
            "expect_effective": "FAIL",
            "expect_evidence": "TYPE_MISMATCH"
        },
        {
            "id": 9,
            "name": "CASE 9: MANUAL gate without manual review evidence -> NOT_RUN",
            "gate": {"id": "C-09", "declared_status": "PASS", "blocking": True, "type": "MANUAL", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "NOT_RUN",
            "expect_evidence": "MANUAL_MISSING"
        },
        {
            "id": 10,
            "name": "CASE 10: HYBRID missing one side -> NOT_RUN",
            "gate": {"id": "C-10", "declared_status": "PASS", "blocking": True, "type": "HYBRID", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "oracle_execution": "PARTIALLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "NOT_RUN",
            "expect_evidence": "HYBRID_INCOMPLETE"
        },
        {
            "id": 11,
            "name": "CASE 11: direct final-SHA command exit 0 -> PASS",
            "gate": {"id": "C-11", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "PASS",
            "expect_evidence": "FINAL_SHA_EXECUTED"
        },
        {
            "id": 12,
            "name": "CASE 12: direct final-SHA command exit !=0 -> FAIL",
            "gate": {"id": "C-12", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": current_sha, "status": "FAIL", "exit_code": 1, "oracle_execution": "PARTIALLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION"},
            "expect_effective": "FAIL",
            "expect_evidence": "FAIL"
        },
        {
            "id": 13,
            "name": "CASE 13: ancestor with modified tool hash -> inheritance rejected (TOOL_HASH_MISMATCH)",
            "gate": {"id": "C-13", "declared_status": "PASS", "blocking": True, "type": "AUTOMATED", "title": "T", "oracle": "O", "method": "M"},
            "evidence": {"commit_sha": "parent_sha_123", "status": "PASS", "exit_code": 0, "oracle_execution": "FULLY_EXECUTED", "evidence_origin": "DIRECT_EXECUTION", "execution_type": "AUTOMATED_EXECUTION", "allow_inheritance": True, "tool_hashes": {"runner": "old_hash_1"}},
            "ancestor_mock": True,
            "scope_mock": True,
            "tool_hash_mock": {"runner": "new_hash_2"},
            "expect_effective": "FAIL",
            "expect_evidence": "TOOL_HASH_MISMATCH"
        }
    ]

    for c in cases:
        idx = c["id"]
        print(f"[{idx:02d}/14] Running {c['name']}...")
        gate = c["gate"]
        ev = c["evidence"]

        if ev and "definition_hash" not in ev:
            ev["definition_hash"] = compute_definition_hash(gate)

        anc_fn = (lambda s: c["ancestor_mock"]) if "ancestor_mock" in c else None
        scp_fn = (lambda s, sc: c["scope_mock"]) if "scope_mock" in c else None
        th_fn = (lambda: c["tool_hash_mock"]) if "tool_hash_mock" in c else None

        res = resolve_effective_status(gate, ev, current_sha, ancestor_checker=anc_fn, scope_checker=scp_fn, tool_hash_provider=th_fn)
        act_eff = res["effective_status"]
        act_ev = res["evidence_status"]

        passed = (act_eff == c["expect_effective"] and act_ev == c["expect_evidence"])
        if passed:
            print(f"  ==> [PASS] Effective={act_eff}, Evidence={act_ev}")
        else:
            print(f"  ==> [FAIL] Expected effective={c['expect_effective']}, got {act_eff}; expected evidence={c['expect_evidence']}, got {act_ev}")
            all_passed = False

    # CASE 14: Static Oracle Coverage Self-Audit
    print("[14/14] Running CASE 14: Static Acceptance Oracle Coverage Audit...")
    audit_ok, audit_msg = audit_oracle_coverage()
    if audit_ok:
        print(f"  ==> [PASS] {audit_msg}")
    else:
        print(f"  ==> [FAIL] {audit_msg}")
        all_passed = False

    print("\n==================================================")
    print(f"SELF-TEST SUMMARY: {'14/14 TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print("==================================================\n")
    return all_passed

def main():
    parser = argparse.ArgumentParser(description="NOVYX Quality Gate Report & Aggregation")
    parser.add_argument("--json", action="store_true", help="Output raw JSON to stdout")
    parser.add_argument("--out", default="dist/quality-gates/final-gate.json", help="Path to write final-gate.json")
    parser.add_argument("--registry", default="dist/quality-evidence/evidence-index.json", help="Path to evidence-index.json")
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
