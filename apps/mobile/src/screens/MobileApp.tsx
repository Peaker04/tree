import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { AuthSessionError } from '../services/authSessionManager';
import { DataSourceStatus } from '../services/greenOpsService';
import { getSharedMobileRuntime } from '../infrastructure/runtime';
import { AppNotification, CareHistory, Role, Task, TaskStatus } from '../types';
import { colors } from '../theme/tokens';
import { executeOfflineSubmission } from '../storage/outbox/submissionService';
import { ExpoEvidenceFileStore } from '../storage/evidence/evidenceFileStore';
import type { SaveEvidenceInput } from '../storage/evidence/evidenceFileStore';
import type {
  AuthUser,
  AssignableStaffCatalogItem,
  CanonicalCreateTaskRequest,
  CreateTreeRequest,
  SubmitEvidenceRequest,
  ReportFieldIssueRequest,
  ResumeBlockedTaskRequest,
  ReassignTaskRequest,
  CancelTaskRequest,
  ReviewTaskRequest,
  ResubmitReworkRequest,
  CreateNotificationRequest,
  LoginRequest,
  OperationalTaskTypeCatalogItem,
} from '@novyx/contracts';
import { NotchedBottomNav } from '../components/NotchedBottomNav';
import {
  MANAGER_NAV_FAB_ITEM,
  MANAGER_NAV_LEFT_ITEMS,
  MANAGER_NAV_RIGHT_ITEMS,
  ManagerArea,
  type ManagerStep,
} from './manager/ManagerArea';
import { StaffArea } from './staff/StaffArea';
import { SupervisorArea } from './supervisor/SupervisorArea';
import { LoginScreen, SessionRestoreScreen } from './auth/AuthScreens';
import { type StaffStep } from '../domain/mobileWorkflow';

type Screen = 'Login' | 'Main';
type DataSourceState = {
  source: DataSourceStatus;
  loading: boolean;
  message?: string;
  cachedAt?: string;
};
type AuthSourceState = {
  source: DataSourceStatus | 'none';
  role?: Role | 'UNSUPPORTED';
  message?: string;
};
type ManagerCatalogState = {
  taskTypes: OperationalTaskTypeCatalogItem[];
  staff: AssignableStaffCatalogItem[];
  loading: boolean;
  error?: string;
};

const mapSessionRole = (role: string): Role | 'UNSUPPORTED' => {
  if (role === 'staff') return 'Staff';
  if (role === 'supervisor') return 'Supervisor';
  if (role === 'manager') return 'Manager';
  return 'UNSUPPORTED';
};

export default function MobileApp() {
  const [runtime] = useState(() => getSharedMobileRuntime());
  const greenOpsService = runtime.greenOpsService;
  const [data, setData] = useState(() => greenOpsService.getSnapshot());
  const [careHistoryByTree, setCareHistoryByTree] = useState<Record<string, CareHistory[]>>({});
  const [dataSource, setDataSource] = useState<DataSourceState>({ source: 'rest', loading: true });
  const [authSource, setAuthSource] = useState<AuthSourceState>({ source: 'none' });
  const [screen, setScreen] = useState<Screen>('Login');
  const [role, setRole] = useState<Role | 'UNSUPPORTED' | null>(null);
  const [authenticatedStaffId, setAuthenticatedStaffId] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [authRestoring, setAuthRestoring] = useState(true);
  const [staffStep, setStaffStep] = useState<StaffStep>('HOME');
  const [managerStep, setManagerStep] = useState<ManagerStep>('HOME');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [userLat, setUserLat] = useState(10.77402);
  const [userLng, setUserLng] = useState(106.69101);
  const [authLoading, setAuthLoading] = useState(false);
  const [managerCatalogs, setManagerCatalogs] = useState<ManagerCatalogState>({
    taskTypes: [],
    staff: [],
    loading: false,
  });

  const updateTasks = (tasks: Task[]) => {
    setCareHistoryByTree({});
    setData(greenOpsService.replaceTasks(tasks));
  };
  const updateNotifications = (notifications: AppNotification[]) =>
    setData(greenOpsService.replaceNotifications(notifications));
  const applyMutationSource = useCallback((source: DataSourceStatus, message?: string) => {
    setDataSource((current) => ({
      source: source === 'rest' ? current.source : source,
      loading: false,
      ...(message ? { message } : {}),
    }));
  }, []);
  const getCareHistoryByTree = useCallback(
    (treeId: string) => careHistoryByTree[treeId] ?? greenOpsService.listCareHistoryByTree(treeId),
    [careHistoryByTree, greenOpsService],
  );
  const loadCareHistoryByTree = useCallback(
    async (treeId: string) => {
      const result = await greenOpsService.loadCareHistoryByTree(treeId);
      setCareHistoryByTree((current) => ({ ...current, [treeId]: result.data }));
      return result.data;
    },
    [greenOpsService],
  );
  const lookupTreeByQr = useCallback(
    async (payload: string) => {
      const result = await greenOpsService.lookupTreeByQr(payload);
      applyMutationSource(result.source, result.message);
      if (result.data) {
        setData(greenOpsService.getSnapshot());
      }
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const createTask = useCallback(
    async (request: CanonicalCreateTaskRequest) => {
      const result = await greenOpsService.createTask(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const createTree = useCallback(
    async (request: Omit<CreateTreeRequest, 'treeId' | 'qrCode'>) => {
      const tree = await greenOpsService.createTree(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      return tree;
    },
    [greenOpsService],
  );
  const refreshManagerCatalogs = useCallback(async () => {
    setManagerCatalogs((current) => ({ ...current, loading: true, error: undefined }));
    try {
      const [taskTypes, staff] = await Promise.all([
        greenOpsService.listOperationalTaskTypes(),
        greenOpsService.listAssignableStaff(),
      ]);
      setManagerCatalogs({ taskTypes, staff, loading: false });
    } catch (error) {
      setManagerCatalogs({
        taskTypes: [],
        staff: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Không tải được danh mục vận hành.',
      });
    }
  }, [greenOpsService]);

  const refreshData = useCallback(async () => {
    setDataSource((current) => ({ ...current, loading: true }));
    const result = await greenOpsService.loadSnapshot();
    if (runtime.taskRepo) {
      await runtime.taskRepo.cacheTasks(result.data.tasks);
    }
    setData(result.data);
    setActiveTask((current) => (current ? (result.data.tasks.find((t) => t.id === current.id) ?? current) : null));
    setReviewTask((current) => (current ? (result.data.tasks.find((t) => t.id === current.id) ?? current) : null));
    setDataSource({
      source: result.source,
      loading: false,
      ...(result.message ? { message: result.message } : {}),
      ...(result.cachedAt ? { cachedAt: result.cachedAt } : {}),
    });
  }, [greenOpsService, runtime]);

  const submitTaskEvidence = useCallback(
    async (task: Task) => {
      if (task.proofProfile !== 'CHANGE_PROOF') {
        applyMutationSource('rest', 'Chỉ hỗ trợ biên bản CHANGE_PROOF trong phiên bản này.');
        throw new Error('UNSUPPORTED_PROFILE');
      }

      const hasLocationException = Boolean(
        task.notes?.includes('Ngoại lệ GPS:') ||
        task.supervisorNotes?.includes('Ngoại lệ GPS:') ||
        (task as unknown as { locationException?: unknown }).locationException,
      );
      const gpsVerified = Boolean(task.gpsCheck?.verified || task.supervisorGpsCheck?.verified);

      if (
        (!gpsVerified && !hasLocationException) ||
        !task.qrCheck?.verified ||
        !task.beforePhoto ||
        !task.afterPhoto ||
        task.checklist.some((c) => !c.done)
      ) {
        applyMutationSource('rest', 'Thiếu bằng chứng GPS, QR, ảnh hoặc checklist.');
        throw new Error('INCOMPLETE_PROOF');
      }

      if (!runtime.outboxRepo || !runtime.taskRepo) {
        await runtime.start();
      }
      if (!runtime.outboxRepo || !runtime.taskRepo) {
        throw new Error('OUTBOX_NOT_READY');
      }

      const fileStore = new ExpoEvidenceFileStore();
      const evidenceInputs: SaveEvidenceInput[] = [
        {
          taskId: task.id,
          stage: 'BEFORE',
          sourceUri: task.beforePhoto,
          fileName: 'before_photo.jpg',
          contentType: 'image/jpeg',
        },
        {
          taskId: task.id,
          stage: 'AFTER',
          sourceUri: task.afterPhoto,
          fileName: 'after_photo.jpg',
          contentType: 'image/jpeg',
        },
      ];

      const parsedGpsReason =
        task.notes?.split('Ngoại lệ GPS:')[1]?.split('\n')[0]?.trim() || 'Tán cây rậm rạp làm trôi tín hiệu GPS';

      const request: SubmitEvidenceRequest = {
        taskId: task.id,
        expectedVersion: task.version ?? 0,
        siteVerification: {
          ...(gpsVerified && task.gpsCheck ? { gpsCheck: task.gpsCheck } : {}),
          qrCheck: task.qrCheck!,
        },
        ...(task.supervisorGpsCheck ? { supervisorGpsCheck: task.supervisorGpsCheck } : {}),
        ...(hasLocationException
          ? {
              locationException: {
                reason: parsedGpsReason,
                distanceMeters: Math.max(1, Math.round(task.gpsCheck?.distance ?? 11)),
                explanationPhotoUri: task.beforePhoto,
                recordedLat: task.gpsCheck?.lat ?? 10.774,
                recordedLng: task.gpsCheck?.lng ?? 106.691,
                timestamp: task.gpsCheck?.timestamp ?? new Date().toISOString(),
              },
            }
          : {}),
        proof: {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: task.beforePhoto,
          afterPhotoUri: task.afterPhoto,
          checklist: task.checklist.map((c) => ({ id: c.id, text: c.text, done: c.done as true })),
        },
        notes: task.notes,
      };

      await runtime.taskRepo.cacheTasks([task]);
      const { outboxItem } = await executeOfflineSubmission(fileStore, runtime.outboxRepo, {
        taskId: task.id,
        request,
        evidenceInputs,
        notes: task.notes,
      });

      const syncResults = await runtime.triggerSync();
      let itemResult = syncResults.find((r) => r.outboxId === outboxItem.id);
      if (!itemResult && runtime.coordinator) {
        itemResult = (await runtime.coordinator.processItemById(outboxItem.id)) ?? undefined;
      }

      if (itemResult?.success) {
        await refreshData();
        const refreshedTask = greenOpsService.getSnapshot().tasks.find((t) => t.id === task.id);
        return refreshedTask ?? { ...task, status: TaskStatus.WAITING_REVIEW };
      }

      if (itemResult && !itemResult.success && itemResult.classification !== 'NETWORK') {
        throw new Error(itemResult.error ?? 'SUBMISSION_FAILED');
      }

      setData(greenOpsService.getSnapshot());
      return task;
    },
    [applyMutationSource, greenOpsService, runtime, refreshData],
  );

  const submitStaffCheckin = useCallback(
    async (task: Task) => {
      const hasLocationException = Boolean(
        task.notes?.includes('Ngoại lệ GPS:') ||
        task.supervisorNotes?.includes('Ngoại lệ GPS:') ||
        (task as unknown as { locationException?: unknown }).locationException,
      );
      const gpsVerified = Boolean(task.gpsCheck?.verified || task.supervisorGpsCheck?.verified);
      if ((!gpsVerified && !hasLocationException) || !task.qrCheck?.verified || task.checklist.some((c) => !c.done)) {
        applyMutationSource('rest', 'Thiếu xác nhận GPS, QR hoặc checklist.');
        throw new Error('INCOMPLETE_STAFF_CHECKIN');
      }
      const parsedGpsReason =
        task.notes?.split('Ngoại lệ GPS:')[1]?.split('\n')[0]?.trim() || 'Tán cây rậm rạp làm trôi tín hiệu GPS';
      let expectedVersion = task.version ?? 0;
      if (task.status === TaskStatus.PENDING || expectedVersion === 0) {
        try {
          const started = await greenOpsService.startTask({ taskId: task.id, expectedVersion });
          expectedVersion = started.data.version ?? expectedVersion + 1;
        } catch {
          const refreshed = await greenOpsService.loadSnapshot();
          const latest = refreshed.data.tasks.find((t) => t.id === task.id);
          if (latest?.version !== undefined) {
            expectedVersion = latest.version;
          }
        }
      }
      const result = await greenOpsService.submitStaffCheckin({
        taskId: task.id,
        expectedVersion,
        siteVerification: {
          ...(gpsVerified && task.gpsCheck ? { gpsCheck: task.gpsCheck } : {}),
          qrCheck: task.qrCheck,
        },
        ...(hasLocationException
          ? {
              locationException: {
                reason: parsedGpsReason,
                distanceMeters: Math.max(1, Math.round(task.gpsCheck?.distance ?? 11)),
                explanationPhotoUri: 'storage://exception/gps-staff',
                recordedLat: task.gpsCheck?.lat ?? 10.774,
                recordedLng: task.gpsCheck?.lng ?? 106.691,
                timestamp: task.gpsCheck?.timestamp ?? new Date().toISOString(),
              },
            }
          : {}),
        checklist: task.checklist.map((c) => ({ id: c.id, text: c.text, done: c.done as true })),
        notes: task.notes,
      });
      if (runtime.taskRepo) {
        await runtime.taskRepo.cacheTasks([result.data]);
      }
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService, runtime],
  );

  const startTask = useCallback(
    async (task: Task) => {
      const result = await greenOpsService.startTask({ taskId: task.id, expectedVersion: task.version ?? 0 });
      if (runtime.taskRepo) {
        await runtime.taskRepo.cacheTasks([result.data]);
      }
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService, runtime],
  );

  const reportFieldIssue = useCallback(
    async (request: ReportFieldIssueRequest) => {
      const result = await greenOpsService.reportFieldIssue(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  const resumeBlockedTask = useCallback(
    async (request: ResumeBlockedTaskRequest) => {
      const result = await greenOpsService.resumeBlockedTask(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  const reassignTask = useCallback(
    async (request: ReassignTaskRequest) => {
      const result = await greenOpsService.reassignTask(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  const cancelTask = useCallback(
    async (request: CancelTaskRequest) => {
      const result = await greenOpsService.cancelTask(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  const resubmitRework = useCallback(
    async (request: ResubmitReworkRequest) => {
      if (request.reworkedProof.proofProfile !== 'CHANGE_PROOF') {
        throw new Error('Chỉ hỗ trợ biên bản CHANGE_PROOF trong phiên bản này.');
      }
      const fileStore = new ExpoEvidenceFileStore();
      const proof = { ...request.reworkedProof };

      for (const stage of ['beforePhotoUri', 'afterPhotoUri'] as const) {
        const localUri = proof[stage];
        if (!/^(file:|content:)/i.test(localUri)) continue;

        let persisted;
        try {
          persisted = await fileStore.persistEvidence({
            taskId: request.taskId,
            stage: stage === 'beforePhotoUri' ? 'BEFORE' : 'AFTER',
            sourceUri: localUri,
            fileName: stage === 'beforePhotoUri' ? 'before_rework.jpg' : 'after_rework.jpg',
            contentType: 'image/jpeg',
          });
        } catch (error) {
          throw new Error(`PERSIST_${stage}: ${error instanceof Error ? error.message : String(error)}`);
        }

        let uploaded;
        try {
          uploaded = await runtime.uploadClient.uploadEvidence(request.taskId, {
            localFileUri: persisted.sandboxFileUri,
            fileName: persisted.fileName,
            contentType: persisted.contentType,
            sizeBytes: persisted.sizeBytes,
            sha256: persisted.sha256,
          });
        } catch (error) {
          throw new Error(`UPLOAD_${stage}: ${error instanceof Error ? error.message : String(error)}`);
        }
        proof[stage] = uploaded.storageRef || uploaded.objectKey;
      }

      const result = await greenOpsService.resubmitRework({ ...request, reworkedProof: proof });
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService, runtime],
  );

  const createNotification = useCallback(
    async (request: CreateNotificationRequest) => {
      const notification: AppNotification = {
        id: `notif-${Date.now()}`,
        title: request.title,
        body: request.body,
        timestamp: request.timestamp ?? new Date().toISOString(),
        read: request.read ?? false,
        type: request.type,
        ...(request.taskId ? { taskId: request.taskId } : {}),
      };
      setData(greenOpsService.replaceNotifications([notification, ...greenOpsService.getSnapshot().notifications]));
      return notification;
    },
    [greenOpsService],
  );
  const markNotificationsRead = useCallback(
    async (_notificationIds: string[], fallbackNotifications: AppNotification[]) => {
      const notifications = fallbackNotifications.map((notification) => ({ ...notification, read: true }));
      setData(greenOpsService.replaceNotifications(notifications));
      return notifications;
    },
    [greenOpsService],
  );
  const reviewTaskDecision = useCallback(
    async (request: ReviewTaskRequest) => {
      const result = await greenOpsService.reviewTask(request);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  useEffect(() => {
    let mounted = true;

    void runtime
      .start()
      .then(async (session) => {
        if (!mounted || !session) {
          return;
        }

        const restoredRole = mapSessionRole(session.user.role);
        setAuthSource({ source: 'rest', role: restoredRole });
        setRole(restoredRole);
        setAuthenticatedUser(session.user);
        setAuthenticatedStaffId(restoredRole === 'Staff' ? session.user.id : null);

        if (restoredRole === 'Staff' || restoredRole === 'Supervisor') {
          setStaffStep('HOME');
          await refreshData();
          if (mounted) setScreen('Main');
        } else if (restoredRole === 'Manager') {
          setManagerStep('HOME');
          await Promise.all([refreshData(), refreshManagerCatalogs()]);
          if (mounted) setScreen('Main');
        } else {
          setAuthSource({ source: 'rest', message: 'Platform Administrator must use Admin Web' });
          await runtime.sessionManager.clearLocalSession();
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthSource({ source: 'none', message: 'Không đọc được phiên đăng nhập đã lưu.' });
        }
      })
      .finally(() => {
        if (mounted) setAuthRestoring(false);
      });

    return () => {
      mounted = false;
      void runtime.stop();
    };
  }, [greenOpsService, refreshData, refreshManagerCatalogs, runtime]);

  const login = async (identifier: string, password: string) => {
    setAuthLoading(true);
    const request: LoginRequest = { identifier, password };
    try {
      const result = await greenOpsService.login(request);
      applyMutationSource(result.source, result.message);
      setAuthSource({
        source: result.source,
        role: result.role,
        ...(result.message ? { message: result.message } : {}),
      });
      if (result.session && result.role !== 'UNSUPPORTED') {
        setAuthenticatedUser(result.session.user);
        setAuthenticatedStaffId(result.role === 'Staff' ? result.session.user.id : null);
        void runtime.triggerSync();
      } else {
        setAuthenticatedUser(null);
        setAuthenticatedStaffId(null);
        await runtime.sessionManager.clearLocalSession();
      }
      setRole(result.role);

      if (result.role === 'Staff' || result.role === 'Supervisor') {
        setStaffStep('HOME');
        await refreshData();
        setScreen('Main');
      } else if (result.role === 'Manager') {
        setManagerStep('HOME');
        await Promise.all([refreshData(), refreshManagerCatalogs()]);
        setScreen('Main');
      } else {
        setScreen('Login');
        setAuthSource((curr) => ({ ...curr, message: 'Platform Administrator must use Admin Web' }));
      }
    } catch (error) {
      const message =
        error instanceof AuthSessionError && error.status === 0
          ? 'Không kết nối được. Kiểm tra mạng rồi thử lại.'
          : error instanceof AuthSessionError && (error.status === 401 || error.status === 403)
            ? 'Email, số điện thoại hoặc mật khẩu không đúng.'
            : 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
      setAuthSource({ source: 'none', message });
      setRole(null);
      setAuthenticatedUser(null);
      setAuthenticatedStaffId(null);
      setScreen('Login');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    greenOpsService.logout();
    setRole(null);
    setAuthenticatedUser(null);
    setAuthenticatedStaffId(null);
    setManagerCatalogs({ taskTypes: [], staff: [], loading: false });
    setAuthSource({ source: 'none' });
    setActiveTask(null);
    setReviewTask(null);
    setStaffStep('HOME');
    setManagerStep('HOME');
    setScreen('Login');
  };

  useEffect(() => {
    if (screen !== 'Main') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (role === 'Staff' || role === 'Supervisor') {
        if (['GPS', 'BEFORE', 'AFTER', 'CHECKLIST', 'REVIEW'].includes(staffStep)) {
          setStaffStep('DETAIL');
          return true;
        }
        if (staffStep === 'QR' && activeTask) {
          setStaffStep('DETAIL');
          return true;
        }
        if (staffStep === 'DETAIL' || staffStep === 'SUCCESS' || staffStep === 'MAP') {
          setStaffStep('WORK');
          return true;
        }
        if (staffStep !== 'HOME') {
          setActiveTask(null);
          setStaffStep('HOME');
          return true;
        }
        return false;
      }

      if (role === 'Manager') {
        if (managerStep === 'REVIEW_DETAIL') {
          setReviewTask(null);
          setManagerStep('REVIEW');
          return true;
        }
        if (managerStep !== 'HOME') {
          setManagerStep('HOME');
          return true;
        }
        return false;
      }

      return false;
    });

    return () => subscription.remove();
  }, [activeTask, managerStep, role, screen, staffStep]);

  if (authRestoring && screen === 'Login') {
    return <SessionRestoreScreen />;
  }

  if (screen === 'Login') {
    return <LoginScreen authLoading={authLoading} errorMessage={authSource.message} onLogin={login} />;
  }

  const isStaff = role === 'Staff';
  const isSupervisor = role === 'Supervisor';
  const showStaffNav =
    (isStaff || isSupervisor) && ['HOME', 'MY_TREES', 'WORK', 'QR', 'NOTIFICATIONS', 'ACCOUNT'].includes(staffStep);
  const showManagerNav = role === 'Manager' && !['REVIEW_DETAIL', 'QR_LOOKUP'].includes(managerStep);

  return (
    <View style={styles.root}>
      <View style={styles.appShell}>
        {isStaff ? (
          <StaffArea
            authenticatedUser={authenticatedUser}
            authenticatedStaffId={authenticatedStaffId}
            tasks={data.tasks}
            trees={data.trees}
            notifications={data.notifications}
            userLat={userLat}
            userLng={userLng}
            setUserLat={setUserLat}
            setUserLng={setUserLng}
            activeTask={activeTask}
            setActiveTask={setActiveTask}
            step={staffStep}
            setStep={setStaffStep}
            updateTasks={updateTasks}
            updateNotifications={updateNotifications}
            getCareHistoryByTree={getCareHistoryByTree}
            loadCareHistoryByTree={loadCareHistoryByTree}
            lookupTreeByQr={lookupTreeByQr}
            startTask={startTask}
            submitTaskEvidence={submitTaskEvidence}
            submitStaffCheckin={submitStaffCheckin}
            reportFieldIssue={reportFieldIssue}
            resubmitRework={resubmitRework}
            createNotification={createNotification}
            markNotificationsRead={markNotificationsRead}
            dataSource={dataSource}
            onRefreshData={refreshData}
            onLogout={logout}
          />
        ) : isSupervisor ? (
          <SupervisorArea
            authenticatedUser={authenticatedUser}
            authenticatedSupervisorId={authenticatedUser?.id ?? null}
            tasks={data.tasks}
            trees={data.trees}
            notifications={data.notifications}
            userLat={userLat}
            userLng={userLng}
            setUserLat={setUserLat}
            setUserLng={setUserLng}
            activeTask={activeTask}
            setActiveTask={setActiveTask}
            step={staffStep}
            setStep={setStaffStep}
            updateTasks={updateTasks}
            updateNotifications={updateNotifications}
            getCareHistoryByTree={getCareHistoryByTree}
            loadCareHistoryByTree={loadCareHistoryByTree}
            lookupTreeByQr={lookupTreeByQr}
            startTask={startTask}
            submitTaskEvidence={submitTaskEvidence}
            reportFieldIssue={reportFieldIssue}
            resubmitRework={resubmitRework}
            createNotification={createNotification}
            markNotificationsRead={markNotificationsRead}
            dataSource={dataSource}
            onRefreshData={refreshData}
            onLogout={logout}
          />
        ) : (
          <ManagerArea
            authenticatedUser={authenticatedUser}
            tasks={data.tasks}
            trees={data.trees}
            staff={data.staff}
            operationalTaskTypes={managerCatalogs.taskTypes}
            assignableStaff={managerCatalogs.staff}
            catalogsLoading={managerCatalogs.loading}
            catalogsError={managerCatalogs.error}
            onRetryCatalogs={refreshManagerCatalogs}
            notifications={data.notifications}
            activeStep={managerStep}
            setActiveStep={setManagerStep}
            reviewTask={reviewTask}
            setReviewTask={setReviewTask}
            getCareHistoryByTree={getCareHistoryByTree}
            loadCareHistoryByTree={loadCareHistoryByTree}
            lookupTreeByQr={lookupTreeByQr}
            createTask={createTask}
            createTree={createTree}
            createNotification={createNotification}
            reviewTaskDecision={reviewTaskDecision}
            resumeBlockedTask={resumeBlockedTask}
            reassignTask={reassignTask}
            cancelTask={cancelTask}
            dataSource={dataSource}
            onRefreshData={refreshData}
            onLogout={logout}
          />
        )}
      </View>
      {showStaffNav ? (
        <NotchedBottomNav
          leftItems={[
            { id: 'HOME', label: 'Trang chủ', icon: 'home-outline' },
            { id: 'MY_TREES', label: 'Cây của tôi', icon: 'leaf-outline' },
          ]}
          rightItems={[
            { id: 'WORK', label: 'Công việc', icon: 'clipboard-outline' },
            { id: 'ACCOUNT', label: 'Tài khoản', icon: 'person-outline' },
          ]}
          fabItem={{ id: 'QR', icon: 'CUSTOM_SCAN' }}
          activeId={staffStep}
          onPress={(id) => {
            if (id === 'QR') {
              // The centered FAB is a global tree lookup action. Task proof steps stay inside task detail.
              setActiveTask(null);
              setStaffStep('QR');
            } else if (id === 'MY_TREES') {
              setActiveTask(null);
              setStaffStep('MY_TREES');
            } else if (id === 'WORK') {
              setActiveTask(null);
              setStaffStep('WORK');
            } else if (id === 'ACCOUNT') {
              setActiveTask(null);
              setStaffStep('ACCOUNT');
            } else {
              setActiveTask(null);
              setStaffStep('HOME');
            }
          }}
        />
      ) : null}
      {showManagerNav ? (
        <NotchedBottomNav
          leftItems={[...MANAGER_NAV_LEFT_ITEMS]}
          rightItems={[...MANAGER_NAV_RIGHT_ITEMS]}
          fabItem={MANAGER_NAV_FAB_ITEM}
          activeId={managerStep}
          onPress={(id) => {
            setManagerStep(id as ManagerStep);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
