/**
 * NOVYX GreenOps — Strict 3-role acceptance E2E on a physical Android device.
 *
 * Differences from mobile-lifecycle-e2e.cjs:
 *  - No blind fallback taps: a missing target is a FAIL, never a coordinate guess.
 *  - No hard-coded PASS: every step asserts visible UI and, where state changes, the API.
 *  - Every captured screen runs an invariant sweep (foreground, RedBox/LogBox, raw enum/email/undefined leakage,
 *    small touch targets) and records WARN/FAIL findings for the UX audit.
 *
 * Usage: node scripts/mobile-role-acceptance-e2e.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const h = require('./mobile-lifecycle-e2e.cjs');

const { SMOKE_DIR, STAFF_EMAIL, SUPERVISOR_EMAIL, MANAGER_EMAIL, DEV_PASSWORD } = h.constants;
const OUT_DIR = path.join(SMOKE_DIR, 'acceptance');
fs.mkdirSync(OUT_DIR, { recursive: true });

const DENSITY = 315 / 160; // device override density → px per dp
const MIN_TOUCH_PX = Math.round(44 * DENSITY) - 4;
const NAV_MIN_Y = 2150;

const steps = [];
const findings = [];
let shotIndex = 0;

class StepFailure extends Error {}

function log(msg) {
  console.log(msg);
}

function record(id, name, ok, detail, artifact) {
  steps.push({ id, name, ok, detail, artifact });
  log(
    `${ok ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m'} ${id} ${name}: ${detail}${artifact ? ` -> ${artifact}` : ''}`,
  );
}

function finding(severity, screen, message) {
  if (findings.some((f) => f.screen === screen && f.message === message)) return;
  findings.push({ severity, screen, message });
  log(`  [${severity}] ${screen}: ${message}`);
}

function appNodes() {
  return h.dumpUiNodes().filter((n) => !n.packageName || n.packageName === 'com.novyx.greenops');
}

function dismissDevMenuIfPresent() {
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const rawNodes = h.dumpUiNodes();
      const hasDevMenu = rawNodes.some((n) =>
        /Toggle Dev Menu|Runtime version|Fast Refresh|React Native dev menu/.test(`${n.text} ${n.contentDesc}`),
      );
      if (!hasDevMenu) break;
      const closeBtn = h.findNode(rawNodes, ['Close']);
      if (closeBtn) {
        h.tapPixel(closeBtn.centerX, closeBtn.centerY);
      } else {
        h.adbExec(['shell', 'input', 'keyevent', '4']);
      }
      h.sleep(1200);
    }
  } catch {
    // Ignore dump errors during dismiss
  }
}

function visible(patterns, opts = {}) {
  return h.findNode(appNodes(), patterns, opts);
}

function waitFor(patterns, { timeoutMs = 12000, ...opts } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const nodes = appNodes();
    const node = h.findNode(nodes, patterns, opts);
    if (node) return node;
    h.sleep(600);
  }
  return null;
}

/** Strict tap: scrolls to find the target; throws StepFailure instead of guessing coordinates. */
function tap(patterns, { maxScrolls = 3, ...opts } = {}) {
  h.ensureAppForeground();
  for (let attempt = 0; attempt <= maxScrolls; attempt++) {
    const nodes = appNodes();
    const node = h.findNode(nodes, patterns, opts);
    if (node) {
      h.tapPixel(node.centerX, node.centerY);
      return node;
    }
    if (attempt < maxScrolls) {
      h.swipe(540, 1700, 540, 900, 350);
      h.sleep(600);
    }
  }
  throw new StepFailure(`Không tìm thấy phần tử: ${JSON.stringify(patterns.map(String))}`);
}

function tapNav(label) {
  return tap([label], { minY: NAV_MIN_Y, maxScrolls: 0 });
}

function scrollTop() {
  for (let i = 0; i < 3; i++) {
    h.swipe(540, 700, 540, 1800, 250);
    h.sleep(250);
  }
}

function pullToRefresh() {
  scrollTop();
  h.swipe(540, 500, 540, 1500, 450);
  h.sleep(1800);
}

function hardwareBack() {
  h.adbExec(['shell', 'input', 'keyevent', '4']);
  h.sleep(1200);
}

function isAppForeground() {
  try {
    const out = h.adbExec(['shell', 'dumpsys', 'window']);
    const focusLines = out.split('\n').filter((l) => l.includes('mCurrentFocus') || l.includes('mFocusedApp'));
    const isNovyx = focusLines.some((l) => l.includes('com.novyx.greenops'));
    if (!isNovyx) {
      h.adbExec(['shell', 'input', 'keyevent', '224']);
      h.adbExec(['shell', 'wm', 'dismiss-keyguard']);
      h.sleep(400);
      const retryOut = h.adbExec(['shell', 'dumpsys', 'window']);
      const retryLines = retryOut.split('\n').filter((l) => l.includes('mCurrentFocus') || l.includes('mFocusedApp'));
      return retryLines.some((l) => l.includes('com.novyx.greenops'));
    }
    return true;
  } catch {
    return false;
  }
}

const LEAK_PATTERNS = [
  { re: /@novyx\.local/i, msg: 'Lộ email kỹ thuật (@novyx.local)' },
  { re: /\b(undefined|null|NaN|\[object Object\])\b/, msg: 'Lộ giá trị lập trình (undefined/null/NaN)' },
  {
    re: /\b(PENDING|IN_PROGRESS|WAITING_REVIEW|REWORK_REQUIRED|COMPLETED|CANCELLED|BLOCKED|CHANGE_PROOF|APPROVE_WITH_EXCEPTION|REQUEST_REWORK)\b/,
    msg: 'Lộ enum nội bộ',
  },
  { re: /\b(TSK|TRE|STF|TT)-[A-Za-z0-9]{3,}/, msg: 'Lộ mã định danh nội bộ trong nhãn' },
  { re: /\b(Error|Exception|Failed to fetch|Network request failed|ECONNREFUSED)\b/, msg: 'Lộ lỗi kỹ thuật thô' },
];

/** Screenshot + invariant sweep. Returns relative artifact path. */
function shot(screen) {
  shotIndex += 1;
  const name = `acceptance-${String(shotIndex).padStart(2, '0')}-${screen}.png`;
  const artifact = h.captureMilestone(name);
  const all = h.dumpUiNodes();

  if (!isAppForeground()) finding('FAIL', screen, 'Ứng dụng không ở tiền cảnh (bị văng hoặc chuyển app)');
  if (
    all.some((n) =>
      /Console Error|Render Error|Uncaught \(in promise|Log \d+ of \d+/.test(`${n.text} ${n.contentDesc}`),
    )
  ) {
    finding('FAIL', screen, 'Xuất hiện RedBox/LogBox lỗi runtime');
  }

  const nodes = all.filter((n) => n.packageName === 'com.novyx.greenops');
  for (const n of nodes) {
    const value = `${n.text} ${n.contentDesc}`.trim();
    if (!value) continue;
    for (const p of LEAK_PATTERNS) {
      if (p.re.test(value)) finding('WARN', screen, `${p.msg}: "${value.slice(0, 80)}"`);
    }
  }

  const small = nodes.filter((n) => {
    if (!n.clickable || n.bounds.top < 60) return false;
    const w = n.bounds.right - n.bounds.left;
    const hgt = n.bounds.bottom - n.bounds.top;
    return Math.min(w, hgt) < MIN_TOUCH_PX;
  });
  for (const n of small.slice(0, 4)) {
    const w = Math.round((n.bounds.right - n.bounds.left) / DENSITY);
    const hgt = Math.round((n.bounds.bottom - n.bounds.top) / DENSITY);
    finding(
      'WARN',
      screen,
      `Vùng chạm < 44dp (${w}×${hgt}dp): "${(n.text || n.contentDesc || n.className).slice(0, 50)}"`,
    );
  }
  return artifact;
}

async function step(id, name, fn) {
  try {
    const { detail, artifact } = (await fn()) || {};
    record(id, name, true, detail || 'OK', artifact);
    return true;
  } catch (err) {
    let artifact;
    try {
      artifact = shot(`${id}-failure`);
    } catch {
      // capture best effort
    }
    const message = err instanceof StepFailure ? err.message : String(err?.message || err);
    record(id, name, false, message, artifact);
    log(`\n\x1b[31m[FAIL-FAST] Bước ${id} "${name}" THẤT BẠI: ${message}\x1b[0m`);
    log(`\x1b[31m[FAIL-FAST] Dừng kiểm thử ngay lập tức tại bước lỗi (không chạy các bước sau).\x1b[0m\n`);
    finish();
    process.exit(1);
  }
}

function assert(cond, message) {
  if (!cond) throw new StepFailure(message);
}

async function apiLogin(email) {
  const res = await h.apiRequest('POST', 'auth/login', { identifier: email, password: DEV_PASSWORD });
  const session = res.json?.data?.session || res.json?.session;
  return { token: session?.accessToken, user: session?.user };
}

async function getTask(token, id) {
  const res = await h.apiRequest('GET', `tasks/${id}`, undefined, token);
  return res.json?.data;
}

async function waitTask(token, id, predicate, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let task;
  while (Date.now() < deadline) {
    task = await getTask(token, id);
    if (task && predicate(task)) return task;
    h.sleep(1200);
  }
  return task;
}

function logoutIfNeeded() {
  dismissDevMenuIfPresent();
  if (visible(['Email hoặc Số điện thoại', 'Đăng nhập vào GreenOps'])) return;
  for (let i = 0; i < 3; i++) {
    const nodes = h.dumpUiNodes();
    const closeBtn = h.findNode(nodes, ['Đóng', 'Đóng lớp phủ', 'Hủy', 'Quay lại']);
    if (closeBtn) {
      h.tapPixel(closeBtn.centerX, closeBtn.centerY);
      h.sleep(600);
    } else {
      break;
    }
  }
  h.safelyExitToMain();
  dismissDevMenuIfPresent();
  if (visible(['Email hoặc Số điện thoại', 'Đăng nhập vào GreenOps'])) return;
  tapNav('Tài khoản');
  h.sleep(900);
  tap(['Đăng xuất'], { maxScrolls: 2 });
  assert(
    waitFor(['Email hoặc Số điện thoại', 'Đăng nhập vào GreenOps'], { timeoutMs: 6000 }),
    'Không về màn hình Đăng nhập sau khi Đăng xuất',
  );
}

function login(email, expectNav) {
  logoutIfNeeded();
  h.loginOnDevice(email, DEV_PASSWORD);
  assert(
    waitFor([expectNav], { minY: NAV_MIN_Y, timeoutMs: 15000 }),
    `Không vào được khu vực chính (chờ tab "${expectNav}")`,
  );
}

async function run() {
  const device = h.initDevice();
  log('================================================================');
  log(' NOVYX GreenOps — STRICT 3-ROLE ACCEPTANCE E2E');
  log(` Device: ${device}`);
  log('================================================================');

  const mgr = await apiLogin(MANAGER_EMAIL);
  const staff = await apiLogin(STAFF_EMAIL);
  const sup = await apiLogin(SUPERVISOR_EMAIL);
  record(
    'P0',
    'API auth cho 3 vai trò',
    Boolean(mgr.token && staff.token && sup.token),
    `manager=${!!mgr.token} staff=${!!staff.token} supervisor=${!!sup.token}`,
  );
  if (!mgr.token || !staff.token || !sup.token) return finish();

  h.grantRuntimePermissions();
  h.ensurePortReverses();
  h.launchMetroDeepLink(true);

  // adb `input text` only types ASCII reliably.
  const uniqueTitle = `E2E nghiem thu ${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
  let taskId = null;

  // ───────────── MANAGER: create task through the real form ─────────────
  await step('M1', 'Quản lý tạo việc qua form Giao việc', async () => {
    login(MANAGER_EMAIL, 'Tổng quan');
    shot('M1-manager-dashboard');
    tapNav('Giao việc');
    assert(waitFor(['Tạo việc']), 'Không mở được màn hình Tạo việc');
    tap(['3 ngày tới'], { maxScrolls: 0 });
    h.sleep(400);
    const titleField = tap(['Ví dụ: Cắt tỉa', 'Tiêu đề công việc'], { maxScrolls: 1 });
    h.sleep(300);
    h.fastClearInput(30);
    h.typeText(uniqueTitle.replace(/ /g, '%s'));
    h.closeKeyboard();
    assert(titleField, 'Không có ô Tiêu đề');

    tap([/^Cây mục tiêu/], { maxScrolls: 2 });
    assert(waitFor(['Áp dụng phạm vi']), 'Không mở sheet chọn phạm vi cây');
    tap(['1 cây đơn lẻ'], { maxScrolls: 0 });
    h.sleep(500);
    tap(['Cây sao đen khu A'], { maxScrolls: 2 });
    h.sleep(300);
    shot('M1-tree-scope-sheet');
    tap(['Áp dụng phạm vi'], { maxScrolls: 0 });
    h.sleep(900);

    tap([/^Người thực hiện/], { maxScrolls: 2 });
    assert(waitFor(['Chọn nhân viên']), 'Không mở danh sách nhân viên');
    tap([/staff@novyx\.local|Nhân viên/], { minY: 300, maxScrolls: 1 });
    h.sleep(700);

    tap([/^Loại công việc/], { maxScrolls: 2 });
    assert(waitFor(['Chọn loại công việc']), 'Không mở danh sách loại việc');
    h.sleep(600);
    const typeRow =
      tap(['Cắt tỉa thử nghiệm', /Cắt tỉa/, /Chăm sóc/], { maxScrolls: 1 }) ||
      (() => {
        const row = h
          .dumpUiNodes()
          .filter((n) => n.packageName === 'com.novyx.greenops' && n.clickable && n.centerY > 450 && n.centerY < 2250)
          .find((n) => !/Xóa tìm kiếm|Đóng/.test(n.contentDesc));
        if (row) {
          h.tapPixel(row.centerX, row.centerY);
          return row;
        }
        return null;
      })();
    assert(typeRow, 'Danh sách loại công việc trống');
    h.sleep(700);

    assert(
      waitFor(['Đã đủ thông tin để tạo việc'], { timeoutMs: 3000 }) ||
        (h.swipe(540, 1700, 540, 900, 300), waitFor(['Đã đủ thông tin để tạo việc'], { timeoutMs: 3000 })),
      'Form chưa đủ điều kiện tạo việc',
    );
    const artifact = shot('M1-create-form-ready');
    tap(['Khởi tạo công việc'], { maxScrolls: 2 });
    h.sleep(3000);

    const list = await h.apiRequest('GET', 'tasks', undefined, mgr.token);
    const created = (list.json?.data || []).find((t) => t.title === uniqueTitle);
    assert(created, `API không có task "${uniqueTitle}" sau khi bấm Khởi tạo`);
    taskId = created.id;
    assert(created.assignedStaffId === staff.user.id, 'Task không giao đúng staff đã chọn');
    return { detail: `Tạo ${taskId} (status=${created.status}) giao cho staff`, artifact };
  });
  if (!taskId) return finish();

  // ───────────── STAFF: field check-in ─────────────
  await step('S1', 'Nhân viên mở việc từ danh sách (kéo làm mới)', async () => {
    login(STAFF_EMAIL, 'Trang chủ');
    shot('S1-staff-home');
    tapNav('Công việc');
    assert(waitFor(['việc đang mở']), 'Không mở được tab Công việc');
    pullToRefresh();
    tap([`Mở công việc ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Chi tiết công việc']), 'Không mở được Chi tiết công việc');
    return { detail: 'Danh sách hiển thị việc mới sau khi kéo làm mới', artifact: shot('S1-staff-detail') };
  });

  await step('S2', 'Nút Back vật lý ở Chi tiết → quay về danh sách, không thoát app', async () => {
    hardwareBack();
    assert(isAppForeground(), 'Bấm Back vật lý làm thoát ứng dụng');
    assert(waitFor(['việc đang mở'], { timeoutMs: 4000 }), 'Back không quay về danh sách Công việc');
    tap([`Mở công việc ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Chi tiết công việc']), 'Không mở lại được Chi tiết công việc');
    return { detail: 'Back lùi đúng 1 cấp trong app' };
  });

  await step('S3', 'Nhân viên GPS → QR → Checklist → Gửi xác nhận', async () => {
    tap(['Xác thực vị trí GPS tại gốc cây', 'Bắt đầu', 'Xác thực vị trí GPS'], { maxScrolls: 2 });
    h.sleep(1200);
    assert(waitFor(['Xác minh GPS', 'Khoảng cách tới cây'], { timeoutMs: 20000 }), 'Không vào được bước Xác minh GPS');
    h.sleep(1500);
    shot('S3-gps');
    tap([/^Check-in$/, 'Báo ngoại lệ'], { maxScrolls: 3 });
    h.sleep(600);
    if (visible(['Tán cây rậm rạp làm trôi tín hiệu GPS', 'Tán cây rậm rạp', 'Báo ngoại lệ vị trí hiện trường'])) {
      tap(['Tán cây rậm rạp làm trôi tín hiệu GPS', /Tán cây rậm rạp/], { maxScrolls: 2 });
      h.sleep(400);
      tap(['Xác nhận ngoại lệ & Tiếp tục', /Xác nhận ngoại lệ/], { maxScrolls: 2 });
    }
    assert(
      waitFor(['Quét mã QR cây', 'Đưa mã QR vào khung'], { timeoutMs: 8000 }),
      'Không vào được bước quét QR (Check-in bị khóa?)',
    );
    h.sleep(800);
    tap(['Nhập mã cây bằng tay', 'Nhập mã cây'], { maxScrolls: 2 });
    assert(waitFor(['Nhập mã cây thủ công', 'Cây theo nhiệm vụ']), 'Không mở được modal nhập mã cây thủ công');
    tap(['Xác nhận đúng cây này', /Xác nhận đúng cây/, /Chọn mã cây/], { maxScrolls: 2 });
    assert(waitFor(['Checklist tác nghiệp'], { timeoutMs: 6000 }), 'Không vào được Checklist sau khi xác nhận cây');
    for (const n of appNodes().filter((x) => x.contentDesc.startsWith('Đánh dấu '))) {
      h.tapPixel(n.centerX, n.centerY);
      h.sleep(350);
    }
    shot('S3-checklist');
    tap(['Xem lại & Gửi xác nhận hiện trường', /Xem lại.*Gửi xác nhận/], { maxScrolls: 2 });
    assert(
      waitFor(['Định vị GPS, mã QR và Checklist hợp lệ', /Checklist hợp lệ/i], { timeoutMs: 5000 }),
      'Màn Xem lại chưa xác nhận đủ 3/3',
    );
    shot('S3-review');
    tap(['Gửi định vị GPS & Xác nhận hoàn thành', /Gửi định vị GPS/], { maxScrolls: 3 });
    const t = await waitTask(mgr.token, taskId, (x) => Boolean(x.staffCompletedAt));
    assert(t?.staffCompletedAt, `API chưa ghi staffCompletedAt (status=${t?.status})`);
    assert(waitFor(['Đã gửi xác nhận hiện trường'], { timeoutMs: 6000 }), 'Không hiển thị màn hình thành công');
    const artifact = shot('S3-success');
    tap(['Quay lại danh sách'], { maxScrolls: 0 });
    return { detail: `API staffCompletedAt=${t.staffCompletedAt}`, artifact };
  });

  // ───────────── SUPERVISOR: photos ─────────────
  await step('V1', 'Giám sát chụp ảnh Trước/Sau và gửi bằng chứng', async () => {
    login(SUPERVISOR_EMAIL, 'Trang chủ');
    shot('V1-supervisor-home');
    tapNav('Công việc');
    assert(waitFor(['Công việc giám sát']), 'Không mở được Công việc giám sát');
    pullToRefresh();
    tap([`Mở công việc ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Xác thực vị trí GPS Giám sát']), 'Chi tiết không có hành động GPS Giám sát');
    shot('V1-supervisor-detail');
    tap(['Xác thực vị trí GPS Giám sát'], { maxScrolls: 2 });
    h.sleep(1200);
    assert(waitFor(['Xác minh GPS', 'Khoảng cách tới cây'], { timeoutMs: 20000 }), 'Không vào bước GPS Giám sát');
    h.sleep(1200);
    tap([/^Check-in$/, 'Báo ngoại lệ'], { maxScrolls: 3 });
    h.sleep(600);
    if (visible(['Tán cây rậm rạp làm trôi tín hiệu GPS', 'Tán cây rậm rạp', 'Báo ngoại lệ vị trí hiện trường'])) {
      tap(['Tán cây rậm rạp làm trôi tín hiệu GPS', /Tán cây rậm rạp/], { maxScrolls: 2 });
      h.sleep(400);
      tap(['Xác nhận ngoại lệ & Tiếp tục', /Xác nhận ngoại lệ/], { maxScrolls: 2 });
    }
    for (const label of ['trước', 'sau']) {
      assert(waitFor([`Chụp ảnh ${label} xử lý`], { timeoutMs: 8000 }), `Không vào bước chụp ảnh ${label}`);
      h.sleep(1500);
      tap([/^Chụp ảnh$/], { maxScrolls: 0 });
      assert(waitFor(['Dùng ảnh này'], { timeoutMs: 8000 }), `Chụp ảnh ${label} thất bại`);
      shot(`V1-photo-${label === 'trước' ? 'before' : 'after'}`);
      tap(['Dùng ảnh này'], { maxScrolls: 0 });
    }
    assert(
      waitFor(['Vị trí Giám sát và ảnh Trước/Sau hợp lệ'], { timeoutMs: 6000 }),
      'Màn Xem lại giám sát chưa hợp lệ',
    );
    shot('V1-review');
    tap(['Gửi bằng chứng giám sát'], { maxScrolls: 3 });
    const t = await waitTask(mgr.token, taskId, (x) => x.status === 'WAITING_REVIEW', 30000);
    assert(t?.status === 'WAITING_REVIEW', `API status=${t?.status}, kỳ vọng WAITING_REVIEW`);
    assert(t.beforePhoto && t.afterPhoto, 'API thiếu ảnh trước/sau');
    const artifact = shot('V1-success');
    if (visible(['Quay lại danh sách'])) tap(['Quay lại danh sách'], { maxScrolls: 0 });
    return { detail: 'API WAITING_REVIEW, có đủ ảnh trước/sau', artifact };
  });

  // ───────────── MANAGER: request rework ─────────────
  await step('M2', 'Quản lý yêu cầu làm lại "Checklist còn thiếu"', async () => {
    login(MANAGER_EMAIL, 'Tổng quan');
    tapNav('Duyệt');
    assert(waitFor(['Duyệt báo cáo']), 'Không mở được hàng chờ Duyệt');
    pullToRefresh();
    h.sleep(1200);
    tap([`Mở báo cáo ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Duyệt bằng chứng']), 'Không mở được chi tiết báo cáo');
    shot('M2-review-detail');
    tap(['Yêu cầu làm lại'], { maxScrolls: 4 });
    h.sleep(500);
    tap(['Checklist còn thiếu'], { maxScrolls: 2 });
    shot('M2-rework-selected');
    tap(['Xác nhận quyết định'], { maxScrolls: 3 });
    const t = await waitTask(mgr.token, taskId, (x) => x.status === 'REWORK_REQUIRED');
    assert(t?.status === 'REWORK_REQUIRED', `API status=${t?.status}`);
    assert(waitFor(['Duyệt báo cáo'], { timeoutMs: 6000 }), 'Không quay lại hàng chờ sau khi xác nhận');
    return { detail: `API REWORK_REQUIRED, reworkTarget=${t.reworkTarget}` };
  });

  // ───────────── STAFF: rework (BA-01) ─────────────
  await step('S4', 'Nhân viên nhận làm lại Checklist và nộp lại', async () => {
    login(STAFF_EMAIL, 'Trang chủ');
    tapNav('Công việc');
    assert(waitFor(['việc đang mở']), 'Không mở được tab Công việc');
    pullToRefresh();
    tap([`Mở công việc ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Nội dung cần làm lại']), 'Không hiển thị hộp Nội dung cần làm lại');
    assert(visible(['Cần cập nhật']), 'Huy hiệu không hiển thị "Cần cập nhật" (BA-01)');
    assert(!visible(['Đã đủ']), 'Huy hiệu mâu thuẫn "Đã đủ" vẫn hiển thị');
    shot('S4-staff-rework-detail');
    tap(['Kiểm tra lại danh mục công việc'], { maxScrolls: 2 });
    assert(waitFor(['Checklist tác nghiệp'], { timeoutMs: 6000 }), 'Không vào lại Checklist');
    tap(['Xem lại & Gửi xác nhận hiện trường', /Xem lại.*Gửi xác nhận/], { maxScrolls: 2 });
    h.sleep(1000);
    shot('S4-staff-rework-review');
    tap(['Gửi định vị GPS & Xác nhận hoàn thành', 'Nộp lại xác nhận hiện trường', /Nộp lại/], { maxScrolls: 3 });
    const t = await waitTask(mgr.token, taskId, (x) => x.status !== 'REWORK_REQUIRED', 20000);
    assert(t && t.status !== 'REWORK_REQUIRED', `API vẫn REWORK_REQUIRED sau khi nộp lại`);
    return { detail: `API status=${t.status}`, artifact: shot('S4-staff-rework-submitted') };
  });

  // ───────────── MANAGER: approve ─────────────
  await step('M3', 'Quản lý phê duyệt nghiệm thu', async () => {
    const before = await waitTask(mgr.token, taskId, (x) => x.status === 'WAITING_REVIEW', 20000);
    assert(before?.status === 'WAITING_REVIEW', `Task chưa vào hàng chờ (status=${before?.status}) — không thể duyệt`);
    login(MANAGER_EMAIL, 'Tổng quan');
    tapNav('Duyệt');
    assert(waitFor(['Duyệt báo cáo']), 'Không mở được hàng chờ Duyệt');
    pullToRefresh();
    h.sleep(1200);
    tap([`Mở báo cáo ${uniqueTitle}`, uniqueTitle], { maxScrolls: 4 });
    assert(waitFor(['Duyệt bằng chứng']), 'Không mở được chi tiết báo cáo');
    tap(['Duyệt nghiệm thu'], { maxScrolls: 4 });
    tap(['Xác nhận quyết định'], { maxScrolls: 3 });
    const t = await waitTask(mgr.token, taskId, (x) => x.status === 'COMPLETED');
    assert(t?.status === 'COMPLETED', `API status=${t?.status}`);
    return { detail: 'API COMPLETED', artifact: shot('M3-approved') };
  });

  // ───────────── FEATURE SWEEP ─────────────
  await step('F1', 'Quản lý: Hồ sơ cây, mở rộng thẻ, QR tra cứu, Tài khoản', async () => {
    login(MANAGER_EMAIL, 'Tổng quan');
    tap(['Cây chú ý'], { maxScrolls: 2 });
    assert(waitFor(['Hồ sơ cây']), 'Không mở được Hồ sơ cây từ Tổng quan');
    shot('F1-manager-trees');
    hardwareBack();
    assert(isAppForeground() && waitFor(['Tổng quan'], { minY: NAV_MIN_Y }), 'Back từ Hồ sơ cây không về Tổng quan');
    tap(['Quét mã QR'], { minY: 2000, maxScrolls: 0 });
    h.sleep(1500);
    shot('F1-manager-qr');
    hardwareBack();
    tapNav('Tài khoản');
    assert(waitFor(['Đăng xuất']), 'Không mở được Tài khoản');
    return { detail: 'Điều hướng Quản lý hoạt động', artifact: shot('F1-manager-account') };
  });

  await step('F2', 'Nhân viên: Cây của tôi, lọc, Quét QR tự do, Thông báo', async () => {
    login(STAFF_EMAIL, 'Trang chủ');
    tapNav('Cây của tôi');
    assert(waitFor(['Tìm cây', 'Chưa có cây được phân công']), 'Không mở được Cây của tôi');
    shot('F2-staff-trees');
    tap(['Quét mã QR'], { minY: 2000, maxScrolls: 0 });
    assert(waitFor(['Quét QR cây']), 'Không mở được Quét QR cây');
    tap(['Nhập mã cây bằng tay', 'Nhập mã cây'], { maxScrolls: 2 });
    assert(waitFor(['Nhập mã cây thủ công', 'Gợi ý danh mục cây']), 'Không mở được modal nhập mã cây thủ công');
    tap([/Chọn mã cây/, 'Cây sao đen'], { maxScrolls: 2 });
    assert(waitFor(['Đã tìm thấy', 'Chi tiết cây'], { timeoutMs: 6000 }), 'Tra cứu QR không trả kết quả');
    shot('F2-staff-qr-result');
    hardwareBack();
    assert(isAppForeground(), 'Back từ Quét QR làm thoát app');
    tapNav('Tài khoản');
    tap(['Thông báo'], { maxScrolls: 1 });
    assert(waitFor(['Cập nhật nhiệm vụ']), 'Không mở được Thông báo');
    return { detail: 'Điều hướng Nhân viên hoạt động', artifact: shot('F2-staff-notifications') };
  });

  return finish();
}

function finish() {
  const pass = steps.filter((s) => s.ok).length;
  const fail = steps.length - pass;
  const fFail = findings.filter((f) => f.severity === 'FAIL').length;
  const fWarn = findings.filter((f) => f.severity === 'WARN').length;
  const report = { at: new Date().toISOString(), pass, fail, findingFail: fFail, findingWarn: fWarn, steps, findings };
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  log('\n================ SUMMARY ================');
  log(`Steps: ${pass} PASS / ${fail} FAIL · Findings: ${fFail} FAIL / ${fWarn} WARN`);
  for (const s of steps) log(`| ${s.ok ? 'PASS' : 'FAIL'} | ${s.id} | ${s.name} | ${s.detail} |`);
  if (findings.length) {
    log('\nFindings:');
    for (const f of findings) log(`- [${f.severity}] ${f.screen}: ${f.message}`);
  }
  if (fail > 0 || fFail > 0) process.exitCode = 1;
}

run().catch((err) => {
  console.error('FATAL', err);
  finish();
  process.exitCode = 1;
});
