const fs = require('node:fs');
const path = require('node:path');

// 0. Patch Podfile post_install for disabling code signing on all pod targets
const podfilePath = path.resolve('apps/mobile/ios/Podfile');
if (fs.existsSync(podfilePath)) {
  let podfile = fs.readFileSync(podfilePath, 'utf8');
  if (!podfile.includes('EXPANDED_CODE_SIGN_IDENTITY')) {
    const postInstallBlock = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['EXPANDED_CODE_SIGN_IDENTITY'] = ""
        config.build_settings['CODE_SIGNING_REQUIRED'] = "NO"
        config.build_settings['CODE_SIGNING_ALLOWED'] = "NO"
        config.build_settings['ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOLS'] = "NO"
        config.build_settings['ENABLE_ON_DEMAND_RESOURCES'] = "NO"
      end
    end
`;
    if (podfile.includes('post_install do |installer|')) {
      podfile = podfile.replace(
        /post_install\s+do\s+\|installer\|/,
        `post_install do |installer|\n${postInstallBlock}`,
      );
    } else {
      podfile += `\npost_install do |installer|\n${postInstallBlock}\nend\n`;
    }
    fs.writeFileSync(podfilePath, podfile);
    console.log('Patched Podfile post_install for code signing');
  }
}

// 1. Patch Package.swift: Swift 6.0 compatibility and strip trailing commas
const pkgPath = path.resolve('node_modules/expo-modules-jsi/apple/Package.swift');
if (fs.existsSync(pkgPath)) {
  let pkg = fs.readFileSync(pkgPath, 'utf8');
  pkg = pkg.replace(/swift-tools-version:\s*6\.[0-9]+/g, 'swift-tools-version: 6.0');
  // Strip trailing commas before closing paren or bracket in Package.swift
  pkg = pkg.replace(/,\s*\)/g, ')');
  pkg = pkg.replace(/,\s*\]/g, ']');
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
  content = content.replace(/<R:\s*@unchecked\s+Sendable>/g, '<R: Sendable>');
  fs.writeFileSync(runtimePath, content);
  console.log('Patched JavaScriptRuntime.swift');
}

// 3. Patch Task+immediate.swift for Xcode 16 Task initializers
const taskImmediatePath = path.resolve(
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Extensions/Task+immediate.swift',
);
if (fs.existsSync(taskImmediatePath)) {
  let content = fs.readFileSync(taskImmediatePath, 'utf8');
  content = content.replace(
    /if #available[\s\S]*?return Task\(name: name, priority: \.high, operation: operation\)\s*\}/,
    'return Task(priority: .high, operation: operation)',
  );
  fs.writeFileSync(taskImmediatePath, content);
  console.log('Patched Task+immediate.swift');
}

// 4. Patch weak let -> weak var, and exact Sendable classes -> @unchecked Sendable
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

        // Revert any invalid @unchecked
        if (code.includes('@unchecked Sendable, Sendable')) {
          code = code.replace(/@unchecked Sendable,\s*Sendable/g, '@unchecked Sendable');
          modified = true;
        }
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

        // Exact class replacements to avoid redundant conformance
        if (
          /class\s+(HostFunctionContext|UnownedThisHostFunctionContext|HostObjectContext)\s*:\s*Sendable/.test(code)
        ) {
          code = code.replace(
            /class\s+(HostFunctionContext|UnownedThisHostFunctionContext|HostObjectContext)\s*:\s*Sendable/g,
            'class $1: @unchecked Sendable',
          );
          modified = true;
        }
        if (code.includes('class JavaScriptError: Error, Sendable')) {
          code = code.replace(
            'class JavaScriptError: Error, Sendable',
            'class JavaScriptError: Error, @unchecked Sendable',
          );
          modified = true;
        }
        if (code.includes('class JavaScriptValue: JavaScriptType')) {
          code = code.replace(
            'class JavaScriptValue: JavaScriptType',
            'class JavaScriptValue: @unchecked Sendable, JavaScriptType',
          );
          modified = true;
        }
        if (code.includes('class JavaScriptPropNameID: JavaScriptType')) {
          code = code.replace(
            'class JavaScriptPropNameID: JavaScriptType',
            'class JavaScriptPropNameID: @unchecked Sendable, JavaScriptType',
          );
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
