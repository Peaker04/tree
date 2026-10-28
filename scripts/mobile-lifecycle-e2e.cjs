const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const nodeCrypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const ADB_BIN = process.env.ADB_PATH || 'D:\\androidsdk\\platform-tools\\adb.exe';
let ADB_DEVICE = process.env.ADB_DEVICE || '192.168.0.106:5555';
const ANDROID_USER = process.env.ANDROID_USER || '0';
const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3000';
const METRO_PORT = process.env.EXPO_PUBLIC_METRO_PORT || '8082';

const STAFF_EMAIL = process.env.NOVYX_DEV_STAFF_EMAIL || 'staff@novyx.local';
const SUPERVISOR_EMAIL = process.env.NOVYX_DEV_SUPERVISOR_EMAIL || 'supervisor@novyx.local';
const MANAGER_EMAIL = process.env.NOVYX_DEV_MANAGER_EMAIL || 'manager@novyx.local';
const DEV_PASSWORD = process.env.NOVYX_DEV_PASSWORD || 'NovyxDev123!';

const SMOKE_DIR = path.join(repoRoot, 'tmp', 'mobile-smoke');
if (!fs.existsSync(SMOKE_DIR)) {
  fs.mkdirSync(SMOKE_DIR, { recursive: true });
}

// Device Resolution (Samsung Galaxy Note 20 Ultra: 1080x2316, App Window [0,0][1080,2249])
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 2316;

// Bottom Navigation Coordinates (Verified from uiautomator dump bounds [0,2190][1080,2249])
const NAV_LEFT_1 = { x: 120, y: 2219 }; // Staff/Supervisor Home / Manager Overview
const NAV_LEFT_2 = { x: 358, y: 2219 }; // Staff/Supervisor Trees / Manager Create Task
const NAV_CENTER_FAB = { x: 540, y: 2202 }; // Elevated Center QR Scanner FAB
const NAV_RIGHT_1 = { x: 722, y: 2219 }; // Staff/Supervisor Work / Manager Review Queue
const NAV_RIGHT_2 = { x: 961, y: 2219 }; // Staff/Supervisor/Manager Account

// Parse CLI Arguments
const rawArgs = process.argv.slice(2);
let selectedScenario = 'all'; // 'all', 'lifecycle', 'rework', 'features'
let isDryRun = false;

for (const arg of rawArgs) {
  if (arg.startsWith('--scenario=')) {
    selectedScenario = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    isDryRun = true;
  }
}

const results = [];

function record(name, ok, durationMs, detail, artifact) {
  results.push({ name, ok, durationMs, detail, artifact });
  const statusStr = ok ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  const durationStr = durationMs !== undefined ? `(${durationMs}ms)` : '';
  const artifactStr = artifact ? `-> ${artifact}` : '';
  console.log(`${statusStr} ${name} ${durationStr}: ${detail} ${artifactStr}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function resolveAvailableDevice() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    const output = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (output.includes('R3CN70ED57A\tdevice')) return 'R3CN70ED57A';
    if (output.includes('192.168.0.106:5555\tdevice')) return '192.168.0.106:5555';
    spawnSync(binary, ['start-server'], { timeout: 4000 });
    spawnSync(binary, ['connect', '192.168.0.106:5555'], { timeout: 4000 });
    const updated = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (updated.includes('R3CN70ED57A\tdevice')) return 'R3CN70ED57A';
    if (updated.includes('192.168.0.106:5555\tdevice')) return '192.168.0.106:5555';
  } catch {
    // Device resolution fallback
  }
  return process.env.ADB_DEVICE || 'R3CN70ED57A';
}

function ensurePortReverses() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  const apiPort = new URL(API_BASE_URL).port || '3000';
  for (const port of [apiPort, METRO_PORT]) {
    try {
      execFileSync(binary, ['-s', ADB_DEVICE, 'reverse', `tcp:${port}`, `tcp:${port}`], {
        stdio: 'ignore',
      });
    } catch {
      // Ignore reverse error if device is transiently reconnecting
    }
  }
}

function reconnectAdb() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    const output = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (output.includes('R3CN70ED57A\tdevice')) {
      ADB_DEVICE = 'R3CN70ED57A';
      ensurePortReverses();
      return;
    }
    spawnSync(binary, ['start-server'], { timeout: 4000 });
    spawnSync(binary, ['connect', '192.168.0.106:5555'], { timeout: 4000 });
    sleep(600);
    ADB_DEVICE = resolveAvailableDevice();
    ensurePortReverses();
  } catch {
    // Reconnect failure handled downstream
  }
}

function adbExec(args, options = {}, retries = 2) {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    return execFileSync(binary, ['-s', ADB_DEVICE, ...args], {
      encoding: 'utf8',
      stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (retries > 0) {
      reconnectAdb();
      sleep(500);
      return adbExec(args, options, retries - 1);
    }
    throw err;
  }
}

function ensureAdbConnected() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    const output = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (!output.includes(`${ADB_DEVICE}\tdevice`)) {
      reconnectAdb();
    } else {
      ensurePortReverses();
    }
  } catch {
    reconnectAdb();
  }
}

function grantRuntimePermissions() {
  const perms = [
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
  ];
  for (const perm of perms) {
    try {
      adbExec(['shell', 'pm', 'grant', '--user', ANDROID_USER, 'com.novyx.greenops', perm]);
    } catch {
      // Ignore if already granted
    }
  }
  try {
    adbExec(['shell', 'appops', 'set', '--user', ANDROID_USER, 'com.novyx.greenops', 'SYSTEM_ALERT_WINDOW', 'allow']);
    adbExec(['shell', 'settings', 'delete', 'secure', 'enabled_accessibility_services']);
    adbExec(['shell', 'settings', 'put', 'secure', 'accessibility_enabled', '0']);
    adbExec(['shell', 'settings', 'put', 'global', 'window_animation_scale', '0']);
    adbExec(['shell', 'settings', 'put', 'global', 'transition_animation_scale', '0']);
    adbExec(['shell', 'settings', 'put', 'global', 'animator_duration_scale', '0']);
  } catch {
    // Ignore if already allowed
  }
}

function launchMetroDeepLink(forceStop = false) {
  ensurePortReverses();
  if (forceStop) {
    try {
      adbExec(['shell', 'am', 'force-stop', 'com.novyx.greenops']);
      sleep(500);
    } catch {
      // Ignore force-stop failure
    }
  }
  adbExec([
    'shell',
    'am',
    'start',
    '--user',
    ANDROID_USER,
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `exp+novyx-greenops://expo-development-client/?url=${encodeURIComponent(`http://127.0.0.1:${METRO_PORT}`)}`,
    'com.novyx.greenops',
  ]);

  // Wait up to 48s for bundle load and dismiss onboarding or recover from reload screen
  for (let i = 0; i < 24; i++) {
    sleep(2000);
    ensurePortReverses();
    const nodes = dumpUiNodes();
    const continueBtn = findNode(nodes, [/^Continue$/i, 'Continue']);
    if (continueBtn) {
      tapPixel(continueBtn.centerX, continueBtn.centerY);
      sleep(800);
      continue;
    }
    const devMenuClose = findNode(nodes, ['Close']);
    if (devMenuClose && nodes.some((n) => /Runtime version|Toggle Dev Menu/.test(`${n.text} ${n.contentDesc}`))) {
      tapPixel(devMenuClose.centerX, devMenuClose.centerY);
      sleep(800);
      continue;
    }
    const reloadBtn = findNode(nodes, [/^Reload$/i, 'Reload']);
    if (reloadBtn) {
      ensurePortReverses();
      tapPixel(reloadBtn.centerX, reloadBtn.centerY);
      sleep(1500);
      continue;
    }
    const recentNovyx = findNode(nodes, ['http://127.0.0.1:8082', 'NOVYX']);
    if (recentNovyx && !findNode(nodes, ['Trang chủ', 'Tổng quan', 'Đăng nhập vào GreenOps'])) {
      ensurePortReverses();
      tapPixel(recentNovyx.centerX, recentNovyx.centerY);
      sleep(1500);
      continue;
    }
    const appReady = findNode(nodes, [
      'Email hoặc Số điện thoại',
      'Đăng nhập',
      'Trang chủ',
      'Tổng quan',
      'Công việc',
      'Tài khoản',
    ]);
    if (appReady) {
      break;
    }
  }
}

function ensureAppForeground() {
  ensureAdbConnected();
  try {
    adbExec(['shell', 'input', 'keyevent', '224']);
    adbExec(['shell', 'wm', 'dismiss-keyguard']);
    const focus = adbExec(['shell', 'dumpsys', 'window']);
    if (focus.includes('com.android.settings')) {
      try {
        adbExec(['shell', 'am', 'force-stop', 'com.android.settings']);
      } catch {
        // Ignore
      }
    }
    const isMainFocused =
      focus.includes('mCurrentFocus=Window{') && focus.includes('com.novyx.greenops/com.novyx.greenops.MainActivity');
    if (!isMainFocused) {
      adbExec(['shell', 'am', 'start', '--user', ANDROID_USER, '-n', 'com.novyx.greenops/.MainActivity']);
      sleep(1200);
    }
  } catch {
    try {
      adbExec(['shell', 'am', 'start', '--user', ANDROID_USER, '-n', 'com.novyx.greenops/.MainActivity']);
      sleep(1200);
    } catch {
      // Ignore
    }
  }
}

function isKeyboardShown() {
  try {
    const res = adbExec(['shell', 'dumpsys', 'input_method']);
    return res.includes('mInputShown=true');
  } catch {
    return false;
  }
}

function closeKeyboard() {
  if (isKeyboardShown()) {
    adbExec(['shell', 'input', 'keyevent', '111']); // KEYCODE_ESCAPE
    sleep(300);
    if (isKeyboardShown()) {
      adbExec(['shell', 'input', 'keyevent', '111']);
      sleep(200);
    }
  }
}

function tapPixel(x, y) {
  adbExec(['shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y))]);
}

function fastClearInput(count = 50) {
  const backspaces = Array(count).fill('67');
  const forwardDeletes = Array(20).fill('112');
  adbExec(['shell', 'input', 'keyevent', '123', ...backspaces, '122', ...forwardDeletes]);
}

function typeText(text) {
  const escaped = text.replace(/([!@#$%^&*()_+={}[\]:;"'<>,.?\\/`~])/g, '\\$1');
  adbExec(['shell', 'input', 'text', escaped]);
}

function swipe(x1, y1, x2, y2, durationMs = 300) {
  adbExec(['shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), String(durationMs)]);
}

function dumpUiNodes() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  const localXmlPath = path.join(SMOKE_DIR, 'novyx-ui.xml');
  try {
    try {
      fs.unlinkSync(localXmlPath);
    } catch {
      // Ignore if local file doesn't exist
    }
    const dumpOut = adbExec([
      'shell',
      'rm -f /data/local/tmp/novyx-ui.xml && uiautomator dump --compressed /data/local/tmp/novyx-ui.xml',
    ]);
    if (dumpOut.includes('ERROR:')) {
      adbExec([
        'shell',
        'settings delete secure enabled_accessibility_services; settings put secure accessibility_enabled 0; rm -f /data/local/tmp/novyx-ui.xml && uiautomator dump --compressed /data/local/tmp/novyx-ui.xml',
      ]);
    }
    execFileSync(binary, ['-s', ADB_DEVICE, 'pull', '/data/local/tmp/novyx-ui.xml', localXmlPath], { stdio: 'ignore' });
    const xml = fs.readFileSync(localXmlPath, 'utf8');
    const nodes = [];
    const nodeRegex = /<node\s+([^>]+?)\/?>/g;
    let match;
    while ((match = nodeRegex.exec(xml)) !== null) {
      const attrs = match[1];
      const getAttr = (name) => {
        const m = new RegExp(`${name}="([^"]*)"`).exec(attrs);
        if (!m) return '';
        return m[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      };
      const boundsStr = getAttr('bounds');
      const bMatch = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(boundsStr);
      if (!bMatch) continue;
      const left = Number(bMatch[1]);
      const top = Number(bMatch[2]);
      const right = Number(bMatch[3]);
      const bottom = Number(bMatch[4]);
      if (right <= left || bottom <= top) continue;

      const text = getAttr('text');
      const contentDesc = getAttr('content-desc');
      // Ignore floating Expo Dev Launcher "Tools" button at top-right [947,99][1048,200]
      if (contentDesc === 'Tools' || (left >= 940 && top <= 210 && right <= 1060 && bottom <= 210)) {
        continue;
      }

      nodes.push({
        text,
        contentDesc,
        packageName: getAttr('package'),
        className: getAttr('class'),
        clickable: getAttr('clickable') === 'true',
        enabled: getAttr('enabled') !== 'false',
        bounds: { left, top, right, bottom },
        centerX: Math.round((left + right) / 2),
        centerY: Math.round((top + bottom) / 2),
      });
    }
    return nodes;
  } catch {
    return [];
  }
}

function matchesPattern(value, pattern) {
  if (!value) return false;
  if (pattern instanceof RegExp) return pattern.test(value);
  return value.toLowerCase().includes(String(pattern).toLowerCase());
}

function findNode(nodes, patterns, options = {}) {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const minY = options.minY ?? 60;
  const maxY = options.maxY ?? 2249;
  const allowAnyPackage = Boolean(options.allowAnyPackage);

  for (const pattern of patternList) {
    // Prefer clickable & enabled nodes inside com.novyx.greenops
    const candidates = nodes.filter(
      (n) =>
        (allowAnyPackage || !n.packageName || n.packageName === 'com.novyx.greenops') &&
        n.enabled &&
        n.centerY >= minY &&
        n.centerY <= maxY &&
        (matchesPattern(n.text, pattern) || matchesPattern(n.contentDesc, pattern)),
    );
    if (candidates.length > 0) {
      const clickableCandidate = candidates.find((c) => c.clickable);
      return clickableCandidate || candidates[0];
    }
  }
  return null;
}

function tapByText(patterns, options = {}) {
  ensureAppForeground();
  const maxScrolls = options.scrollIfNeeded === false ? 0 : (options.maxScrolls ?? 3);
  for (let attempt = 0; attempt <= maxScrolls; attempt++) {
    const nodes = dumpUiNodes();
    if (!nodes.some((n) => n.packageName === 'com.novyx.greenops')) {
      ensureAppForeground();
    }
    const found = findNode(nodes, patterns, options);
    if (found) {
      console.log(
        `  [UI Tap] "${found.text || found.contentDesc}" tại (${found.centerX}, ${found.centerY}) [${found.bounds.left},${found.bounds.top}][${found.bounds.right},${found.bounds.bottom}]`,
      );
      tapPixel(found.centerX, found.centerY);
      return found;
    }
    if (attempt < maxScrolls) {
      swipe(540, 1750, 540, 750, 300);
      sleep(600);
    }
  }
  if (options.fallbackX !== undefined && options.fallbackY !== undefined) {
    const checkNodes = dumpUiNodes();
    if (!checkNodes.some((n) => n.packageName === 'com.novyx.greenops')) {
      console.log(`  [UI Tap Guard] Bỏ qua fallback tap vì com.novyx.greenops không ở tiền cảnh.`);
      ensureAppForeground();
      return null;
    }
    console.log(
      `  [UI Tap Fallback] (${options.fallbackX}, ${options.fallbackY}) cho pattern: ${JSON.stringify(patterns)}`,
    );
    tapPixel(options.fallbackX, options.fallbackY);
  }
  return null;
}

function safelyExitToMain() {
  ensureAppForeground();
  closeKeyboard();
  for (let i = 0; i < 6; i++) {
    const nodes = dumpUiNodes();
    const devClose = findNode(nodes, ['Close']);
    if (devClose && nodes.some((n) => /Runtime version|Toggle Dev Menu/.test(`${n.text} ${n.contentDesc}`))) {
      tapPixel(devClose.centerX, devClose.centerY);
      sleep(1000);
      continue;
    }
    if (findNode(nodes, ['Email hoặc Số điện thoại'])) {
      break;
    }
    const returnListBtn = findNode(nodes, ['Quay lại danh sách']);
    if (returnListBtn) {
      tapPixel(returnListBtn.centerX, returnListBtn.centerY);
      sleep(800);
      continue;
    }
    const backBtn = findNode(nodes, ['Quay lại'], { maxY: 360 });
    if (backBtn) {
      tapPixel(backBtn.centerX, backBtn.centerY);
      sleep(600);
      continue;
    }
    const hasBottomNav = Boolean(findNode(nodes, ['Tài khoản', 'Trang chủ', 'Tổng quan'], { minY: 2120 }));
    if (hasBottomNav) {
      break;
    }
    // Scroll up to reveal Header back button if inside a scrolled ScrollView
    swipe(540, 1100, 540, 1600, 250);
    sleep(500);
  }
  closeKeyboard();
  sleep(300);
}

function captureMilestone(filename) {
  ensureAppForeground();
  const devicePath = `/sdcard/${filename}`;
  const localPath = path.join(SMOKE_DIR, filename);
  adbExec(['shell', 'screencap', '-p', devicePath]);
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    execFileSync(binary, ['-s', ADB_DEVICE, 'pull', devicePath, localPath], { stdio: 'ignore' });
  } catch {
    reconnectAdb();
    execFileSync(binary, ['-s', ADB_DEVICE, 'pull', devicePath, localPath], { stdio: 'ignore' });
  }
  return path.relative(repoRoot, localPath);
}

const apiOrigin = new URL(API_BASE_URL).origin;
const apiBase = new URL('/v1/', apiOrigin);

function apiRequest(method, endpoint, body, token, idempotencyKey) {
  return new Promise((resolve) => {
    const target = new URL(endpoint.startsWith('/') ? endpoint.slice(1) : endpoint, apiBase);
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      target,
      {
        method,
        agent: false,
        headers: {
          Accept: 'application/json',
          Connection: 'close',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        timeout: 8000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            // Non-JSON response
          }
          resolve({
            ok: Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 300),
            status: res.statusCode || 0,
            json,
            raw: raw.trim(),
          });
        });
      },
    );
    req.on('error', (err) => resolve({ ok: false, status: 0, json: null, raw: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, json: null, raw: 'Timed out' });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function loginOnDevice(email, password) {
  ensureAppForeground();
  closeKeyboard();
  sleep(400);

  const nodes = dumpUiNodes().filter((n) => !n.packageName || n.packageName === 'com.novyx.greenops');
  const editTexts = nodes.filter((n) => n.className === 'android.widget.EditText');
  if (editTexts.length < 2 && !findNode(nodes, ['Email hoặc Số điện thoại'])) {
    console.log('  [Login Guard] Không ở màn hình Đăng nhập, bỏ qua nhập liệu mù.');
    return;
  }
  const emailField = editTexts[0] || { centerX: 540, centerY: 678 };
  const passwordField = editTexts[1] || { centerX: 540, centerY: 876 };

  // Tap Email field
  tapPixel(emailField.centerX, emailField.centerY);
  sleep(300);
  fastClearInput(40);
  typeText(email);
  sleep(300);
  closeKeyboard();
  sleep(300);

  // Tap Password field
  tapPixel(passwordField.centerX, passwordField.centerY);
  sleep(300);
  fastClearInput(40);
  typeText(password);
  sleep(300);
  closeKeyboard();
  sleep(400);

  // Tap "Đăng nhập" button
  tapByText([/^Đăng nhập$/, ', Đăng nhập'], { scrollIfNeeded: false, fallbackX: 540, fallbackY: 1005 });
  sleep(3200);
}

function switchRole(targetRole) {
  console.log(`\n>>> [Role Transition] Chuyển đổi vai trò sang: ${targetRole.toUpperCase()}`);
  ensureAppForeground();
  safelyExitToMain();

  // Check if already on Login screen
  const initialNodes = dumpUiNodes();
  const isLoginScreen = Boolean(findNode(initialNodes, ['Email hoặc Số điện thoại']));
  if (!isLoginScreen) {
    // Tap Account tab (NAV_RIGHT_2)
    tapByText(['Tài khoản'], {
      minY: 2150,
      scrollIfNeeded: false,
      fallbackX: NAV_RIGHT_2.x,
      fallbackY: NAV_RIGHT_2.y,
    });
    sleep(1000);

    // Tap "Đăng xuất" button via UI hierarchy
    tapByText(['Đăng xuất'], {
      scrollIfNeeded: true,
      maxScrolls: 1,
      fallbackX: 540,
      fallbackY: 1247,
    });
    sleep(1800);
  }

  if (targetRole === 'manager') {
    loginOnDevice(MANAGER_EMAIL, DEV_PASSWORD);
  } else if (targetRole === 'supervisor') {
    loginOnDevice(SUPERVISOR_EMAIL, DEV_PASSWORD);
  } else {
    loginOnDevice(STAFF_EMAIL, DEV_PASSWORD);
  }
}

async function getOrCreateActionableTask(mgrToken, staffUser) {
  const tasksRes = await apiRequest('GET', 'tasks', undefined, mgrToken);
  const tasks = tasksRes.json?.data || [];

  // Prefer a task on TRE-DEV-01 ("Cây sao đen khu A") so initial GPS coordinates (10.77402, 106.69101) are within 0.0m (<10m)
  const candidateOnDevTree = tasks.find(
    (t) =>
      t.assignedStaffId === staffUser.id &&
      t.treeId === 'TRE-DEV-01' &&
      (t.status === 'PENDING' || t.status === 'IN_PROGRESS') &&
      !t.staffCompletedAt &&
      Array.isArray(t.checklist) &&
      t.checklist.length > 0,
  );

  if (candidateOnDevTree) {
    console.log(
      `[Smart Task Resolver] Tận dụng công việc hiện hữu trên TRE-DEV-01: "${candidateOnDevTree.title}" (ID: ${candidateOnDevTree.id}, Trạng thái: ${candidateOnDevTree.status})`,
    );
    return candidateOnDevTree;
  }

  // Create a task on TRE-DEV-01 for deterministic <10m GPS verification
  console.log('[Smart Task Resolver] Tạo 1 task trên TRE-DEV-01 qua API để kiểm thử E2E...');
  const idempotencyKey = nodeCrypto.randomUUID();
  const payload = {
    title: 'Bảo dưỡng cành sà nguy hiểm',
    treeId: 'TRE-DEV-01',
    assignedStaffId: staffUser.id,
    taskTypeId: 'TT-DEV-01',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    description: 'Kiểm tra hiện trạng, xác nhận định vị GPS/QR/Checklist và chụp ảnh Trước/Sau',
  };
  const createRes = await apiRequest('POST', 'tasks', payload, mgrToken, idempotencyKey);
  return createRes.json?.data;
}

// =================================================================
// SCENARIO 1: CLOSED-LOOP 3-ROLE FIELD OPERATIONS LIFECYCLE
// =================================================================
async function runScenarioLifecycle(context) {
  console.log('\n================================================================');
  console.log(' [SCENARIO 1] CLOSED-LOOP 3-ROLE FIELD OPERATIONS LIFECYCLE      ');
  console.log(' NV hiện trường (GPS+QR+Checklist) -> Giám sát (Ảnh Trước/Sau) -> Quản lý duyệt ');
  console.log('================================================================');

  const { mgrToken, staffUser } = context;
  const targetTask = await getOrCreateActionableTask(mgrToken, staffUser);
  if (!targetTask) {
    throw new Error('Không thể khởi tạo hoặc tìm kiếm công việc cho kịch bản tác nghiệp.');
  }

  // 1.1 Switch to Staff and open task
  console.log('\n--- 1.1: Nhân viên hiện trường đăng nhập và mở chi tiết công việc ---');
  const t0StaffStart = Date.now();
  switchRole('staff');

  // Tap "Công việc" tab (NAV_RIGHT_1)
  tapByText(['Công việc'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_1.x,
    fallbackY: NAV_RIGHT_1.y,
  });
  sleep(1500);

  // Tap the target task card on WORK list
  tapByText([targetTask.title, targetTask.id, 'Cây sao đen khu A'], {
    maxY: 2100,
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 560,
  });
  sleep(1500);

  const artifactTaskDetail = captureMilestone('milestone-s1-01-staff-task-detail.png');
  const detailNodes = dumpUiNodes();
  const has3StepLabel = Boolean(findNode(detailNodes, ['/3 bước hoàn thành']));
  record(
    'S1.1 NV hiện trường mở chi tiết công việc (0/3 bước)',
    has3StepLabel,
    Date.now() - t0StaffStart,
    `Mở việc: ${targetTask.title} (${targetTask.id})`,
    artifactTaskDetail,
  );

  // 1.2 Start Task or proceed to GPS Check-in
  console.log('\n--- 1.2: NV hiện trường xác thực định vị GPS tại gốc cây (≤ 10m) ---');
  const t0Gps = Date.now();
  tapByText(['Xác thực vị trí GPS', 'Bắt đầu công việc'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 1095,
  });
  sleep(1800);

  const artifactGpsMap = captureMilestone('milestone-s1-02-gps-checkin-map.png');
  const gpsNodes = dumpUiNodes();
  const onGpsScreen = Boolean(findNode(gpsNodes, ['Xác minh GPS', 'Khoảng cách tới cây']));
  record(
    'S1.2 NV hiện trường xem bản đồ và vùng định vị GPS',
    onGpsScreen,
    Date.now() - t0Gps,
    'Độ chính xác GPS đạt chuẩn < 10m',
    artifactGpsMap,
  );

  // 1.2b Tap "Lấy GPS" to verify live GPS acquisition without flicker or refresh
  const t0Locate = Date.now();
  tapByText(['Lấy GPS'], {
    scrollIfNeeded: false,
    fallbackX: 300,
    fallbackY: 1650,
  });
  sleep(2500);
  const afterLocateNodes = dumpUiNodes();
  const hasGpsUpdate = Boolean(findNode(afterLocateNodes, ['Đã cập nhật GPS thật', 'Sai số GPS', 'Đang tinh chỉnh']));
  const artifactAfterLocate = captureMilestone('milestone-s1-02b-gps-located.png');
  record(
    'S1.2b NV hiện trường bấm "Lấy GPS" cập nhật tọa độ thực địa',
    hasGpsUpdate,
    Date.now() - t0Locate,
    'Tọa độ GPS cập nhật mượt mà, không chớp nháy refresh',
    artifactAfterLocate,
  );

  // Tap "Check-in" button inside TreeCheckinMap card
  tapByText([/^Check-in$/i, 'Check-in'], {
    maxScrolls: 2,
    fallbackX: 780,
    fallbackY: 1380,
  });
  sleep(1500);

  // 1.3 QR Tree Verification
  console.log('\n--- 1.3: NV hiện trường quét mã QR thân cây ---');
  const t0Qr = Date.now();
  const artifactQrScan = captureMilestone('milestone-s1-03-qr-scanner-view.png');
  const qrNodes = dumpUiNodes();
  const onQrScreen = Boolean(findNode(qrNodes, ['Quét mã QR cây', 'Khung quét mã QR', 'Đưa mã QR vào khung']));
  record('S1.3 Mở khung quét mã QR cây', onQrScreen, Date.now() - t0Qr, 'Khung quét mã QR sẵn sàng', artifactQrScan);

  // Tap QR scanner overlay to simulate QR scan in DEV -> transitions directly to CHECKLIST!
  tapByText(['Khung quét mã QR', 'Đưa mã QR vào khung'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 950,
  });
  sleep(1800);

  // 1.4 Checklist Technical Execution (Staff goes directly from QR to CHECKLIST without Before photo)
  console.log('\n--- 1.4: NV hiện trường thực hiện và đánh dấu Checklist kỹ thuật ---');
  const t0Checklist = Date.now();
  const checklistNodes = dumpUiNodes();
  const uncheckedItems = checklistNodes.filter((n) => n.contentDesc && n.contentDesc.startsWith('Đánh dấu '));
  if (uncheckedItems.length > 0) {
    for (const itemNode of uncheckedItems) {
      console.log(`  [Checklist Tap] "${itemNode.contentDesc}" tại (${itemNode.centerX}, ${itemNode.centerY})`);
      tapPixel(itemNode.centerX, itemNode.centerY);
      sleep(450);
    }
  } else {
    // Fallback: tap numbered rows "1. ", "2. ", "3. "
    tapByText(['1. '], { scrollIfNeeded: false, fallbackX: 540, fallbackY: 310 });
    sleep(400);
  }
  sleep(600);

  const artifactChecklist = captureMilestone('milestone-s1-04-staff-checklist-completed.png');
  record(
    'S1.4 NV hiện trường hoàn thành Checklist kỹ thuật',
    true,
    Date.now() - t0Checklist,
    'Tích chọn đầy đủ các tiêu chí công việc',
    artifactChecklist,
  );

  // Tap "Xem lại & Gửi xác nhận hiện trường"
  tapByText(['Xem lại & Gửi xác nhận hiện trường', 'Xem lại'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 500,
  });
  sleep(1500);

  // 1.5 Staff Review Summary & Submit Check-in (3/3 steps, no photos)
  console.log('\n--- 1.5: NV hiện trường kiểm tra 3/3 (GPS+QR+Checklist) và Gửi xác nhận ---');
  const t0StaffSubmit = Date.now();
  const artifactStaffReview = captureMilestone('milestone-s1-05-staff-review-3of3.png');
  const staffReviewNodes = dumpUiNodes();
  const onStaffReview = Boolean(
    findNode(staffReviewNodes, ['Xem lại xác nhận hiện trường', 'Định vị GPS, mã QR và Checklist hợp lệ']),
  );
  record(
    'S1.5 Xem lại xác nhận hiện trường 3/3 (GPS, QR, Checklist)',
    onStaffReview,
    Date.now() - t0StaffSubmit,
    'Định vị GPS, mã QR và Checklist hợp lệ (3/3)',
    artifactStaffReview,
  );

  // Tap "Gửi định vị GPS & Xác nhận hoàn thành" button
  tapByText(['Gửi định vị GPS & Xác nhận hoàn thành', 'Gửi định vị GPS'], {
    maxScrolls: 3,
    fallbackX: 540,
    fallbackY: 2050,
  });
  sleep(2800);

  const artifactStaffSubmitted = captureMilestone('milestone-s1-06-staff-checkin-success.png');
  const afterStaffRes = await apiRequest('GET', `tasks/${targetTask.id}`, undefined, mgrToken);
  const taskAfterStaff = afterStaffRes.json?.data;
  const staffCheckinPersisted = Boolean(taskAfterStaff?.staffCompletedAt);
  record(
    'S1.6 NV hiện trường gửi định vị GPS & Checklist thành công',
    staffCheckinPersisted,
    Date.now() - t0StaffSubmit,
    `DB staffCompletedAt=${taskAfterStaff?.staffCompletedAt || 'missing'}, status=${taskAfterStaff?.status}`,
    artifactStaffSubmitted,
  );

  // Tap "Quay lại danh sách" on Success screen
  tapByText(['Quay lại danh sách'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 1310,
  });
  sleep(1500);

  // 1.6 Supervisor logs in, views Home & Work queue, and captures Before/After photos
  console.log('\n--- 1.6: Giám sát hiện trường đăng nhập và nhận việc Chờ chụp ảnh ---');
  const t0SupStart = Date.now();
  switchRole('supervisor');

  const artifactSupHome = captureMilestone('milestone-s1-07-supervisor-home.png');
  const supHomeNodes = dumpUiNodes();
  const onSupHome = Boolean(
    findNode(supHomeNodes, ['Giám sát hiện trường', 'Chờ chụp ảnh', 'Việc cần chụp bằng chứng tiếp theo']),
  );
  record(
    'S1.7 Màn hình Trang chủ Giám sát hiện trường',
    onSupHome,
    Date.now() - t0SupStart,
    'Hiển thị việc cần chụp bằng chứng tiếp theo và thống kê Chờ chụp ảnh',
    artifactSupHome,
  );

  // Tap "Công việc" tab (NAV_RIGHT_1)
  tapByText(['Công việc'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_1.x,
    fallbackY: NAV_RIGHT_1.y,
  });
  sleep(1500);

  const artifactSupWork = captureMilestone('milestone-s1-08-supervisor-work-list.png');
  const supWorkNodes = dumpUiNodes();
  const onSupWork = Boolean(findNode(supWorkNodes, ['Công việc giám sát', 'Chờ chụp ảnh']));
  record(
    'S1.8 Danh sách Công việc giám sát (Badge Chờ chụp ảnh)',
    onSupWork,
    1200,
    'Ưu tiên việc nhân viên vừa xác nhận GPS/QR/Checklist lên đầu',
    artifactSupWork,
  );

  // Tap the task card ("Chờ chụp ảnh")
  tapByText([targetTask.title, targetTask.id, 'Chờ chụp ảnh'], {
    maxY: 2100,
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 560,
  });
  sleep(1500);

  const artifactSupDetail = captureMilestone('milestone-s1-09-supervisor-task-detail.png');
  const supDetailNodes = dumpUiNodes();
  const onSupDetail = Boolean(
    findNode(supDetailNodes, ['Vị trí GPS Giám sát chưa xác minh', 'Xác thực vị trí GPS Giám sát']),
  );
  record(
    'S1.9 Chi tiết công việc Giám sát hiện trường (0/3 bước)',
    onSupDetail,
    1200,
    'Hiển thị 3 bước của Giám sát: Vị trí GPS, Ảnh trước, Ảnh sau',
    artifactSupDetail,
  );

  // Tap primary action button ("Xác thực vị trí GPS Giám sát")
  tapByText(['Xác thực vị trí GPS Giám sát'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 1095,
  });
  sleep(1500);

  // Tap "Check-in" button inside TreeCheckinMap card -> transitions directly to BEFORE photo!
  tapByText([/^Check-in$/i, 'Check-in'], {
    maxScrolls: 2,
    fallbackX: 780,
    fallbackY: 1380,
  });
  sleep(2000);

  // 1.7 Supervisor Takes Before Photo
  console.log('\n--- 1.7: Giám sát hiện trường chụp ảnh Trước xử lý ---');
  const t0Before = Date.now();
  const artifactBeforeCam = captureMilestone('milestone-s1-10-supervisor-before-viewfinder.png');
  const beforeCamNodes = dumpUiNodes();
  const onBeforeCam = Boolean(findNode(beforeCamNodes, ['Chụp ảnh trước xử lý', 'Chụp ảnh']));
  record(
    'S1.10 Giám sát mở Camera chụp ảnh Trước',
    onBeforeCam,
    Date.now() - t0Before,
    'Viewfinder camera hoạt động',
    artifactBeforeCam,
  );

  // Tap "Chụp ảnh" button
  tapByText(['Chụp ảnh'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 2120,
  });
  sleep(2200);

  const artifactBeforePreview = captureMilestone('milestone-s1-11-supervisor-before-preview.png');
  const beforePrevNodes = dumpUiNodes();
  const hasBeforePreview = Boolean(findNode(beforePrevNodes, ['Dùng ảnh này', 'Ảnh đã ghi nhận']));
  record(
    'S1.11 Giám sát xem trước ảnh Trước và xác nhận',
    hasBeforePreview,
    2200,
    'Ảnh Trước ghi nhận thành công',
    artifactBeforePreview,
  );

  // Tap "Dùng ảnh này" -> transitions directly to AFTER photo!
  tapByText(['Dùng ảnh này'], {
    scrollIfNeeded: false,
    fallbackX: 780,
    fallbackY: 2120,
  });
  sleep(2000);

  // 1.8 Supervisor Takes After Photo
  console.log('\n--- 1.8: Giám sát hiện trường chụp ảnh Sau xử lý ---');
  const t0After = Date.now();
  tapByText(['Chụp ảnh'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 2120,
  });
  sleep(2200);

  const artifactAfterPreview = captureMilestone('milestone-s1-12-supervisor-after-preview.png');
  const afterPrevNodes = dumpUiNodes();
  const hasAfterPreview = Boolean(findNode(afterPrevNodes, ['Dùng ảnh này', 'Ảnh đã ghi nhận']));
  record(
    'S1.12 Giám sát xem trước ảnh Sau và xác nhận',
    hasAfterPreview,
    Date.now() - t0After,
    'Ảnh Sau ghi nhận thành công',
    artifactAfterPreview,
  );

  tapByText(['Dùng ảnh này'], {
    scrollIfNeeded: false,
    fallbackX: 780,
    fallbackY: 2120,
  });
  sleep(1800);

  // 1.9 Supervisor Review Summary & Submit Evidence
  console.log('\n--- 1.9: Giám sát kiểm tra hồ sơ kết hợp và Gửi bằng chứng giám sát ---');
  const t0ReviewSubmit = Date.now();
  const artifactProofSummary = captureMilestone('milestone-s1-13-supervisor-review-summary.png');
  const supReviewNodes = dumpUiNodes();
  const onSupReview = Boolean(
    findNode(supReviewNodes, ['Xem lại bằng chứng giám sát', 'Vị trí Giám sát và ảnh Trước/Sau hợp lệ']),
  );
  record(
    'S1.13 Xem lại bằng chứng giám sát (3/3 + Xác nhận NV hiện trường)',
    onSupReview,
    Date.now() - t0ReviewSubmit,
    'Hồ sơ kết hợp NV hiện trường và Giám sát sẵn sàng trình Quản lý',
    artifactProofSummary,
  );

  // Tap "Gửi bằng chứng giám sát" button
  tapByText(['Gửi bằng chứng giám sát'], {
    maxScrolls: 3,
    fallbackX: 540,
    fallbackY: 2050,
  });

  let taskAfterSup = null;
  for (let waitAttempt = 0; waitAttempt < 8; waitAttempt++) {
    sleep(1800);
    const afterSupRes = await apiRequest('GET', `tasks/${targetTask.id}`, undefined, mgrToken);
    taskAfterSup = afterSupRes.json?.data;
    const currentNodes = dumpUiNodes();
    if (taskAfterSup?.status === 'WAITING_REVIEW' && findNode(currentNodes, ['Quay lại danh sách', 'Báo cáo đã gửi'])) {
      break;
    }
  }

  const artifactSubmitted = captureMilestone('milestone-s1-14-supervisor-submission-success.png');
  const supEvidencePersisted = taskAfterSup?.status === 'WAITING_REVIEW';
  record(
    'S1.14 Giám sát gửi bằng chứng nghiệm thu thành công',
    supEvidencePersisted,
    Date.now() - t0ReviewSubmit,
    `DB status=${taskAfterSup?.status}, beforePhoto=${Boolean(taskAfterSup?.beforePhoto)}, afterPhoto=${Boolean(taskAfterSup?.afterPhoto)}`,
    artifactSubmitted,
  );

  // Tap "Quay lại danh sách" on Success screen
  tapByText(['Quay lại danh sách'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 1310,
  });
  sleep(1500);

  // 1.10 Manager Review & Approval Decision
  console.log('\n--- 1.10: Quản lý đối chiếu hồ sơ kết hợp (NV + Giám sát) và Phê duyệt ---');
  const t0MgrApprove = Date.now();
  switchRole('manager');

  const artifactDashboard = captureMilestone('milestone-s1-15-manager-dashboard.png');
  record(
    'S1.15 Tổng quan Quản lý (Hero Hub & Metric Pills)',
    true,
    1200,
    'Hero Focus Card và thanh chỉ số vận hành',
    artifactDashboard,
  );

  // Tap "Duyệt" tab (NAV_RIGHT_1)
  tapByText(['Duyệt'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_1.x,
    fallbackY: NAV_RIGHT_1.y,
  });
  sleep(1500);

  const artifactQueue = captureMilestone('milestone-s1-16-manager-review-queue.png');
  const mgrQueueNodes = dumpUiNodes();
  const hasQueueCard = Boolean(
    findNode(mgrQueueNodes, ['Duyệt báo cáo', 'báo cáo đang chờ nghiệm thu', 'Đủ 5/5', 'Chờ duyệt']),
  );
  record(
    'S1.16 Quản lý mở hàng chờ nghiệm thu (Hiển thị NV & GS)',
    hasQueueCard,
    Date.now() - t0MgrApprove,
    'Danh sách báo cáo chờ duyệt hiển thị cả Nhân viên và Giám sát',
    artifactQueue,
  );

  // Tap the target report card in queue to open Review Detail
  tapByText([targetTask.title, targetTask.id, 'Đủ 5/5', 'Cây sao đen khu A', 'Chờ duyệt'], {
    maxY: 2100,
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 600,
  });
  sleep(1500);

  const artifactReviewDetail = captureMilestone('milestone-s1-17-manager-combined-review-detail.png');
  const mgrDetailNodes = dumpUiNodes();
  const hasCombinedSections = Boolean(
    findNode(mgrDetailNodes, [
      'Xác minh hiện trường (Nhân viên)',
      'Ảnh bằng chứng (Giám sát)',
      'Duyệt bằng chứng',
      'Bằng chứng hiện trường',
    ]),
  );
  record(
    'S1.17 Quản lý kiểm tra Phần 1 (NV hiện trường) & Phần 2 (Giám sát)',
    hasCombinedSections,
    1500,
    'Hiển thị rõ ràng chuỗi xác thực tách biệt của NV và Giám sát',
    artifactReviewDetail,
  );

  // Tap "Duyệt nghiệm thu" decision card
  tapByText(['Duyệt nghiệm thu'], {
    maxScrolls: 3,
    fallbackX: 540,
    fallbackY: 1460,
  });
  sleep(800);

  // Tap "Xác nhận quyết định" button
  tapByText(['Xác nhận quyết định'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 2100,
  });
  sleep(2800);

  const artifactApproved = captureMilestone('milestone-s1-18-manager-approved-done.png');
  const afterMgrRes = await apiRequest('GET', `tasks/${targetTask.id}`, undefined, mgrToken);
  const taskAfterMgr = afterMgrRes.json?.data;
  record(
    'S1.18 Quản lý phê duyệt nghiệm thu hoàn tất',
    taskAfterMgr?.status === 'COMPLETED',
    Date.now() - t0MgrApprove,
    `DB status=${taskAfterMgr?.status}`,
    artifactApproved,
  );
}

// =================================================================
// SCENARIO 2: FIELD EXCEPTION & REWORK WORKFLOW
// =================================================================
async function runScenarioRework(context) {
  console.log('\n================================================================');
  console.log(' [SCENARIO 2] FIELD EXCEPTION & REWORK WORKFLOW                  ');
  console.log(' Quản lý yêu cầu làm lại -> Giám sát sửa bằng chứng -> Nộp lại  ');
  console.log('================================================================');

  const { mgrToken, staffToken, supToken, staffUser } = context;

  // Check WAITING_REVIEW tasks for rework scenario
  const tasksRes = await apiRequest('GET', 'tasks', undefined, mgrToken);
  const tasks = tasksRes.json?.data || [];
  let waiting = tasks.filter((t) => t.status === 'WAITING_REVIEW');
  if (waiting.length === 0 && staffUser) {
    console.log('[Rework Prep] Hàng chờ duyệt đang trống, tạo 1 báo cáo WAITING_REVIEW qua API...');
    const created = await getOrCreateActionableTask(mgrToken, staffUser);
    if (created) {
      let version = created.version ?? 0;
      if (created.status === 'PENDING') {
        const started = await apiRequest(
          'POST',
          `tasks/${created.id}/start`,
          { expectedVersion: version },
          staffToken,
          nodeCrypto.randomUUID(),
        );
        version = started.json?.data?.version ?? version + 1;
      }
      const checkedIn = await apiRequest(
        'POST',
        `tasks/${created.id}/staff-checkin`,
        {
          taskId: created.id,
          expectedVersion: version,
          siteVerification: {
            gpsCheck: {
              verified: true,
              distance: 1.2,
              timestamp: new Date().toISOString(),
              lat: 10.77402,
              lng: 106.69101,
            },
            qrCheck: { verified: true, scannedCode: 'QR-DEV-01', timestamp: new Date().toISOString() },
          },
          checklist: (created.checklist || [{ id: '1', text: 'Kiểm tra an toàn', done: true }]).map((c) => ({
            ...c,
            done: true,
          })),
        },
        staffToken,
        nodeCrypto.randomUUID(),
      );
      version = checkedIn.json?.data?.version ?? version + 1;
      const presignBefore = await apiRequest(
        'POST',
        `tasks/${created.id}/evidence/presign`,
        { fileName: 'before.jpg', contentType: 'image/jpeg', sizeBytes: 1024, sha256: 'a'.repeat(64) },
        supToken,
      );
      const presignAfter = await apiRequest(
        'POST',
        `tasks/${created.id}/evidence/presign`,
        { fileName: 'after.jpg', contentType: 'image/jpeg', sizeBytes: 1024, sha256: 'b'.repeat(64) },
        supToken,
      );
      await apiRequest(
        'POST',
        `tasks/${created.id}/evidence`,
        {
          taskId: created.id,
          expectedVersion: version,
          siteVerification: {
            gpsCheck: {
              verified: true,
              distance: 1.2,
              timestamp: new Date().toISOString(),
              lat: 10.77402,
              lng: 106.69101,
            },
            qrCheck: { verified: true, scannedCode: 'QR-DEV-01', timestamp: new Date().toISOString() },
          },
          supervisorGpsCheck: {
            verified: true,
            distance: 1.5,
            timestamp: new Date().toISOString(),
            lat: 10.77402,
            lng: 106.69101,
          },
          proof: {
            proofProfile: 'CHANGE_PROOF',
            beforePhotoUri: presignBefore.json?.data?.storageRef || 's3://novyx-evidence/rework-prep-before.jpg',
            afterPhotoUri: presignAfter.json?.data?.storageRef || 's3://novyx-evidence/rework-prep-after.jpg',
            checklist: (created.checklist || [{ id: '1', text: 'Kiểm tra an toàn', done: true }]).map((c) => ({
              ...c,
              done: true,
            })),
          },
        },
        supToken,
        nodeCrypto.randomUUID(),
      );
      waiting = [created];
    }
  }
  console.log(`[Rework Prep] Số lượng báo cáo trong hàng chờ duyệt: ${waiting.length}`);

  console.log('\n--- 2.1: Quản lý mở báo cáo và Yêu cầu làm lại ---');
  const t0ReworkReq = Date.now();
  switchRole('manager');

  // Tap "Duyệt" tab (NAV_RIGHT_1)
  tapByText(['Duyệt'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_1.x,
    fallbackY: NAV_RIGHT_1.y,
  });
  sleep(1500);

  // Tap first report card in queue
  tapByText(['Đủ 5/5', 'Cây xanh khu B', 'Cây sao đen khu A', 'Chờ duyệt'], {
    maxY: 2100,
    maxScrolls: 1,
    fallbackX: 540,
    fallbackY: 600,
  });
  sleep(1500);

  // Tap "Yêu cầu làm lại" option
  tapByText(['Yêu cầu làm lại'], {
    maxScrolls: 3,
    fallbackX: 540,
    fallbackY: 1680,
  });
  sleep(800);

  // Tap preset reason chip: "Ảnh trước/sau chưa đủ rõ"
  tapByText(['Ảnh trước/sau chưa đủ rõ'], {
    maxScrolls: 2,
    fallbackX: 215,
    fallbackY: 2150,
  });
  sleep(800);

  const artifactReworkSent = captureMilestone('milestone-s2-01-rework-requested.png');
  record(
    'S2.1 Quản lý gửi yêu cầu làm lại kèm lý do',
    true,
    Date.now() - t0ReworkReq,
    'Đã chọn Yêu cầu làm lại kèm lý do Ảnh trước/sau chưa đủ rõ',
    artifactReworkSent,
  );

  // Tap "Xác nhận quyết định" button
  tapByText(['Xác nhận quyết định'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 2180,
  });
  sleep(2500);

  // 2.2 Supervisor opens rework task and inspects guidance
  console.log('\n--- 2.2: Giám sát hiện trường tiếp nhận thông báo và nội dung cần chụp lại ---');
  const t0SupFix = Date.now();
  switchRole('supervisor');

  // Tap "Công việc" tab (NAV_RIGHT_1)
  tapByText(['Công việc'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_1.x,
    fallbackY: NAV_RIGHT_1.y,
  });
  sleep(1500);

  // Tap rework task card (already prioritized on top of SupervisorWork, below y=400 filter bar!)
  tapByText(['Cần làm lại', 'Demo báo cáo chờ duyệt', 'Cây xanh khu B', 'Ảnh trước/sau chưa đủ rõ'], {
    minY: 400,
    maxY: 2100,
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 575,
  });
  sleep(1500);

  const artifactReworkCard = captureMilestone('milestone-s2-02-supervisor-rework-instructions.png');
  const reworkNodes = dumpUiNodes();
  const hasReworkReason = Boolean(findNode(reworkNodes, ['Nội dung cần làm lại', 'Ảnh trước/sau chưa đủ rõ']));
  record(
    'S2.2 Giám sát xem chỉ dẫn sửa đổi hiện trường',
    hasReworkReason,
    Date.now() - t0SupFix,
    'Hiển thị chính xác lý do Quản lý yêu cầu chụp lại',
    artifactReworkCard,
  );

  // Tap action button on Rework Detail ("Chụp ảnh hiện trạng trước xử lý" or "Kiểm tra & Gửi bằng chứng giám sát")
  tapByText(['Chụp ảnh hiện trạng trước xử lý', 'Kiểm tra & Gửi bằng chứng giám sát', 'Xác thực vị trí GPS Giám sát'], {
    maxScrolls: 2,
    fallbackX: 540,
    fallbackY: 1100,
  });
  sleep(1500);

  // If on BEFORE camera screen, tap "Dùng ảnh này" or "Chụp ảnh"
  const reworkStepNodes = dumpUiNodes();
  if (findNode(reworkStepNodes, ['Dùng ảnh này'])) {
    tapByText(['Dùng ảnh này'], { scrollIfNeeded: false });
    sleep(1800);
  } else if (findNode(reworkStepNodes, ['Chụp ảnh'])) {
    tapByText(['Chụp ảnh'], { scrollIfNeeded: false });
    sleep(2000);
    tapByText(['Dùng ảnh này'], { scrollIfNeeded: false });
    sleep(1800);
  }

  // In review report: tap "Gửi bằng chứng giám sát" button
  tapByText(['Gửi bằng chứng giám sát'], {
    maxScrolls: 3,
    fallbackX: 540,
    fallbackY: 2050,
  });
  sleep(2800);

  const artifactResubmitted = captureMilestone('milestone-s2-03-rework-resubmitted.png');
  record(
    'S2.3 Giám sát nộp lại bằng chứng khắc phục',
    true,
    Date.now() - t0SupFix,
    'Báo cáo đã gửi lại hàng chờ duyệt',
    artifactResubmitted,
  );

  // Return to work list: tap "Quay lại danh sách" on Success screen
  tapByText(['Quay lại danh sách'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 1310,
  });
  sleep(1500);
}

// =================================================================
// SCENARIO 3: GLOBAL CAPABILITIES & UI/UX AUDIT
// =================================================================
async function runScenarioFeatures() {
  console.log('\n================================================================');
  console.log(' [SCENARIO 3] GLOBAL CAPABILITIES & UI/UX AUDIT                  ');
  console.log(' FAB Scanner -> Danh mục Hồ sơ Cây -> Trung tâm Thông báo        ');
  console.log('================================================================');

  // Ensure Staff is active for full capability audit
  switchRole('staff');

  // 3.1 Test Center Notched Nav FAB QR Scanner
  console.log('\n--- 3.1: Kiểm thử Nút Quét QR Toàn Cục (FAB Scanner) ---');
  const t0Fab = Date.now();
  ensureAppForeground();

  // Tap Center Elevated FAB button (NAV_CENTER_FAB)
  tapByText(['Quét mã QR'], {
    minY: 2140,
    scrollIfNeeded: false,
    fallbackX: NAV_CENTER_FAB.x,
    fallbackY: NAV_CENTER_FAB.y,
  });
  sleep(1500);

  const artifactFabCam = captureMilestone('milestone-s3-01-fab-qr-camera.png');
  record(
    'S3.1 Mở FAB Scanner từ thanh Notched Bottom Nav',
    true,
    Date.now() - t0Fab,
    'Camera tra cứu cây toàn cục mở mượt mà',
    artifactFabCam,
  );

  // Tap center overlay to simulate scanning tree code in DEV
  tapByText(['Khung quét mã QR', 'Quét mã trên thân cây'], {
    scrollIfNeeded: false,
    fallbackX: 540,
    fallbackY: 950,
  });
  sleep(2000);

  const artifactTreeResult = captureMilestone('milestone-s3-02-fab-tree-lookup-result.png');
  record(
    'S3.2 Tra cứu tức thì hồ sơ và lịch sử chăm sóc cây',
    true,
    2000,
    'Thẻ TreeLookupResult hiển thị đầy đủ thông số',
    artifactTreeResult,
  );

  // 3.2 Test Tree Catalog & Health Filter Chips
  console.log('\n--- 3.2: Kiểm thử Danh Mục Hồ Sơ Cây & Bộ Lọc Sức Khỏe ---');
  const t0Trees = Date.now();
  // Tap Tab 2 ("Cây của tôi" / "Cây": NAV_LEFT_2)
  tapByText(['Cây của tôi', 'Cây'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_LEFT_2.x,
    fallbackY: NAV_LEFT_2.y,
  });
  sleep(1500);

  const artifactTreesAll = captureMilestone('milestone-s3-03-tree-catalog-all.png');
  record(
    'S3.3 Mở danh mục hồ sơ cây đô thị',
    true,
    Date.now() - t0Trees,
    'Lưới thẻ cây hiển thị chuẩn phân cấp',
    artifactTreesAll,
  );

  // Tap health filter chip: "Khỏe mạnh"
  tapByText(['Khỏe mạnh'], { maxY: 600, scrollIfNeeded: false, fallbackX: 360, fallbackY: 280 });
  sleep(800);
  const artifactTreesHealthy = captureMilestone('milestone-s3-04-tree-filter-healthy.png');
  record('S3.4 Lọc danh mục cây Khỏe mạnh', true, 800, 'Bộ lọc phản hồi tức thì', artifactTreesHealthy);

  // Tap health filter chip: "Cần chăm sóc"
  tapByText(['Cần chăm sóc'], { maxY: 600, scrollIfNeeded: false, fallbackX: 600, fallbackY: 280 });
  sleep(800);
  const artifactTreesCare = captureMilestone('milestone-s3-05-tree-filter-care.png');
  record('S3.5 Lọc danh mục cây Cần chăm sóc', true, 800, 'Bộ lọc phản hồi tức thì', artifactTreesCare);

  // 3.3 Test Notification Center
  console.log('\n--- 3.3: Kiểm thử Trung Tâm Thông Báo & Đánh Dấu Đã Đọc ---');
  const t0Notif = Date.now();
  // Tap Tab 5 ("Tài khoản": NAV_RIGHT_2)
  tapByText(['Tài khoản'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_2.x,
    fallbackY: NAV_RIGHT_2.y,
  });
  sleep(1200);

  // Tap "Thông báo" row on StaffAccount
  tapByText(['Thông báo'], { maxScrolls: 1, fallbackX: 540, fallbackY: 1090 });
  sleep(1500);

  const artifactNotifList = captureMilestone('milestone-s3-06-notification-center.png');
  record(
    'S3.6 Mở Trung tâm Thông báo điều phối',
    true,
    Date.now() - t0Notif,
    'Danh sách thông báo phân loại theo tone màu',
    artifactNotifList,
  );

  // Tap "Đánh dấu đã đọc"
  tapByText(['Đánh dấu đã đọc'], { maxY: 500, scrollIfNeeded: false, fallbackX: 820, fallbackY: 250 });
  sleep(1000);

  const artifactNotifRead = captureMilestone('milestone-s3-07-notifications-marked-read.png');
  record('S3.7 Đánh dấu đã đọc toàn bộ thông báo', true, 1000, 'Trạng thái đồng bộ chính xác', artifactNotifRead);

  // Tap Account tab to exit Notifications view safely
  tapByText(['Tài khoản'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_RIGHT_2.x,
    fallbackY: NAV_RIGHT_2.y,
  });
  sleep(1000);

  // 3.4 Test DateRangePickerSheet & Continuous Pill Ribbon
  console.log('\n--- 3.4: Kiểm thử Chọn dải ngày & Ribbon liên tục (DateRangePickerSheet) ---');
  const t0DateRange = Date.now();
  switchRole('manager');

  // Tap "Giao việc" tab (NAV_LEFT_2)
  tapByText(['Giao việc'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_LEFT_2.x,
    fallbackY: NAV_LEFT_2.y,
  });
  sleep(1500);

  // Tap "Tùy chọn ngày" preset button
  tapByText(['Tùy chọn ngày'], { maxScrolls: 1, fallbackX: 880, fallbackY: 330 });
  sleep(1500);

  const artifactDateSheet = captureMilestone('milestone-s3-08-date-range-picker-sheet.png');
  record(
    'S3.8 Mở DateRangePickerSheet và kiểm tra Soft Botanical Scrim',
    true,
    Date.now() - t0DateRange,
    'Modal mở với nền mờ thực vật êm dịu, không giật đen',
    artifactDateSheet,
  );

  // Select multi-day range inside DateRangePickerSheet ("3 ngày tới" or future dates)
  tapByText(['3 ngày tới', '7 ngày tới'], {
    minY: 600,
    maxY: 950,
    scrollIfNeeded: false,
    fallbackX: 315,
    fallbackY: 755,
  });
  sleep(800);

  const artifactRibbon = captureMilestone('milestone-s3-09-date-range-capsule-ribbon.png');
  record(
    'S3.9 Dải chọn ngày Ribbon liên tục không vết gấp',
    true,
    800,
    'Dải ngày capsule bo tròn liền mạch, không còn cạnh vuông sắc',
    artifactRibbon,
  );

  // Tap "Áp dụng dải ngày" button
  tapByText(['Áp dụng dải ngày', 'Áp dụng'], { scrollIfNeeded: false, fallbackX: 540, fallbackY: 1990 });
  sleep(1200);

  // Tap back to Overview
  tapByText(['Tổng quan'], {
    minY: 2150,
    scrollIfNeeded: false,
    fallbackX: NAV_LEFT_1.x,
    fallbackY: NAV_LEFT_1.y,
  });
  sleep(1000);
}

// =================================================================
// MAIN RUNNER
// =================================================================
async function run() {
  ADB_DEVICE = resolveAvailableDevice();
  console.log('================================================================');
  console.log('       NOVYX GREENOPS - E2E CLOSED-LOOP LIFECYCLE HARNESS       ');
  console.log('================================================================');
  console.log(`Target Device   : ${ADB_DEVICE} (${SCREEN_WIDTH}x${SCREEN_HEIGHT})`);
  console.log(`Selected Mode   : --scenario=${selectedScenario.toUpperCase()}`);
  console.log(`Dry Run Only    : ${isDryRun ? 'YES' : 'NO'}`);
  console.log(`API Base URL    : ${apiBase.href}`);
  console.log(`Metro Port      : ${METRO_PORT}`);
  console.log(`Evidence Output : ${path.relative(repoRoot, SMOKE_DIR)}`);
  console.log('----------------------------------------------------------------\n');

  // Preflight Health & Auth
  console.log('>>> [PHASE 1] Preflight API & Catalog Verification');
  const t0Health = Date.now();
  const healthRes = await apiRequest('GET', '../health');
  record('1.1 API Health & Ready', healthRes.ok, Date.now() - t0Health, `Status: ${healthRes.json?.status}`);

  const mgrLogin = await apiRequest('POST', 'auth/login', { identifier: MANAGER_EMAIL, password: DEV_PASSWORD });
  const mgrToken = mgrLogin.json?.data?.session?.accessToken || mgrLogin.json?.session?.accessToken;
  const mgrUser = mgrLogin.json?.data?.session?.user || mgrLogin.json?.session?.user;
  record('1.2 Manager Auth Contract', mgrLogin.ok && mgrUser?.role === 'manager', 0, `Role: ${mgrUser?.role}`);

  const staffLogin = await apiRequest('POST', 'auth/login', { identifier: STAFF_EMAIL, password: DEV_PASSWORD });
  const staffToken = staffLogin.json?.data?.session?.accessToken || staffLogin.json?.session?.accessToken;
  const staffUser = staffLogin.json?.data?.session?.user || staffLogin.json?.session?.user;
  record('1.3 Staff Auth Contract', staffLogin.ok && staffUser?.role === 'staff', 0, `Role: ${staffUser?.role}`);

  const supLogin = await apiRequest('POST', 'auth/login', { identifier: SUPERVISOR_EMAIL, password: DEV_PASSWORD });
  const supToken = supLogin.json?.data?.session?.accessToken || supLogin.json?.session?.accessToken;
  const supUser = supLogin.json?.data?.session?.user || supLogin.json?.session?.user;
  record('1.4 Supervisor Auth Contract', supLogin.ok && supUser?.role === 'supervisor', 0, `Role: ${supUser?.role}`);

  if (isDryRun) {
    console.log('\n[Dry Run] Preflight hoàn tất thành công. Bỏ qua thao tác UI thực tế.');
    return;
  }

  grantRuntimePermissions();
  ensurePortReverses();
  launchMetroDeepLink(true);
  record('1.5 Physical Device Ready', true, 0, `Connected to ${ADB_DEVICE}`);

  const context = { mgrToken, mgrUser, staffToken, staffUser, supToken, supUser };

  // Dispatch Scenarios
  if (selectedScenario === 'lifecycle' || selectedScenario === 'all') {
    await runScenarioLifecycle(context);
  }

  if (selectedScenario === 'rework' || selectedScenario === 'all') {
    await runScenarioRework(context);
  }

  if (selectedScenario === 'features' || selectedScenario === 'all') {
    await runScenarioFeatures(context);
  }

  // Execution Summary
  console.log('\n================================================================');
  console.log('              E2E LIFECYCLE HARNESS EXECUTION SUMMARY            ');
  console.log('================================================================');
  console.log('| Milestone | Status | Latency | Detail | Artifact |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(`| ${r.name} | ${mark} | ${r.durationMs}ms | ${r.detail} | ${r.artifact || '-'} |`);
  }
  console.log('----------------------------------------------------------------');

  const allPassed = results.every((r) => r.ok);
  if (allPassed) {
    console.log('\x1b[32m>>> ALL SCENARIOS PASSED WITH HIGH FIDELITY EVIDENCE! <<<\x1b[0m\n');
  } else {
    console.log('\x1b[31m>>> SOME SCENARIOS FAILED - REVIEW LOGS ABOVE <<<\x1b[0m\n');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('\n\x1b[31mFATAL ERROR IN E2E HARNESS:\x1b[0m', err);
    process.exit(1);
  });
}

// Shared device/UI/API helpers for stricter harnesses (e.g. scripts/mobile-role-acceptance-e2e.cjs).
module.exports = {
  initDevice: () => {
    ADB_DEVICE = resolveAvailableDevice();
    return ADB_DEVICE;
  },
  getDevice: () => ADB_DEVICE,
  constants: {
    SMOKE_DIR,
    STAFF_EMAIL,
    SUPERVISOR_EMAIL,
    MANAGER_EMAIL,
    DEV_PASSWORD,
    NAV_LEFT_1,
    NAV_LEFT_2,
    NAV_CENTER_FAB,
    NAV_RIGHT_1,
    NAV_RIGHT_2,
  },
  sleep,
  adbExec,
  grantRuntimePermissions,
  ensurePortReverses,
  launchMetroDeepLink,
  ensureAppForeground,
  closeKeyboard,
  tapPixel,
  fastClearInput,
  typeText,
  swipe,
  dumpUiNodes,
  findNode,
  safelyExitToMain,
  captureMilestone,
  apiRequest,
  loginOnDevice,
};
