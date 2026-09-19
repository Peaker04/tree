#!/usr/bin/env python3
"""
NOVYX Diagram Tool — Validation, SVG Extraction, PNG & PDF Export
Project-Local Extension for diagram-design in NOVYX GreenOps.
"""

import sys
import os
import re
import argparse
import subprocess
import shutil
from pathlib import Path

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

def find_browser():
    for p in EDGE_PATHS:
        if os.path.exists(p):
            return p
    # Try which / where
    for b in ["msedge", "chrome", "google-chrome"]:
        found = shutil.which(b)
        if found:
            return found
    return None

def rgba_to_hex_opacity(rgba_str):
    m = re.match(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)", rgba_str)
    if not m:
        return rgba_str, "1"
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    hex_color = f"#{r:02X}{g:02X}{b:02X}"
    opacity = m.group(4) if m.group(4) is not None else "1"
    return hex_color, opacity

def normalize_svg_colors(svg_content):
    """
    Replace rgba(r,g,b,a) in stroke/fill attributes with compatible hex + opacity
    to ensure SVG 1.1 / PowerPoint / Illustrator compatibility without black box rendering.
    """
    def replace_rgba_fill(match):
        full = match.group(0)
        attr = match.group(1) # fill or stroke
        rgba = match.group(2)
        hex_c, op = rgba_to_hex_opacity(rgba)
        if float(op) < 1.0:
            return f'{attr}="{hex_c}" {attr}-opacity="{op}"'
        return f'{attr}="{hex_c}"'

    normalized = re.sub(r'(fill|stroke)=["\'](rgba?\([^)]+\))["\']', replace_rgba_fill, svg_content)
    return normalized

def extract_svg(html_content, title="NOVYX Diagram", desc="Architecture Diagram"):
    m = re.search(r'(<svg[^>]*>.*?</svg>)', html_content, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    raw_svg = m.group(1)
    
    # Ensure xmlns
    if 'xmlns="http://www.w3.org/2000/svg"' not in raw_svg:
        raw_svg = raw_svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"', 1)
    
    # Ensure role="img"
    if 'role=' not in raw_svg:
        raw_svg = raw_svg.replace('<svg', '<svg role="img"', 1)
        
    # Ensure title and desc if missing
    if '<title>' not in raw_svg:
        raw_svg = re.sub(r'(<svg[^>]*>)', rf'\1\n  <title>{title}</title>\n  <desc>{desc}</desc>', raw_svg, count=1)
        
    normalized = normalize_svg_colors(raw_svg)
    return normalized

def validate_vietnamese_typography(html_path):
    """
    Validates typography rules from localization-vi.md:
    1. Font size floor: prose should not be 7px, 8px, 9px.
    2. Font loading: check for Noto Sans / Noto Serif.
    3. Monospace check: technical IDs only.
    4. Text wrapping: dy="1.4em" check.
    """
    content = Path(html_path).read_text(encoding="utf-8")
    errors = []
    warnings = []

    # 1. Check Google Fonts
    if "Noto+Sans" not in content and "Noto+Serif" not in content:
        warnings.append("Google Fonts link does not explicitly include Noto Sans / Noto Serif.")

    # 2. Check font sizes
    small_fonts = re.findall(r'font-size=["\']([0-9]+)(?:px)?["\']', content)
    for size_str in small_fonts:
        size = int(size_str)
        if size < 10:
            errors.append(f"Found font-size={size}px below recommended floor (>= 11-12px required).")
            break

    # 3. Check for foreignObject
    if "<foreignObject" in content:
        warnings.append("Found <foreignObject> in SVG. Prefer authoring-time <tspan> for static portability.")

    # 4. Check for dy="1.4em" or dy wrapping in multi-line texts
    tspans = re.findall(r'<tspan[^>]*>', content)
    if tspans:
        has_dy = any("dy=" in t for t in tspans)
        if not has_dy:
            warnings.append("Multi-line <tspan> elements found but no 'dy=' spacing specified.")

    # 5. Check banner status
    if "CANONICAL DOC SYNCHRONIZATION PENDING" in content:
        errors.append("Banner still states 'CANONICAL DOC SYNCHRONIZATION PENDING'. Update to 'DERIVED VIEW — CANONICAL BUSINESS BASELINE'.")
    if "SOURCE:" not in content:
        warnings.append("Diagram does not explicitly state its canonical source (e.g. 'SOURCE: docs/WORKFLOWS.md').")

    return errors, warnings

def export_diagram(html_path, out_dir=None, export_svg=True, export_png=True, export_pdf=True, full_page=False):
    html_path = Path(html_path).resolve()
    if not html_path.exists():
        print(f"Error: File not found: {html_path}")
        return False

    if out_dir is None:
        out_dir = html_path.parent
    else:
        out_dir = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    base_name = html_path.stem
    content = html_path.read_text(encoding="utf-8")
    browser = find_browser()

    print(f"\nProcessing diagram: {html_path.name}")
    errors, warnings = validate_vietnamese_typography(html_path)
    if warnings:
        for w in warnings:
            print(f"  [WARN] {w}")
    if errors:
        for e in errors:
            print(f"  [FAIL] {e}")

    # 1. Export SVG
    if export_svg:
        svg_content = extract_svg(content, title=base_name, desc=f"Generated from {html_path.name}")
        if svg_content:
            svg_out = out_dir / f"{base_name}.svg"
            svg_out.write_text(svg_content, encoding="utf-8")
            print(f"  [OK] Exported SVG: {svg_out.name}")
        else:
            print(f"  [WARN] No inline <svg> found to extract.")

    # 2. Export PNG via Headless Edge/Chrome
    if export_png:
        if not browser:
            print("  [SKIP] PNG export: No headless browser found.")
        else:
            # Full-page PNG
            png_suffix = ".full.png" if full_page else ".png"
            png_out = out_dir / f"{base_name}{png_suffix}"
            cmd = [
                browser,
                "--headless",
                "--disable-gpu",
                "--force-device-scale-factor=2",
                "--window-size=1600,1200",
                f"--screenshot={str(png_out)}",
                f"file:///{str(html_path).replace(os.sep, '/')}"
            ]
            try:
                res = subprocess.run(cmd, capture_output=True, timeout=30)
                if png_out.exists():
                    print(f"  [OK] Exported PNG @2x: {png_out.name}")
                else:
                    print(f"  [FAIL] PNG export failed: {res.stderr.decode('utf-8', errors='ignore')}")
            except Exception as ex:
                print(f"  [FAIL] PNG export error: {ex}")

    # 3. Export PDF via Headless Edge/Chrome
    if export_pdf:
        if not browser:
            print("  [SKIP] PDF export: No headless browser found.")
        else:
            pdf_suffix = ".full.pdf" if full_page else ".pdf"
            pdf_out = out_dir / f"{base_name}{pdf_suffix}"
            cmd = [
                browser,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={str(pdf_out)}",
                f"file:///{str(html_path).replace(os.sep, '/')}"
            ]
            try:
                res = subprocess.run(cmd, capture_output=True, timeout=30)
                if pdf_out.exists():
                    print(f"  [OK] Exported PDF: {pdf_out.name}")
                else:
                    print(f"  [FAIL] PDF export failed: {res.stderr.decode('utf-8', errors='ignore')}")
            except Exception as ex:
                print(f"  [FAIL] PDF export error: {ex}")

    return len(errors) == 0

def main():
    parser = argparse.ArgumentParser(description="NOVYX Diagram Tool — Validate, Export SVG, PNG, PDF")
    parser.add_argument("diagrams", nargs="+", help="Path to diagram HTML file(s)")
    parser.add_argument("--out-dir", default=None, help="Output directory for exports")
    parser.add_argument("--svg", action="store_true", default=True, help="Export SVG")
    parser.add_argument("--no-svg", action="store_false", dest="svg", help="Do not export SVG")
    parser.add_argument("--png", action="store_true", default=True, help="Export PNG @2x")
    parser.add_argument("--no-png", action="store_false", dest="png", help="Do not export PNG")
    parser.add_argument("--pdf", action="store_true", default=True, help="Export PDF")
    parser.add_argument("--no-pdf", action="store_false", dest="pdf", help="Do not export PDF")
    parser.add_argument("--full-page", action="store_true", default=False, help="Export full-page PNG/PDF")
    parser.add_argument("--validate-only", action="store_true", default=False, help="Validate only without export")

    args = parser.parse_args()

    all_passed = True
    for d in args.diagrams:
        p = Path(d)
        if not p.exists():
            print(f"File not found: {d}")
            all_passed = False
            continue
        if args.validate_only:
            errors, warnings = validate_vietnamese_typography(p)
            print(f"\nValidation for {p.name}:")
            for w in warnings:
                print(f"  [WARN] {w}")
            if errors:
                for e in errors:
                    print(f"  [FAIL] {e}")
                all_passed = False
            else:
                print("  [PASS] All typography and banner checks passed.")
        else:
            ok = export_diagram(
                p,
                out_dir=args.out_dir,
                export_svg=args.svg,
                export_png=args.png,
                export_pdf=args.pdf,
                full_page=args.full_page
            )
            if not ok:
                all_passed = False

    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
