export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In_Progress',
  WAITING_REVIEW = 'Waiting_Review',
  COMPLETED = 'Completed',
  REWORK_REQUIRED = 'Rework_Required'
}

export interface Tree {
  id: string;
  name: string;
  species: string;
  lat: number;
  lng: number;
  address: string;
  qrCode: string;
  healthStatus: 'Khỏe mạnh' | 'Cần chăm sóc' | 'Sâu bệnh';
  ageYears: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  workload: number; // number of current pending tasks
  role: 'Staff';
}

export interface Task {
  id: string;
  title: string;
  taskType: 'Tưới nước' | 'Cắt tỉa cành' | 'Bón phân' | 'Phun thuốc' | 'Kiểm tra sâu bệnh' | 'Trồng mới';
  description: string;
  treeId: string;
  treeName: string;
  treeAddress: string;
  assignedStaffId: string;
  assignedStaffName: string;
  deadline: string;
  status: TaskStatus;
  
  // Verification evidences
  gpsCheck?: {
    verified: boolean;
    distance: number; // in meters
    timestamp: string;
    lat: number;
    lng: number;
  };
  qrCheck?: {
    verified: boolean;
    scannedCode: string;
    timestamp: string;
  };
  beforePhoto?: string;
  afterPhoto?: string;
  checklist: {
    id: string;
    text: string;
    done: boolean;
  }[];
  notes?: string;
  
  // Review outcomes
  rejectReason?: string;
  rejectChips?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'danger';
  taskId?: string;
}

export type Role = 'Staff' | 'Manager';
