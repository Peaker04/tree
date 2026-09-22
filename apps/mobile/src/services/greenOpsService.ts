import { createInitialData } from '../data';
import { AppData, AppNotification, CareHistory, Role, Task, TaskStatus } from '../types';
import type {
  AuthSession,
  ApiFailure,
  ApiList,
  ApiSuccess,
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
} from '@novyx/contracts';
import { readPublicRuntimeConfig } from '@novyx/config';

const defaultPublicEnvSource = {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
};

export interface GreenOpsService {
  getSnapshot: () => AppData;
  login: (request: LoginRequest, fallbackRole: Role) => Promise<LoginResult>;
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
  role: Role;
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

const isApiFailure = (value: unknown): value is ApiFailure =>
  Boolean(value && typeof value === 'object' && 'error' in value);

const unwrapResource = <TData>(payload: ApiSuccess<TData> | ApiFailure): TData => {
  if (isApiFailure(payload)) {
    throw new GreenOpsApiError(payload.error);
  }
  return payload.data;
};

const unwrapList = <TData>(payload: ApiList<TData> | ApiFailure): TData[] => {
  if (isApiFailure(payload)) {
    throw new GreenOpsApiError(payload.error);
  }
  return payload.data;
};

const appendQuery = <TQuery extends object>(url: URL, query?: TQuery) => {
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
};

const createJsonRequest = (method: 'POST' | 'PATCH', body: unknown): RequestInit => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const isLocalEvidenceUri = (uri: string) =>
  uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('asset-library://');

const getEvidenceFileName = (taskId: string, stage: string, uri: string) => {
  const rawName = uri.split('/').filter(Boolean).pop();
  return rawName && rawName.includes('.') ? rawName : `${taskId}-${stage}.jpg`;
};

const createEvidenceMultipartRequest = (request: SubmitTaskEvidenceRequest): RequestInit => {
  const formData = new FormData();
  formData.append('metadata', JSON.stringify(request));
  request.evidence
    .filter((item) => isLocalEvidenceUri(item.uri))
    .forEach((item) => {
      formData.append(item.stage, {
        uri: item.uri,
        name: getEvidenceFileName(request.taskId, item.stage, item.uri),
        type: 'image/jpeg',
      } as unknown as Blob);
    });

  return {
    method: 'POST',
    body: formData as unknown as BodyInit,
  };
};

const createEvidenceRequest = (request: SubmitTaskEvidenceRequest): RequestInit =>
  request.evidence.some((item) => isLocalEvidenceUri(item.uri))
    ? createEvidenceMultipartRequest(request)
    : createJsonRequest('POST', request);

const createEvidenceMetadataRequest = (request: SubmitTaskEvidenceRequest): RequestInit =>
  createJsonRequest('POST', request);

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
    checklist: task.checklist.map((check) => ({ ...check })),
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

const mergeNotifications = (notifications: AppNotification[], updates: AppNotification[]) => {
  const updatesById = new Map(updates.map((notification) => [notification.id, notification]));
  return notifications.map((notification) => updatesById.get(notification.id) ?? notification);
};

const findTreeInSnapshot = (snapshot: AppData, payload: string) =>
  snapshot.trees.find((tree) => tree.qrCode === payload || tree.id === payload) ?? null;

const mapSessionRole = (session: AuthSession): Role => (session.user.role === 'staff' ? 'Staff' : 'Manager');

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

export function createMockGreenOpsService(seed: AppData = createInitialData()): GreenOpsService {
  let snapshot = cloneData(seed);

  return {
    getSnapshot: () => cloneData(snapshot),
    login: async (_request, fallbackRole) => ({
      role: fallbackRole,
      source: 'mock',
    }),
    restoreSession: (session) => ({
      role: mapSessionRole(session),
      source: 'mock',
      session,
    }),
    logout: () => undefined,
    loadSnapshot: async () => ({ data: cloneData(snapshot), source: 'mock' }),
    listCareHistoryByTree: (treeId) => cloneCareHistory(buildCareHistory(snapshot.tasks, treeId)),
    loadCareHistoryByTree: async (treeId) => ({
      data: cloneCareHistory(buildCareHistory(snapshot.tasks, treeId)),
      source: 'mock',
    }),
    lookupTreeByQr: async (payload) => ({
      data: findTreeInSnapshot(snapshot, payload),
      source: 'mock',
    }),
    createTask: async (_request, fallbackTask) => {
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, fallbackTask),
      };
      return {
        data: { ...fallbackTask, checklist: fallbackTask.checklist.map((item) => ({ ...item })) },
        source: 'mock',
      };
    },
    updateTaskProgress: async (task) => {
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, task),
      };
      return { data: cloneTasks([task])[0], source: 'mock' };
    },
    submitTaskEvidence: async (task) => {
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, task),
      };
      return { data: cloneTasks([task])[0], source: 'mock' };
    },
    reviewTask: async (_request, fallbackTask) => {
      snapshot = {
        ...snapshot,
        tasks: upsertTask(snapshot.tasks, fallbackTask),
      };
      return { data: cloneTasks([fallbackTask])[0], source: 'mock' };
    },
    createNotification: async (request) => {
      const notification = buildFallbackNotification(request);
      snapshot = {
        ...snapshot,
        notifications: [notification, ...snapshot.notifications],
      };
      return { data: { ...notification }, source: 'mock' };
    },
    markNotificationsRead: async (_notificationIds, fallbackNotifications) => {
      snapshot = {
        ...snapshot,
        notifications: fallbackNotifications.map((notification) => ({ ...notification })),
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
      snapshot = createInitialData();
      return cloneData(snapshot);
    },
  };
}

export function createHybridGreenOpsService(
  seed: AppData = createInitialData(),
  envSource: Record<string, string | undefined> = defaultPublicEnvSource,
): GreenOpsService {
  const config = readPublicRuntimeConfig(envSource);
  // Section 5 & 33: Explicit data source selection. In mock mode, use mock intentionally.
  if (config.dataSource === 'mock') {
    return createMockGreenOpsService(seed);
  }

  let snapshot = cloneData(seed);
  const restService = createGreenOpsRestService(envSource);

  return {
    getSnapshot: () => cloneData(snapshot),
    login: async (request, fallbackRole) => {
      try {
        const response = await restService.login(request);
        return {
          role: mapSessionRole(response.session),
          source: 'rest',
          session: response.session,
        };
      } catch (error) {
        return {
          role: fallbackRole,
          source: 'fallback',
          message: toLoadFailureMessage(error),
        };
      }
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
      const notification = await restService.createNotification(request);
      snapshot = {
        ...snapshot,
        notifications: [notification, ...snapshot.notifications.filter((item) => item.id !== notification.id)],
      };
      return { data: { ...notification }, source: 'rest' };
    },
    markNotificationsRead: async (notificationIds, _fallbackNotifications) => {
      const updatedNotifications = await Promise.all(
        notificationIds.map((notificationId) => restService.markNotificationRead(notificationId)),
      );
      snapshot = {
        ...snapshot,
        notifications: mergeNotifications(snapshot.notifications, updatedNotifications),
      };
      return {
        data: snapshot.notifications.map((notification) => ({ ...notification })),
        source: 'rest',
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
): GreenOpsRestService {
  const config = readPublicRuntimeConfig(envSource);
  const baseUrl = config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl : `${config.apiBaseUrl}/`;
  let accessToken: string | null = null;

  const withAuthorization = (init?: RequestInit, authenticated = true): RequestInit | undefined => {
    if (!authenticated || !accessToken) {
      return init;
    }
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return {
      ...init,
      headers,
    };
  };

  const requestJson = async <TEnvelope>(
    path: string,
    init?: RequestInit,
    options?: { authenticated?: boolean },
  ): Promise<TEnvelope> => {
    const response = await fetch(
      new URL(path, baseUrl).toString(),
      withAuthorization(init, options?.authenticated ?? true),
    );
    const payload = (await response.json().catch(() => null)) as TEnvelope | ApiFailure | null;

    if (!response.ok) {
      if (payload && isApiFailure(payload)) {
        throw new GreenOpsApiError(payload.error);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    if (!payload) {
      throw new Error('API response body is empty.');
    }

    return payload as TEnvelope;
  };

  return {
    login: async (request) => {
      const response = unwrapResource(
        await requestJson<ApiSuccess<LoginResponse> | ApiFailure>('auth/login', createJsonRequest('POST', request), {
          authenticated: false,
        }),
      );
      accessToken = response.session.accessToken;
      return response;
    },
    restoreSession: (session) => {
      accessToken = session.accessToken;
    },
    logout: () => {
      accessToken = null;
    },
    listTasks: async (query) => {
      const url = appendQuery(new URL('tasks', baseUrl), query);
      return unwrapList(await requestJson<ApiList<TaskDto> | ApiFailure>(url.toString()));
    },
    listTrees: async (query) => {
      const url = appendQuery(new URL('trees', baseUrl), query);
      return unwrapList(await requestJson<ApiList<TreeDto> | ApiFailure>(url.toString()));
    },
    listCareHistoryByTree: async (treeId) =>
      unwrapList(await requestJson<ApiList<CareHistoryDto> | ApiFailure>(`trees/${treeId}/care-history`)),
    createTask: async (request) =>
      unwrapResource(await requestJson<ApiSuccess<TaskDto> | ApiFailure>('tasks', createJsonRequest('POST', request))),
    updateTaskProgress: async (request) =>
      unwrapResource(
        await requestJson<ApiSuccess<TaskDto> | ApiFailure>(
          `tasks/${request.taskId}/progress`,
          createJsonRequest('PATCH', request),
        ),
      ),
    submitTaskEvidence: async (request) => {
      const endpoint = `tasks/${request.taskId}/evidence`;
      try {
        return unwrapResource(
          await requestJson<ApiSuccess<TaskDto> | ApiFailure>(endpoint, createEvidenceRequest(request)),
        );
      } catch (error) {
        if (!request.evidence.some((item) => isLocalEvidenceUri(item.uri))) {
          throw error;
        }

        return unwrapResource(
          await requestJson<ApiSuccess<TaskDto> | ApiFailure>(endpoint, createEvidenceMetadataRequest(request)),
        );
      }
    },
    reviewTask: async (request) =>
      unwrapResource(
        await requestJson<ApiSuccess<TaskDto> | ApiFailure>(
          `tasks/${request.taskId}/review`,
          createJsonRequest('PATCH', request),
        ),
      ),
    listNotifications: async () =>
      unwrapList(await requestJson<ApiList<NotificationDto> | ApiFailure>('notifications')),
    createNotification: async (request) =>
      unwrapResource(
        await requestJson<ApiSuccess<NotificationDto> | ApiFailure>(
          'notifications',
          createJsonRequest('POST', request),
        ),
      ),
    markNotificationRead: async (notificationId) =>
      unwrapResource(
        await requestJson<ApiSuccess<NotificationDto> | ApiFailure>(
          `notifications/${notificationId}/read`,
          createJsonRequest('PATCH', {}),
        ),
      ),
  };
}
