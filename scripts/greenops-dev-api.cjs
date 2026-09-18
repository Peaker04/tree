const http = require('node:http');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const DEV_TREE_LAT = Number(process.env.GREENOPS_DEV_TREE_LAT);
const DEV_TREE_LNG = Number(process.env.GREENOPS_DEV_TREE_LNG);

const TaskStatus = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In_Progress',
  WAITING_REVIEW: 'Waiting_Review',
  COMPLETED: 'Completed',
  REWORK_REQUIRED: 'Rework_Required',
};

const baseTrees = [
  {
    id: 'TRE-0824',
    name: 'Cây Xà Cừ Cổ Thụ #01',
    species: 'Khaya senegalensis',
    lat: 10.7742,
    lng: 106.691,
    address: 'Phân khu A, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-0824',
    healthStatus: 'Khỏe mạnh',
    riskStatus: 'healthy',
    ageYears: 85,
  },
  {
    id: 'TRE-1142',
    name: 'Cây Bằng Lăng Tím #04',
    species: 'Lagerstroemia speciosa',
    lat: 10.7749,
    lng: 106.6915,
    address: 'Đường đi nội bộ khu B, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-1142',
    healthStatus: 'Cần chăm sóc',
    riskStatus: 'overdue',
    ageYears: 12,
  },
  {
    id: 'TRE-2209',
    name: 'Cây Phượng Vĩ Đỏ #12',
    species: 'Delonix regia',
    lat: 10.7747,
    lng: 106.6908,
    address: 'Khu vực cổng Nguyễn Thị Minh Khai, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-2209',
    healthStatus: 'Sâu bệnh',
    riskStatus: 'pest_risk',
    ageYears: 24,
  },
  {
    id: 'TRE-3541',
    name: 'Cây Lộc Vừng Cạnh Hồ #02',
    species: 'Barringtonia acutangula',
    lat: 10.7739,
    lng: 106.6918,
    address: 'Bờ hồ cảnh quan trung tâm, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-3541',
    healthStatus: 'Khỏe mạnh',
    riskStatus: 'healthy',
    ageYears: 18,
  },
  {
    id: 'TRE-4091',
    name: 'Cây Sao Đen Đại Thụ #08',
    species: 'Hopea odorata',
    lat: 10.774,
    lng: 106.6905,
    address: 'Khu vui chơi trẻ em, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-4091',
    healthStatus: 'Khỏe mạnh',
    riskStatus: 'healthy',
    ageYears: 95,
  },
  {
    id: 'TRE-5523',
    name: 'Cây Lim Sét Hoa Vàng #15',
    species: 'Peltophorum pterocarpum',
    lat: 10.7752,
    lng: 106.6912,
    address: 'Phía sau khu Đền Hùng, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-5523',
    healthStatus: 'Khỏe mạnh',
    riskStatus: 'healthy',
    ageYears: 15,
  },
];

const treeOffsets = [
  { lat: 0, lng: 0 },
  { lat: 0.00003, lng: 0.00003 },
  { lat: -0.00003, lng: 0.00002 },
  { lat: 0.00002, lng: -0.00003 },
  { lat: -0.00002, lng: -0.00002 },
  { lat: 0.00004, lng: -0.00001 },
];

const hasDevTreeOrigin = Number.isFinite(DEV_TREE_LAT) && Number.isFinite(DEV_TREE_LNG);

const trees = baseTrees.map((tree, index) => {
  if (!hasDevTreeOrigin) {
    return tree;
  }

  const offset = treeOffsets[index] || { lat: 0, lng: 0 };
  return {
    ...tree,
    lat: DEV_TREE_LAT + offset.lat,
    lng: DEV_TREE_LNG + offset.lng,
    address: `${tree.address} (seed quanh vị trí smoke)`,
  };
});

const staff = [
  {
    id: 'STF-01',
    name: 'Nguyễn Văn Hùng',
    email: 'hung.nguyen@novyx.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    workload: 2,
    role: 'Staff',
  },
];

const treeById = new Map(trees.map((tree) => [tree.id, tree]));

const withCurrentTreeFields = (task) => {
  const tree = treeById.get(task.treeId);
  if (!tree) {
    return task;
  }

  return {
    ...task,
    treeName: tree.name,
    treeAddress: tree.address,
  };
};

const createInitialTasks = () =>
  [
    {
      id: 'TSK-101',
      title: 'Tưới nước định kỳ & Dọn cỏ',
      taskType: 'Tưới nước',
      description: 'Tưới đẫm nước quanh bầu rễ cây Xà Cừ cổ thụ, làm sạch cỏ dại quanh gốc.',
      treeId: 'TRE-0824',
      treeName: 'Cây Xà Cừ Cổ Thụ #01',
      treeAddress: 'Phân khu A, Công viên Tao Đàn, Quận 1',
      assignedStaffId: 'STF-01',
      assignedStaffName: 'Nguyễn Văn Hùng',
      deadline: '2026-07-08',
      status: TaskStatus.PENDING,
      checklist: [
        { id: 'c1', text: 'Kiểm tra độ ẩm gốc cây trước khi tưới nước', done: false },
        { id: 'c2', text: 'Tưới tối thiểu 100L nước phân bổ đều quanh tán', done: false },
        { id: 'c3', text: 'Nhổ sạch cỏ dại ký sinh và cỏ lấn chiếm sát gốc', done: false },
        { id: 'c4', text: 'Vệ sinh rác thải xung quanh khu vực bồn cây', done: false },
      ],
      createdAt: '2026-07-07T08:00:00Z',
      updatedAt: '2026-07-07T08:00:00Z',
    },
    {
      id: 'TSK-102',
      title: 'Cắt tỉa cành khô phòng bão',
      taskType: 'Cắt tỉa cành',
      description: 'Rà soát nhánh cây phía Tây, cắt tỉa cành khô có nguy cơ gãy khi mưa giông lớn.',
      treeId: 'TRE-1142',
      treeName: 'Cây Bằng Lăng Tím #04',
      treeAddress: 'Đường đi nội bộ khu B, Công viên Tao Đàn, Quận 1',
      assignedStaffId: 'STF-01',
      assignedStaffName: 'Nguyễn Văn Hùng',
      deadline: '2026-07-08',
      status: TaskStatus.IN_PROGRESS,
      checklist: [
        { id: 'c5', text: 'Thiết lập rào chắn và đặt biển cảnh báo khu vực cắt tỉa', done: true },
        { id: 'c6', text: 'Cưa tỉa đúng kỹ thuật không làm xước da thân chính', done: false },
        { id: 'c7', text: 'Bôi keo liền sẹo cây cảnh chuyên dụng vào vết cắt', done: false },
      ],
      createdAt: '2026-07-07T08:30:00Z',
      updatedAt: '2026-07-07T14:20:00Z',
    },
    {
      id: 'TSK-103',
      title: 'Xử lý sâu đục thân & Quét vôi gốc',
      taskType: 'Phun thuốc',
      description: 'Kiểm tra vết sâu đục, phun thuốc sinh học và quét vôi bảo vệ gốc cây.',
      treeId: 'TRE-2209',
      treeName: 'Cây Phượng Vĩ Đỏ #12',
      treeAddress: 'Khu vực cổng Nguyễn Thị Minh Khai, Công viên Tao Đàn, Quận 1',
      assignedStaffId: 'STF-02',
      assignedStaffName: 'Lê Hoàng Nam',
      deadline: '2026-07-08',
      status: TaskStatus.WAITING_REVIEW,
      gpsCheck: { verified: true, distance: 3.5, timestamp: '2026-07-08T08:15:30Z', lat: 10.77472, lng: 106.69083 },
      qrCheck: { verified: true, scannedCode: 'NOVYX-TRE-2209', timestamp: '2026-07-08T08:18:10Z' },
      beforePhoto: 'mock://novyx/tree-qr-dau-rai',
      afterPhoto: 'mock://novyx/tree-landscape',
      checklist: [
        { id: 'c9', text: 'Xác định chính xác vị trí sâu đục thân', done: true },
        { id: 'c10', text: 'Bơm thuốc trừ sâu sinh học vào lỗ mọt', done: true },
        { id: 'c11', text: 'Quét vôi trắng bảo vệ gốc cây lên độ cao 1.2m', done: true },
      ],
      notes: 'Đã xử lý 3 lỗ mọt phía Bắc và quét vôi đều gốc cây.',
      createdAt: '2026-07-07T09:00:00Z',
      updatedAt: '2026-07-08T08:25:00Z',
    },
  ].map(withCurrentTreeFields);

const createInitialNotifications = () => [
  {
    id: 'notif-1',
    title: 'Phân công nhiệm vụ mới',
    body: 'Bạn có nhiệm vụ "Tưới nước định kỳ & Dọn cỏ" tại Cây Xà Cừ Cổ Thụ #01.',
    timestamp: '2026-07-08T05:00:00Z',
    read: false,
    type: 'info',
    taskId: 'TSK-101',
  },
  {
    id: 'notif-2',
    title: 'Cảnh báo hạn chót công việc',
    body: 'Nhiệm vụ "Cắt tỉa cành khô phòng bão" có hạn chót hôm nay.',
    timestamp: '2026-07-08T05:10:00Z',
    read: false,
    type: 'warning',
    taskId: 'TSK-102',
  },
];

let tasks = createInitialTasks();
let notifications = createInitialNotifications();

const resetState = () => {
  tasks = createInitialTasks();
  notifications = createInitialNotifications();
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
};

const ok = (response, data) => sendJson(response, 200, { data });
const list = (response, data) => sendJson(response, 200, { data, meta: { nextCursor: null, hasMore: false } });
const notFound = (response, message = 'Resource not found.') =>
  sendJson(response, 404, {
    error: {
      code: 'NOT_FOUND',
      message,
      requestId: `dev-${Date.now()}`,
    },
  });

const readBody = (request) =>
  new Promise((resolve) => {
    const chunks = [];
    request.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) {
        resolve({});
        return;
      }

      if (request.headers['content-type']?.includes('multipart/form-data')) {
        const metadataMatch = body.match(
          /name="metadata"(?:;[^\r\n]*)?\r\n(?:Content-Type:[^\r\n]*\r\n)?\r\n([\s\S]*?)\r\n--/,
        );

        if (metadataMatch?.[1]) {
          try {
            resolve(JSON.parse(metadataMatch[1].trim()));
            return;
          } catch {
            resolve({});
            return;
          }
        }

        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });

const upsertTask = (nextTask) => {
  tasks = tasks.some((task) => task.id === nextTask.id)
    ? tasks.map((task) => (task.id === nextTask.id ? nextTask : task))
    : [nextTask, ...tasks];
  return nextTask;
};

const buildCareHistory = (treeId) =>
  tasks
    .filter((task) => task.treeId === treeId)
    .filter((task) => task.status === TaskStatus.COMPLETED || task.status === TaskStatus.WAITING_REVIEW)
    .map((task) => ({
      id: `hist-${task.id}`,
      treeId: task.treeId,
      taskId: task.id,
      taskTitle: task.title,
      staffId: task.assignedStaffId,
      staffName: task.assignedStaffName,
      completedAt: task.updatedAt,
      status: task.status,
      ...(task.gpsCheck ? { gpsCheck: task.gpsCheck } : {}),
      ...(task.qrCheck ? { qrCheck: task.qrCheck } : {}),
      ...(task.beforePhoto ? { beforePhoto: task.beforePhoto } : {}),
      ...(task.afterPhoto ? { afterPhoto: task.afterPhoto } : {}),
      ...(task.notes ? { notes: task.notes } : {}),
    }));

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && path === '/v1/health') {
    ok(response, {
      status: 'ok',
      service: 'greenops-dev-api',
      ...(hasDevTreeOrigin ? { seedOrigin: { lat: DEV_TREE_LAT, lng: DEV_TREE_LNG } } : {}),
    });
    return;
  }

  if (request.method === 'POST' && path === '/v1/dev/reset') {
    resetState();
    ok(response, {
      status: 'reset',
      tasks: tasks.length,
      notifications: notifications.length,
    });
    return;
  }

  if (request.method === 'POST' && path === '/v1/auth/login') {
    const body = await readBody(request);
    const identifier = String(body.identifier || 'staff@novyx.local').toLowerCase();
    const role = identifier.includes('manager') || identifier.includes('admin') ? 'manager' : 'staff';
    ok(response, {
      session: {
        accessToken: `dev-access-${randomUUID()}`,
        refreshToken: `dev-refresh-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: role === 'staff' ? 'STF-01' : 'MGR-01',
          email: identifier,
          role,
        },
      },
    });
    return;
  }

  if (request.method === 'GET' && path === '/v1/trees') {
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Number(url.searchParams.get('limit') || trees.length);
    const filtered = q
      ? trees.filter((tree) =>
          [tree.id, tree.name, tree.species, tree.address, tree.qrCode].some((value) =>
            String(value).toLowerCase().includes(q),
          ),
        )
      : trees;
    list(response, filtered.slice(0, Number.isFinite(limit) ? limit : trees.length));
    return;
  }

  const careHistoryMatch = path.match(/^\/v1\/trees\/([^/]+)\/care-history$/);
  if (request.method === 'GET' && careHistoryMatch) {
    list(response, buildCareHistory(decodeURIComponent(careHistoryMatch[1])));
    return;
  }

  if (request.method === 'GET' && path === '/v1/tasks') {
    const staffId = url.searchParams.get('staffId');
    const status = url.searchParams.get('status');
    list(
      response,
      tasks.filter((task) => (!staffId || task.assignedStaffId === staffId) && (!status || task.status === status)),
    );
    return;
  }

  if (request.method === 'POST' && path === '/v1/tasks') {
    const body = await readBody(request);
    const tree = trees.find((item) => item.id === body.treeId) || trees[0];
    const assignee = staff.find((item) => item.id === body.assignedStaffId) || staff[0];
    const now = new Date().toISOString();
    ok(
      response,
      upsertTask({
        id: `TSK-${Date.now().toString().slice(-5)}`,
        title: body.title || 'Công việc mới',
        taskType: body.taskType || 'Tưới nước',
        description: body.description || '',
        treeId: tree.id,
        treeName: tree.name,
        treeAddress: tree.address,
        assignedStaffId: assignee.id,
        assignedStaffName: assignee.name,
        deadline: body.deadline || now.slice(0, 10),
        status: TaskStatus.PENDING,
        checklist: Array.isArray(body.checklist) ? body.checklist : [],
        createdAt: now,
        updatedAt: now,
      }),
    );
    return;
  }

  const taskProgressMatch = path.match(/^\/v1\/tasks\/([^/]+)\/progress$/);
  if (request.method === 'PATCH' && taskProgressMatch) {
    const taskId = decodeURIComponent(taskProgressMatch[1]);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      notFound(response, `Task ${taskId} not found.`);
      return;
    }
    const body = await readBody(request);
    ok(response, upsertTask({ ...task, ...body, id: task.id, updatedAt: new Date().toISOString() }));
    return;
  }

  const taskEvidenceMatch = path.match(/^\/v1\/tasks\/([^/]+)\/evidence$/);
  if (request.method === 'POST' && taskEvidenceMatch) {
    const taskId = decodeURIComponent(taskEvidenceMatch[1]);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      notFound(response, `Task ${taskId} not found.`);
      return;
    }
    const body = await readBody(request);
    ok(
      response,
      upsertTask({
        ...task,
        ...body,
        id: task.id,
        status: TaskStatus.WAITING_REVIEW,
        updatedAt: new Date().toISOString(),
      }),
    );
    return;
  }

  const taskReviewMatch = path.match(/^\/v1\/tasks\/([^/]+)\/review$/);
  if (request.method === 'PATCH' && taskReviewMatch) {
    const taskId = decodeURIComponent(taskReviewMatch[1]);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      notFound(response, `Task ${taskId} not found.`);
      return;
    }
    const body = await readBody(request);
    const isApprove = body.decision === 'approve';
    const rejectReason = body.rejectReason || body.reason || body.reviewNote || '';
    const rejectChips = Array.isArray(body.reasonChips)
      ? body.reasonChips.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
      : [];
    ok(
      response,
      upsertTask({
        ...task,
        status: isApprove ? TaskStatus.COMPLETED : TaskStatus.REWORK_REQUIRED,
        rejectReason: isApprove ? undefined : rejectReason || undefined,
        rejectChips: isApprove ? undefined : rejectChips,
        reviewNote: isApprove ? undefined : rejectReason || undefined,
        updatedAt: new Date().toISOString(),
      }),
    );
    return;
  }

  if (request.method === 'GET' && path === '/v1/notifications') {
    list(response, notifications);
    return;
  }

  if (request.method === 'POST' && path === '/v1/notifications') {
    const body = await readBody(request);
    const notification = {
      id: `notif-${Date.now()}`,
      title: body.title || 'Thông báo mới',
      body: body.body || '',
      timestamp: body.timestamp || new Date().toISOString(),
      read: body.read ?? false,
      type: body.type || 'info',
      ...(body.taskId ? { taskId: body.taskId } : {}),
    };
    notifications = [notification, ...notifications];
    ok(response, notification);
    return;
  }

  const notificationReadMatch = path.match(/^\/v1\/notifications\/([^/]+)\/read$/);
  if (request.method === 'PATCH' && notificationReadMatch) {
    const notificationId = decodeURIComponent(notificationReadMatch[1]);
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification) {
      notFound(response, `Notification ${notificationId} not found.`);
      return;
    }
    notification.read = true;
    ok(response, notification);
    return;
  }

  notFound(response);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`NOVYX GreenOps dev API listening on http://127.0.0.1:${PORT}/v1`);
});
