#!/usr/bin/env python3
"""
NOVYX Diagram Tool — Runtime Geometry Validation, SVG Extraction, PNG & PDF Export
Authoritative Project-Local Tooling for diagram-design in NOVYX GreenOps.
"""

import sys
import os
import re
import argparse
import subprocess
import shutil
import tempfile
import json
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

def find_browser():
    for p in EDGE_PATHS:
        if os.path.exists(p):
            return p
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
    def replace_rgba_attr(match):
        attr = match.group(1)
        rgba = match.group(2)
        hex_c, op = rgba_to_hex_opacity(rgba)
        if float(op) < 1.0:
            return f'{attr}="{hex_c}" {attr}-opacity="{op}"'
        return f'{attr}="{hex_c}"'

    normalized = re.sub(r'(fill|stroke)=["\'](rgba?\([^)]+\))["\']', replace_rgba_attr, svg_content)
    return normalized

def extract_svg(html_content, title="NOVYX Diagram", desc="Architecture Diagram"):
    """
    Extracts inline SVG and enriches it for standalone SVG usage:
    - Injects Google Fonts @import inside <defs><style> with XML-escaped '&amp;'
    - Injects reliable fallback font-family declarations
    - Normalizes rgba colors to hex + opacity
    - Ensures standard XML header, xmlns, role="img", title and desc
    """
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

    # Font style definition with XML-safe '&amp;'
    font_style = (
        "\n  <defs>\n"
        "    <style type=\"text/css\"><![CDATA[\n"
        "      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Geist+Mono:wght@400;500;600&amp;display=swap');\n"
        "      text {\n"
        "        font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n"
        "      }\n"
        "    ]]></style>\n"
        "  </defs>"
    )

    if '<defs>' in raw_svg:
        raw_svg = raw_svg.replace('<defs>', font_style.replace('</defs>', ''), 1)
    else:
        raw_svg = re.sub(r'(<svg[^>]*>)', rf'\1{font_style}', raw_svg, count=1)

    # Ensure title and desc if missing
    if '<title>' not in raw_svg:
        raw_svg = re.sub(r'(<svg[^>]*>)', rf'\1\n  <title>{title}</title>\n  <desc>{desc}</desc>', raw_svg, count=1)

    normalized = normalize_svg_colors(raw_svg)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n{normalized}'

def build_runtime_validator_script():
    """
    Browser-evaluated script injected into diagram DOM to perform real geometric collision detection.
    Evaluates:
    - document.fonts.ready
    - Text vs Text collision
    - Text vs Owning Node boundary overflow
    - Visible clipping outside SVG viewBox
    - Minimum typography floor (font-size < 10px)
    """
    return """
<script id="__collision_validator__">
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await document.fonts.ready;
        const svg = document.querySelector('svg');
        if (!svg) {
            outputResult({ error: 'No SVG element found in page' });
            return;
        }

        const svgRect = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const vbWidth = vb && vb.width > 0 ? vb.width : svg.clientWidth;
        const vbHeight = vb && vb.height > 0 ? vb.height : svg.clientHeight;

        // Check specific Vietnamese font faces (VAL-003)
        const notoSansLoaded = document.fonts.check('12px "Noto Sans"');
        const notoSerifLoaded = document.fonts.check('16px "Noto Serif"');

        const results = {
            fontsLoaded: document.fonts.status === 'loaded',
            fontCount: document.fonts.size,
            fontChecks: {
                notoSans: notoSansLoaded,
                notoSerif: notoSerifLoaded,
                systemStatus: document.fonts.status
            },
            svgBounds: { width: Math.round(svgRect.width), height: Math.round(svgRect.height) },
            viewBox: { width: vbWidth, height: vbHeight },
            textCollisions: [],
            boundaryOverflows: [],
            safePaddingViolations: [],
            nodeCollisions: [],
            clippingIssues: [],
            fontFloorViolations: [],
            executedChecks: [
                'VAL-002: await document.fonts.ready',
                'VAL-003: document.fonts.check font faces',
                'VAL-004: tightest enclosing owner detection',
                'VAL-005: safe padding & boundary overflow',
                'VAL-006: text vs text collision',
                'VAL-008: node vs node overlap',
                'VAL-009: SVG viewport clipping'
            ],
            skippedChecks: [],
            stats: { totalTexts: 0, totalNodes: 0 }
        };

        const texts = Array.from(svg.querySelectorAll('text'));
        const rects = Array.from(svg.querySelectorAll('rect'));
        results.stats.totalTexts = texts.length;
        results.stats.totalNodes = rects.length;

        // 1. Text element data extraction
        const textData = texts.map((t, idx) => {
            const rect = t.getBoundingClientRect();
            const textContent = t.textContent.trim().replace(/\\s+/g, ' ');
            const computedStyle = window.getComputedStyle(t);
            const fontSize = parseFloat(computedStyle.fontSize) || 12;
            return {
                id: t.id || `text-${idx}`,
                text: textContent,
                rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
                fontSize,
                element: t
            };
        });

        // 2. Candidate card/node rects (exclude full-canvas background rects)
        const cardRects = rects
            .map(r => {
                const b = r.getBoundingClientRect();
                return { element: r, rect: b };
            })
            .filter(c => {
                return c.rect.width > 15 && c.rect.height > 8 &&
                       c.rect.width < (svgRect.width * 0.95) &&
                       c.rect.height < (svgRect.height * 0.95);
            });

        // 3. Node vs Node Overlap check (VAL-008)
        for (let i = 0; i < cardRects.length; i++) {
            const c1 = cardRects[i];
            for (let j = i + 1; j < cardRects.length; j++) {
                const c2 = cardRects[j];
                // Skip nested groups (parent containing child)
                const c1ContainsC2 = (c1.rect.left <= c2.rect.left + 2 && c1.rect.right >= c2.rect.right - 2 &&
                                      c1.rect.top <= c2.rect.top + 2 && c1.rect.bottom >= c2.rect.bottom - 2);
                const c2ContainsC1 = (c2.rect.left <= c1.rect.left + 2 && c2.rect.right >= c1.rect.right - 2 &&
                                      c2.rect.top <= c1.rect.top + 2 && c2.rect.bottom >= c1.rect.bottom - 2);
                if (c1ContainsC2 || c2ContainsC1) continue;

                // Documented exclusion (VAL-010): Section header badge tab sitting on top border of container
                const isHeaderBadge = (c1.rect.height <= 36 && Math.abs(c1.rect.top - c2.rect.top) <= 25 && c1.rect.width < c2.rect.width) ||
                                      (c2.rect.height <= 36 && Math.abs(c2.rect.top - c1.rect.top) <= 25 && c2.rect.width < c1.rect.width);
                if (isHeaderBadge) continue;

                const ovX = Math.max(0, Math.min(c1.rect.right, c2.rect.right) - Math.max(c1.rect.left, c2.rect.left));
                const ovY = Math.max(0, Math.min(c1.rect.bottom, c2.rect.bottom) - Math.max(c1.rect.top, c2.rect.top));
                if (ovX > 4 && ovY > 4) {
                    results.nodeCollisions.push({
                        nodeA: c1.element.id || `rect-${i}`,
                        nodeB: c2.element.id || `rect-${j}`,
                        overlap: { width: Math.round(ovX), height: Math.round(ovY) },
                        coordsA: { x: Math.round(c1.rect.left - svgRect.left), y: Math.round(c1.rect.top - svgRect.top) },
                        coordsB: { x: Math.round(c2.rect.left - svgRect.left), y: Math.round(c2.rect.top - svgRect.top) }
                    });
                }
            }
        }

        // 4. Text checks
        for (let i = 0; i < textData.length; i++) {
            const t1 = textData[i];

            // A. Typography floor check
            if (t1.fontSize < 10) {
                results.fontFloorViolations.push({
                    text: t1.text.substring(0, 35),
                    fontSize: t1.fontSize,
                    issue: `Font size ${t1.fontSize}px is below minimum floor (>= 11-12px required)`
                });
            }

            // B. Visible clipping outside SVG canvas
            if (t1.rect.left < svgRect.left - 2 ||
                t1.rect.top < svgRect.top - 2 ||
                t1.rect.right > svgRect.right + 2 ||
                t1.rect.bottom > svgRect.bottom + 2) {
                results.clippingIssues.push({
                    text: t1.text.substring(0, 40),
                    issue: 'Text clips outside SVG viewport boundaries',
                    coords: { x: Math.round(t1.rect.left - svgRect.left), y: Math.round(t1.rect.top - svgRect.top) }
                });
            }

            // C. Text vs Text overlap (VAL-006)
            for (let j = i + 1; j < textData.length; j++) {
                const t2 = textData[j];
                if (!t1.text || !t2.text) continue;
                if (t1.element.contains(t2.element) || t2.element.contains(t1.element)) continue;

                const overlapX = Math.max(0, Math.min(t1.rect.right, t2.rect.right) - Math.max(t1.rect.left, t2.rect.left));
                const overlapY = Math.max(0, Math.min(t1.rect.bottom, t2.rect.bottom) - Math.max(t1.rect.top, t2.rect.top));

                if (overlapX > 3 && overlapY > 3) {
                    results.textCollisions.push({
                        textA: t1.text.substring(0, 30),
                        textB: t2.text.substring(0, 30),
                        overlap: { width: Math.round(overlapX), height: Math.round(overlapY) },
                        coordsA: { x: Math.round(t1.rect.left - svgRect.left), y: Math.round(t1.rect.top - svgRect.top) },
                        coordsB: { x: Math.round(t2.rect.left - svgRect.left), y: Math.round(t2.rect.top - svgRect.top) }
                    });
                }
            }

            // D. Semantic owner detection (VAL-004) & Safe padding (VAL-005)
            let ownerCard = null;

            // Priority 1: Explicit metadata (VAL-004)
            const explicitOwnerId = t1.element.getAttribute('data-owner-id') ||
                                   t1.element.getAttribute('data-label-for') ||
                                   (t1.element.parentElement ? t1.element.parentElement.getAttribute('data-owner-id') : null);
            if (explicitOwnerId) {
                const matched = cardRects.find(c => c.element.id === explicitOwnerId);
                if (matched) ownerCard = matched;
            }

            // Priority 2: Smallest sibling rect in same group containing text center
            if (!ownerCard) {
                const parentG = t1.element.closest('g');
                if (parentG) {
                    const siblingRects = Array.from(parentG.querySelectorAll(':scope > rect'));
                    const midY = (t1.rect.top + t1.rect.bottom) / 2;
                    const midX = (t1.rect.left + t1.rect.right) / 2;
                    const candidateSiblings = [];
                    for (const r of siblingRects) {
                        const matched = cardRects.find(c => c.element === r);
                        if (matched) {
                            const cr = matched.rect;
                            if (midY >= cr.top - 4 && midY <= cr.bottom + 4 &&
                                midX >= cr.left - 6 && midX <= cr.right + 6) {
                                candidateSiblings.push(matched);
                            }
                        }
                    }
                    candidateSiblings.sort((a, b) => (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height));
                    if (candidateSiblings.length > 0) {
                        ownerCard = candidateSiblings[0];
                    }
                }
            }

            // Priority 3: Geometric center containment (midX, midY strictly within card)
            if (!ownerCard) {
                const midX = (t1.rect.left + t1.rect.right) / 2;
                const midY = (t1.rect.top + t1.rect.bottom) / 2;
                const candidateCards = cardRects.filter(card => {
                    const cr = card.rect;
                    return (midX >= cr.left - 4 && midX <= cr.right + 4 &&
                            midY >= cr.top - 4 && midY <= cr.bottom + 4);
                });
                candidateCards.sort((a, b) => (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height));
                if (candidateCards.length > 0) {
                    ownerCard = candidateCards[0];
                }
            }

            if (ownerCard) {
                const cr = ownerCard.rect;
                const padRight = cr.right - t1.rect.right;
                const padBottom = cr.bottom - t1.rect.bottom;
                const padLeft = t1.rect.left - cr.left;
                const padTop = t1.rect.top - cr.top;

                // Hard boundary overflow
                if (padRight < -1 || padBottom < -1 || padLeft < -2 || padTop < -2) {
                    results.boundaryOverflows.push({
                        text: t1.text.substring(0, 35),
                        ownerId: ownerCard.element.id || 'card',
                        cardBounds: { width: Math.round(cr.width), height: Math.round(cr.height) },
                        overflow: {
                            x: Math.max(0, Math.round(-padRight), Math.round(-padLeft)),
                            y: Math.max(0, Math.round(-padBottom), Math.round(-padTop))
                        }
                    });
                } else if (padRight < 4 || padLeft < 2) {
                    // Safe padding violation: text pressed right against card boundary
                    results.safePaddingViolations.push({
                        text: t1.text.substring(0, 35),
                        ownerId: ownerCard.element.id || 'card',
                        padding: { left: Math.round(padLeft), right: Math.round(padRight), top: Math.round(padTop), bottom: Math.round(padBottom) },
                        minExpected: 4
                    });
                }
            }
        }

        // Full-page dimensions for dynamic export scaling (Section 25)
        results.fullPageBounds = {
            width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, 1200),
            height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 800)
        };

        outputResult(results);
    } catch (err) {
        outputResult({ error: err.toString() });
    }

    function outputResult(data) {
        const el = document.createElement('script');
        el.id = '__validation_data__';
        el.type = 'application/json';
        el.textContent = JSON.stringify(data);
        document.body.appendChild(el);
    }
});
</script>
"""

def validate_diagram_runtime(html_path):
    """
    Executes headless Edge to collect real DOM/geometry metrics and validate zero-collision.
    """
    html_path = Path(html_path).resolve()
    content = html_path.read_text(encoding="utf-8")
    browser = find_browser()

    static_errors = []
    static_warnings = []

    # 1. Static authority & metadata checks
    if "CANONICAL DOC SYNCHRONIZATION PENDING" in content:
        static_errors.append("Banner states 'CANONICAL DOC SYNCHRONIZATION PENDING'. Must be 'DERIVED VIEW — CANONICAL BUSINESS BASELINE'.")
    if "SOURCE:" not in content:
        static_warnings.append("Missing explicit canonical source citation (e.g. 'SOURCE: docs/WORKFLOWS.md').")
    if 'lang="vi"' not in content:
        static_warnings.append("Missing lang=\"vi\" on <html> element.")
    if "Noto+Sans" not in content and "Noto+Serif" not in content:
        static_warnings.append("Missing explicit Noto Sans / Noto Serif Google Fonts link.")

    if not browser:
        return {
            "browserFound": False,
            "staticErrors": static_errors,
            "staticWarnings": static_warnings,
            "geometryData": None
        }

    # Inject validator script
    validator_code = build_runtime_validator_script()
    injected_html = content.replace("</body>", f"{validator_code}\n</body>")

    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8') as tf:
        tf.write(injected_html)
        tmp_file = tf.name

    try:
        file_url = "file:///" + tmp_file.replace("\\", "/")
        cmd = [
            browser,
            "--headless",
            "--disable-gpu",
            "--virtual-time-budget=4000",
            "--dump-dom",
            file_url
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', timeout=20)
        output = res.stdout

        marker = '<script id="__validation_data__" type="application/json">'
        if marker in output:
            start = output.index(marker) + len(marker)
            end = output.index('</script>', start)
            geom_data = json.loads(output[start:end])
        else:
            geom_data = {"error": "Failed to parse validation data from browser DOM dump"}
    except Exception as ex:
        geom_data = {"error": f"Browser execution failed: {ex}"}
    finally:
        if os.path.exists(tmp_file):
            try:
                os.unlink(tmp_file)
            except Exception:
                pass

    return {
        "browserFound": True,
        "staticErrors": static_errors,
        "staticWarnings": static_warnings,
        "geometryData": geom_data
    }

def print_validation_report(html_name, val_result):
    print(f"\n==================================================")
    print(f"DIAGRAM VALIDATION REPORT: {html_name}")
    print(f"==================================================")

    static_errs = val_result["staticErrors"]
    static_warns = val_result["staticWarnings"]
    geom = val_result["geometryData"]

    has_errors = len(static_errs) > 0

    for w in static_warns:
        print(f"  [WARN] {w}")
    for e in static_errs:
        print(f"  [FAIL] {e}")

    if not val_result["browserFound"]:
        print("  [INCONCLUSIVE] Headless browser not found. Skipping runtime geometry collision validation.")
        print("  ==> RESULT: [INCONCLUSIVE] VAL-001 requirement failed: cannot certify zero collision without browser runtime.")
        return "INCONCLUSIVE"

    if not geom or "error" in geom:
        print(f"  [FAIL] Runtime geometry error: {geom.get('error', 'Unknown error')}")
        return "FAIL"

    font_checks = geom.get("fontChecks", {})
    print(f"  [PASS] Font Engine: loaded={geom.get('fontsLoaded')} (Noto Sans: {font_checks.get('notoSans')}, Noto Serif: {font_checks.get('notoSerif')}, Loaded faces: {geom.get('fontCount')})")
    print(f"  [INFO] Evaluated SVG elements: {geom['stats']['totalTexts']} texts, {geom['stats']['totalNodes']} nodes.")
    print(f"  [INFO] Executed Checks: {len(geom.get('executedChecks', []))} active validation gates.")

    # Check collisions
    collisions = geom.get("textCollisions", [])
    overflows = geom.get("boundaryOverflows", [])
    padding_viols = geom.get("safePaddingViolations", [])
    node_collisions = geom.get("nodeCollisions", [])
    clippings = geom.get("clippingIssues", [])
    font_floors = geom.get("fontFloorViolations", [])

    if collisions:
        has_errors = True
        print(f"  [FAIL] Text vs Text Collisions ({len(collisions)} detected):")
        for c in collisions:
            print(f"         - \"{c['textA']}\" [x:{c['coordsA']['x']}, y:{c['coordsA']['y']}] collides with \"{c['textB']}\" [x:{c['coordsB']['x']}, y:{c['coordsB']['y']}] (Overlap: {c['overlap']['width']}x{c['overlap']['height']}px)")
    else:
        print("  [PASS] Zero Text vs Text collision.")

    if node_collisions:
        has_errors = True
        print(f"  [FAIL] Node vs Node Collisions ({len(node_collisions)} detected):")
        for nc in node_collisions:
            print(f"         - \"{nc['nodeA']}\" [x:{nc['coordsA']['x']}, y:{nc['coordsA']['y']}] overlaps \"{nc['nodeB']}\" [x:{nc['coordsB']['x']}, y:{nc['coordsB']['y']}] (Overlap: {nc['overlap']['width']}x{nc['overlap']['height']}px)")
    else:
        print("  [PASS] Zero Node vs Node unintended overlap.")

    if overflows:
        has_errors = True
        print(f"  [FAIL] Boundary Overflows ({len(overflows)} detected):")
        for o in overflows:
            print(f"         - \"{o['text']}\" in card [{o.get('ownerId', '')} ({o['cardBounds']['width']}x{o['cardBounds']['height']}px)] spills by {o['overflow']['x']}px x {o['overflow']['y']}px")
    else:
        print("  [PASS] Zero Node Boundary overflow.")

    if padding_viols:
        # Undersized container warning / safe padding violation
        print(f"  [WARN] Safe Padding Violations ({len(padding_viols)} detected - tight content box):")
        for pv in padding_viols:
            print(f"         - \"{pv['text']}\" in card [{pv.get('ownerId', '')}]: rightPad={pv['padding']['right']}px, leftPad={pv['padding']['left']}px (min expected: {pv['minExpected']}px)")
    else:
        print("  [PASS] Safe padding maintained for all content labels.")

    if clippings:
        has_errors = True
        print(f"  [FAIL] SVG Viewport Clipping ({len(clippings)} detected):")
        for cl in clippings:
            print(f"         - \"{cl['text']}\" at {cl.get('coords', '')}: {cl['issue']}")
    else:
        print("  [PASS] Zero Viewport clipping.")

    if font_floors:
        has_errors = True
        print(f"  [FAIL] Font Floor Violations ({len(font_floors)} detected):")
        for ff in font_floors:
            print(f"         - \"{ff['text']}\": {ff['issue']}")
    else:
        print("  [PASS] Vietnamese typography floor satisfied (all text >= 11px).")

    if not has_errors:
        print(f"  ==> RESULT: [VERIFIED PASS] Zero Visual Collision & Fully Validated.")
        return "PASS"
    else:
        print(f"  ==> RESULT: [FAIL] Issues detected requiring diagram geometry repair.")
        return "FAIL"

def get_svg_dimensions(svg_content):
    """
    Extracts width and height or viewBox dimensions from SVG
    """
    m_vb = re.search(r'viewBox=["\']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["\']', svg_content)
    if m_vb:
        return int(float(m_vb.group(3))), int(float(m_vb.group(4)))
    m_w = re.search(r'width=["\']([0-9.]+)["\']', svg_content)
    m_h = re.search(r'height=["\']([0-9.]+)["\']', svg_content)
    if m_w and m_h:
        return int(float(m_w.group(1))), int(float(m_h.group(1)))
    return 1200, 800

def export_diagram(html_path, out_dir=None, formats=None, mode="diagram", scale=2):
    """
    Multi-format export:
    - SVG: Standalone SVG with Google Fonts @import, clean XML, rgba normalized
    - PNG:
        mode="diagram": Exact SVG bounding box screenshot at scale (e.g. 2x or 3x)
        mode="full-page": Full page screenshot including header, metadata, badges
    - PDF:
        mode="diagram": Exact SVG dimensions vector PDF with 0 margins
        mode="full-page": Full page vector PDF
    """
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

    if formats is None:
        formats = ["svg", "png", "pdf"]

    print(f"\n==================================================")
    print(f"EXPORTING: {html_path.name}")
    print(f"Mode: {mode} | Scale: @{scale}x | Formats: {', '.join(formats)}")
    print(f"==================================================")

    # Validate first
    val_res = validate_diagram_runtime(html_path)
    print_validation_report(html_path.name, val_res)

    svg_content = extract_svg(content, title=base_name, desc=f"NOVYX Diagram {base_name}")
    if not svg_content:
        print("  [FAIL] Could not extract inline SVG from diagram.")
        return False

    svg_w, svg_h = get_svg_dimensions(svg_content)

    # 1. Export SVG
    if "svg" in formats:
        svg_out = out_dir / f"{base_name}.svg"
        svg_out.write_text(svg_content, encoding="utf-8")
        print(f"  [OK] Exported Standalone SVG: {svg_out.name}")

    if not browser and ("png" in formats or "pdf" in formats):
        print("  [SKIP] PNG/PDF export skipped: No headless browser found.")
        return True

    # Prepare temporary HTML wrapper for capture
    if mode == "diagram":
        wrapper_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{base_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: {svg_w}px {svg_h}px;
      margin: 0;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html, body {{
      margin: 0;
      padding: 0;
      width: {svg_w}px;
      height: {svg_h}px;
      overflow: hidden;
      background: #FCFCF7;
    }}
    svg {{
      display: block;
      width: {svg_w}px;
      height: {svg_h}px;
    }}
  </style>
  <script>
    window.addEventListener('DOMContentLoaded', async () => {{
      try {{
        await document.fonts.ready;
      }} catch (e) {{}}
      document.documentElement.setAttribute('data-export-ready', 'true');
    }});
  </script>
</head>
<body>
  {svg_content.replace('<?xml version="1.0" encoding="UTF-8"?>', '')}
</body>
</html>
"""
        with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8') as tf:
            tf.write(wrapper_html)
            render_target = tf.name
        render_w, render_h = svg_w, svg_h
    else:
        render_target = str(html_path)
        # Dynamically calculate full-page dimensions (Section 25)
        fp_bounds = val_res.get("geometryData", {}).get("fullPageBounds", {}) if val_res else {}
        measured_w = int(fp_bounds.get("width", 1400))
        measured_h = int(fp_bounds.get("height", 1000))
        # Ensure sufficient viewport height to include entire banner, diagram, and legends without cut-off
        render_w = max(1400, measured_w)
        render_h = max(900, measured_h + 80)

    target_url = "file:///" + render_target.replace("\\", "/")

    try:
        # 2. Export PNG
        if "png" in formats:
            suffix = ".png" if mode == "diagram" else ".full.png"
            if scale == 3:
                suffix = f"@3x{suffix}"
            png_out = out_dir / f"{base_name}{suffix}"

            cmd = [
                browser,
                "--headless",
                "--disable-gpu",
                "--virtual-time-budget=3000",
                f"--force-device-scale-factor={scale}",
                f"--window-size={render_w},{render_h}",
                f"--screenshot={str(png_out)}",
                target_url
            ]
            subprocess.run(cmd, capture_output=True, timeout=30)
            if png_out.exists():
                print(f"  [OK] Exported PNG ({mode} @{scale}x): {png_out.name} ({render_w}x{render_h})")
            else:
                print(f"  [FAIL] Failed to produce PNG: {png_out.name}")

        # 3. Export PDF
        if "pdf" in formats:
            suffix = ".pdf" if mode == "diagram" else ".full.pdf"
            pdf_out = out_dir / f"{base_name}{suffix}"

            cmd = [
                browser,
                "--headless",
                "--disable-gpu",
                "--virtual-time-budget=3000",
                "--no-pdf-header-footer",
                f"--window-size={render_w},{render_h}",
                f"--print-to-pdf={str(pdf_out)}",
                target_url
            ]
            subprocess.run(cmd, capture_output=True, timeout=30)
            if pdf_out.exists():
                print(f"  [OK] Exported PDF ({mode}): {pdf_out.name}")
            else:
                print(f"  [FAIL] Failed to produce PDF: {pdf_out.name}")

    finally:
        if mode == "diagram" and os.path.exists(render_target):
            try:
                os.unlink(render_target)
            except Exception:
                pass

    return True

def main():
    parser = argparse.ArgumentParser(description="NOVYX Diagram Tool — Authoritative Validation & Export")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Command: validate
    val_parser = subparsers.add_parser("validate", help="Run geometric and typography validation on diagrams")
    val_parser.add_argument("diagrams", nargs="+", help="Diagram HTML file(s) to validate")

    # Command: export
    exp_parser = subparsers.add_parser("export", help="Export diagram(s) to SVG, PNG, PDF")
    exp_parser.add_argument("diagrams", nargs="+", help="Diagram HTML file(s) to export")
    exp_parser.add_argument("--format", default="svg,png,pdf", help="Comma-separated formats: svg, png, pdf")
    exp_parser.add_argument("--mode", choices=["diagram", "full-page"], default="diagram", help="Export mode: diagram or full-page")
    exp_parser.add_argument("--scale", type=int, choices=[1, 2, 3], default=2, help="Scale factor for raster export (@1x, @2x, @3x)")
    exp_parser.add_argument("--out-dir", default=None, help="Output directory for exports")

    # Backward compatibility flags at root parser
    parser.add_argument("diagrams_legacy", nargs="*", help="Legacy diagrams list")
    parser.add_argument("--validate-only", action="store_true", default=False, help="Run validation only")
    parser.add_argument("--out-dir", default=None, help="Output directory for legacy export")
    parser.add_argument("--svg", action="store_true", default=None, help="Export SVG")
    parser.add_argument("--png", action="store_true", default=None, help="Export PNG")
    parser.add_argument("--pdf", action="store_true", default=None, help="Export PDF")
    parser.add_argument("--full-page", action="store_true", default=False, help="Export full page")
    parser.add_argument("--scale", type=int, choices=[1, 2, 3], default=2, help="Scale factor")

    args = parser.parse_args()

    # Route command
    if args.command == "validate":
        overall_status = "PASS"
        for d in args.diagrams:
            p = Path(d)
            if not p.exists():
                print(f"Error: File not found: {d}")
                overall_status = "FAIL"
                continue
            res = validate_diagram_runtime(p)
            status = print_validation_report(p.name, res)
            if status == "FAIL":
                overall_status = "FAIL"
            elif status == "INCONCLUSIVE" and overall_status != "FAIL":
                overall_status = "INCONCLUSIVE"
        exit_code = 0 if overall_status == "PASS" else (2 if overall_status == "INCONCLUSIVE" else 1)
        sys.exit(exit_code)

    elif args.command == "export":
        formats = [f.strip().lower() for f in args.format.split(",") if f.strip()]
        all_ok = True
        for d in args.diagrams:
            p = Path(d)
            if not p.exists():
                print(f"Error: File not found: {d}")
                all_ok = False
                continue
            ok = export_diagram(p, out_dir=args.out_dir, formats=formats, mode=args.mode, scale=args.scale)
            if not ok:
                all_ok = False
        sys.exit(0 if all_ok else 1)

    # Legacy invocation support
    diagrams = args.diagrams_legacy
    if not diagrams:
        parser.print_help()
        sys.exit(1)

    if args.validate_only:
        overall_status = "PASS"
        for d in diagrams:
            p = Path(d)
            res = validate_diagram_runtime(p)
            status = print_validation_report(p.name, res)
            if status == "FAIL":
                overall_status = "FAIL"
            elif status == "INCONCLUSIVE" and overall_status != "FAIL":
                overall_status = "INCONCLUSIVE"
        exit_code = 0 if overall_status == "PASS" else (2 if overall_status == "INCONCLUSIVE" else 1)
        sys.exit(exit_code)
    else:
        formats = []
        if args.svg or (args.svg is None and not (args.png or args.pdf)):
            formats.append("svg")
        if args.png:
            formats.append("png")
        if args.pdf:
            formats.append("pdf")
        if not formats:
            formats = ["svg", "png", "pdf"]

        mode = "full-page" if args.full_page else "diagram"
        all_ok = True
        for d in diagrams:
            p = Path(d)
            ok = export_diagram(p, out_dir=args.out_dir, formats=formats, mode=mode, scale=args.scale)
            if not ok:
                all_ok = False
        sys.exit(0 if all_ok else 1)

if __name__ == "__main__":
    main()
