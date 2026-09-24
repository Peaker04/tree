import { z } from 'zod';
import type { CanonicalTaskStatus } from '../operational/task-status';
import type { GpsCheckDto, QrCheckDto } from '../operational/verification';
import type { ChecklistItemDto } from '../operational/evidence';
import type { TreeHealthStatus, TreeRiskStatus } from '../governance/trees';
import type { ProofProfile } from '../operational/proof-profile';

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy Vietnamese demo task types used by apps/mobile.
 * Canonical operational contracts reference TaskType catalog by identifier (TaskTypeId).
 */
export const LegacyTaskTypeSchema = z.enum([
  'Tưới nước',
  'Cắt tỉa cành',
  'Bón phân',
  'Phun thuốc',
  'Kiểm tra sâu bệnh',
  'Trồng mới',
]);

export type LegacyTaskType = z.infer<typeof LegacyTaskTypeSchema>;

export type TaskType = LegacyTaskType;

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy PascalCase task status constants used by current apps/mobile.
 * Use CanonicalTaskStatus / TaskStatusSchema for new canonical backend work.
 */
export const LegacyTaskStatus = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In_Progress',
  WAITING_REVIEW: 'Waiting_Review',
  COMPLETED: 'Completed',
  REWORK_REQUIRED: 'Rework_Required',
} as const;

export type LegacyTaskStatus = (typeof LegacyTaskStatus)[keyof typeof LegacyTaskStatus];

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Preserved for apps/mobile runtime and source compatibility.
 * Canonical runtime validation is provided by TaskStatusSchema.
 */
export const TaskStatus = LegacyTaskStatus;
export type TaskStatus = CanonicalTaskStatus | LegacyTaskStatus;

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy PascalCase role used by apps/mobile.
 * Canonical roles are in HumanRoleSchema ('staff' | 'manager' | 'admin').
 */
export type Role = 'Staff' | 'Manager';

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy evidence stage enum used by apps/mobile.
 * Canonical evidence models use ProofProfile-adaptive payloads.
 */
export type EvidenceStage = 'before' | 'after';

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy staff DTO shape used by apps/mobile.
 */
export interface StaffDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  workload: number;
  role: 'Staff';
}

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy task evidence DTO shape used by apps/mobile.
 */
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

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  taskId?: string;
}

export interface CreateNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  taskId?: string;
  timestamp?: string;
  read?: boolean;
}

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Transitional TaskDto preserving compatibility with apps/mobile mock data and UI.
 * Canonical backend uses CanonicalTaskDto (inferred from TaskDtoSchema with required version: number).
 */
export interface TaskDto {
  id: string;
  title: string;
  taskType: TaskType;
  proofProfile: ProofProfile;
  description: string;
  treeId: string;
  treeName: string;
  treeAddress: string;
  assignedStaffId: string;
  assignedStaffName: string;
  deadline: string;
  status: TaskStatus;
  version?: number;
  gpsCheck?: GpsCheckDto;
  qrCheck?: QrCheckDto;
  beforePhoto?: string;
  afterPhoto?: string;
  beforePhotoDisplayUrl?: string;
  afterPhotoDisplayUrl?: string;
  evidence?: TaskEvidenceDto[];
  checklist: ChecklistItemDto[];
  notes?: string;
  rejectReason?: string;
  reworkTarget?: string;
  rejectChips?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Transitional TreeDto preserving compatibility with apps/mobile mock data.
 * Canonical backend uses CanonicalTreeDto (inferred from TreeDtoSchema with required version: number).
 */
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
  version?: number;
  riskStatus?: TreeRiskStatus;
}

export interface AppDataDto {
  trees: TreeDto[];
  staff: StaffDto[];
  tasks: TaskDto[];
  notifications: NotificationDto[];
}

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Transitional CareHistoryDto preserving compatibility with apps/mobile.
 */
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
  hasException?: boolean;
  exceptionReason?: string;
}

/**
 * @deprecated TRANSITIONAL_COMPAT
 * Legacy CreateTaskRequest shape used by apps/mobile.
 * Canonical creation uses CanonicalCreateTaskRequest / CreateTaskRequestSchema without client-controlled checklist.
 */
export interface CreateTaskRequest {
  title: string;
  taskType: TaskType;
  description: string;
  treeId: string;
  assignedStaffId: string;
  deadline: string;
  checklist: ChecklistItemDto[];
}
