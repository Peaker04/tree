import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('NOVYX mobile UI authority', () => {
  it('keeps one approved mobile visual authority', () => {
    const design = read('DESIGN.md');
    const screenContracts = read('.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md');
    const evidenceDocs = [
      '.design/DESIGN.md',
      '.design/SCREEN_CONTRACTS.md',
      '.design/UI_KIT_SPEC.md',
      '.design/UX_RULES.md',
      '.stitch/DESIGN.md',
    ].map(read);

    expect(design).toContain('Living Botanical Operational');
    expect(design).toContain('Design variance');
    expect(design).toContain('4/10');
    expect(design).toContain('Primary action');
    expect(design).toContain('16px');
    expect(design).toContain('at least `13px`');
    expect(design).not.toMatch(/Primary[^\n]*radius\.pill/i);
    expect(design).not.toMatch(/Metadata[^\n]*\|\s*`10px`/i);
    expect(design).not.toMatch(/Body[^\n]*\|\s*`12px`/i);
    expect(screenContracts).toContain('Status: approved');

    for (const evidence of evidenceDocs) {
      expect(evidence).toContain('non-authoritative evidence');
      expect(evidence).toContain('root `DESIGN.md`');
    }
  });

  it('requires the mobile UI research and evidence harness', () => {
    const agents = read('AGENTS.md');
    const mobileSkill = read('.agents/skills/mobile-ui-ux/SKILL.md');
    const mobileRules = read('docs/MOBILE_UI_RULES.md');
    const memory = read('.agents/memory/UI_UX_MEMORY.md');

    expect(agents).toContain('mobile-ui-ux');
    expect(agents.toLowerCase()).toContain('impeccable');
    expect(agents).toContain('test-audit');
    expect(mobileSkill).toContain('FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md');
    expect(mobileSkill).toContain('Research acceptance record');
    expect(mobileSkill.toLowerCase()).toContain('physical-device acceptance matrix');
    expect(mobileRules).toContain('Impeccable');
    expect(memory).toContain('accepted or rejected');
  });
});
