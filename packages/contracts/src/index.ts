export const API_VERSION = 'v1' as const;

export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type ApiVersion = typeof API_VERSION;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
}

export interface ApiSuccess<TData> {
  data: TData;
}

export interface ApiList<TData> {
  data: TData[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ApiFailure {
  error: ApiError;
}

export type ApiResult<TData> = ApiSuccess<TData> | ApiFailure;

export type UserRole = 'staff' | 'manager' | 'admin';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const TaskStatus = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In_Progress',
  WAITING_REVIEW: 'Waiting_Review',
  COMPLETED: 'Completed',
  REWORK_REQUIRED: 'Rework_Required',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export type Role = 'Staff' | 'Manager';

export type TreeHealthStatus = 'Khỏe mạnh' | 'Cần chăm sóc' | 'Sâu bệnh';
export type TreeRiskStatus = 'healthy' | 'abnormal' | 'overdue' | 'pest_risk' | 'leaning';
export type TaskType = 'Tưới nước' | 'Cắt tỉa cành' | 'Bón phân' | 'Phun thuốc' | 'Kiểm tra sâu bệnh' | 'Trồng mới';
export type NotificationType = 'info' | 'success' | 'warning' | 'danger';
export type EvidenceStage = 'before' | 'after';
export type ReviewDecision = 'approve' | 'request_rework';

export interface TreeDto {
  id: string;
  name: string;
  species: string;
  lat: number;
  lng: number;
  address: string;
  qrCode: string;
  healthStatus: TreeHealthStatus;
  ageYears: number;
  riskStatus?: TreeRiskStatus;
}

export interface StaffDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  workload: number;
  role: 'Staff';
}

export interface ChecklistItemDto {
  id: string;
  text: string;
  done: boolean;
}

export interface GpsCheckDto {
  verified: boolean;
  distance: number;
  timestamp: string;
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface QrCheckDto {
  verified: boolean;
  scannedCode: string;
  timestamp: string;
}

export interface TaskEvidenceDto {
  id: string;
  taskId: string;
  treeId: string;
  stage: EvidenceStage;
  uri: string;
  capturedAt: string;
  capturedByUserId: string;
  gpsCheck?: GpsCheckDto;
}

export interface TaskDto {
  id: string;
  title: string;
  taskType: TaskType;
  description: string;
  treeId: string;
  treeName: string;
  treeAddress: string;
  assignedStaffId: string;
  assignedStaffName: string;
  deadline: string;
  status: TaskStatus;
  gpsCheck?: GpsCheckDto;
  qrCheck?: QrCheckDto;
  beforePhoto?: string;
  afterPhoto?: string;
  evidence?: TaskEvidenceDto[];
  checklist: ChecklistItemDto[];
  notes?: string;
  rejectReason?: string;
  rejectChips?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  taskId?: string;
}

export interface CareHistoryDto {
  id: string;
  treeId: string;
  taskId: string;
  taskTitle: string;
  staffId: string;
  staffName: string;
  completedAt: string;
  status: TaskStatus;
  gpsCheck?: GpsCheckDto;
  qrCheck?: QrCheckDto;
  beforePhoto?: string;
  afterPhoto?: string;
  notes?: string;
}

export interface AppDataDto {
  trees: TreeDto[];
  staff: StaffDto[];
  tasks: TaskDto[];
  notifications: NotificationDto[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  session: AuthSession;
}

export interface ListTasksQuery {
  staffId?: string;
  status?: TaskStatus;
  cursor?: string;
  limit?: number;
}

export interface ListTreesQuery {
  q?: string;
  riskStatus?: TreeRiskStatus;
  cursor?: string;
  limit?: number;
}

export interface CreateTaskRequest {
  title: string;
  taskType: TaskType;
  description: string;
  treeId: string;
  assignedStaffId: string;
  deadline: string;
  checklist: ChecklistItemDto[];
}

export interface UpdateTaskProgressRequest {
  taskId: string;
  status?: TaskStatus;
  gpsCheck?: GpsCheckDto;
  qrCheck?: QrCheckDto;
  beforePhoto?: string;
  afterPhoto?: string;
  evidence?: TaskEvidenceDto[];
  checklist?: ChecklistItemDto[];
  notes?: string;
  rejectReason?: string;
}

export interface SubmitTaskEvidenceRequest {
  taskId: string;
  gpsCheck: GpsCheckDto;
  qrCheck: QrCheckDto;
  evidence: TaskEvidenceDto[];
  checklist: ChecklistItemDto[];
  notes?: string;
}

export interface CreateNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  taskId?: string;
  timestamp?: string;
  read?: boolean;
}

export interface ReviewDecisionRequest {
  taskId: string;
  decision: ReviewDecision;
  reviewerId: string;
  reason?: string;
  rejectReason?: string;
  reasonChips?: string[];
}
