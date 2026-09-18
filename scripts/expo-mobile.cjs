const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const mobileRoot = path.join(repoRoot, 'apps', 'mobile');
const args = process.argv.slice(2);
const buildMirrorRoot =
  process.env.NOVYX_ANDROID_BUILD_ROOT || path.join(path.parse(repoRoot).root, 'novyx-tree-build');

if (args.length === 0) {
  console.error('Usage: node scripts/expo-mobile.cjs <expo-command> [...args]');
  process.exit(1);
}

function run(command, commandArgs, cwd, cleanup = () => {}) {
  configureAndroidEnvironment();

  try {
    const result = spawnSync(command, commandArgs, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    if (result.error) {
      console.error(result.error.message);
      process.exitCode = 1;
      return;
    }

    process.exitCode = result.status ?? 1;
  } finally {
    cleanup();
  }
}

function runAndExit(command, commandArgs, cwd) {
  configureAndroidEnvironment();

  const result = spawnSync(command, commandArgs, {
    cwd,
    env: process.env,
    shell: false,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function quoteCmd(value) {
  const text = String(value);
  return /^[A-Za-z0-9_./:=\\~-]+$/.test(text) ? text : `"${text.replace(/"/g, '""')}"`;
}

function runInWindowsCmd(cwd, commandArgs) {
  configureAndroidEnvironment();

  const command = ['cd', '/d', cwd, '&&', 'npx', 'expo', ...commandArgs.map(quoteCmd)].join(' ');
  const result = spawnSync('cmd.exe', ['/d', '/c', command], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function prependPath(entry) {
  if (!entry || !fs.existsSync(entry)) {
    return;
  }

  const currentPath = process.env.Path || process.env.PATH || '';
  const parts = currentPath.split(path.delimiter).filter(Boolean);
  const hasEntry = parts.some((part) => part.toLowerCase() === entry.toLowerCase());

  if (!hasEntry) {
    process.env.Path = [entry, ...parts].join(path.delimiter);
  }
}

function configureAndroidEnvironment() {
  loadRootDotEnv();

  if (process.platform !== 'win32') {
    return;
  }

  process.env.NODE_OPTIONS = appendNodeOption(process.env.NODE_OPTIONS, '--dns-result-order=ipv4first');

  const sdkCandidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    'D:\\androidsdk',
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  ].filter(Boolean);

  const sdkRoot = sdkCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'platform-tools', 'adb.exe')));

  if (sdkRoot) {
    process.env.ANDROID_HOME = sdkRoot;
    process.env.ANDROID_SDK_ROOT = sdkRoot;
    prependPath(path.join(sdkRoot, 'platform-tools'));
    prependPath(path.join(sdkRoot, 'emulator'));
  }

  const avdHome = process.env.ANDROID_AVD_HOME || 'D:\\androidavd';
  if (fs.existsSync(avdHome)) {
    process.env.ANDROID_AVD_HOME = avdHome;
  }

  const gradleHome = process.env.GRADLE_USER_HOME || 'D:\\gradle-cache';
  fs.mkdirSync(gradleHome, { recursive: true });
  process.env.GRADLE_USER_HOME = gradleHome;
}

function appendNodeOption(currentValue, option) {
  const parts = String(currentValue || '')
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.includes(option)) {
    parts.push(option);
  }

  return parts.join(' ');
}

function loadRootDotEnv() {
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match) {
        return;
      }

      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) {
        return;
      }

      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    });
}

function isAndroidNativeBuildCommand(commandArgs) {
  return commandArgs[0] === 'run:android';
}

function syncToBuildMirror() {
  if (process.platform !== 'win32') {
    return repoRoot;
  }

  if (!/^[\x20-\x7e]+$/.test(buildMirrorRoot) || /\s/.test(buildMirrorRoot)) {
    console.error(`Android build mirror must use an ASCII path without spaces: ${buildMirrorRoot}`);
    process.exit(1);
  }

  fs.mkdirSync(buildMirrorRoot, { recursive: true });

  console.log(`Syncing Android build mirror: ${buildMirrorRoot}`);
  const result = spawnSync(
    'robocopy.exe',
    [
      repoRoot,
      buildMirrorRoot,
      '/MIR',
      '/XD',
      '.git',
      '.expo',
      'node_modules',
      'dist',
      'build',
      '.gradle',
      '.cxx',
      '/XF',
      '*.tsbuildinfo',
      '/NFL',
      '/NDL',
      '/NJH',
      '/NJS',
      '/NP',
    ],
    {
      stdio: 'inherit',
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 16) >= 8) {
    console.error(`robocopy failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }

  return buildMirrorRoot;
}

function needsAsciiAlias(projectPath) {
  return process.platform === 'win32' && /[^\x20-\x7e]|\s/.test(projectPath);
}

function getWindowsShortPath(targetPath) {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      '$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFolder($env:SHORT_PATH_TARGET).ShortPath',
    ],
    {
      env: { ...process.env, SHORT_PATH_TARGET: targetPath },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  const shortPath = result.stdout.trim();
  return shortPath && fs.existsSync(shortPath) ? shortPath : null;
}

if (
  process.platform === 'win32' &&
  needsAsciiAlias(repoRoot) &&
  isAndroidNativeBuildCommand(args) &&
  process.env.NOVYX_IN_ANDROID_BUILD_MIRROR !== '1'
) {
  const mirrorRoot = syncToBuildMirror();
  const installResult = spawnSync('npm', ['install'], {
    cwd: mirrorRoot,
    env: process.env,
    shell: true,
    stdio: 'inherit',
  });

  if (installResult.error) {
    console.error(installResult.error.message);
    process.exit(1);
  }

  if (installResult.status !== 0) {
    process.exit(installResult.status ?? 1);
  }

  runAndExit(process.execPath, ['scripts/expo-mobile.cjs', ...args], mirrorRoot);
} else if (needsAsciiAlias(repoRoot)) {
  const shortMobileRoot = getWindowsShortPath(mobileRoot);

  if (!shortMobileRoot || needsAsciiAlias(shortMobileRoot)) {
    console.error(`Could not resolve an ASCII short path for ${mobileRoot}`);
    process.exit(1);
  }

  runInWindowsCmd(shortMobileRoot, args);
} else {
  run('npx', ['expo', ...args], mobileRoot);
}
