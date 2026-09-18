import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark, Button, Card, Field } from '../components/AppPrimitives';
import { clearAuthSession, loadStoredAuthSession, saveAuthSession } from '../services/authSessionStore';
import { createHybridGreenOpsService, DataSourceStatus } from '../services/greenOpsService';
import { AppNotification, CareHistory, Role, Task } from '../types';
import { colors, radius, spacing } from '../theme/tokens';
import type {
  CreateNotificationRequest,
  CreateTaskRequest,
  LoginRequest,
  ReviewDecisionRequest,
} from '@novyx/contracts';
import { NovyxMark } from '../components/NovyxMark';
import { NotchedBottomNav } from '../components/NotchedBottomNav';
import { Header } from '../components/presentation/TaskSurfaces';
import {
  MANAGER_NAV_FAB_ITEM,
  MANAGER_NAV_LEFT_ITEMS,
  MANAGER_NAV_RIGHT_ITEMS,
  ManagerArea,
  type ManagerStep,
} from './manager/ManagerArea';
import { StaffArea } from './staff/StaffArea';
import { type StaffStep } from '../domain/mobileWorkflow';

type Screen = 'Login' | 'Forgot' | 'Main';
type DataSourceState = {
  source: DataSourceStatus;
  loading: boolean;
  message?: string;
};
type AuthSourceState = {
  source: DataSourceStatus | 'none';
  role?: Role;
  message?: string;
};

export default function MobileApp() {
  const [greenOpsService] = useState(() => createHybridGreenOpsService());
  const [data, setData] = useState(() => greenOpsService.getSnapshot());
  const [careHistoryByTree, setCareHistoryByTree] = useState<Record<string, CareHistory[]>>({});
  const [dataSource, setDataSource] = useState<DataSourceState>({ source: 'mock', loading: true });
  const [, setAuthSource] = useState<AuthSourceState>({ source: 'none' });
  const [screen, setScreen] = useState<Screen>('Login');
  const [role, setRole] = useState<Role | null>(null);
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
      source: source === 'mock' ? current.source : source,
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
    let mounted = true;

    loadStoredAuthSession()
      .then((session) => {
        if (!mounted || !session) {
          return;
        }

        const result = greenOpsService.restoreSession(session);
        setAuthSource({
          source: result.source,
          role: result.role,
        });
        setRole(result.role);

        if (result.role === 'Staff') {
          setStaffStep('HOME');
          setScreen('Main');
        } else {
          setManagerStep('HOME');
          setScreen('Main');
        }
        void refreshData();
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
  }, [greenOpsService, refreshData]);

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
        } else {
          await clearAuthSession();
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
    return <LoginScreen authLoading={authLoading} onForgot={() => setScreen('Forgot')} onLogin={login} />;
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

function LoginScreen({
  authLoading,
  onLogin,
  onForgot,
}: {
  authLoading: boolean;
  onLogin: (role: Role, email: string, password: string) => Promise<void>;
  onForgot: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    const normalized = email.trim().toLowerCase();
    void onLogin(
      normalized.includes('manager') || normalized.includes('admin') ? 'Manager' : 'Staff',
      normalized,
      password,
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginWrap}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoBox}>
              <NovyxMark size={36} color={colors.brandForest} accentColor={colors.brandOlive} />
            </View>
            <Text style={styles.brandKicker}>Urban green verification</Text>
          </View>
          <Text style={styles.brand}>NOVYX</Text>
          <Text style={styles.brandBody}>Quản lý cây xanh, QR, GPS và bằng chứng ảnh cho đội vận hành đô thị.</Text>
        </View>

        <View style={styles.formStack}>
          {error ? (
            <Card tone="danger" style={styles.alertRow}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
              <Text style={styles.alertText}>{error}</Text>
            </Card>
          ) : null}
          <Field
            label="Email hoặc Số điện thoại"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="hung.nguyen@novyx.vn"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Mật khẩu"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword((prev) => !prev)}
          />
          <Pressable accessibilityRole="button" onPress={onForgot} hitSlop={10}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </Pressable>
          <Button disabled={authLoading} icon="key-outline" loading={authLoading} onPress={submit}>
            {authLoading ? 'Đang đăng nhập' : 'Đăng nhập'}
          </Button>
        </View>

        <View style={styles.quickLogin}>
          <Text style={styles.quickTitle}>Đăng nhập nhanh để kiểm thử</Text>
          <View style={styles.quickRow}>
            <Pressable
              accessibilityRole="button"
              disabled={authLoading}
              style={[styles.quickCard, styles.quickStaff, authLoading && styles.quickCardDisabled]}
              onPress={() => void onLogin('Staff', 'hung.nguyen@novyx.vn', 'demo123')}
            >
              <Text style={styles.quickRoleStaff}>Nhân viên</Text>
              <Text style={styles.quickDesc}>N.V. Hùng (Staff)</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={authLoading}
              style={[styles.quickCard, styles.quickManager, authLoading && styles.quickCardDisabled]}
              onPress={() => void onLogin('Manager', 'manager@novyx.vn', 'demo123')}
            >
              <Text style={styles.quickRoleManager}>Quản lý</Text>
              <Text style={styles.quickDesc}>Admin (Manager)</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SessionRestoreScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.screenPad, styles.centerJustified]}>
        <BrandMark />
        <Card tone="green" style={styles.sessionRestoreCard}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.primaryDark} />
          <Text style={styles.successTitle}>Đang khôi phục phiên đăng nhập</Text>
          <Text style={styles.bodyText}>NOVYX đang kiểm tra session bảo mật trên thiết bị.</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function ForgotScreen({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Khôi phục mật khẩu" subtitle="Gửi mã OTP xác nhận cấp lại mật khẩu." onBack={onBack} />
        <View style={styles.formStack}>
          <Field
            label="Email đã đăng ký"
            placeholder="ten.nhanvien@novyx.vn"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {sent ? (
            <Card tone="green">
              <Text style={styles.successTitle}>Đã gửi liên kết</Text>
              <Text style={styles.bodyText}>Link đặt lại mật khẩu đã được gửi về email của bạn.</Text>
            </Card>
          ) : null}
          <Button onPress={() => setSent(true)} disabled={sent}>
            Gửi liên kết khôi phục
          </Button>
        </View>
      </ScrollView>
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
  dataSourceBanner: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: Platform.OS === 'android' ? 8 + (StatusBar.currentHeight ?? 0) * 0.25 : 8,
    paddingBottom: 8,
  },
  dataSourceRest: {
    backgroundColor: colors.primarySoft,
    borderBottomColor: colors.primaryBorder,
  },
  dataSourceFallback: {
    backgroundColor: colors.amberSoft,
    borderBottomColor: '#f3d5a7',
  },
  dataSourceMock: {
    backgroundColor: colors.skySoft,
    borderBottomColor: '#ccebf4',
  },
  dataSourceIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataSourceTitle: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '900',
  },
  dataSourceBody: {
    color: colors.mutedForeground,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  dataSourceRetry: {
    minWidth: 54,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  dataSourceRetryDisabled: {
    opacity: 0.58,
  },
  dataSourceRetryText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },
  flex: {
    flex: 1,
  },
  screenPad: {
    padding: spacing.screen,
    paddingTop: Platform.OS === 'android' ? spacing.screen + (StatusBar.currentHeight ?? 0) * 0.35 : spacing.screen,
    gap: spacing.section,
    paddingBottom: 34,
  },
  loginWrap: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 20 + (StatusBar.currentHeight ?? 0) * 0.35 : 22,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 34,
    paddingTop: 4,
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.brandIvory,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  brand: {
    fontSize: 29,
    fontWeight: '900',
    color: colors.forest,
  },
  brandKicker: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  brandBody: {
    marginTop: 10,
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 340,
  },
  formStack: {
    gap: 14,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  linkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  quickLogin: {
    marginTop: 'auto',
    paddingTop: 18,
    gap: 12,
  },
  quickTitle: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    minHeight: 58,
    justifyContent: 'center',
  },
  quickStaff: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  quickManager: {
    backgroundColor: colors.skySoft,
    borderColor: '#ccebf4',
  },
  quickCardDisabled: {
    opacity: 0.5,
  },
  quickRoleStaff: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  quickRoleManager: {
    color: colors.sky,
    fontSize: 10,
    fontWeight: '900',
  },
  quickDesc: {
    marginTop: 4,
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
  sessionRestoreCard: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  permissionWrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  permissionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  darkTitle: {
    color: colors.foreground,
    fontSize: 23,
    fontWeight: '900',
  },
  darkBody: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  permissionCard: {
    backgroundColor: colors.cardWarm,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  permissionGranted: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  permissionSmallIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  permissionBody: {
    color: colors.mutedForeground,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
  },
  permissionFinePrint: {
    color: colors.subtle,
    textAlign: 'center',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.1)',
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '900',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  headerSubDark: {
    color: '#94a3b8',
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mutedSmall: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  pageTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  homeHero: {
    minHeight: 178,
  },
  adminHero: {
    minHeight: 202,
  },
  managerListHero: {
    minHeight: 154,
  },
  managerReviewHero: {
    minHeight: 138,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroKicker: {
    color: '#bde8c2',
    fontSize: 12,
    fontWeight: '900',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  heroBody: {
    color: '#d9f7dd',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroMetaPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,250,224,0.26)',
    backgroundColor: 'rgba(255,250,224,0.12)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    color: colors.cornsilk,
    fontSize: 10,
    fontWeight: '900',
  },
  heroImage: {
    width: 110,
    height: 132,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  treeHeroCard: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  workHeroCard: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  createTaskHero: {
    minHeight: 158,
  },
  createPreviewCard: {
    gap: 10,
  },
  createSectionCard: {
    gap: 12,
  },
  createStepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  createStepPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  createStepText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  lightHeroTitle: {
    color: colors.forest,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  lightHeroBody: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  reviewHeroCount: {
    width: 82,
    minHeight: 82,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ead879',
    backgroundColor: 'rgba(255,255,251,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  reviewHeroNumber: {
    color: colors.forest,
    fontSize: 28,
    fontWeight: '900',
  },
  reviewHeroLabel: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  treeHeroImage: {
    width: 105,
    height: 126,
    borderRadius: radius.lg,
  },
  nextActionCard: {
    gap: 14,
  },
  progressCard: {
    backgroundColor: colors.forest,
    borderColor: '#2c6a45',
    paddingVertical: 18,
  },
  progressKicker: {
    color: '#bde8c2',
    fontSize: 11,
    fontWeight: '900',
  },
  progressNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  progressText: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(6,78,59,0.85)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  progressBody: {
    color: '#d1fae5',
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listCard: {
    gap: 9,
    marginBottom: 8,
    paddingVertical: 15,
  },
  reviewQueueCard: {
    borderColor: colors.primaryBorder,
  },
  reviewQueueInner: {
    gap: 12,
    minHeight: 0,
  },
  opsPulseCard: {
    borderColor: '#ead879',
  },
  opsPulseInner: {
    gap: 8,
    minHeight: 0,
  },
  opsPulseRow: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(170, 208, 128, 0.38)',
    backgroundColor: 'rgba(255,255,251,0.66)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionPanel: {
    gap: 2,
  },
  managerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  managerSectionImage: {
    width: 74,
    height: 74,
    borderRadius: radius.lg,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metricDotGreen: {
    backgroundColor: colors.primary,
  },
  metricDotAmber: {
    backgroundColor: colors.vanillaCustard,
  },
  metricDotSlate: {
    backgroundColor: colors.willowGreen,
  },
  reviewQueueRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 11,
  },
  qrPayloadRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 11,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  centerPanel: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 22,
  },
  bigStatus: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  bigStatusGood: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  bigStatusBad: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  bigTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  mapScreen: {
    flex: 1,
  },
  mapPanel: {
    gap: 12,
  },
  mapFrame: {
    height: 330,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundAlt,
  },
  realMap: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  mapFallbackIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mapCheckinCard: {
    gap: 12,
  },
  gpsAuditGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsAuditBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
    justifyContent: 'center',
  },
  checkinStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTaskList: {
    gap: 10,
    paddingBottom: 4,
  },
  mapTaskRow: {
    minHeight: 70,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mapTaskRowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  mapTaskDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.borderStrong,
  },
  mapTaskDotActive: {
    backgroundColor: colors.primary,
  },
  qrScreen: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  qrContextCard: {
    borderColor: '#2c6a45',
  },
  qrPayloadText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  scannerBox: {
    borderRadius: 24,
    backgroundColor: '#030814',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  scannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  nativeCameraPreview: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#030814',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  nativeCameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.26)',
    gap: 10,
  },
  qrActions: {
    gap: 12,
    paddingBottom: 4,
  },
  cameraScreen: {
    backgroundColor: '#020617',
    padding: 20,
  },
  cameraPreview: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  cameraPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewBadge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  photoMetaPanel: {
    borderRadius: radius.md,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  cameraText: {
    color: '#cbd5e1',
    marginTop: 10,
    fontWeight: '800',
  },
  cameraHint: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraActions: {
    gap: 12,
    paddingBottom: 10,
  },
  checkPress: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  checkLine: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  checkIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndexDone: {
    backgroundColor: colors.primarySoft,
  },
  checkIndexText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  checkIndexTextDone: {
    color: colors.primaryDark,
  },
  checkText: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 5,
    borderColor: colors.primary,
  },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCol: {
    flex: 1,
    gap: 7,
  },
  photo: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: radius.md,
    backgroundColor: '#e2e8f0',
  },
  photoLabelBefore: {
    textAlign: 'center',
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
  },
  photoLabelAfter: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  bottomNav: {
    minHeight: 76,
    backgroundColor: colors.cardWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'android' ? 10 : 4,
  },
  /* ── Notched Bottom Nav ── */
  notchedNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 18,
  },
  fabContainer: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    zIndex: 10,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 14,
  },
  fabButtonActive: {
    backgroundColor: colors.brandForest,
    shadowOpacity: 0.5,
  },
  notchedBarOuter: {
    width: '100%',
    minHeight: 68,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  barBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  barSideBg: {
    flex: 1,
    backgroundColor: colors.cardWarm,
  },
  middleCutoutContainer: {
    width: 76,
    height: '100%',
    overflow: 'hidden',
  },
  middleCutoutCircle: {
    position: 'absolute',
    top: -118,
    left: -80,
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 80,
    borderColor: colors.cardWarm,
    backgroundColor: 'transparent',
  },
  notchedBarContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingBottom: Platform.OS === 'android' ? 10 : 4,
    paddingHorizontal: 6,
  },
  notchedBarSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  notchSpacer: {
    width: 60,
  },
  notchedNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 2,
    position: 'relative',
  },
  notchedNavItemActive: {},
  notchedNavIconShell: {
    width: 34,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchedNavIconShellActive: {},
  notchedNavLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
    maxWidth: '100%',
    textAlign: 'center',
  },
  notchedNavLabelActive: {
    color: colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  treeFilterPanel: {
    gap: 12,
    backgroundColor: colors.cardWarm,
    borderColor: colors.primaryBorder,
  },
  taskFilterPanel: {
    gap: 12,
    backgroundColor: colors.cardWarm,
    borderColor: colors.border,
  },
  filterMetaRow: {
    gap: 10,
  },
  filterChips: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  resultText: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '800',
  },
  treeAssignmentCard: {
    gap: 12,
  },
  treeImageWrap: {
    height: 128,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundAlt,
  },
  treeCardImage: {
    width: '100%',
    height: '100%',
  },
  treeImageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  treeMetaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  treeMetaBox: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.mineral,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
  },
  treeMetaValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 5,
  },
  relatedTaskCard: {
    gap: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    padding: 12,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    marginTop: 2,
  },
  taskSignalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  taskSignalPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskSignalPillDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  taskSignalPillDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#ffd5dc',
  },
  taskSignalText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  taskSignalTextDone: {
    color: colors.primaryDark,
  },
  taskSignalTextDanger: {
    color: colors.danger,
  },
  taskProofPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskProofPill: {
    minHeight: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskProofPillDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  taskProofText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  taskProofTextDone: {
    color: colors.primaryDark,
  },
  proofGateCard: {
    borderColor: colors.primaryBorder,
  },
  proofGateInner: {
    gap: 10,
    minHeight: 0,
  },
  proofGapList: {
    gap: 4,
    paddingLeft: 2,
  },
  proofChainRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    padding: 10,
    marginTop: 8,
  },
  proofChainIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofChainIconDone: {
    backgroundColor: colors.primarySoft,
  },
  auditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  auditBox: {
    width: '47%',
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    padding: 10,
    justifyContent: 'center',
  },
  auditValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  reviewDecisionCard: {
    gap: 12,
  },
  reviewActionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  reviewActionButton: {
    flex: 1,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonChipActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  reasonChipText: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '800',
  },
  reasonChipTextActive: {
    color: colors.amber,
  },
  multilineInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  reworkReasonBox: {
    flexDirection: 'row',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ffd5dc',
    backgroundColor: colors.dangerSoft,
    padding: 11,
  },
  historyPreview: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyProofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  historyProofPill: {
    minHeight: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyProofText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  metricGreen: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  metricAmber: {
    color: colors.amber,
    fontSize: 16,
    fontWeight: '900',
  },
  metricSky: {
    color: colors.sky,
    fontSize: 16,
    fontWeight: '900',
  },
  treeCode: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeCodeText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 11,
  },
  selectRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  selectRowActive: {
    backgroundColor: colors.primarySoft,
  },
  inlineEmpty: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  managerAccountHero: {
    minHeight: 168,
  },
  managerAvatarDark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.cornsilk,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,250,224,0.4)',
  },
  managerAvatarDarkText: {
    color: colors.forest,
    fontSize: 24,
    fontWeight: '900',
  },
  managerAccountName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  managerAccountRole: {
    color: '#d9f7dd',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  accountInfoCard: {
    gap: 10,
  },
  accountInfoRow: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountShortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  managerAvatarText: {
    color: colors.sky,
    fontSize: 22,
    fontWeight: '900',
  },
});
