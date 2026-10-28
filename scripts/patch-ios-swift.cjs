const fs = require('node:fs');
const path = require('node:path');

// 1. Patch Package.swift
const pkgPath = path.resolve('node_modules/expo-modules-jsi/apple/Package.swift');
if (fs.existsSync(pkgPath)) {
  let pkg = fs.readFileSync(pkgPath, 'utf8');
  pkg = pkg.replace(/swift-tools-version:\s*6\.[0-9]+/g, 'swift-tools-version: 6.0');
  pkg = pkg.replace(/targets:\s*\["ExpoModulesJSI"\],/g, 'targets: ["ExpoModulesJSI"]');
  if (!pkg.includes('-strict-concurrency=minimal')) {
    pkg = pkg.replace(
      '.interoperabilityMode(.Cxx),',
      '.interoperabilityMode(.Cxx),\n        .unsafeFlags(["-Xfrontend", "-strict-concurrency=minimal"]),',
    );
  }
  fs.writeFileSync(pkgPath, pkg);
  console.log('Patched Package.swift');
}

// 2. Remove trailing comma in closure arguments in JavaScriptRuntime.swift
const runtimePath = path.resolve(
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift',
);
if (fs.existsSync(runtimePath)) {
  let content = fs.readFileSync(runtimePath, 'utf8');
  content = content.replace(
    '_ arguments: consuming JavaScriptValuesBuffer,',
    '_ arguments: consuming JavaScriptValuesBuffer',
  );
  // Revert any invalid <R: @unchecked Sendable> to <R: Sendable>
  content = content.replace(/<R:\s*@unchecked\s+Sendable>/g, '<R: Sendable>');
  fs.writeFileSync(runtimePath, content);
  console.log('Patched JavaScriptRuntime.swift');
}

// 3. Patch weak let -> weak var, and only class Sendable -> @unchecked Sendable
const dir = path.resolve('node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI');
if (fs.existsSync(dir)) {
  function patchDir(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) {
        patchDir(p);
      } else if (p.endsWith('.swift')) {
        let code = fs.readFileSync(p, 'utf8');
        let modified = false;

        // Revert invalid generic constraints and protocols
        if (code.includes('<R: @unchecked Sendable>')) {
          code = code.replace(/<R:\s*@unchecked\s+Sendable>/g, '<R: Sendable>');
          modified = true;
        }
        if (code.includes('protocol JavaScriptRepresentable: @unchecked Sendable')) {
          code = code.replace(
            'protocol JavaScriptRepresentable: @unchecked Sendable',
            'protocol JavaScriptRepresentable: Sendable',
          );
          modified = true;
        }
        if (code.includes('protocol JavaScriptType: @unchecked Sendable')) {
          code = code.replace('protocol JavaScriptType: @unchecked Sendable', 'protocol JavaScriptType: Sendable');
          modified = true;
        }

        // Apply weak let -> weak var
        if (code.includes('weak let')) {
          code = code.replace(/weak let/g, 'weak var');
          modified = true;
        }

        // Only classes can have @unchecked Sendable
        if (/class\s+([A-Za-z0-9_]+)[^{]*:\s*Sendable/.test(code)) {
          code = code.replace(/(class\s+[A-Za-z0-9_]+[^{]*):\s*Sendable/g, '$1: @unchecked Sendable');
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(p, code);
          console.log('Patched', p);
        }
      }
    }
  }
  patchDir(dir);
}
console.log('Swift iOS compatibility patch completed.');
