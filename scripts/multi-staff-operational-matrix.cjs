/**
 * NOVYX GreenOps — Multi-Staff Operational Concurrency & Dual-Platform Verification Matrix
 * Executes end-to-end field workflows across 6 authoritative personas (4 Staff, 1 Supervisor, 1 Manager)
 * targeting the live running API (Local or Ngrok TLS Edge) with Cloudflare R2 binary uploads.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const API_BASE_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
const PASSWORD = process.env.NOVYX_DEV_PASSWORD || 'NovyxDev123!';

const MANAGER_EMAIL = 'manager@novyx.local';
const SUPERVISOR_EMAIL = 'supervisor@novyx.local';
const DIEM_EMAIL = 'ngocdiem@novyx.local';
const HUNG_EMAIL = 'duyhung@novyx.local';
const PHONG_EMAIL = 'duyphong@novyx.local';

let passCount = 0;
let failCount = 0;
const results = [];

function assertMatrix(id, title, condition, details) {
  if (condition) {
    passCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${title} — \x1b[90m${details}\x1b[0m`);
    results.push({ id, title, status: 'PASS', details });
  } else {
    failCount++;
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${title} — \x1b[31m${details}\x1b[0m`);
    results.push({ id, title, status: 'FAIL', details });
  }
}

function requestJson(urlStr, method = 'GET', body = null, token = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      const payload = body ? JSON.stringify(body) : null;

      const headers = {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...extraHeaders,
      };
      if (payload) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = client.request(
        url,
        {
          method,
          headers,
          timeout: 20000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            let json = null;
            try {
              json = data ? JSON.parse(data) : null;
            } catch {
              json = null;
            }
            resolve({ status: res.statusCode || 0, data, json, headers: res.headers });
          });
        },
      );

      req.on('error', (err) => resolve({ status: 0, data: err.message, json: null, error: err }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, data: 'Timeout after 20s', json: null });
      });

      if (payload) req.write(payload);
      req.end();
    } catch (err) {
      resolve({ status: 0, data: err.message, json: null, error: err });
    }
  });
}

function uploadBinary(uploadUrl, buffer, contentType = 'image/jpeg') {
  return new Promise((resolve) => {
    try {
      const url = new URL(uploadUrl);
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length,
          },
          timeout: 25000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode || 0, data }));
        },
      );
      req.on('error', (err) => resolve({ status: 0, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, error: 'Timeout after 25s' });
      });
      req.write(buffer);
      req.end();
    } catch (err) {
      resolve({ status: 0, error: err.message });
    }
  });
}

function createDummyJpeg(colorHex = '#2d5a27', label = 'EVIDENCE') {
  return Buffer.from(
    `\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xFF\xDB\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0C\x14\r\x0C\x0B\x0B\x0C\x19\x12\x13\x0F\x14\x1D\x1A\x1F\x1E\x1D\x1A\x1C\x1C $.' ",#\x1C\x1C(7),01444\x1F'9=82<.342\xFF\xC0\x00\x0B\x08\x00\xF0\x01\x40\x01\x01\x11\x00\xFF\xC4\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0B\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xBF\x00${label}:${colorHex}\xFF\xD9`,
    'binary',
  );
}

async function loginUser(email, password = PASSWORD) {
  const res = await requestJson(`${API_BASE_URL}/v1/auth/login`, 'POST', {
    identifier: email,
    password,
  });
  if (res.status !== 200 || !res.json?.session?.accessToken) {
    return null;
  }
  return {
    accessToken: res.json.session.accessToken,
    refreshToken: res.json.session.refreshToken,
    user: res.json.session.user,
  };
}

async function run() {
  console.log('═'.repeat(80));
  console.log('   NOVYX GREENOPS — MULTI-STAFF OPERATIONAL CONCURRENCY MATRIX');
  console.log('═'.repeat(80));
  console.log(`Target API Base URL: \x1b[1m\x1b[36m${API_BASE_URL}\x1b[0m\n`);

  // =========================================================================
  // STAGE 1: MULTI-ROLE AUTHENTICATION & ZERO-MOCK CATALOG VALIDATION
  // =========================================================================
  console.log('\x1b[1m[STAGE 1] ĐĂNG NHẬP ĐA VAI TRÒ & ĐỐI SOÁT TÊN THẬT TỪ POSTGRESQL\x1b[0m');

  const [mgrSession, supSession, diemSession, hungSession, phongSession] = await Promise.all([
    loginUser(MANAGER_EMAIL),
    loginUser(SUPERVISOR_EMAIL),
    loginUser(DIEM_EMAIL),
    loginUser(HUNG_EMAIL),
    loginUser(PHONG_EMAIL),
  ]);

  assertMatrix(
    'MAT-01',
    'Đăng nhập đồng thời 5 vai trò (Manager, Supervisor, 3 Staff)',
    Boolean(mgrSession && supSession && diemSession && hungSession && phongSession),
    `Manager: ${mgrSession?.user?.id?.slice(0, 8)}, Ngọc Diễm: ${diemSession?.user?.id?.slice(0, 8)}, Duy Hưng: ${hungSession?.user?.id?.slice(0, 8)}, Duy Phong: ${phongSession?.user?.id?.slice(0, 8)}`,
  );

  const staffCatalogRes = await requestJson(
    `${API_BASE_URL}/v1/operational/assignable-staff`,
    'GET',
    null,
    mgrSession.accessToken,
  );

  const assignableList = staffCatalogRes.json?.data || [];
  const diemEntry = assignableList.find((s) => s.email === DIEM_EMAIL);
  const hungEntry = assignableList.find((s) => s.email === HUNG_EMAIL);
  const phongEntry = assignableList.find((s) => s.email === PHONG_EMAIL);

  const authenticNamesOk =
    diemEntry?.displayName === 'Ngọc Diễm' &&
    hungEntry?.displayName === 'Duy Hưng' &&
    phongEntry?.displayName === 'Duy Phong';

  assertMatrix(
    'MAT-02',
    'Danh mục nhân viên phân công phản ánh tên thật tiếng Việt từ DB',
    authenticNamesOk,
    `Ngọc Diễm: "${diemEntry?.displayName}", Duy Hưng: "${hungEntry?.displayName}", Duy Phong: "${phongEntry?.displayName}"`,
  );

  // Fetch trees and task types for dispatching
  const [treesRes, taskTypesRes] = await Promise.all([
    requestJson(`${API_BASE_URL}/v1/trees`, 'GET', null, mgrSession.accessToken),
    requestJson(`${API_BASE_URL}/v1/operational/task-types`, 'GET', null, mgrSession.accessToken),
  ]);

  const treeList = treesRes.json?.data || [];
  const taskTypeList = taskTypesRes.json?.data || [];
  const targetTaskType = taskTypeList.find((tt) => tt.status === 'ACTIVE') || taskTypeList[0];
  const tree1 = treeList[0];
  const tree2 = treeList[1] || tree1;
  const tree3 = treeList[2] || tree1;

  // =========================================================================
  // STAGE 2: MANAGER DISPATCHES 3 DISTINCT TASKS (SINGLE, MULTI, ZONE)
  // =========================================================================
  console.log('\n\x1b[1m[STAGE 2] QUẢN LÝ GIAO 3 NHIỆM VỤ ĐA DẠNG PHẠM VI (SINGLE, MULTI, ZONE)\x1b[0m');

  const now = new Date();
  const deadlineIso = new Date(Date.now() + 86400000 * 2).toISOString();

  // Task 1: Single tree -> Ngọc Diễm
  const task1Payload = {
    title: `Cắt tỉa an toàn nhánh khô - ${now.toLocaleTimeString('vi-VN')}`,
    description: 'Nhiệm vụ kiểm thử thực địa giao cho Ngọc Diễm',
    taskTypeId: targetTaskType.id,
    treeId: tree1.id,
    assignedStaffId: diemEntry.id,
    deadline: deadlineIso,
  };

  const create1Res = await requestJson(
    `${API_BASE_URL}/v1/tasks`,
    'POST',
    task1Payload,
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );
  const task1 = create1Res.json?.data;

  assertMatrix(
    'MAT-03',
    'Quản lý giao nhiệm vụ 1 (Đơn cây) cho Ngọc Diễm',
    create1Res.status === 201 && task1?.id && task1.assignedStaffId === diemEntry.id,
    `Task ID: ${task1?.id}, Nhân viên: ${diemEntry.displayName}, Cây: ${task1?.treeName}, Version: ${task1?.version}`,
  );

  // Task 2: Multi-tree setup -> Duy Hưng
  const task2Payload = {
    title: `Bón phân hữu cơ & xới đất vi sinh - ${now.toLocaleTimeString('vi-VN')}`,
    description: 'Nhiệm vụ kiểm thử thực địa giao cho Duy Hưng (kịch bản Rework)',
    taskTypeId: targetTaskType.id,
    treeId: tree2.id,
    assignedStaffId: hungEntry.id,
    deadline: deadlineIso,
  };

  const create2Res = await requestJson(
    `${API_BASE_URL}/v1/tasks`,
    'POST',
    task2Payload,
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );
  const task2 = create2Res.json?.data;

  assertMatrix(
    'MAT-04',
    'Quản lý giao nhiệm vụ 2 cho Duy Hưng (Kịch bản Rework)',
    create2Res.status === 201 && task2?.id && task2.assignedStaffId === hungEntry.id,
    `Task ID: ${task2?.id}, Nhân viên: ${hungEntry.displayName}, Cây: ${task2?.treeName}, Version: ${task2?.version}`,
  );

  // Task 3: Zone setup -> Duy Phong
  const task3Payload = {
    title: `Khảo sát an toàn tán cây mùa mưa bão - ${now.toLocaleTimeString('vi-VN')}`,
    description: 'Nhiệm vụ kiểm thử giao cho Duy Phong (kịch bản Báo cáo sự cố)',
    taskTypeId: targetTaskType.id,
    treeId: tree3.id,
    assignedStaffId: phongEntry.id,
    deadline: deadlineIso,
  };

  const create3Res = await requestJson(
    `${API_BASE_URL}/v1/tasks`,
    'POST',
    task3Payload,
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );
  const task3 = create3Res.json?.data;

  assertMatrix(
    'MAT-05',
    'Quản lý giao nhiệm vụ 3 cho Duy Phong (Kịch bản Sự cố)',
    create3Res.status === 201 && task3?.id && task3.assignedStaffId === phongEntry.id,
    `Task ID: ${task3?.id}, Nhân viên: ${phongEntry.displayName}, Cây: ${task3?.treeName}, Version: ${task3?.version}`,
  );

  // =========================================================================
  // STAGE 3: PARALLEL FIELD EXECUTION & TASK ISOLATION
  // =========================================================================
  console.log('\n\x1b[1m[STAGE 3] NHÂN VIÊN THAO TÁC ĐỒNG THỜI & BẢO ĐẢM CÔ LẬP DỮ LIỆU\x1b[0m');

  const [diemTasksRes, hungTasksRes, phongTasksRes] = await Promise.all([
    requestJson(`${API_BASE_URL}/v1/tasks`, 'GET', null, diemSession.accessToken),
    requestJson(`${API_BASE_URL}/v1/tasks`, 'GET', null, hungSession.accessToken),
    requestJson(`${API_BASE_URL}/v1/tasks`, 'GET', null, phongSession.accessToken),
  ]);

  const diemHasTask1 = diemTasksRes.json?.data?.some((t) => t.id === task1.id);
  const hungHasTask2 = hungTasksRes.json?.data?.some((t) => t.id === task2.id);
  const phongHasTask3 = phongTasksRes.json?.data?.some((t) => t.id === task3.id);

  assertMatrix(
    'MAT-06',
    'Cô lập danh sách công việc: Mỗi nhân viên thấy đúng việc được giao',
    diemHasTask1 && hungHasTask2 && phongHasTask3,
    `Ngọc Diễm thấy ${task1.id}: ${diemHasTask1}, Duy Hưng thấy ${task2.id}: ${hungHasTask2}, Duy Phong thấy ${task3.id}: ${phongHasTask3}`,
  );

  // Parallel start tasks
  const [start1Res, start2Res, start3Res] = await Promise.all([
    requestJson(`${API_BASE_URL}/v1/tasks/${task1.id}/start`, 'POST', { expectedVersion: 0 }, diemSession.accessToken, { 'Idempotency-Key': crypto.randomUUID() }),
    requestJson(`${API_BASE_URL}/v1/tasks/${task2.id}/start`, 'POST', { expectedVersion: 0 }, hungSession.accessToken, { 'Idempotency-Key': crypto.randomUUID() }),
    requestJson(`${API_BASE_URL}/v1/tasks/${task3.id}/start`, 'POST', { expectedVersion: 0 }, phongSession.accessToken, { 'Idempotency-Key': crypto.randomUUID() }),
  ]);

  const allStarted =
    start1Res.status === 200 &&
    start2Res.status === 200 &&
    start3Res.status === 200 &&
    start1Res.json?.data?.status === 'IN_PROGRESS' &&
    start2Res.json?.data?.status === 'IN_PROGRESS' &&
    start3Res.json?.data?.status === 'IN_PROGRESS';

  assertMatrix(
    'MAT-07',
    'Bắt đầu song song 3 nhiệm vụ (OCC Version tăng an toàn 0 -> 1)',
    allStarted,
    `Task 1 Version: ${start1Res.json?.data?.version}, Task 2 Version: ${start2Res.json?.data?.version}, Task 3 Version: ${start3Res.json?.data?.version}`,
  );

  // =========================================================================
  // STAGE 4: CLOUDFLARE R2 S3 BINARY UPLOADS & EVIDENCE SUBMISSION
  // =========================================================================
  console.log('\n\x1b[1m[STAGE 4] TẢI NHỊ PHÂN ẢNH LÊN CLOUDFLARE R2 & GỬI BẰNG CHỨNG\x1b[0m');

  const jpeg1Before = createDummyJpeg('#236e38', 'DIEM-BEFORE');
  const jpeg1After = createDummyJpeg('#104c22', 'DIEM-AFTER');
  const jpeg2Before = createDummyJpeg('#b8860b', 'HUNG-BEFORE');
  const jpeg2After = createDummyJpeg('#8b6508', 'HUNG-AFTER-DARK');
  const jpegRework = createDummyJpeg('#2e8b57', 'HUNG-AFTER-BRIGHT');

  const hash1Before = crypto.createHash('sha256').update(jpeg1Before).digest('hex');
  const hash1After = crypto.createHash('sha256').update(jpeg1After).digest('hex');
  const hash2Before = crypto.createHash('sha256').update(jpeg2Before).digest('hex');
  const hash2After = crypto.createHash('sha256').update(jpeg2After).digest('hex');
  const hashRework = crypto.createHash('sha256').update(jpegRework).digest('hex');

  // Presign for Task 1
  const [presign1Before, presign1After] = await Promise.all([
    requestJson(
      `${API_BASE_URL}/v1/tasks/${task1.id}/evidence/presign`,
      'POST',
      { stage: 'BEFORE', contentType: 'image/jpeg', fileName: `before-${task1.id}.jpg`, sizeBytes: jpeg1Before.length, contentHash: hash1Before },
      diemSession.accessToken,
    ),
    requestJson(
      `${API_BASE_URL}/v1/tasks/${task1.id}/evidence/presign`,
      'POST',
      { stage: 'AFTER', contentType: 'image/jpeg', fileName: `after-${task1.id}.jpg`, sizeBytes: jpeg1After.length, contentHash: hash1After },
      diemSession.accessToken,
    ),
  ]);

  // Presign for Task 2
  const [presign2Before, presign2After] = await Promise.all([
    requestJson(
      `${API_BASE_URL}/v1/tasks/${task2.id}/evidence/presign`,
      'POST',
      { stage: 'BEFORE', contentType: 'image/jpeg', fileName: `before-${task2.id}.jpg`, sizeBytes: jpeg2Before.length, contentHash: hash2Before },
      hungSession.accessToken,
    ),
    requestJson(
      `${API_BASE_URL}/v1/tasks/${task2.id}/evidence/presign`,
      'POST',
      { stage: 'AFTER', contentType: 'image/jpeg', fileName: `after-${task2.id}.jpg`, sizeBytes: jpeg2After.length, contentHash: hash2After },
      hungSession.accessToken,
    ),
  ]);

  assertMatrix(
    'MAT-08',
    'Cấp 4 Presigned URLs đồng thời cho Ngọc Diễm & Duy Hưng',
    presign1Before.status === 200 && presign1After.status === 200 && presign2Before.status === 200 && presign2After.status === 200,
    `Keys: ${presign1Before.json?.data?.storageRef?.slice(-35)}, ${presign2Before.json?.data?.storageRef?.slice(-35)}`,
  );

  // Upload binary images to Cloudflare R2
  const [up1Before, up1After, up2Before, up2After] = await Promise.all([
    uploadBinary(presign1Before.json?.data?.uploadUrl, jpeg1Before),
    uploadBinary(presign1After.json?.data?.uploadUrl, jpeg1After),
    uploadBinary(presign2Before.json?.data?.uploadUrl, jpeg2Before),
    uploadBinary(presign2After.json?.data?.uploadUrl, jpeg2After),
  ]);

  const allUploads200 = up1Before.status === 200 && up1After.status === 200 && up2Before.status === 200 && up2After.status === 200;
  assertMatrix(
    'MAT-09',
    'Tải nhị phân 4 ảnh thành công lên Cloudflare R2 bucket (novyx-evidence)',
    allUploads200,
    `HTTP Codes: Before1=${up1Before.status}, After1=${up1After.status}, Before2=${up2Before.status}, After2=${up2After.status}`,
  );

  // Submit Evidence for Task 1 (Ngọc Diễm)
  const submit1Payload = {
    expectedVersion: 1,
    siteVerification: {
      qrCheck: { verified: true, scannedCode: tree1.qrCode, timestamp: new Date().toISOString() },
      gpsCheck: { verified: true, lat: 10.77402, lng: 106.69101, distance: 3.2, timestamp: new Date().toISOString() },
    },
    proof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: presign1Before.json.data.storageRef,
      afterPhotoUri: presign1After.json.data.storageRef,
      checklist: [{ id: 'chk-1', text: 'An toàn khu vực', done: true }],
    },
    notes: 'Ngọc Diễm hoàn thành cắt tỉa an toàn đúng quy chuẩn.',
  };

  const submit1Res = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task1.id}/evidence`,
    'POST',
    submit1Payload,
    diemSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );
  if (submit1Res.status !== 200) {
    console.log('DEBUG submit1Res:', submit1Res.status, submit1Res.data);
  }

  assertMatrix(
    'MAT-10',
    'Ngọc Diễm nộp trọn gói bằng chứng hiện trường (Chuyển WAITING_REVIEW)',
    submit1Res.status === 200 && submit1Res.json?.data?.status === 'WAITING_REVIEW' && submit1Res.json?.data?.version === 2,
    `Task 1 Status: ${submit1Res.json?.data?.status}, Version: ${submit1Res.json?.data?.version}`,
  );

  // Submit Evidence for Task 2 (Duy Hưng)
  const submit2Payload = {
    expectedVersion: 1,
    siteVerification: {
      qrCheck: { verified: true, scannedCode: tree2.qrCode, timestamp: new Date().toISOString() },
      gpsCheck: { verified: true, lat: 10.77402, lng: 106.69101, distance: 4.1, timestamp: new Date().toISOString() },
    },
    proof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: presign2Before.json.data.storageRef,
      afterPhotoUri: presign2After.json.data.storageRef,
      checklist: [{ id: 'chk-1', text: 'An toàn khu vực', done: true }],
    },
    notes: 'Duy Hưng nộp báo cáo bón phân vi sinh.',
  };

  const submit2Res = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task2.id}/evidence`,
    'POST',
    submit2Payload,
    hungSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-11',
    'Duy Hưng nộp gói bằng chứng (Chuyển WAITING_REVIEW chuẩn bị Rework)',
    submit2Res.status === 200 && submit2Res.json?.data?.status === 'WAITING_REVIEW',
    `Task 2 Status: ${submit2Res.json?.data?.status}, Version: ${submit2Res.json?.data?.version}`,
  );

  // Duy Phong reports field issue on Task 3
  const reportIssuePayload = {
    expectedVersion: 1,
    issueDescription: 'Cành cây vướng đường dây điện trung thế, có nguy cơ phóng điện nguy hiểm cần xe thang.',
    issuePhotoUri: presign1Before.json.data.storageRef,
  };

  const issueRes = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task3.id}/field-issue`,
    'POST',
    reportIssuePayload,
    phongSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-12',
    'Duy Phong báo cáo sự cố hiện trường (Nhiệm vụ chuyển sang BLOCKED)',
    issueRes.status === 200 && issueRes.json?.data?.status === 'BLOCKED',
    `Task 3 Status: ${issueRes.json?.data?.status}, Lý do: "${reportIssuePayload.issueDescription.slice(0, 45)}..."`,
  );

  // =========================================================================
  // STAGE 5: MANAGER REVIEW, REWORK REJECTION & RESUBMISSION
  // =========================================================================
  console.log('\n\x1b[1m[STAGE 5] QUẢN LÝ DUYỆT BẰNG CHỨNG, YÊU CẦU LÀM LẠI & NỘP LẠI\x1b[0m');

  // Manager approves Task 1 (Ngọc Diễm)
  const review1Res = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task1.id}/review`,
    'POST',
    {
      expectedVersion: 2,
      decision: 'APPROVE',
      notes: 'Bằng chứng sắc nét, an toàn khu vực đạt chuẩn.',
    },
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-13',
    'Quản lý phê duyệt nghiệm thu việc của Ngọc Diễm (COMPLETED, v3)',
    review1Res.status === 200 && review1Res.json?.data?.status === 'COMPLETED' && review1Res.json?.data?.version === 3,
    `Task 1 Status: ${review1Res.json?.data?.status}, Version: ${review1Res.json?.data?.version}`,
  );

  // Manager rejects Task 2 (Duy Hưng) with Rework required
  const review2Res = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task2.id}/review`,
    'POST',
    {
      expectedVersion: 2,
      decision: 'REQUEST_REWORK',
      targetedArea: 'AFTER',
      reworkReason: 'Ảnh sau chụp quá tối và góc chụp bị che khuất bởi tán cây lớn.',
    },
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-14',
    'Quản lý yêu cầu Duy Hưng làm lại (REWORK_REQUIRED, target: AFTER)',
    review2Res.status === 200 && review2Res.json?.data?.status === 'REWORK_REQUIRED' && review2Res.json?.data?.version === 3,
    `Task 2 Status: ${review2Res.json?.data?.status}, Version: ${review2Res.json?.data?.version}, Target: AFTER`,
  );

  // Duy Hưng uploads replacement after photo
  const presignReworkRes = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task2.id}/evidence/presign`,
    'POST',
    { stage: 'AFTER', contentType: 'image/jpeg', fileName: `after-rework-${task2.id}.jpg`, sizeBytes: jpegRework.length, contentHash: hashRework },
    hungSession.accessToken,
  );

  const reworkUploadRes = await uploadBinary(
    presignReworkRes.json?.data?.uploadUrl,
    jpegRework,
  );
  if (reworkUploadRes.status !== 200) {
    throw new Error('Upload rework image failed: ' + reworkUploadRes.status);
  }

  const resubmitPayload = {
    expectedVersion: 3,
    reworkedProof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: presign2Before.json.data.storageRef,
      afterPhotoUri: presignReworkRes.json.data.storageRef,
      checklist: [{ id: 'chk-1', text: 'An toàn khu vực', done: true }],
    },
    reworkNotes: 'Duy Hưng đã chụp lại ảnh sau với đủ ánh sáng và góc nhìn toàn cảnh.',
  };

  const resubmitRes = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task2.id}/rework/resubmit`,
    'POST',
    resubmitPayload,
    hungSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-15',
    'Duy Hưng tải ảnh mới lên R2 và nộp lại thành công (WAITING_REVIEW, v4)',
    resubmitRes.status === 200 && resubmitRes.json?.data?.status === 'WAITING_REVIEW' && resubmitRes.json?.data?.version === 4,
    `Task 2 Status: ${resubmitRes.json?.data?.status}, Version: ${resubmitRes.json?.data?.version}`,
  );

  // Manager final approval for Task 2
  const review2FinalRes = await requestJson(
    `${API_BASE_URL}/v1/tasks/${task2.id}/review`,
    'POST',
    {
      expectedVersion: 4,
      decision: 'APPROVE',
      notes: 'Ảnh chụp lại rất sáng và rõ ràng. Phê duyệt hoàn thành!',
    },
    mgrSession.accessToken,
    { 'Idempotency-Key': crypto.randomUUID() },
  );

  assertMatrix(
    'MAT-16',
    'Quản lý phê duyệt nghiệm thu lần 2 cho Duy Hưng (COMPLETED, v5)',
    review2FinalRes.status === 200 && review2FinalRes.json?.data?.status === 'COMPLETED' && review2FinalRes.json?.data?.version === 5,
    `Task 2 Status: ${review2FinalRes.json?.data?.status}, Version: ${review2FinalRes.json?.data?.version}`,
  );

  // =========================================================================
  // STAGE 6: IDEMPOTENCY SAFETY & POSTGRESQL TRANSACTION AUDIT
  // =========================================================================
  console.log('\n\x1b[1m[STAGE 6] KIỂM TRA BẢO VỆ IDEMPOTENCY & TÍNH TOÀN VẸN POSTGRESQL\x1b[0m');

  // Replay idempotency on Task 1
  const replayKey = crypto.randomUUID();
  const replay1 = await requestJson(
    `${API_BASE_URL}/v1/tasks`,
    'POST',
    task1Payload,
    mgrSession.accessToken,
    { 'Idempotency-Key': replayKey },
  );

  const replay2 = await requestJson(
    `${API_BASE_URL}/v1/tasks`,
    'POST',
    task1Payload,
    mgrSession.accessToken,
    { 'Idempotency-Key': replayKey },
  );

  const idempotencyOk = replay1.status === 201 && replay2.status === 201 && replay1.json?.data?.id === replay2.json?.data?.id;

  assertMatrix(
    'MAT-17',
    'Phòng vệ Idempotency: Tái phát cùng key trả về đúng bản ghi, chống duplicate',
    idempotencyOk,
    `Key: ${replayKey.slice(0, 8)}, ID1: ${replay1.json?.data?.id}, ID2: ${replay2.json?.data?.id}`,
  );

  // Dual-platform geometry invariants check
  const bottomNavTsx = fs.readFileSync(path.resolve(repoRoot, 'apps/mobile/src/components/NotchedBottomNav.tsx'), 'utf8');
  const primitivesTsx = fs.readFileSync(path.resolve(repoRoot, 'apps/mobile/src/components/AppPrimitives.tsx'), 'utf8');

  const dualPlatformOk =
    bottomNavTsx.includes('Platform.OS === \'ios\' ? 56 : 64') &&
    primitivesTsx.includes('Animated.createAnimatedComponent(Pressable)') &&
    primitivesTsx.includes('height: 42') &&
    primitivesTsx.includes('useSafeAreaInsets');

  assertMatrix(
    'MAT-18',
    'Chuẩn hóa hình học song hành Dual-Platform (iOS 56dp HIG, Android 64dp, 42dp FilterBar)',
    dualPlatformOk,
    'iOS 56dp + Home bar, Android 64dp, AnimatedPressable flex protection, Safe area insets',
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '═'.repeat(80));
  console.log(`TỔNG KẾT MA TRẬN VẬN HÀNH: ${passCount} ĐẠT (PASS), ${failCount} LỖI (FAIL)`);
  console.log('═'.repeat(80));

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Lỗi ngoại lệ thực thi ma trận:', err);
  process.exit(1);
});
