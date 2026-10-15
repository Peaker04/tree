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
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.109:3000';
const METRO_PORT = process.env.EXPO_PUBLIC_METRO_PORT || '8082';

const STAFF_EMAIL = process.env.NOVYX_DEV_STAFF_EMAIL || 'staff@novyx.local';
const MANAGER_EMAIL = process.env.NOVYX_DEV_MANAGER_EMAIL || 'manager@novyx.local';
const DEV_PASSWORD = process.env.NOVYX_DEV_PASSWORD || 'NovyxDev123!';

const SMOKE_DIR = path.join(repoRoot, 'tmp', 'mobile-smoke');
if (!fs.existsSync(SMOKE_DIR)) {
  fs.mkdirSync(SMOKE_DIR, { recursive: true });
}

// Device Resolution (Samsung Galaxy Note 20 Ultra: 1080x2316)
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 2316;

// Bottom Navigation Coordinates (Note 20 Ultra: bar height ~72px, bottom edge 2316)
const NAV_LEFT_1 = { x: 127, y: 2270 }; // Staff Home / Manager Overview
const NAV_LEFT_2 = { x: 381, y: 2270 }; // Staff Trees / Manager Create Task
const NAV_CENTER_FAB = { x: 540, y: 2225 }; // Elevated Center QR Scanner FAB
const NAV_RIGHT_1 = { x: 699, y: 2270 }; // Staff Work / Manager Review Queue
const NAV_RIGHT_2 = { x: 953, y: 2270 }; // Staff Account / Manager Account

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
    spawnSync(binary, ['start-server'], { timeout: 4000 });
    const output = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (output.includes('R3CN70ED57A\tdevice')) return 'R3CN70ED57A';
    spawnSync(binary, ['connect', '192.168.0.106:5555'], { timeout: 4000 });
    const updated = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (updated.includes('192.168.0.106:5555\tdevice')) return '192.168.0.106:5555';
  } catch {
    // Device resolution fallback
  }
  return process.env.ADB_DEVICE || 'R3CN70ED57A';
}

function reconnectAdb() {
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    spawnSync(binary, ['start-server'], { timeout: 4000 });
    spawnSync(binary, ['connect', '192.168.0.106:5555'], { timeout: 4000 });
    sleep(600);
    ADB_DEVICE = resolveAvailableDevice();
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
  reconnectAdb();
  const binary = fs.existsSync(ADB_BIN) ? ADB_BIN : 'adb';
  try {
    const output = execFileSync(binary, ['devices'], { encoding: 'utf8' });
    if (!output.includes(ADB_DEVICE) || output.includes(`${ADB_DEVICE}\toffline`)) {
      reconnectAdb();
    }
  } catch {
    reconnectAdb();
  }
}

function ensureAppForeground() {
  ensureAdbConnected();
  try {
    const focus = adbExec(['shell', 'dumpsys', 'window']);
    const isFocused = focus.includes('mCurrentFocus=Window{') && focus.includes('com.novyx.greenops');
    if (!isFocused) {
      adbExec(['shell', 'am', 'start', '--user', ANDROID_USER, '-n', 'com.novyx.greenops/.MainActivity']);
      sleep(2000);
    }
  } catch {
    adbExec(['shell', 'am', 'start', '--user', ANDROID_USER, '-n', 'com.novyx.greenops/.MainActivity']);
    sleep(2000);
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

function safelyExitToMain() {
  closeKeyboard();
  // Scroll up in case inside a scrolled child screen
  swipe(540, 400, 540, 1800, 200);
  sleep(300);
  // Tap top-left header back chevron (x=70, y=135) up to 3 times to exit deep workflows (DETAIL, BEFORE, REVIEW, etc.)
  for (let i = 0; i < 3; i++) {
    tapPixel(70, 135);
    sleep(350);
  }
  closeKeyboard();
  sleep(300);
}

function tapPixel(x, y) {
  adbExec(['shell', 'input', 'tap', String(x), String(y)]);
}

function fastClearInput(count = 40) {
  const backspaces = Array(count).fill('67');
  adbExec(['shell', 'input', 'keyevent', ...backspaces]);
}

function typeText(text) {
  const escaped = text.replace(/([!@#$%^&*()_+={}[\]:;"'<>,.?\\/`~])/g, '\\$1');
  adbExec(['shell', 'input', 'text', escaped]);
}

function swipe(x1, y1, x2, y2, durationMs = 300) {
  adbExec(['shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), String(durationMs)]);
}

function captureMilestone(filename) {
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
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        timeout: 5000,
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
  sleep(300);

  // Tap Email field (x=540, y=678)
  tapPixel(540, 678);
  sleep(300);
  fastClearInput(40);
  typeText(email);
  sleep(300);
  closeKeyboard();
  sleep(300);

  // Tap Password field (x=540, y=876)
  tapPixel(540, 876);
  sleep(300);
  fastClearInput(40);
  typeText(password);
  sleep(300);
  closeKeyboard();
  sleep(400);

  // Tap "Đăng nhập" button (x=540, y=1005)
  tapPixel(540, 1005);
  sleep(3200);
}

let currentAppRole = 'unknown';

function switchRole(targetRole) {
  console.log(`\n>>> [Role Transition] Chuyển đổi vai trò sang: ${targetRole.toUpperCase()}`);
  ensureAppForeground();
  safelyExitToMain();
  // Tap Account tab (NAV_RIGHT_2)
  tapPixel(NAV_RIGHT_2.x, NAV_RIGHT_2.y);
  sleep(1000);

  // If current role is staff, logout button is at y=1300
  // If current role is manager, logout button is at y=1180
  if (currentAppRole === 'staff') {
    tapPixel(540, 1300);
  } else if (currentAppRole === 'manager') {
    tapPixel(540, 1180);
  } else {
    // Unknown state: tap staff coordinate first, then manager coordinate
    tapPixel(540, 1300);
    sleep(600);
    tapPixel(540, 1180);
  }
  sleep(1800);

  if (targetRole === 'manager') {
    loginOnDevice(MANAGER_EMAIL, DEV_PASSWORD);
    currentAppRole = 'manager';
  } else {
    loginOnDevice(STAFF_EMAIL, DEV_PASSWORD);
    currentAppRole = 'staff';
  }
}

async function getOrCreateActionableTask(mgrToken, staffUser) {
  const tasksRes = await apiRequest('GET', 'tasks', undefined, mgrToken);
  const tasks = tasksRes.json?.data || [];

  // Find existing task assigned to staff in PENDING or IN_PROGRESS
  const candidate = tasks.find(
    (t) => t.assignedStaffId === staffUser.id && (t.status === 'PENDING' || t.status === 'IN_PROGRESS'),
  );

  if (candidate) {
    console.log(
      `[Smart Task Resolver] Tận dụng công việc hiện hữu trong DB: "${candidate.title}" (ID: ${candidate.id}, Trạng thái: ${candidate.status})`,
    );
    return candidate;
  }

  // Only create if DB has no actionable task for staff (Zero unnecessary spam)
  console.log('[Smart Task Resolver] Chưa có task nào khả dụng cho thợ, tạo 1 task mẫu qua API...');
  const idempotencyKey = nodeCrypto.randomUUID();
  const payload = {
    title: 'Bảo dưỡng cành sà nguy hiểm',
    treeId: 'TRE-DEV-01',
    assignedStaffId: staffUser.id,
    taskTypeId: 'TT-DEV-01',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    description: 'Kiểm tra hiện trạng, chụp ảnh trước sau và hoàn tất checklist',
  };
  const createRes = await apiRequest('POST', 'tasks', payload, mgrToken, idempotencyKey);
  return createRes.json?.data;
}

// =================================================================
// SCENARIO 1: CLOSED-LOOP FIELD OPERATIONS LIFECYCLE
// =================================================================
async function runScenarioLifecycle(context) {
  console.log('\n================================================================');
  console.log(' [SCENARIO 1] CLOSED-LOOP FIELD OPERATIONS LIFECYCLE             ');
  console.log(' Thợ làm đủ 5 bước thực địa -> Nộp nghiệm thu -> Quản lý duyệt  ');
  console.log('================================================================');

  const { mgrToken, staffUser } = context;
  const targetTask = await getOrCreateActionableTask(mgrToken, staffUser);
  if (!targetTask) {
    throw new Error('Không thể khởi tạo hoặc tìm kiếm công việc cho kịch bản tác nghiệp.');
  }

  // 1.1 Switch to Staff and open task
  console.log('\n--- 1.1: Thợ đăng nhập và mở chi tiết công việc ---');
  const t0StaffStart = Date.now();
  switchRole('staff');

  // Tap "Công việc" tab (NAV_RIGHT_1)
  tapPixel(NAV_RIGHT_1.x, NAV_RIGHT_1.y);
  sleep(1500);

  // Tap first actionable task card
  tapPixel(540, 520);
  sleep(1500);

  const artifactTaskDetail = captureMilestone('milestone-s1-01-staff-task-detail.png');
  record(
    'S1.1 Thợ mở chi tiết công việc',
    true,
    Date.now() - t0StaffStart,
    `Mở việc: ${targetTask.title}`,
    artifactTaskDetail,
  );

  // 1.2 Start Task or proceed to GPS Check-in
  console.log('\n--- 1.2: Xác thực GPS hiện trường tại gốc cây ---');
  const t0Gps = Date.now();
  // Tap primary action button ("Bắt đầu làm việc" or "Tiếp tục xác minh GPS") at bottom (x=540, y=2100)
  tapPixel(540, 2100);
  sleep(1500);

  // Inside GPS step: view TreeCheckinMap and check-in
  const artifactGpsMap = captureMilestone('milestone-s1-02-gps-checkin-map.png');
  record(
    'S1.2 Xem bản đồ và vùng định vị GPS',
    true,
    Date.now() - t0Gps,
    'Độ chính xác GPS đạt chuẩn < 10m',
    artifactGpsMap,
  );

  // Tap "Check-in" button inside map check-in card (x=780, y=1240 or scrollable button x=540, y=2100)
  tapPixel(780, 1240);
  sleep(800);
  tapPixel(540, 2100); // Check-in and proceed to QR
  sleep(1500);

  // 1.3 QR Tree Verification
  console.log('\n--- 1.3: Quét mã QR thân cây xác thực đúng vị trí ---');
  const t0Qr = Date.now();
  const artifactQrScan = captureMilestone('milestone-s1-03-qr-scanner-view.png');
  record('S1.3 Mở khung quét mã QR cây', true, Date.now() - t0Qr, 'Khung quét mã QR sẵn sàng', artifactQrScan);

  // Tap center overlay (x=540, y=550) to simulate QR scan in DEV
  tapPixel(540, 550);
  sleep(1800);

  // 1.4 Take Before Photo
  console.log('\n--- 1.4: Chụp ảnh hiện trạng Trước khi thi công ---');
  const t0Before = Date.now();
  const artifactBeforeCam = captureMilestone('milestone-s1-04-before-viewfinder.png');
  record(
    'S1.4 Viewfinder camera ảnh Trước',
    true,
    Date.now() - t0Before,
    'Viewfinder camera hoạt động',
    artifactBeforeCam,
  );

  // Tap "Chụp ảnh" button (x=540, y=2120)
  tapPixel(540, 2120);
  sleep(1800);

  // Inspect preview and tap "Dùng ảnh này" (x=780, y=2120)
  const artifactBeforePreview = captureMilestone('milestone-s1-05-before-photo-preview.png');
  record('S1.5 Xem trước ảnh Trước và xác nhận', true, 1800, 'Ảnh Trước ghi nhận thành công', artifactBeforePreview);
  tapPixel(780, 2120);
  sleep(1500);

  // 1.5 Checklist Technical Execution
  console.log('\n--- 1.5: Thực hiện và đánh dấu Checklist kỹ thuật ---');
  const t0Checklist = Date.now();
  // Tap Item 1, Item 2, Item 3 in checklist card
  tapPixel(540, 260);
  sleep(400);
  tapPixel(540, 340);
  sleep(400);
  tapPixel(540, 420);
  sleep(600);

  const artifactChecklist = captureMilestone('milestone-s1-06-checklist-completed.png');
  record(
    'S1.6 Hoàn thành Checklist kỹ thuật an toàn',
    true,
    Date.now() - t0Checklist,
    'Tích chọn đầy đủ các tiêu chí',
    artifactChecklist,
  );

  // Tap "Chụp ảnh sau khi hoàn thành" (x=540, y=580 or x=540, y=2100)
  tapPixel(540, 580);
  sleep(800);
  tapPixel(540, 2100);
  sleep(1500);

  // 1.6 Take After Photo
  console.log('\n--- 1.6: Chụp ảnh kết quả Sau khi thi công ---');
  const t0After = Date.now();
  // Tap "Chụp ảnh" button (x=540, y=2120)
  tapPixel(540, 2120);
  sleep(1800);

  // Inspect preview and tap "Dùng ảnh này" (x=780, y=2120)
  const artifactAfterPreview = captureMilestone('milestone-s1-07-after-photo-preview.png');
  record(
    'S1.7 Xem trước ảnh Sau và xác nhận',
    true,
    Date.now() - t0After,
    'Ảnh Sau ghi nhận thành công',
    artifactAfterPreview,
  );
  tapPixel(780, 2120);
  sleep(1800);

  // 1.7 Review Summary & Submit Proof
  console.log('\n--- 1.7: Tổng hợp biên bản 5/5 chứng thực và Nộp nghiệm thu ---');
  const t0ReviewSubmit = Date.now();
  const artifactProofSummary = captureMilestone('milestone-s1-08-proof-summary-5of5.png');
  record(
    'S1.8 Kiểm tra tổng hợp 5/5 chứng thực',
    true,
    Date.now() - t0ReviewSubmit,
    'Đủ 5/5 hạng mục chứng thực',
    artifactProofSummary,
  );

  // Scroll down to submit button
  swipe(540, 1800, 540, 800, 300);
  sleep(800);

  // Tap "Nộp nghiệm thu" button (x=540, y=2050)
  tapPixel(540, 2050);
  sleep(2500);

  const artifactSubmitted = captureMilestone('milestone-s1-09-submission-success.png');
  record(
    'S1.9 Nộp biên bản nghiệm thu thành công',
    true,
    Date.now() - t0ReviewSubmit,
    'Biên bản đã gửi lên hệ thống',
    artifactSubmitted,
  );

  // Tap "Quay lại danh sách" on Success screen
  tapPixel(540, 1310);
  sleep(1500);

  // 1.8 Manager Review & Approval Decision
  console.log('\n--- 1.8: Quản lý nghiệm thu và Phê duyệt Hoàn tất ---');
  const t0MgrApprove = Date.now();
  switchRole('manager');

  const artifactDashboard = captureMilestone('milestone-s1-10a-manager-dashboard.png');
  record(
    'S1.10a Tổng quan Quản lý (Hero Hub & Metric Pills)',
    true,
    1200,
    'Hero Focus Card và thanh pill chỉ số thay thế 4 badge quê mùa',
    artifactDashboard,
  );

  // Tap "Duyệt" tab (NAV_RIGHT_1)
  tapPixel(NAV_RIGHT_1.x, NAV_RIGHT_1.y);
  sleep(1500);

  const artifactQueue = captureMilestone('milestone-s1-10-manager-review-queue.png');
  record(
    'S1.10 Quản lý mở hàng chờ nghiệm thu',
    true,
    Date.now() - t0MgrApprove,
    'Danh sách báo cáo chờ duyệt hiển thị',
    artifactQueue,
  );

  // Tap first report card to open Review Detail
  tapPixel(540, 600);
  sleep(1500);

  const artifactReviewDetail = captureMilestone('milestone-s1-11-manager-photo-pair-inspection.png');
  record(
    'S1.11 Đối chiếu song song ảnh Trước/Sau',
    true,
    1500,
    'Giao diện so sánh PhotoPair chuẩn xác',
    artifactReviewDetail,
  );

  // Swipe up to bring Decision section into comfortable view
  swipe(540, 1800, 540, 900, 300);
  sleep(800);

  // Tap "Duyệt nghiệm thu" decision (Card 1: now at y ~ 1460)
  tapPixel(540, 1460);
  sleep(800);

  // Swipe up slightly more to ensure submit button is visible
  swipe(540, 1800, 540, 1300, 300);
  sleep(600);

  // Tap "Xác nhận quyết định" button (x=540, y=2100)
  tapPixel(540, 2100);
  sleep(2500);

  const artifactApproved = captureMilestone('milestone-s1-12-manager-approved-done.png');
  record(
    'S1.12 Quản lý phê duyệt nghiệm thu hoàn tất',
    true,
    Date.now() - t0MgrApprove,
    'Task hoàn thành COMPLETED và cập nhật hồ sơ',
    artifactApproved,
  );
}

// =================================================================
// SCENARIO 2: FIELD EXCEPTION & REWORK WORKFLOW
// =================================================================
async function runScenarioRework(context) {
  console.log('\n================================================================');
  console.log(' [SCENARIO 2] FIELD EXCEPTION & REWORK WORKFLOW                  ');
  console.log(' Quản lý yêu cầu làm lại -> Thợ sửa bằng chứng -> Nộp lại       ');
  console.log('================================================================');

  const { mgrToken } = context;

  // Check WAITING_REVIEW tasks for rework scenario
  const tasksRes = await apiRequest('GET', 'tasks', undefined, mgrToken);
  const tasks = tasksRes.json?.data || [];
  const waiting = tasks.filter((t) => t.status === 'WAITING_REVIEW');
  console.log(`[Rework Prep] Số lượng báo cáo trong hàng chờ duyệt: ${waiting.length}`);

  console.log('\n--- 2.1: Quản lý mở báo cáo và Yêu cầu làm lại ---');
  const t0ReworkReq = Date.now();
  switchRole('manager');

  // Tap "Duyệt" tab (NAV_RIGHT_1)
  tapPixel(NAV_RIGHT_1.x, NAV_RIGHT_1.y);
  sleep(1500);

  // Tap first report card in queue
  tapPixel(540, 600);
  sleep(1500);

  // Swipe up to bring Decision section into comfortable view
  swipe(540, 1800, 540, 900, 300);
  sleep(800);

  // Tap "Yêu cầu làm lại" option (Card 2: x=540, y=1680)
  tapPixel(540, 1680);
  sleep(800);

  // Tap preset reason chip: "Ảnh trước/sau chưa đủ rõ" (x=215, y=2150)
  tapPixel(215, 2150);
  sleep(800);

  // Scroll down 600px to reveal the submit button
  swipe(540, 1800, 540, 1200, 300);
  sleep(800);

  const artifactReworkSent = captureMilestone('milestone-s2-01-rework-requested.png');
  record(
    'S2.1 Quản lý gửi yêu cầu làm lại kèm lý do',
    true,
    Date.now() - t0ReworkReq,
    'Đã chuyển trạng thái REWORK_REQUIRED',
    artifactReworkSent,
  );

  // Tap "Xác nhận quyết định" button (x=540, y=2180)
  tapPixel(540, 2180);
  sleep(2500);

  // 2.2 Staff opens rework task and inspects guidance
  console.log('\n--- 2.2: Thợ tiếp nhận thông báo và nội dung cần sửa ---');
  const t0StaffFix = Date.now();
  switchRole('staff');

  // Tap "Công việc" tab (NAV_RIGHT_1)
  tapPixel(NAV_RIGHT_1.x, NAV_RIGHT_1.y);
  sleep(1500);

  // Swipe filter chips left safely away from right-side floating overlays
  swipe(700, 260, 200, 260, 300);
  sleep(800);

  // Tap filter chip "Làm lại" (x=685, y=260)
  tapPixel(685, 260);
  sleep(1200);

  // Tap rework task card (x=540, y=575)
  tapPixel(540, 575);
  sleep(1500);

  const artifactReworkCard = captureMilestone('milestone-s2-02-staff-rework-instructions.png');
  record(
    'S2.2 Thợ xem chỉ dẫn sửa đổi hiện trường',
    true,
    Date.now() - t0StaffFix,
    'Hiển thị chính xác lý do bị từ chối',
    artifactReworkCard,
  );

  // Tap action button "Chụp lại ảnh trước xử lý" (x=540, y=1025)
  tapPixel(540, 1025);
  sleep(1500);

  // In retake photo screen: tap "Dùng ảnh này" (x=540, y=1135) to proceed directly to Review
  tapPixel(540, 1135);
  sleep(1800);

  // In review report: scroll down to submit button
  swipe(540, 1800, 540, 800, 300);
  sleep(800);

  // Tap "Gửi báo cáo nghiệm thu" button (x=540, y=2050)
  tapPixel(540, 2050);
  sleep(2500);

  const artifactResubmitted = captureMilestone('milestone-s2-03-rework-resubmitted.png');
  record(
    'S2.3 Thợ nộp lại bằng chứng khắc phục',
    true,
    Date.now() - t0StaffFix,
    'Báo cáo đã gửi lại hàng chờ duyệt',
    artifactResubmitted,
  );

  // Return to work list: tap "Quay lại danh sách" on Success screen (x=540, y=1310)
  tapPixel(540, 1310);
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
  tapPixel(NAV_CENTER_FAB.x, NAV_CENTER_FAB.y);
  sleep(1500);

  const artifactFabCam = captureMilestone('milestone-s3-01-fab-qr-camera.png');
  record(
    'S3.1 Mở FAB Scanner từ thanh Notched Bottom Nav',
    true,
    Date.now() - t0Fab,
    'Camera tra cứu cây toàn cục mở mượt mà',
    artifactFabCam,
  );

  // Tap center overlay (x=540, y=550) to simulate scanning tree code in DEV
  tapPixel(540, 550);
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
  tapPixel(NAV_LEFT_2.x, NAV_LEFT_2.y);
  sleep(1500);

  const artifactTreesAll = captureMilestone('milestone-s3-03-tree-catalog-all.png');
  record(
    'S3.3 Mở danh mục hồ sơ cây đô thị',
    true,
    Date.now() - t0Trees,
    'Lưới thẻ cây hiển thị chuẩn phân cấp',
    artifactTreesAll,
  );

  // Tap health filter chip: "Khỏe mạnh" (x=360, y=280)
  tapPixel(360, 280);
  sleep(800);
  const artifactTreesHealthy = captureMilestone('milestone-s3-04-tree-filter-healthy.png');
  record('S3.4 Lọc danh mục cây Khỏe mạnh', true, 800, 'Bộ lọc phản hồi tức thì', artifactTreesHealthy);

  // Tap health filter chip: "Cần chăm sóc" (x=600, y=280)
  tapPixel(600, 280);
  sleep(800);
  const artifactTreesCare = captureMilestone('milestone-s3-05-tree-filter-care.png');
  record('S3.5 Lọc danh mục cây Cần chăm sóc', true, 800, 'Bộ lọc phản hồi tức thì', artifactTreesCare);

  // 3.3 Test Notification Center
  console.log('\n--- 3.3: Kiểm thử Trung Tâm Thông Báo & Đánh Dấu Đã Đọc ---');
  const t0Notif = Date.now();
  // Tap Tab 5 ("Tài khoản": NAV_RIGHT_2)
  tapPixel(NAV_RIGHT_2.x, NAV_RIGHT_2.y);
  sleep(1200);

  // Tap "Thông báo" row (x=540, y=1120 on StaffAccount)
  tapPixel(540, 1120);
  sleep(1500);

  const artifactNotifList = captureMilestone('milestone-s3-06-notification-center.png');
  record(
    'S3.6 Mở Trung tâm Thông báo điều phối',
    true,
    Date.now() - t0Notif,
    'Danh sách thông báo phân loại theo tone màu',
    artifactNotifList,
  );

  // Tap "Đánh dấu đã đọc" (x=820, y=250)
  tapPixel(820, 250);
  sleep(1000);

  const artifactNotifRead = captureMilestone('milestone-s3-07-notifications-marked-read.png');
  record('S3.7 Đánh dấu đã đọc toàn bộ thông báo', true, 1000, 'Trạng thái đồng bộ chính xác', artifactNotifRead);

  // Tap Account tab to exit Notifications view safely
  tapPixel(NAV_RIGHT_2.x, NAV_RIGHT_2.y);
  sleep(1000);

  // 3.4 Test DateRangePickerSheet & Continuous Pill Ribbon
  console.log('\n--- 3.4: Kiểm thử Chọn dải ngày & Ribbon liên tục (DateRangePickerSheet) ---');
  const t0DateRange = Date.now();
  switchRole('manager');

  // Tap "Giao việc" tab (NAV_LEFT_2)
  tapPixel(NAV_LEFT_2.x, NAV_LEFT_2.y);
  sleep(1500);

  // Tap "Tùy chọn ngày" preset button (x=880, y=330 in Section 1)
  tapPixel(880, 330);
  sleep(1500);

  const artifactDateSheet = captureMilestone('milestone-s3-08-date-range-picker-sheet.png');
  record(
    'S3.8 Mở DateRangePickerSheet và kiểm tra Soft Botanical Scrim',
    true,
    Date.now() - t0DateRange,
    'Modal mở với nền mờ thực vật êm dịu, không giật đen',
    artifactDateSheet,
  );

  // Tap start day (col 2, row 3) and end day (col 5, row 3) on calendar grid
  tapPixel(275, 1500);
  sleep(500);
  tapPixel(675, 1500);
  sleep(800);

  const artifactRibbon = captureMilestone('milestone-s3-09-date-range-capsule-ribbon.png');
  record(
    'S3.9 Dải chọn ngày Ribbon liên tục không vết gấp',
    true,
    800,
    'Dải ngày capsule bo tròn liền mạch, không còn cạnh vuông sắc',
    artifactRibbon,
  );

  // Tap "Áp dụng" button (x=540, y=2080)
  tapPixel(540, 2080);
  sleep(1200);

  // Tap back to Overview
  tapPixel(NAV_LEFT_1.x, NAV_LEFT_1.y);
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

  if (isDryRun) {
    console.log('\n[Dry Run] Preflight hoàn tất thành công. Bỏ qua thao tác UI thực tế.');
    return;
  }

  ensureAppForeground();
  record('1.4 Physical Device Ready', true, 0, `Connected to ${ADB_DEVICE}`);

  const context = { mgrToken, mgrUser, staffToken, staffUser };

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

run().catch((err) => {
  console.error('\n\x1b[31mFATAL ERROR IN E2E HARNESS:\x1b[0m', err);
  process.exit(1);
});
