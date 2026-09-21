import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 13 Wave 2: Backend Architecture Boundaries (Clean Architecture & Bounded Contexts)', () => {
  const apiSrcDir = path.resolve(__dirname, '../../apps/api/src');
  const modulesDir = path.resolve(apiSrcDir, 'modules');
  const coreDir = path.resolve(apiSrcDir, 'core');

  function getAllTsFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let result: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        result = result.concat(getAllTsFiles(fullPath));
      } else if (file.isFile() && file.name.endsWith('.ts')) {
        result.push(fullPath);
      }
    }
    return result;
  }

  it('verifies core/ and modules/ do NOT import Fastify', () => {
    const domainFiles = [...getAllTsFiles(coreDir), ...getAllTsFiles(modulesDir)];
    expect(domainFiles.length).toBeGreaterThan(0);

    for (const filePath of domainFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/from\s+['"]fastify['"]/);
      expect(content).not.toMatch(/from\s+['"]fastify-type-provider-zod['"]/);
    }
  });

  it('verifies core/ and modules/ do NOT import Drizzle ORM', () => {
    const domainFiles = [...getAllTsFiles(coreDir), ...getAllTsFiles(modulesDir)];

    for (const filePath of domainFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/from\s+['"]drizzle-orm/);
    }
  });

  it('verifies core/ and modules/ do NOT import PostgreSQL driver (pg)', () => {
    const domainFiles = [...getAllTsFiles(coreDir), ...getAllTsFiles(modulesDir)];

    for (const filePath of domainFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/from\s+['"]pg['"]/);
    }
  });

  it('verifies apps/api does NOT import @novyx/ui', () => {
    const allApiFiles = getAllTsFiles(apiSrcDir);

    for (const filePath of allApiFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/from\s+['"]@novyx\/ui/);
      expect(content).not.toMatch(/from\s+['"]\.\.\/packages\/ui/);
    }
  });

  it('verifies exactly 5 logical business bounded context modules exist', () => {
    const expectedModules = [
      'work-management',
      'tree-asset-registry',
      'policy-template-governance',
      'audit-compliance',
      'iam',
    ];

    const actualDirs = fs
      .readdirSync(modulesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    expect(actualDirs).toEqual(expectedModules.sort());
    expect(actualDirs).toHaveLength(5);

    // Negative check: No sixth bounded context
    expect(actualDirs).not.toContain('notifications');
    expect(actualDirs).not.toContain('offline');
    expect(actualDirs).not.toContain('storage');
  });

  it('verifies external/hermes-agent is NOT imported into API runtime', () => {
    const allApiFiles = getAllTsFiles(apiSrcDir);

    for (const filePath of allApiFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/hermes-agent/);
    }
  });
});
