import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function findSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.expo' ||
        entry.name === 'coverage'
      ) {
        continue;
      }
      results.push(...findSourceFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext) && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function extractImportPaths(fileContent: string): string[] {
  const importPaths: string[] = [];
  // Match ES imports/exports: import ... from '...'; export ... from '...';
  const importExportRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  // Match dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  // Match require: require('...')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = importExportRegex.exec(fileContent)) !== null) {
    if (match[1]) importPaths.push(match[1]);
  }
  while ((match = dynamicImportRegex.exec(fileContent)) !== null) {
    if (match[1]) importPaths.push(match[1]);
  }
  while ((match = requireRegex.exec(fileContent)) !== null) {
    if (match[1]) importPaths.push(match[1]);
  }

  return importPaths;
}

describe('Wave 0 Architecture Boundaries (ADR 0001, ADR 0002, AGENTS.md)', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const packagesDir = path.join(repoRoot, 'packages');
  const appsDir = path.join(repoRoot, 'apps');
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'];

  it('Rule 1: Shared packages (packages/**) must NOT import from application workspaces (apps/**)', () => {
    const packageFiles = findSourceFiles(packagesDir, extensions);
    expect(packageFiles.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of packageFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImportPaths(content);

      for (const importPath of imports) {
        // Forbidden: relative imports escaping packages to apps, or direct workspace import of apps
        if (
          importPath.includes('/apps/') ||
          importPath.includes('\\apps\\') ||
          importPath.startsWith('apps/') ||
          importPath.startsWith('@novyx/mobile') ||
          importPath.startsWith('@novyx/admin-web')
        ) {
          violations.push({
            file: path.relative(repoRoot, file),
            importPath,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('Rule 2: Product runtime code (apps/** and packages/**) must NOT import from external/hermes-agent internals', () => {
    const productFiles = [...findSourceFiles(appsDir, extensions), ...findSourceFiles(packagesDir, extensions)];
    expect(productFiles.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of productFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImportPaths(content);

      for (const importPath of imports) {
        if (
          importPath.includes('external/hermes-agent') ||
          importPath.includes('external\\hermes-agent') ||
          importPath.includes('hermes-agent')
        ) {
          violations.push({
            file: path.relative(repoRoot, file),
            importPath,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('Rule 3: Shared contracts package (packages/contracts) must NOT depend on other packages or apps', () => {
    const contractsDir = path.join(packagesDir, 'contracts');
    const contractsFiles = findSourceFiles(contractsDir, extensions);
    expect(contractsFiles.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of contractsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImportPaths(content);

      for (const importPath of imports) {
        // Contracts package must not import other internal packages (@novyx/ui, @novyx/config) or apps
        if (
          importPath.startsWith('@novyx/') ||
          importPath.includes('/packages/') ||
          importPath.includes('\\packages\\')
        ) {
          violations.push({
            file: path.relative(repoRoot, file),
            importPath,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
