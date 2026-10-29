const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

// 0. Patch Podfile post_install for disabling code signing on all pod targets
const podfilePath = path.join(repoRoot, 'apps/mobile/ios/Podfile');
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

// 1-5. (Removed) — expo-modules-jsi >= 57.1.2 includes upstream Xcode 26 (Swift 6.2)
// compatibility (RuntimeScheduler::create static factories, Sendable closures, etc.).
// Legacy source mutations broke RuntimeScheduler.h in 57.1.3+.

// 6. Patch prebuilt .swiftinterface files & hook into Pod XCFramework switch scripts
function cleanSwiftInterfaceContent(content) {
  return (
    content
      // Xóa @_Concurrency.MainActor hoặc @MainActor đặt ở vị trí isolated protocol conformance (Swift 6.2/6.3)
      .replace(/(,|:)\s*@(_Concurrency\.)?MainActor\s+/g, '$1 ')
      // Xóa các cờ upcoming feature không tương thích nếu có
      .replace(/\/\/\s*swift-module-flags:.*$/gm, (line) => line.replace(/-enable-upcoming-feature\s+\S+/g, ''))
  );
}

function patchSwiftInterfaces(rootDir) {
  if (!fs.existsSync(rootDir)) return;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      patchSwiftInterfaces(fullPath);
    } else if (entry.name.endsWith('.swiftinterface')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const updated = cleanSwiftInterfaceContent(content);
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Patched swiftinterface:', fullPath);
      }
    } else if (entry.name.endsWith('.swiftmodule') && fullPath.includes('.xcframework')) {
      // Chỉ xóa file binary .swiftmodule (không xóa thư mục .swiftmodule)
      fs.rmSync(fullPath, { force: true });
      console.log('Removed binary swiftmodule:', fullPath);
    }
  }
}

// 6a. Quét và patch toàn bộ .swiftinterface hiện có trong node_modules và Pods
patchSwiftInterfaces(path.join(repoRoot, 'node_modules'));
patchSwiftInterfaces(path.join(repoRoot, 'apps/mobile/ios/Pods'));

// 6b. (Removed) — With matching Xcode/Swift toolchain, runtime
// injection into Pod scripts is no longer needed.

console.log('Swift iOS compatibility patch completed.');
