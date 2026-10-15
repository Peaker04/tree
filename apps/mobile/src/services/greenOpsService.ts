import { AppData, AppNotification, CareHistory, Role, Task, TaskStatus, Tree } from '../types';
import type {
  AuthSession,
  ApiFailure,
  AssignableStaffCatalogItem,
  CanonicalCreateTaskRequest,
  CreateTreeRequest,
  CareHistoryDto,
  GpsCheckDto,
  LoginRequest,
  LoginResponse,
  ListTasksQuery,
  ListTreesQuery,
  NotificationDto,
  OperationalTaskTypeCatalogItem,
  QrCheckDto,
  ReviewTaskRequest,
  TaskEvidenceDto,
  TaskDto,
  TreeDto,
  CancelTaskRequest,
  CanonicalTaskDto,
  ReportFieldIssueRequest,
  ResumeBlockedTaskRequest,
  ReassignTaskRequest,
  ResubmitReworkRequest,
  StartTaskRequest,
} from '@novyx/contracts';
import { readPublicRuntimeConfig } from '@novyx/config';
import type { IAuthSessionManager } from './authSessionManager';
import { AuthSessionManager } from './authSessionManager';
import { MobileApiClient } from './mobileApiClient';
import type { IAuthenticatedSnapshotCache } from '../storage/cache/authenticatedSnapshotCache';
import { generateSecureUuid } from '../storage/utils/uuid';

const defaultPublicEnvSource = {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_API_FUD: process.env.EXPO_PUBLIC_API_FUD,
  EXPO_PUBLIC_API_HOME: process.env.EXPO_PUBLIC_API_HOME,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
};

type CreateTreeInput = Omit<CreateTreeRequest, 'treeId' | 'qrCode'>;

export interface GreenOpsService {
  getSnapshot: () => AppData;
  login: (request: LoginRequest) => Promise<LoginResult>;
  restoreSession: (session: AuthSession) => LoginResult;
  logout: () => void;
  loadSnapshot: () => Promise<SnapshotLoadResult>;
  listOperationalTaskTypes: () => Promise<OperationalTaskTypeCatalogItem[]>;
  listAssignableStaff: () => Promise<AssignableStaffCatalogItem[]>;
  listCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistoryLoadResult>;
  lookupTreeByQr: (payload: string) => Promise<TreeLookupResult>;
  createTask: (request: CanonicalCreateTaskRequest) => Promise<TaskMutationResult>;
  createTree: (request: CreateTreeInput) => Promise<Tree>;
  startTask: (request: StartTaskRequest) => Promise<TaskMutationResult>;
  reportFieldIssue: (request: ReportFieldIssueRequest) => Promise<TaskMutationResult>;
  resumeBlockedTask: (request: ResumeBlockedTaskRequest) => Promise<TaskMutationResult>;
  reassignTask: (request: ReassignTaskRequest) => Promise<TaskMutationResult>;
  cancelTask: (request: CancelTaskRequest) => Promise<TaskMutationResult>;
  resubmitRework: (request: ResubmitReworkRequest) => Promise<TaskMutationResult>;
  reviewTask: (request: ReviewTaskRequest) => Promise<TaskMutationResult>;
  replaceTasks: (tasks: Task[]) => AppData;
  replaceNotifications: (notifications: AppNotification[]) => AppData;
  setSnapshotCache: (cache: IAuthenticatedSnapshotCache) => void;
  reset: () => AppData;
}

export type DataSourceStatus = 'rest' | 'cache' | 'error';

export interface SnapshotLoadResult {
  data: AppData;
  source: DataSourceStatus;
  message?: string;
  cachedAt?: string;
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

export interface GreenOpsRestService {
  login: (request: LoginRequest) => Promise<LoginResponse>;
  restoreSession: (session: AuthSession) => void;
  logout: () => void;
  listTasks: (query?: ListTasksQuery) => Promise<TaskDto[]>;
  listTrees: (query?: ListTreesQuery) => Promise<TreeDto[]>;
  listCareHistoryByTree: (treeId: string) => Promise<CareHistoryDto[]>;
  createTask: (request: CanonicalCreateTaskRequest) => Promise<TaskDto>;
  createTree: (request: CreateTreeInput) => Promise<TreeDto>;
  startTask: (request: StartTaskRequest) => Promise<TaskDto>;
  reportFieldIssue: (request: ReportFieldIssueRequest) => Promise<TaskDto>;
  resumeBlockedTask: (request: ResumeBlockedTaskRequest) => Promise<TaskDto>;
  reassignTask: (request: ReassignTaskRequest) => Promise<TaskDto>;
  cancelTask: (request: CancelTaskRequest) => Promise<TaskDto>;
  resubmitRework: (request: ResubmitReworkRequest) => Promise<TaskDto>;
  reviewTask: (request: ReviewTaskRequest) => Promise<TaskDto>;
  listNotifications: () => Promise<NotificationDto[]>;
  listOperationalTaskTypes: () => Promise<OperationalTaskTypeCatalogItem[]>;
  listAssignableStaff: () => Promise<AssignableStaffCatalogItem[]>;
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

const normalizeMobileTaskStatus = (status: Task['status']): Task['status'] => {
  if (status === 'PENDING') return TaskStatus.PENDING;
  if (status === 'IN_PROGRESS') return TaskStatus.IN_PROGRESS;
  if (status === 'WAITING_REVIEW') return TaskStatus.WAITING_REVIEW;
  if (status === 'REWORK_REQUIRED') return TaskStatus.REWORK_REQUIRED;
  if (status === 'COMPLETED') return TaskStatus.COMPLETED;
  return status;
};

const cloneTasks = (tasks: Task[]): Task[] =>
  tasks.map((task) => ({
    ...task,
    status: normalizeMobileTaskStatus(task.status),
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

const emptyAppData = (): AppData => ({ trees: [], staff: [], tasks: [], notifications: [] });

export function createHybridGreenOpsService(
  seed: AppData | undefined,
  envSource: Record<string, string | undefined> = defaultPublicEnvSource,
  sessionManager?: IAuthSessionManager,
  apiClient?: MobileApiClient,
  initialSnapshotCache?: IAuthenticatedSnapshotCache,
): GreenOpsService {
  readPublicRuntimeConfig(envSource);

  let snapshot = cloneData(seed ?? emptyAppData());
  let snapshotCache = initialSnapshotCache;
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
      const activeSession = sessionManager?.getActiveSessionSync();
      const userId = activeSession?.user.id;
      try {
        const [trees, tasks] = await Promise.all([restService.listTrees(), restService.listTasks()]);
        const currentNotifications = snapshot.notifications;
        const nextTasks = cloneTasks(tasks);
        let notifications = currentNotifications;

        if (activeSession?.user.role === 'staff') {
          const latestReviewedTask = nextTasks
            .filter(
              (task) =>
                task.assignedStaffId === activeSession.user.id &&
                (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.REWORK_REQUIRED),
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

          if (latestReviewedTask && !notifications.some((item) => item.taskId === latestReviewedTask.id)) {
            const needsRework = latestReviewedTask.status === TaskStatus.REWORK_REQUIRED;
            notifications = [
              {
                id: `review-${latestReviewedTask.id}-${latestReviewedTask.version}`,
                title: needsRework ? 'Công việc cần làm lại' : 'Báo cáo đã được duyệt',
                body: needsRework
                  ? `${latestReviewedTask.title}: ${latestReviewedTask.rejectReason ?? 'Quản lý yêu cầu bổ sung bằng chứng.'}`
                  : `${latestReviewedTask.title} đã hoàn tất sau khi quản lý duyệt.`,
                timestamp: latestReviewedTask.updatedAt,
                read: false,
                type: needsRework ? 'warning' : 'success',
                taskId: latestReviewedTask.id,
              },
              ...notifications,
            ];
          }
        }

        snapshot = {
          trees: trees.map((tree) => ({ ...tree })),
          staff: [],
          tasks: nextTasks,
          notifications,
        };
        let cacheMessage: string | undefined;
        if (userId && snapshotCache) {
          try {
            await snapshotCache.save(userId, snapshot);
          } catch {
            cacheMessage = 'Đã tải dữ liệu REST nhưng chưa lưu được bộ nhớ ngoại tuyến.';
          }
        }
        return {
          data: cloneData(snapshot),
          source: 'rest',
          ...(cacheMessage ? { message: cacheMessage } : {}),
        };
      } catch (error) {
        const cached = userId && snapshotCache ? await snapshotCache.load(userId) : null;
        if (cached) {
          snapshot = cloneData(cached.data);
          return {
            data: cloneData(snapshot),
            source: 'cache',
            cachedAt: cached.updatedAt,
            message: 'API hiện không khả dụng.',
          };
        }

        snapshot = emptyAppData();
        return {
          data: cloneData(snapshot),
          source: 'error',
          message: toLoadFailureMessage(error),
        };
      }
    },
    listOperationalTaskTypes: async () => await restService.listOperationalTaskTypes(),
    listAssignableStaff: async () => await restService.listAssignableStaff(),
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
          source: 'cache',
          message: `Dữ liệu lưu trên thiết bị: ${toLoadFailureMessage(error)}`,
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
          source: findTreeInSnapshot(snapshot, payload) ? 'cache' : 'error',
          message: `Không thể tra cứu API: ${toLoadFailureMessage(error)}`,
        };
      }
    },
    // Section 5: In rest mode, mutation failures MUST NOT execute against mock or mutate fake tasks
    createTask: async (request) => {
      const task = await restService.createTask(request);
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, task),
      };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    createTree: async (request) => {
      const tree = await restService.createTree(request);
      snapshot = { ...snapshot, trees: [tree, ...snapshot.trees] };
      return { ...tree };
    },
    startTask: async (request) => {
      const task = await restService.startTask(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    reportFieldIssue: async (request) => {
      const task = await restService.reportFieldIssue(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    resumeBlockedTask: async (request) => {
      const task = await restService.resumeBlockedTask(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    reassignTask: async (request) => {
      const task = await restService.reassignTask(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    cancelTask: async (request) => {
      const task = await restService.cancelTask(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    resubmitRework: async (request) => {
      const task = await restService.resubmitRework(request);
      snapshot = { ...snapshot, tasks: upsertTask(snapshot.tasks, task) };
      return { data: cloneTasks([task])[0], source: 'rest' };
    },
    reviewTask: async (request) => {
      const nextTask = await restService.reviewTask(request);
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, nextTask),
      };
      return { data: cloneTasks([nextTask])[0], source: 'rest' };
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
    setSnapshotCache: (cache) => {
      snapshotCache = cache;
    },
    reset: () => {
      snapshot = cloneData(seed ?? emptyAppData());
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
        taskTypeId: request.taskTypeId,
        description: request.description,
        treeId: request.treeId,
        assignedStaffId: request.assignedStaffId,
        deadline: request.deadline,
        ...(request.dateRange ? { dateRange: request.dateRange } : {}),
        ...(request.scope ? { scope: request.scope } : {}),
      };
      return await client.post<TaskDto>('/v1/tasks', payload, { idempotencyKey: generateSecureUuid() });
    },
    createTree: async (request) => {
      const identity = generateSecureUuid();
      return await client.post<TreeDto>(
        '/v1/governance/trees',
        { ...request, treeId: `TRE-${identity}`, qrCode: `NOVYX-${identity}` },
        { idempotencyKey: generateSecureUuid() },
      );
    },
    startTask: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/start`, body, { idempotencyKey: generateSecureUuid() });
    },
    reportFieldIssue: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/field-issue`, body, {
        idempotencyKey: generateSecureUuid(),
      });
    },
    resumeBlockedTask: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/resume`, body, { idempotencyKey: generateSecureUuid() });
    },
    reassignTask: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/reassign`, body, {
        idempotencyKey: generateSecureUuid(),
      });
    },
    cancelTask: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/cancel`, body, { idempotencyKey: generateSecureUuid() });
    },
    resubmitRework: async (request) => {
      const { taskId, ...body } = request;
      return await client.post<TaskDto>(`/v1/tasks/${taskId}/rework/resubmit`, body, {
        idempotencyKey: generateSecureUuid(),
      });
    },
    reviewTask: async (request) => {
      const { taskId, ...body } = request;
      const result = await client.post<CanonicalTaskDto>(`/v1/tasks/${taskId}/review`, body, {
        idempotencyKey: generateSecureUuid(),
      });
      return result as unknown as TaskDto;
    },
    listNotifications: async () => {
      // Backend does not have notification routes.
      return Promise.resolve([]);
    },
    listOperationalTaskTypes: async () => {
      return await client.get<OperationalTaskTypeCatalogItem[]>('/v1/operational/task-types');
    },
    listAssignableStaff: async () => {
      return await client.get<AssignableStaffCatalogItem[]>('/v1/operational/assignable-staff');
    },
  };
}
