import { AppData, AppNotification, Staff, Task, TaskStatus, Tree } from './types';

export const INITIAL_TREES: Tree[] = [
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

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'STF-01',
    name: 'Nguyễn Văn Hùng',
    email: 'hung.nguyen@novyx.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    workload: 2,
    role: 'Staff',
  },
  {
    id: 'STF-02',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@novyx.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    workload: 1,
    role: 'Staff',
  },
  {
    id: 'STF-03',
    name: 'Trần Thị Minh',
    email: 'minh.tran@novyx.vn',
    phone: '0987 654 321',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    workload: 0,
    role: 'Staff',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TSK-101',
    title: 'Tưới nước định kỳ & Dọn cỏ',
    taskType: 'Tưới nước',
    description:
      'Tưới đẫm nước quanh bầu rễ cây Xà Cừ cổ thụ, làm sạch cỏ dại mọc lấn chiếm quanh bán kính 1.5m tính từ gốc.',
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
  {
    id: 'TSK-104',
    title: 'Bón phân dưỡng rễ phục hồi cây',
    taskType: 'Bón phân',
    description: 'Bón phân NPK hữu cơ vi sinh cho cây Lộc Vừng phục hồi sau ngập úng nhẹ.',
    treeId: 'TRE-3541',
    treeName: 'Cây Lộc Vừng Cạnh Hồ #02',
    treeAddress: 'Bờ hồ cảnh quan trung tâm, Công viên Tao Đàn, Quận 1',
    assignedStaffId: 'STF-03',
    assignedStaffName: 'Trần Thị Minh',
    deadline: '2026-07-07',
    status: TaskStatus.COMPLETED,
    gpsCheck: { verified: true, distance: 1.2, timestamp: '2026-07-07T09:45:00Z', lat: 10.77391, lng: 106.69182 },
    qrCheck: { verified: true, scannedCode: 'NOVYX-TRE-3541', timestamp: '2026-07-07T09:48:00Z' },
    beforePhoto: 'mock://novyx/tree-qr-dau-rai',
    afterPhoto: 'mock://novyx/tree-landscape',
    checklist: [
      { id: 'c13', text: 'Xới nhẹ đất quanh rãnh chiếu tán cây', done: true },
      { id: 'c14', text: 'Bón đều 500g phân hữu cơ vi sinh', done: true },
      { id: 'c15', text: 'Lấp đất mỏng giữ ẩm phân bón', done: true },
    ],
    notes: 'Đất ven hồ giữ nước khá ẩm, đã xới đất xốp và bón phân đều.',
    createdAt: '2026-07-06T10:00:00Z',
    updatedAt: '2026-07-07T10:15:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
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

export const createInitialData = (): AppData => ({
  trees: INITIAL_TREES.map((item) => ({ ...item })),
  staff: INITIAL_STAFF.map((item) => ({ ...item })),
  tasks: INITIAL_TASKS.map((item) => ({ ...item, checklist: item.checklist.map((check) => ({ ...check })) })),
  notifications: INITIAL_NOTIFICATIONS.map((item) => ({ ...item })),
});

export const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};
