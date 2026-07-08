import { Tree, Staff, Task, TaskStatus, AppNotification } from './types';

export const INITIAL_TREES: Tree[] = [
  {
    id: 'TRE-0824',
    name: 'Cây Xà Cừ Cổ Thụ #01',
    species: 'Khaya senegalensis',
    lat: 10.7742,
    lng: 106.6910,
    address: 'Phân khu A, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-0824',
    healthStatus: 'Khỏe mạnh',
    ageYears: 85
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
    ageYears: 12
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
    ageYears: 24
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
    ageYears: 18
  },
  {
    id: 'TRE-4091',
    name: 'Cây Sao Đen Đại Thụ #08',
    species: 'Hopea odorata',
    lat: 10.7740,
    lng: 106.6905,
    address: 'Khu vui chơi trẻ em, Công viên Tao Đàn, Quận 1',
    qrCode: 'NOVYX-TRE-4091',
    healthStatus: 'Khỏe mạnh',
    ageYears: 95
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
    ageYears: 15
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'STF-01',
    name: 'Nguyễn Văn Hùng',
    email: 'hung.nguyen@novyx.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    workload: 2,
    role: 'Staff'
  },
  {
    id: 'STF-02',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@novyx.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    workload: 1,
    role: 'Staff'
  },
  {
    id: 'STF-03',
    name: 'Trần Thị Minh',
    email: 'minh.tran@novyx.vn',
    phone: '0987 654 321',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    workload: 0,
    role: 'Staff'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TSK-101',
    title: 'Tưới nước định kỳ & Dọn cỏ',
    taskType: 'Tưới nước',
    description: 'Thực hiện tưới đẫm nước quanh bầu rễ cây Xà Cừ cổ thụ, làm sạch cỏ dại mọc lấn chiếm quanh phạm vi bán kính 1.5m tính từ gốc.',
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
      { id: 'c4', text: 'Vệ sinh rác thải xung quanh khu vực bồn cây', done: false }
    ],
    createdAt: '2026-07-07T08:00:00Z',
    updatedAt: '2026-07-07T08:00:00Z'
  },
  {
    id: 'TSK-102',
    title: 'Cắt tỉa cành khô phòng bão',
    taskType: 'Cắt tỉa cành',
    description: 'Rà soát các nhánh cây phía Tây, dùng thang nâng cắt tỉa 4-5 cành khô đường kính trên 10cm có nguy cơ mục gãy khi mưa giông lớn.',
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
      { id: 'c8', text: 'Thu dọn cành khô vào bãi tập kết rác hữu cơ công viên', done: false }
    ],
    createdAt: '2026-07-07T08:30:00Z',
    updatedAt: '2026-07-07T14:20:00Z'
  },
  {
    id: 'TSK-103',
    title: 'Xử lý sâu đục thân & Quét vôi gốc',
    taskType: 'Phun thuốc',
    description: 'Kiểm tra phát hiện vết sâu đục, phun thuốc trừ sâu sinh học đặc trị luồn sâu vào mạch mọt đục, sau đó quét vôi bảo vệ gốc cây chống côn trùng đẻ trứng.',
    treeId: 'TRE-2209',
    treeName: 'Cây Phượng Vĩ Đỏ #12',
    treeAddress: 'Khu vực cổng Nguyễn Thị Minh Khai, Công viên Tao Đàn, Quận 1',
    assignedStaffId: 'STF-02',
    assignedStaffName: 'Lê Hoàng Nam',
    deadline: '2026-07-08',
    status: TaskStatus.WAITING_REVIEW,
    gpsCheck: {
      verified: true,
      distance: 3.5,
      timestamp: '2026-07-08T08:15:30Z',
      lat: 10.77472,
      lng: 106.69083
    },
    qrCheck: {
      verified: true,
      scannedCode: 'NOVYX-TRE-2209',
      timestamp: '2026-07-08T08:18:10Z'
    },
    beforePhoto: 'https://images.unsplash.com/photo-1621886292650-520f76c747d6?w=400&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&auto=format&fit=crop&q=80',
    checklist: [
      { id: 'c9', text: 'Xác định chính xác vị trí sâu đục thân trên thân cây', done: true },
      { id: 'c10', text: 'Dùng xilanh bơm thuốc trừ sâu sinh học vào lỗ mọt', done: true },
      { id: 'c11', text: 'Quét vôi trắng bảo vệ gốc cây lên độ cao 1.2m', done: true },
      { id: 'c12', text: 'Chụp ảnh nghiệm thu báo cáo chất lượng vôi quét', done: true }
    ],
    notes: 'Đã phát hiện 3 lỗ mọt sâu đục thân ở phía Bắc. Đã xử lý thuốc đặc trị và bịt sáp bảo vệ miệng lỗ, quét vôi đều gốc cây cao đúng 1.2m.',
    createdAt: '2026-07-07T09:00:00Z',
    updatedAt: '2026-07-08T08:25:00Z'
  },
  {
    id: 'TSK-104',
    title: 'Bón phân dưỡng rễ phục hồi cây',
    taskType: 'Bón phân',
    description: 'Bón phân NPK hữu cơ vi sinh sinh học cho cây Lộc Vừng giúp cây nhanh chóng phục hồi sau thời gian dài ngập úng nhẹ.',
    treeId: 'TRE-3541',
    treeName: 'Cây Lộc Vừng Cạnh Hồ #02',
    treeAddress: 'Bờ hồ cảnh quan trung tâm, Công viên Tao Đàn, Quận 1',
    assignedStaffId: 'STF-03',
    assignedStaffName: 'Trần Thị Minh',
    deadline: '2026-07-07',
    status: TaskStatus.COMPLETED,
    gpsCheck: {
      verified: true,
      distance: 1.2,
      timestamp: '2026-07-07T09:45:00Z',
      lat: 10.77391,
      lng: 106.69182
    },
    qrCheck: {
      verified: true,
      scannedCode: 'NOVYX-TRE-3541',
      timestamp: '2026-07-07T09:48:00Z'
    },
    beforePhoto: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&auto=format&fit=crop&q=80',
    checklist: [
      { id: 'c13', text: 'Xới nhẹ đất quanh rãnh chiếu tán cây', done: true },
      { id: 'c14', text: 'Bón đều 500g phân hữu cơ vi sinh tơi xốp', done: true },
      { id: 'c15', text: 'Lấp đất mỏng giữ ẩm phân bón tránh trôi rửa', done: true }
    ],
    notes: 'Đất ven hồ giữ nước khá ẩm, đã xới đất xốp bón đều phân NPK sinh học bọc hữu cơ và lấp giữ ẩm tốt.',
    createdAt: '2026-07-06T10:00:00Z',
    updatedAt: '2026-07-07T10:15:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Phân công nhiệm vụ mới',
    body: 'Bạn có nhiệm vụ "Tưới nước định kỳ & Dọn cỏ" tại Cây Xà Cừ Cổ Thụ #01 mới được phân công.',
    timestamp: '2026-07-08T05:00:00Z',
    read: false,
    type: 'info',
    taskId: 'TSK-101'
  },
  {
    id: 'notif-2',
    title: 'Cảnh báo hạn chót công việc',
    body: 'Nhiệm vụ "Cắt tỉa cành khô phòng bão" có hạn chót vào hôm nay. Vui lòng tiến hành sớm.',
    timestamp: '2026-07-08T05:10:00Z',
    read: false,
    type: 'warning',
    taskId: 'TSK-102'
  }
];

export function getStoredData() {
  const trees = localStorage.getItem('NOVYX_TREES');
  const staff = localStorage.getItem('NOVYX_STAFF');
  const tasks = localStorage.getItem('NOVYX_TASKS');
  const notifications = localStorage.getItem('NOVYX_NOTIFICATIONS');
  const hasInitialized = localStorage.getItem('NOVYX_INITIALIZED');

  if (!hasInitialized) {
    localStorage.setItem('NOVYX_TREES', JSON.stringify(INITIAL_TREES));
    localStorage.setItem('NOVYX_STAFF', JSON.stringify(INITIAL_STAFF));
    localStorage.setItem('NOVYX_TASKS', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('NOVYX_NOTIFICATIONS', JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem('NOVYX_INITIALIZED', 'true');
    return {
      trees: INITIAL_TREES,
      staff: INITIAL_STAFF,
      tasks: INITIAL_TASKS,
      notifications: INITIAL_NOTIFICATIONS
    };
  }

  return {
    trees: trees ? JSON.parse(trees) : INITIAL_TREES,
    staff: staff ? JSON.parse(staff) : INITIAL_STAFF,
    tasks: tasks ? JSON.parse(tasks) : INITIAL_TASKS,
    notifications: notifications ? JSON.parse(notifications) : INITIAL_NOTIFICATIONS
  };
}

export function saveStoredData(data: {
  trees?: Tree[];
  staff?: Staff[];
  tasks?: Task[];
  notifications?: AppNotification[];
}) {
  if (data.trees) localStorage.setItem('NOVYX_TREES', JSON.stringify(data.trees));
  if (data.staff) localStorage.setItem('NOVYX_STAFF', JSON.stringify(data.staff));
  if (data.tasks) localStorage.setItem('NOVYX_TASKS', JSON.stringify(data.tasks));
  if (data.notifications) localStorage.setItem('NOVYX_NOTIFICATIONS', JSON.stringify(data.notifications));
}
