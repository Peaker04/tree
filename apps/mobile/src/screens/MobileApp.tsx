import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAuthSession, loadStoredAuthSession, saveAuthSession } from '../services/authSessionStore';
import { DataSourceStatus } from '../services/greenOpsService';
import { getSharedMobileRuntime } from '../infrastructure/runtime';
import { AppNotification, CareHistory, Role, Task } from '../types';
import { colors } from '../theme/tokens';
import type {
  CreateNotificationRequest,
  CreateTaskRequest,
  LoginRequest,
  ReviewDecisionRequest,
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
import { LoginScreen, SessionRestoreScreen, ForgotScreen } from './auth/AuthScreens';
import { type StaffStep } from '../domain/mobileWorkflow';

type Screen = 'Login' | 'Forgot' | 'Main';
type DataSourceState = {
  source: DataSourceStatus;
  loading: boolean;
  message?: string;
};
type AuthSourceState = {
  source: DataSourceStatus | 'none';
  role?: Role | 'UNSUPPORTED';
  message?: string;
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
  const [authRestoring, setAuthRestoring] = useState(true);
  const [staffStep, setStaffStep] = useState<StaffStep>('HOME');
  const [managerStep, setManagerStep] = useState<ManagerStep>('HOME');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [userLat, setUserLat] = useState(10.77421);
  const [userLng, setUserLng] = useState(106.69101);
  const [authLoading, setAuthLoading] = useState(false);

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
    async (request: CreateTaskRequest, fallbackTask: Task) => {
      const result = await greenOpsService.createTask(request, fallbackTask);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const syncTaskProgress = useCallback(
    async (task: Task) => {
      const result = await greenOpsService.updateTaskProgress(task);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const submitTaskEvidence = useCallback(
    async (task: Task) => {
      const result = await greenOpsService.submitTaskEvidence(task);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const createNotification = useCallback(
    async (request: CreateNotificationRequest) => {
      const result = await greenOpsService.createNotification(request);
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const markNotificationsRead = useCallback(
    async (notificationIds: string[], fallbackNotifications: AppNotification[]) => {
      const result = await greenOpsService.markNotificationsRead(notificationIds, fallbackNotifications);
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );
  const reviewTaskDecision = useCallback(
    async (request: ReviewDecisionRequest, fallbackTask: Task) => {
      const result = await greenOpsService.reviewTask(request, fallbackTask);
      setCareHistoryByTree({});
      setData(greenOpsService.getSnapshot());
      applyMutationSource(result.source, result.message);
      return result.data;
    },
    [applyMutationSource, greenOpsService],
  );

  const refreshData = useCallback(async () => {
    setDataSource((current) => ({ ...current, loading: true }));
    const result = await greenOpsService.loadSnapshot();
    setData(result.data);
    setDataSource({
      source: result.source,
      loading: false,
      ...(result.message ? { message: result.message } : {}),
    });
  }, [greenOpsService]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    void runtime.start();
    return () => {
      void runtime.stop();
    };
  }, [runtime]);

  useEffect(() => {
    let mounted = true;

    loadStoredAuthSession()
      .then((session) => {
        if (!mounted || !session) {
          return;
        }

        void runtime.sessionManager.setSession(session);
        const result = greenOpsService.restoreSession(session);
        setAuthSource({
          source: result.source,
          role: result.role,
        });
        setRole(result.role);

        if (result.role === 'Staff') {
          setStaffStep('HOME');
          setScreen('Main');
        } else if (result.role === 'Manager') {
          setManagerStep('HOME');
          setScreen('Main');
        } else {
          setScreen('Login');
          setAuthSource({ source: 'rest', message: 'Ứng dụng mobile không hỗ trợ quyển admin.' });
        }
        void refreshData();
        void runtime.triggerSync();
      })
      .catch(() => {
        if (mounted) {
          setAuthSource({
            source: 'none',
            message: 'Không đọc được phiên đăng nhập đã lưu.',
          });
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthRestoring(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [greenOpsService, refreshData, runtime]);

  const login = async (fallbackRole: Role, identifier: string, password: string) => {
    setAuthLoading(true);
    const request: LoginRequest = { identifier, password };
    try {
      const result = await greenOpsService.login(request, fallbackRole);
      applyMutationSource(result.source, result.message);
      setAuthSource({
        source: result.source,
        role: result.role,
        ...(result.message ? { message: result.message } : {}),
      });
      try {
        if (result.session) {
          await saveAuthSession(result.session);
          await runtime.sessionManager.setSession(result.session);
          void runtime.triggerSync();
        } else {
          await clearAuthSession();
          await runtime.sessionManager.clearLocalSession();
        }
      } catch {
        setAuthSource((current) => ({
          ...current,
          message: 'Đăng nhập thành công nhưng chưa lưu được phiên bảo mật trên thiết bị.',
        }));
      }
      setRole(result.role);
      void refreshData();

      if (result.role === 'Staff') {
        setStaffStep('HOME');
        setScreen('Main');
      } else {
        setManagerStep('HOME');
        setScreen('Main');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    void clearAuthSession();
    void runtime.sessionManager.logout();
    greenOpsService.logout();
    setRole(null);
    setAuthSource({ source: 'none' });
    setActiveTask(null);
    setReviewTask(null);
    setStaffStep('HOME');
    setManagerStep('HOME');
    setScreen('Login');
  };

  if (screen === 'Forgot') {
    return <ForgotScreen onBack={() => setScreen('Login')} />;
  }

  if (authRestoring && screen === 'Login') {
    return <SessionRestoreScreen />;
  }

  if (screen === 'Login') {
    return <LoginScreen authLoading={authLoading} errorMessage={authSource.message} onForgot={() => setScreen('Forgot')} onLogin={login} />;
  }

  const isStaff = role === 'Staff';
  const showStaffNav = isStaff && ['HOME', 'MY_TREES', 'WORK', 'QR', 'NOTIFICATIONS', 'ACCOUNT'].includes(staffStep);
  const showManagerNav = role === 'Manager' && !['REVIEW_DETAIL', 'QR_LOOKUP'].includes(managerStep);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.appShell}>
        {isStaff ? (
          <StaffArea
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
            syncTaskProgress={syncTaskProgress}
            submitTaskEvidence={submitTaskEvidence}
            createNotification={createNotification}
            markNotificationsRead={markNotificationsRead}
            dataSource={dataSource}
            onRefreshData={refreshData}
            onLogout={logout}
          />
        ) : (
          <ManagerArea
            tasks={data.tasks}
            trees={data.trees}
            staff={data.staff}
            notifications={data.notifications}
            activeStep={managerStep}
            setActiveStep={setManagerStep}
            reviewTask={reviewTask}
            setReviewTask={setReviewTask}
            getCareHistoryByTree={getCareHistoryByTree}
            loadCareHistoryByTree={loadCareHistoryByTree}
            lookupTreeByQr={lookupTreeByQr}
            createTask={createTask}
            createNotification={createNotification}
            reviewTaskDecision={reviewTaskDecision}
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
          onPress={(id) => setManagerStep(id as ManagerStep)}
        />
      ) : null}
    </SafeAreaView>
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
