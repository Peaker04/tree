import { createInitialData } from '../data';
import { AppData, AppNotification, CareHistory, Role, Task, TaskStatus } from '../types';
import type {
  AuthSession,
  ApiFailure,
  CareHistoryDto,
  CreateNotificationRequest,
  CreateTaskRequest,
  GpsCheckDto,
  LoginRequest,
  LoginResponse,
  ListTasksQuery,
  ListTreesQuery,
  NotificationDto,
  QrCheckDto,
  ReviewDecisionRequest,
  SubmitTaskEvidenceRequest,
  TaskEvidenceDto,
  TaskDto,
  TreeDto,
  UpdateTaskProgressRequest,
  CanonicalTaskDto,
  ReviewTaskBody,
} from '@novyx/contracts';
import { readPublicRuntimeConfig } from '@novyx/config';
import type { IAuthSessionManager } from './authSessionManager';
import { AuthSessionManager } from './authSessionManager';
import { MobileApiClient } from './mobileApiClient';

const defaultPublicEnvSource = {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
};

export interface GreenOpsService {
  getSnapshot: () => AppData;
  login: (request: LoginRequest) => Promise<LoginResult>;
  restoreSession: (session: AuthSession) => LoginResult;
  logout: () => void;
  loadSnapshot: () => Promise<SnapshotLoadResult>;
  listCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistoryLoadResult>;
  lookupTreeByQr: (payload: string) => Promise<TreeLookupResult>;
  createTask: (request: CreateTaskRequest, fallbackTask: Task) => Promise<TaskMutationResult>;
  updateTaskProgress: (task: Task) => Promise<TaskMutationResult>;
  submitTaskEvidence: (task: Task) => Promise<TaskMutationResult>;
  reviewTask: (request: ReviewDecisionRequest, fallbackTask: Task) => Promise<TaskMutationResult>;
  createNotification: (request: CreateNotificationRequest) => Promise<NotificationMutationResult>;
  markNotificationsRead: (
    notificationIds: string[],
    fallbackNotifications: AppNotification[],
  ) => Promise<NotificationsMutationResult>;
  replaceTasks: (tasks: Task[]) => AppData;
  replaceNotifications: (notifications: AppNotification[]) => AppData;
  reset: () => AppData;
}

export type DataSourceStatus = 'mock' | 'rest' | 'fallback';

export interface SnapshotLoadResult {
  data: AppData;
  source: DataSourceStatus;
  message?: string;
}

export interface LoginResult {
  role: Role | 'UNSUPPORTED';
  source: DataSourceStatus;
  session?: AuthSession;
  message?: string;
}

export interface CareHistoryLoadResult {
  data: CareHistory[];
  source: DataSourceStatus;
  message?: string;
}

export interface TreeLookupResult {
  data: TreeDto | null;
  source: DataSourceStatus;
  message?: string;
}

export interface TaskMutationResult {
  data: Task;
  source: DataSourceStatus;
  message?: string;
}

export interface NotificationsMutationResult {
  data: AppNotification[];
  source: DataSourceStatus;
  message?: string;
}

export interface NotificationMutationResult {
  data: AppNotification;
  source: DataSourceStatus;
  message?: string;
}

export interface GreenOpsRestService {
  login: (request: LoginRequest) => Promise<LoginResponse>;
  restoreSession: (session: AuthSession) => void;
  logout: () => void;
  listTasks: (query?: ListTasksQuery) => Promise<TaskDto[]>;
  listTrees: (query?: ListTreesQuery) => Promise<TreeDto[]>;
  listCareHistoryByTree: (treeId: string) => Promise<CareHistoryDto[]>;
  createTask: (request: CreateTaskRequest) => Promise<TaskDto>;
  updateTaskProgress: (request: UpdateTaskProgressRequest) => Promise<TaskDto>;
  submitTaskEvidence: (request: SubmitTaskEvidenceRequest) => Promise<TaskDto>;
  reviewTask: (request: ReviewDecisionRequest) => Promise<TaskDto>;
  listNotifications: () => Promise<NotificationDto[]>;
  createNotification: (request: CreateNotificationRequest) => Promise<NotificationDto>;
  markNotificationRead: (notificationId: string) => Promise<NotificationDto>;
}

class GreenOpsApiError extends Error {
  code: string;
  requestId: string;
  details?: Record<string, unknown>;

  constructor(error: ApiFailure['error']) {
    super(error.message);
    this.name = 'GreenOpsApiError';
    this.code = error.code;
    this.requestId = error.requestId;
    this.details = error.details;
  }
}

const toLoadFailureMessage = (error: unknown) => {
  if (error instanceof GreenOpsApiError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Không thể kết nối API.';
};

const cloneGpsCheck = (gpsCheck: GpsCheckDto | undefined): GpsCheckDto | undefined => {
  if (!gpsCheck) return undefined;

  return {
    verified: gpsCheck.verified,
    distance: gpsCheck.distance,
    timestamp: gpsCheck.timestamp,
    lat: gpsCheck.lat,
    lng: gpsCheck.lng,
    ...(gpsCheck.accuracyMeters !== undefined ? { accuracyMeters: gpsCheck.accuracyMeters } : {}),
  };
};

const cloneQrCheck = (qrCheck: QrCheckDto | undefined): QrCheckDto | undefined => {
  if (!qrCheck) return undefined;

  return {
    verified: qrCheck.verified,
    scannedCode: qrCheck.scannedCode,
    timestamp: qrCheck.timestamp,
  };
};

const cloneEvidenceItem = (item: TaskEvidenceDto): TaskEvidenceDto => {
  const cloned: TaskEvidenceDto = {
    id: item.id,
    taskId: item.taskId,
    treeId: item.treeId,
    stage: item.stage,
    uri: item.uri,
    capturedAt: item.capturedAt,
    capturedByUserId: item.capturedByUserId,
  };
  const gpsCheck = cloneGpsCheck(item.gpsCheck);
  if (gpsCheck) {
    cloned.gpsCheck = gpsCheck;
  }
  return cloned;
};

const buildTaskEvidenceItems = (task: Task): TaskEvidenceDto[] => {
  if (task.evidence?.length) {
    return task.evidence.map(cloneEvidenceItem);
  }

  const gpsCheck = cloneGpsCheck(task.gpsCheck);
  const items: TaskEvidenceDto[] = [];

  if (task.beforePhoto) {
    const beforeEvidence: TaskEvidenceDto = {
      id: `ev-${task.id}-before`,
      taskId: task.id,
      treeId: task.treeId,
      stage: 'before',
      uri: task.beforePhoto,
      capturedAt: task.updatedAt,
      capturedByUserId: task.assignedStaffId,
    };
    if (gpsCheck) {
      beforeEvidence.gpsCheck = gpsCheck;
    }
    items.push(beforeEvidence);
  }

  if (task.afterPhoto) {
    const afterEvidence: TaskEvidenceDto = {
      id: `ev-${task.id}-after`,
      taskId: task.id,
      treeId: task.treeId,
      stage: 'after',
      uri: task.afterPhoto,
      capturedAt: task.updatedAt,
      capturedByUserId: task.assignedStaffId,
    };
    if (gpsCheck) {
      afterEvidence.gpsCheck = gpsCheck;
    }
    items.push(afterEvidence);
  }

  return items;
};

const cloneTasks = (tasks: Task[]): Task[] =>
  tasks.map((task) => ({
    ...task,
    ...(task.gpsCheck ? { gpsCheck: cloneGpsCheck(task.gpsCheck) } : {}),
    ...(task.qrCheck ? { qrCheck: cloneQrCheck(task.qrCheck) } : {}),
    ...(task.evidence ? { evidence: buildTaskEvidenceItems(task) } : {}),
    checklist: (task.checklist ?? []).map((check) => ({ ...check })),
  }));

const cloneData = (data: AppData): AppData => ({
  trees: data.trees.map((tree) => ({ ...tree })),
  staff: data.staff.map((staff) => ({ ...staff })),
  tasks: cloneTasks(data.tasks),
  notifications: data.notifications.map((notification) => ({ ...notification })),
});

const cloneCareHistory = (items: CareHistory[]): CareHistory[] =>
  items.map((item) => ({
    ...item,
    ...(item.gpsCheck ? { gpsCheck: cloneGpsCheck(item.gpsCheck) } : {}),
    ...(item.qrCheck ? { qrCheck: cloneQrCheck(item.qrCheck) } : {}),
  }));

const buildCareHistory = (tasks: Task[], treeId: string): CareHistory[] =>
  tasks
    .filter((task) => task.treeId === treeId)
    .filter((task) => task.status === TaskStatus.COMPLETED)
    .map((task) => ({
      id: `hist-${task.id}`,
      treeId: task.treeId,
      taskId: task.id,
      taskTitle: task.title,
      staffId: task.assignedStaffId,
      staffName: task.assignedStaffName,
      completedAt: task.updatedAt,
      status: task.status,
      ...(task.gpsCheck ? { gpsCheck: cloneGpsCheck(task.gpsCheck) } : {}),
      ...(task.qrCheck ? { qrCheck: cloneQrCheck(task.qrCheck) } : {}),
      ...(task.beforePhoto ? { beforePhoto: task.beforePhoto } : {}),
      ...(task.afterPhoto ? { afterPhoto: task.afterPhoto } : {}),
      ...(task.notes ? { notes: task.notes } : {}),
    }))
    .sort((first, second) => new Date(second.completedAt).getTime() - new Date(first.completedAt).getTime());

const upsertTask = (tasks: Task[], nextTask: Task) =>
  tasks.some((task) => task.id === nextTask.id)
    ? tasks.map((task) => (task.id === nextTask.id ? nextTask : task))
    : [nextTask, ...tasks];

const findTreeInSnapshot = (snapshot: AppData, payload: string) =>
  snapshot.trees.find((tree) => tree.qrCode === payload || tree.id === payload) ?? null;

const mapSessionRole = (session: AuthSession): Role | 'UNSUPPORTED' => {
  if (session.user.role === 'staff') return 'Staff';
  if (session.user.role === 'manager') return 'Manager';
  return 'UNSUPPORTED';
};

const buildEvidenceRequest = (task: Task): SubmitTaskEvidenceRequest => ({
  taskId: task.id,
  gpsCheck: task.gpsCheck ?? {
    verified: false,
    distance: 999,
    timestamp: new Date().toISOString(),
    lat: 0,
    lng: 0,
  },
  qrCheck: task.qrCheck ?? {
    verified: false,
    scannedCode: '',
    timestamp: new Date().toISOString(),
  },
  evidence: buildTaskEvidenceItems(task),
  checklist: task.checklist.map((item) => ({ ...item })),
  ...(task.notes ? { notes: task.notes } : {}),
});

const buildTaskProgressRequest = (task: Task): UpdateTaskProgressRequest => ({
  taskId: task.id,
  status: task.status,
  ...(task.gpsCheck ? { gpsCheck: cloneGpsCheck(task.gpsCheck) } : {}),
  ...(task.qrCheck ? { qrCheck: cloneQrCheck(task.qrCheck) } : {}),
  ...(task.beforePhoto ? { beforePhoto: task.beforePhoto } : {}),
  ...(task.afterPhoto ? { afterPhoto: task.afterPhoto } : {}),
  ...(task.evidence ? { evidence: buildTaskEvidenceItems(task) } : {}),
  checklist: task.checklist.map((item) => ({ ...item })),
  ...(task.notes ? { notes: task.notes } : {}),
  ...(task.rejectReason ? { rejectReason: task.rejectReason } : {}),
});

const buildFallbackNotification = (request: CreateNotificationRequest): AppNotification => ({
  id: `notif-${Date.now()}`,
  title: request.title,
  body: request.body,
  timestamp: request.timestamp ?? new Date().toISOString(),
  read: request.read ?? false,
  type: request.type,
  ...(request.taskId ? { taskId: request.taskId } : {}),
});

export function createHybridGreenOpsService(
  seed: AppData = createInitialData(),
  envSource: Record<string, string | undefined> = defaultPublicEnvSource,
  sessionManager?: IAuthSessionManager,
  apiClient?: MobileApiClient,
): GreenOpsService {
  const _config = readPublicRuntimeConfig(envSource);
  // Section 5 & 33: Explicit data source selection. In mock mode, use mock intentionally.

  let snapshot = cloneData(seed);
  const restService = createGreenOpsRestService(envSource, sessionManager, apiClient);

  return {
    getSnapshot: () => cloneData(snapshot),
    login: async (request) => {
      const response = await restService.login(request);
      return {
        role: mapSessionRole(response.session),
        source: 'rest',
        session: response.session,
      };
    },
    restoreSession: (session) => {
      restService.restoreSession(session);
      return {
        role: mapSessionRole(session),
        source: 'rest',
        session,
      };
    },
    logout: () => {
      restService.logout();
    },
    loadSnapshot: async () => {
      try {
        const [trees, tasks, notifications] = await Promise.all([
          restService.listTrees(),
          restService.listTasks(),
          restService.listNotifications(),
        ]);
        snapshot = {
          ...snapshot,
          trees: trees.map((tree) => ({ ...tree })),
          tasks: cloneTasks(tasks),
          notifications: notifications.map((notification) => ({ ...notification })),
        };
        return { data: cloneData(snapshot), source: 'rest' };
      } catch (error) {
        // Read-only stale cached data with explicit offline/stale indication
        return {
          data: cloneData(snapshot),
          source: 'fallback',
          message: `Stale cached data (offline): ${toLoadFailureMessage(error)}`,
        };
      }
    },
    listCareHistoryByTree: (treeId) => cloneCareHistory(buildCareHistory(snapshot.tasks, treeId)),
    loadCareHistoryByTree: async (treeId) => {
      try {
        const careHistory = await restService.listCareHistoryByTree(treeId);
        return {
          data: cloneCareHistory(careHistory),
          source: 'rest',
        };
      } catch (error) {
        return {
          data: cloneCareHistory(buildCareHistory(snapshot.tasks, treeId)),
          source: 'fallback',
          message: `Stale cached data (offline): ${toLoadFailureMessage(error)}`,
        };
      }
    },
    lookupTreeByQr: async (payload) => {
      try {
        const trees = await restService.listTrees({ q: payload, limit: 5 });
        const matchedTree = trees.find((tree) => tree.qrCode === payload || tree.id === payload) ?? trees[0] ?? null;
        if (matchedTree) {
          snapshot = {
            ...snapshot,
            trees: snapshot.trees.some((tree) => tree.id === matchedTree.id)
              ? snapshot.trees.map((tree) => (tree.id === matchedTree.id ? matchedTree : tree))
              : [matchedTree, ...snapshot.trees],
          };
        }
        return {
          data: matchedTree,
          source: 'rest',
        };
      } catch (error) {
        return {
          data: findTreeInSnapshot(snapshot, payload),
          source: 'fallback',
          message: `Stale cached data (offline): ${toLoadFailureMessage(error)}`,
        };
      }
    },
    // Section 5: In rest mode, mutation failures MUST NOT execute against mock or mutate fake tasks
    createTask: async (request, _fallbackTask) => {
      const task = await restService.createTask(request);
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, task),
      };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    updateTaskProgress: async (task) => {
      const nextTask = await restService.updateTaskProgress(buildTaskProgressRequest(task));
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, nextTask),
      };
      return { data: cloneTasks([nextTask])[0], source: 'rest' };
    },
    submitTaskEvidence: async (task) => {
      const nextTask = await restService.submitTaskEvidence(buildEvidenceRequest(task));
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, nextTask),
      };
      return { data: cloneTasks([nextTask])[0], source: 'rest' };
    },
    reviewTask: async (request, _fallbackTask) => {
      const nextTask = await restService.reviewTask(request);
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, nextTask),
      };
      return { data: cloneTasks([nextTask])[0], source: 'rest' };
    },
    createNotification: async (request) => {
      // Backend does not have notification routes; keep local/mock explicitly
      const notification = buildFallbackNotification(request);
      snapshot = {
        ...snapshot,
        notifications: [notification, ...snapshot.notifications.filter((item) => item.id !== notification.id)],
      };
      return { data: { ...notification }, source: 'mock' };
    },
    markNotificationsRead: async (_notificationIds, fallbackNotifications) => {
      // Backend does not have notification routes; keep local/mock explicitly
      snapshot = {
        ...snapshot,
        notifications: fallbackNotifications.map((notification) => ({ ...notification, read: true })),
      };
      return {
        data: snapshot.notifications.map((notification) => ({ ...notification })),
        source: 'mock',
      };
    },
    replaceTasks: (tasks) => {
      snapshot = {
        ...snapshot,
        tasks: cloneTasks(tasks),
      };
      return cloneData(snapshot);
    },
    replaceNotifications: (notifications) => {
      snapshot = {
        ...snapshot,
        notifications: notifications.map((notification) => ({ ...notification })),
      };
      return cloneData(snapshot);
    },
    reset: () => {
      snapshot = cloneData(seed);
      return cloneData(snapshot);
    },
  };
}

export function createGreenOpsRestService(
  envSource: Record<string, string | undefined> = defaultPublicEnvSource,
  sessionManager?: IAuthSessionManager,
  apiClient?: MobileApiClient,
): GreenOpsRestService {
  const config = readPublicRuntimeConfig(envSource);
  const authSessionManager = sessionManager ?? new AuthSessionManager(config.apiBaseUrl);
  const client = apiClient ?? new MobileApiClient(config.apiBaseUrl, authSessionManager);

  return {
    login: async (request) => {
      const session = await authSessionManager.login(request);
      return {
        session,
        user: session.user,
      };
    },
    restoreSession: (session) => {
      void authSessionManager.setSession(session);
    },
    logout: () => {
      void authSessionManager.logout();
    },
    listTasks: async (query) => {
      const queryParams = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== '') queryParams.set(k, String(v));
        });
      }
      const qStr = queryParams.toString();
      const path = `/v1/tasks${qStr ? `?${qStr}` : ''}`;
      return await client.get<TaskDto[]>(path);
    },
    listTrees: async (query) => {
      const queryParams = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== '') queryParams.set(k, String(v));
        });
      }
      const qStr = queryParams.toString();
      const path = `/v1/trees${qStr ? `?${qStr}` : ''}`;
      return await client.get<TreeDto[]>(path);
    },
    listCareHistoryByTree: async (treeId) => {
      return await client.get<CareHistoryDto[]>(`/v1/trees/${treeId}/care-history`);
    },
    createTask: async (request) => {
      const payload = {
        title: request.title,
        taskTypeId: (request as unknown as { taskTypeId?: string }).taskTypeId ?? request.taskType,
        description: request.description,
        treeId: request.treeId,
        assignedStaffId: request.assignedStaffId,
        deadline: request.deadline,
      };
      return await client.post<TaskDto>('/v1/tasks', payload);
    },
    updateTaskProgress: async () => {
      throw new Error('UNSUPPORTED_IN_REST_MODE: /tasks/:id/progress does not exist on backend.');
    },
    submitTaskEvidence: async () => {
      throw new Error('NOT_CUT_OVER: submitTaskEvidence direct REST call is deprecated. Use durable Outbox pipeline.');
    },
    reviewTask: async (request) => {
      if (request.expectedVersion === undefined) {
        throw new Error('NOT_CUT_OVER: Review in REST mode requires expectedVersion.');
      }
      const decisionMap: Record<string, 'APPROVE' | 'REQUEST_REWORK' | 'APPROVE_WITH_EXCEPTION' | 'CANCEL'> = {
        approve: 'APPROVE',
        request_rework: 'REQUEST_REWORK',
        APPROVE: 'APPROVE',
        REQUEST_REWORK: 'REQUEST_REWORK',
        APPROVE_WITH_EXCEPTION: 'APPROVE_WITH_EXCEPTION',
        CANCEL: 'CANCEL',
      };
      const canonicalDecision = decisionMap[request.decision];
      if (!canonicalDecision) {
        throw new Error(`NOT_CUT_OVER: Unsupported review decision "${request.decision}"`);
      }
      const body: ReviewTaskBody = {
        expectedVersion: request.expectedVersion,
        decision: canonicalDecision,
        ...(request.reason ? { notes: request.reason } : {}),
        ...((request.rejectReason ?? request.reason) ? { reworkReason: request.rejectReason ?? request.reason } : {}),
      };
      const result = await client.post<CanonicalTaskDto>(`/v1/tasks/${request.taskId}/review`, body);
      return result as unknown as TaskDto;
    },
    listNotifications: async () => {
      // Backend does not have notification routes; do not emit HTTP calls
      return Promise.resolve([]);
    },
    createNotification: async () => {
      throw new Error('NOT_CUT_OVER: Notifications not supported on backend.');
    },
    markNotificationRead: async () => {
      throw new Error('NOT_CUT_OVER: Notifications not supported on backend.');
    },
  };
}
