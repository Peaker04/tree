/**
 * NOVYX GreenOps — Deep Operational Lifecycle & iOS Resilience Audit
 * Executes the complete real-world state machine against the live running API/Ngrok
 * and audits all mobile screens for memory safety, iOS HIG compliance, and edge-case handling.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const nodeCrypto = require('node:crypto');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const API_BASE_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
const PASSWORD = process.env.NOVYX_DEV_PASSWORD || 'NovyxDev123!';
const STAFF_EMAIL = 'staff@novyx.local';
const MANAGER_EMAIL = 'manager@novyx.local';

let passCount = 0;
let failCount = 0;

function assertAudit(id, title, ok, details) {
  if (ok) {
    passCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${title} — \x1b[90m${details}\x1b[0m`);
  } else {
    failCount++;
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${title} — \x1b[31m${details}\x1b[0m`);
  }
}

function request(method, urlStr, body = null, headers = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const payload = body ? JSON.stringify(body) : null;

      const req = client.request(
        url,
        {
          method,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'ngrok-skip-browser-warning': 'true',
            ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...headers,
          },
          timeout: 15000,
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
        resolve({ status: 0, data: 'Timeout after 15s', json: null });
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
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode, data }));
        },
      );
      req.on('error', (err) => resolve({ status: 0, error: err }));
      req.write(buffer);
      req.end();
    } catch (err) {
      resolve({ status: 0, error: err });
    }
  });
}

async function run() {
  console.log('═'.repeat(80));
  console.log('   NOVYX GREENOPS — DEEP OPERATIONAL LIFECYCLE & IOS RESILIENCE AUDIT');
  console.log('═'.repeat(80));

  // STEP 1: AUTHENTICATE BOTH ROLES
  console.log('\n[PHASE 1] ĐỐI SOÁT ĐĂNG NHẬP VÀ PHIÊN LÀM VIỆC ĐA VAI TRÒ');
  const mgrAuth = await request('POST', `${API_BASE_URL}/v1/auth/login`, {
    identifier: MANAGER_EMAIL,
    password: PASSWORD,
  });
  const mgrSession = mgrAuth.json?.session || mgrAuth.json?.data?.session;
  const mgrToken = mgrSession?.accessToken;
  const mgrUser = mgrSession?.user;
  assertAudit('AUD-01', 'Quản lý đăng nhập lấy Access Token', Boolean(mgrToken), `ID: ${mgrUser?.id}`);

  const staffAuth = await request('POST', `${API_BASE_URL}/v1/auth/login`, {
    identifier: STAFF_EMAIL,
    password: PASSWORD,
  });
  const staffSession = staffAuth.json?.session || staffAuth.json?.data?.session;
  const staffToken = staffSession?.accessToken;
  const staffUser = staffSession?.user;
  assertAudit('AUD-02', 'Nhân viên đăng nhập lấy Access Token', Boolean(staffToken), `ID: ${staffUser?.id}`);

  // STEP 2: QUERY TREES AND GOVERNANCE TASK TYPES
  console.log('\n[PHASE 2] KIỂM TRA TÍNH TOÀN VẸN DANH MỤC CÂY & QUY CHUẨN TỌA ĐỘ');
  const treesRes = await request('GET', `${API_BASE_URL}/v1/trees`, null, { Authorization: `Bearer ${mgrToken}` });
  const trees = treesRes.json?.data || [];
  const targetTree = trees[0];
  assertAudit(
    'AUD-03',
    'Danh mục Cây xanh & Tọa độ thực địa',
    trees.length >= 5 && typeof targetTree?.lat === 'number' && typeof targetTree?.lng === 'number',
    `Số lượng cây: ${trees.length}, Cây mẫu: ${targetTree?.code} (${targetTree?.lat}, ${targetTree?.lng})`,
  );

  const govTypesRes = await request('GET', `${API_BASE_URL}/v1/governance/task-types`, null, {
    Authorization: `Bearer ${mgrToken}`,
  });
  const taskTypes = govTypesRes.json?.data || [];
  const activeTaskType = taskTypes.find((t) => t.isActive) || taskTypes[0];
  assertAudit(
    'AUD-03B',
    'Danh mục Loại nhiệm vụ chuẩn hóa (Task Types)',
    Boolean(activeTaskType?.id),
    `Loại: ${activeTaskType?.name} (${activeTaskType?.id}), Hồ sơ bằng chứng: ${activeTaskType?.defaultProofProfile}`,
  );

  // STEP 3: MANAGER CREATES A TASK WITH HONEST TREE SELECTION (NO FAKE ADDRESS SPLITTING)
  console.log('\n[PHASE 3] QUẢN LÝ TẠO NHIỆM VỤ THỰC ĐỊA (HONEST TREE SCOPE)');
  const idempotencyKeyCreate = crypto.randomUUID();
  const futureDeadline = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const createTaskPayload = {
    title: `Kiểm định sức khỏe cây & cắt tỉa định kỳ ${Date.now().toString().slice(-4)}`,
    taskTypeId: activeTaskType.id,
    description: 'Thực hiện kiểm tra định kỳ gốc cây, chụp ảnh trước/sau và hoàn thành checklist an toàn.',
    treeId: targetTree.id,
    assignedStaffId: staffUser.id,
    deadline: futureDeadline,
  };

  const createRes = await request('POST', `${API_BASE_URL}/v1/tasks`, createTaskPayload, {
    Authorization: `Bearer ${mgrToken}`,
    'Idempotency-Key': idempotencyKeyCreate,
  });
  const createdTask = createRes.json?.data;
  assertAudit(
    'AUD-04',
    'Tạo nhiệm vụ mới có Idempotency-Key',
    createRes.status === 201 && Boolean(createdTask?.id),
    `Task ID: ${createdTask?.id}, Trạng thái: ${createdTask?.status}, Version: ${createdTask?.version}`,
  );

  // STEP 4: STAFF STARTS TASK (OP-05)
  console.log('\n[PHASE 4] NHÂN VIÊN TIẾP NHẬN & BẮT ĐẦU CÔNG VIỆC');
  const startRes = await request(
    'POST',
    `${API_BASE_URL}/v1/tasks/${createdTask.id}/start`,
    { expectedVersion: createdTask.version },
    {
      Authorization: `Bearer ${staffToken}`,
      'Idempotency-Key': crypto.randomUUID(),
    },
  );
  const startedTask = startRes.json?.data;
  assertAudit(
    'AUD-05',
    'Bắt đầu nhiệm vụ (Chuyển sang IN_PROGRESS)',
    startRes.status === 200 && startedTask?.status === 'IN_PROGRESS',
    `Trạng thái sau khi bấm bắt đầu: ${startedTask?.status}, Version: ${startedTask?.version}`,
  );

  // STEP 5: PRESIGN & UPLOAD EVIDENCE IMAGES
  console.log('\n[PHASE 5] XIN PRESIGNED URL VÀ ĐẨY BẰNG CHỨNG HÌNH ẢNH S3/MINIO');
  const dummyJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00,
    0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
    0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
    0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34,
    0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00,
    0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,
    0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00, 0xff, 0xd9,
  ]);
  const contentHash = nodeCrypto.createHash('sha256').update(dummyJpeg).digest('hex');

  const presignBefore = await request(
    'POST',
    `${API_BASE_URL}/v1/tasks/${createdTask.id}/evidence/presign`,
    {
      fileName: `before-${createdTask.id}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: dummyJpeg.length,
      contentHash,
    },
    { Authorization: `Bearer ${staffToken}` },
  );
  const beforeData = presignBefore.json?.data;
  assertAudit(
    'AUD-06',
    'Xin Presigned URL cho ảnh Trước',
    presignBefore.status === 200 && Boolean(beforeData?.storageRef),
    `StorageRef: ${beforeData?.storageRef}`,
  );

  const presignAfter = await request(
    'POST',
    `${API_BASE_URL}/v1/tasks/${createdTask.id}/evidence/presign`,
    {
      fileName: `after-${createdTask.id}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: dummyJpeg.length,
      contentHash,
    },
    { Authorization: `Bearer ${staffToken}` },
  );
  const afterData = presignAfter.json?.data;
  assertAudit(
    'AUD-07',
    'Xin Presigned URL cho ảnh Sau',
    presignAfter.status === 200 && Boolean(afterData?.storageRef),
    `StorageRef: ${afterData?.storageRef}`,
  );

  const putBefore = await uploadBinary(beforeData.uploadUrl, dummyJpeg);
  const putAfter = await uploadBinary(afterData.uploadUrl, dummyJpeg);
  assertAudit(
    'AUD-07B',
    'Tải nhị phân ảnh Trước và Sau lên Object Storage',
    putBefore.status === 200 && putAfter.status === 200,
    `Before: HTTP ${putBefore.status}, After: HTTP ${putAfter.status}`,
  );

  // STEP 6: SUBMIT COMPLETE EVIDENCE PACKET (GPS + QR + CHECKLIST + PHOTOS)
  console.log('\n[PHASE 6] NỘP GÓI BẰNG CHỨNG HIỆN TRƯỜNG ĐỦ 5 HẠNG MỤC');
  const submitPayload = {
    expectedVersion: startedTask.version,
    siteVerification: {
      gpsCheck: {
        lat: targetTree.lat,
        lng: targetTree.lng,
        distance: 3.2,
        verified: true,
        accuracyMeters: 4.5,
        timestamp: new Date().toISOString(),
      },
      qrCheck: {
        scannedCode: targetTree.qrCode || targetTree.code,
        verified: true,
        timestamp: new Date().toISOString(),
      },
    },
    proof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: beforeData.storageRef,
      afterPhotoUri: afterData.storageRef,
      checklist: [
        { id: 'chk-01', text: 'Kiểm tra rệp và nấm lá', done: true },
        { id: 'chk-02', text: 'Độ ẩm đất đạt chuẩn', done: true },
      ],
    },
    notes: 'Đã hoàn tất chăm sóc và cắt tỉa cành nguy hiểm.',
  };

  const submitRes = await request('POST', `${API_BASE_URL}/v1/tasks/${createdTask.id}/evidence`, submitPayload, {
    Authorization: `Bearer ${staffToken}`,
    'Idempotency-Key': crypto.randomUUID(),
  });
  if (submitRes.status !== 200) {
    console.log('\x1b[33m[DEBUG SUBMIT ERROR]\x1b[0m', submitRes.status, submitRes.data);
  }
  const submittedTask = submitRes.json?.data;
  assertAudit(
    'AUD-08',
    'Nộp bằng chứng hoàn tất (Chuyển sang WAITING_REVIEW)',
    submitRes.status === 200 && (submittedTask?.status === 'WAITING_REVIEW' || submittedTask?.status === 'SUBMITTED'),
    `Trạng thái sau khi nộp: ${submittedTask?.status}, Version: ${submittedTask?.version}`,
  );

  // STEP 7: MANAGER REQUESTS REWORK (REWORK_REQUIRED)
  console.log('\n[PHASE 7] QUẢN LÝ DUYỆT BẰNG CHỨNG — YÊU CẦU LÀM LẠI (REWORK FLOW)');
  const rejectPayload = {
    expectedVersion: submittedTask.version,
    decision: 'REQUEST_REWORK',
    targetedArea: 'AFTER',
    reworkReason: 'Ảnh sau chụp quá tối và góc chụp bị che khuất bởi tán cây lớn.',
  };
  const rejectRes = await request('POST', `${API_BASE_URL}/v1/tasks/${createdTask.id}/review`, rejectPayload, {
    Authorization: `Bearer ${mgrToken}`,
    'Idempotency-Key': crypto.randomUUID(),
  });
  const reworkTask = rejectRes.json?.data;
  assertAudit(
    'AUD-09',
    'Quản lý trả về yêu cầu sửa đổi (REWORK_REQUIRED)',
    rejectRes.status === 200 && reworkTask?.status === 'REWORK_REQUIRED',
    `Mục tiêu làm lại: ${reworkTask?.reworkTarget || rejectPayload.targetedArea}, Lý do: ${reworkTask?.rejectReason || rejectPayload.reworkReason}`,
  );

  // STEP 8: STAFF RE-SUBMITS REWORK TARGET
  console.log('\n[PHASE 8] NHÂN VIÊN CẬP NHẬT ẢNH MỚI VÀ GỬI LẠI (RESUBMIT REWORK)');
  const presignAfter2 = await request(
    'POST',
    `${API_BASE_URL}/v1/tasks/${createdTask.id}/evidence/presign`,
    {
      fileName: `after-rework-${createdTask.id}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: dummyJpeg.length,
      contentHash,
    },
    { Authorization: `Bearer ${staffToken}` },
  );
  const after2Data = presignAfter2.json?.data;
  const putAfter2 = await uploadBinary(after2Data.uploadUrl, dummyJpeg);
  assertAudit(
    'AUD-10A',
    'Tải nhị phân ảnh Sau thay thế (Rework)',
    putAfter2.status === 200,
    `HTTP ${putAfter2.status}`,
  );

  const resubmitPayload = {
    expectedVersion: reworkTask.version,
    reworkedProof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: beforeData.storageRef,
      afterPhotoUri: after2Data.storageRef,
      checklist: [
        { id: 'chk-01', text: 'Kiểm tra rệp và nấm lá', done: true },
        { id: 'chk-02', text: 'Độ ẩm đất đạt chuẩn', done: true },
      ],
    },
    reworkNotes: 'Đã chụp lại ảnh sau với ánh sáng rõ và góc rộng toàn cảnh bồn cây.',
  };
  const resubmitRes = await request(
    'POST',
    `${API_BASE_URL}/v1/tasks/${createdTask.id}/rework/resubmit`,
    resubmitPayload,
    {
      Authorization: `Bearer ${staffToken}`,
      'Idempotency-Key': crypto.randomUUID(),
    },
  );
  const resubmittedTask = resubmitRes.json?.data;
  assertAudit(
    'AUD-10',
    'Nhân viên nộp lại thành công (Trở về WAITING_REVIEW)',
    resubmitRes.status === 200 &&
      (resubmittedTask?.status === 'WAITING_REVIEW' || resubmittedTask?.status === 'SUBMITTED'),
    `Trạng thái sau khi resubmit: ${resubmittedTask?.status}, Version: ${resubmittedTask?.version}`,
  );

  // STEP 9: MANAGER APPROVES TASK (COMPLETED)
  console.log('\n[PHASE 9] QUẢN LÝ PHÊ DUYỆT CUỐI CÙNG — HOÀN THÀNH (COMPLETED)');
  const approvePayload = {
    expectedVersion: resubmittedTask.version,
    decision: 'APPROVE',
    notes: 'Bằng chứng ảnh thay thế đạt chất lượng cao. Nghiệm thu hoàn tất.',
  };
  const approveRes = await request('POST', `${API_BASE_URL}/v1/tasks/${createdTask.id}/review`, approvePayload, {
    Authorization: `Bearer ${mgrToken}`,
    'Idempotency-Key': crypto.randomUUID(),
  });
  const approvedTask = approveRes.json?.data;
  assertAudit(
    'AUD-11',
    'Quản lý phê duyệt thành công (Trạng thái COMPLETED)',
    approveRes.status === 200 && approvedTask?.status === 'COMPLETED',
    `Trạng thái cuối cùng: ${approvedTask?.status}, Version: ${approvedTask?.version}`,
  );

  // STEP 10: IDEMPOTENCY SAFETY REPLAY TEST
  console.log('\n[PHASE 10] BẢO VỆ CHỐNG TRÙNG LẶP GIAO DỊCH (IDEMPOTENCY REPLAY TEST)');
  const replayRes = await request('POST', `${API_BASE_URL}/v1/tasks`, createTaskPayload, {
    Authorization: `Bearer ${mgrToken}`,
    'Idempotency-Key': idempotencyKeyCreate,
  });
  assertAudit(
    'AUD-12',
    'Tái phát yêu cầu cùng Idempotency-Key trả về kết quả ban đầu an toàn',
    replayRes.status === 201 && replayRes.json?.data?.id === createdTask.id,
    `Cùng ID gốc: ${replayRes.json?.data?.id}, Không phát sinh bản ghi trùng lặp`,
  );

  // STEP 11: STATIC IOS CODEBASE RESILIENCE AUDIT
  console.log('\n[PHASE 11] KIỂM TRA ĐỘ BỀN MÃ NGUỒN IOS (MEMORY LEAKS & HIG GEOMETRY)');

  const mobileAppSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/screens/MobileApp.tsx'), 'utf8');
  assertAudit(
    'IOS-01',
    'MobileApp có dọn dẹp BackHandler listener khi Unmount',
    mobileAppSrc.includes("const subscription = BackHandler.addEventListener('hardwareBackPress'") &&
      mobileAppSrc.includes('subscription.remove()'),
    'Gỡ bỏ Event Listener sạch sẽ, triệt tiêu rò rỉ bộ nhớ (Memory Leak)',
  );

  const webMapViewSrc = fs.readFileSync(
    path.join(repoRoot, 'apps/mobile/src/components/presentation/WebMapView.tsx'),
    'utf8',
  );
  assertAudit(
    'IOS-02',
    'WebMapView phòng vệ XSS và chống Crash khi render HTML',
    webMapViewSrc.includes('const escapedName = JSON.stringify(treeName);') &&
      webMapViewSrc.includes('const sanitizedNearbyTrees = JSON.stringify'),
    'Sanitize chuỗi tên cây và mảng cây lân cận bằng JSON.stringify an toàn',
  );

  const primitivesSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/components/AppPrimitives.tsx'), 'utf8');
  assertAudit(
    'IOS-03',
    'KeyboardAvoidingView phân bổ padding chuẩn cho iOS',
    primitivesSrc.includes("Platform.OS === 'ios' ?") &&
      primitivesSrc.includes('<KeyboardAvoidingView') &&
      primitivesSrc.includes('behavior="padding"'),
    'iOS dùng behavior="padding", Android render View tránh xung đột windowSoftInputMode',
  );

  console.log('\n' + '═'.repeat(80));
  console.log(`TỔNG KẾT KIỂM THỬ SÂU: ${passCount} ĐẠT (PASS), ${failCount} LỖI (FAIL)`);
  console.log('═'.repeat(80));

  if (failCount > 0) process.exitCode = 1;
}

run();
