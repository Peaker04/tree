import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  Notice,
  ScreenHeader,
  SectionTitle,
} from '../../components/AppPrimitives';
import { UserAvatar } from '../../components/UserAvatar';
import { Header } from '../../components/presentation/TaskSurfaces';
import {
  TASK_FILTER_OPTIONS,
  TaskFilter,
  TreeFilter,
  StaffStep,
  filterTasks,
  filterTrees,
  formatActorDisplayName,
  formatTaskDate,
  getNextProofStep,
  getTaskProofWorkflowState,
  getTaskStatusMeta,
  isTaskAwaitingSupervisor,
  isTaskOverdue,
  sanitizeNotificationText,
} from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { AppNotification, CareHistory, Task, TaskStatus, Tree } from '../../types';
import type {
  AuthUser,
  CreateNotificationRequest,
  ReportFieldIssueRequest,
  ResubmitReworkRequest,
} from '@novyx/contracts';
import { StaffProofFlow } from '../staff/StaffProofFlow';
import { StaffTrees } from '../staff/StaffTrees';

const NOTIFICATION_TYPE_META: Record<
  AppNotification['type'],
  { label: string; tone: 'danger' | 'amber' | 'green' | 'sky' }
> = {
  danger: { label: 'Khẩn cấp', tone: 'danger' },
  warning: { label: 'Cần làm lại', tone: 'amber' },
  success: { label: 'Thành công', tone: 'green' },
  info: { label: 'Thông tin', tone: 'sky' },
};

export function SupervisorArea(props: {
  authenticatedUser: AuthUser | null;
  authenticatedSupervisorId: string | null;
  tasks: Task[];
  trees: Tree[];
  notifications: AppNotification[];
  userLat: number;
  userLng: number;
  setUserLat: (lat: number) => void;
  setUserLng: (lng: number) => void;
  activeTask: Task | null;
  setActiveTask: (task: Task | null) => void;
  step: StaffStep;
  setStep: (step: StaffStep) => void;
  updateTasks: (tasks: Task[]) => void;
  updateNotifications: (notifications: AppNotification[]) => void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  lookupTreeByQr: (payload: string) => Promise<Tree | null>;
  startTask: (task: Task) => Promise<Task>;
  reportFieldIssue: (request: ReportFieldIssueRequest) => Promise<Task>;
  resubmitRework: (request: ResubmitReworkRequest) => Promise<Task>;
  submitTaskEvidence: (task: Task) => Promise<Task>;
  createNotification: (request: CreateNotificationRequest) => Promise<AppNotification>;
  markNotificationsRead: (
    notificationIds: string[],
    fallbackNotifications: AppNotification[],
  ) => Promise<AppNotification[]>;
  onLogout: () => void;
  dataSource?: {
    source: string;
    loading: boolean;
    message?: string;
  };
  onRefreshData?: () => Promise<void>;
}) {
  const [treeQuery, setTreeQuery] = useState('');
  const [treeFilter, setTreeFilter] = useState<TreeFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [mapReturnStep, setMapReturnStep] = useState<StaffStep>('MY_TREES');
  const [markingNotifications, setMarkingNotifications] = useState(false);

  const supervisorTasks = useMemo(
    () =>
      props.tasks.filter(
        (task) => !task.assignedSupervisorId || task.assignedSupervisorId === props.authenticatedSupervisorId,
      ),
    [props.authenticatedSupervisorId, props.tasks],
  );

  const openTasks = useMemo(
    () =>
      supervisorTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED',
      ),
    [supervisorTasks],
  );

  const completedTasks = useMemo(
    () => supervisorTasks.filter((task) => task.status === TaskStatus.COMPLETED),
    [supervisorTasks],
  );

  const waitingReviewTasks = useMemo(
    () => supervisorTasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW),
    [supervisorTasks],
  );

  const awaitingCaptureTasks = useMemo(
    () =>
      supervisorTasks.filter(
        (task) => isTaskAwaitingSupervisor(task) || task.status === TaskStatus.REWORK_REQUIRED,
      ),
    [supervisorTasks],
  );

  const visibleTasks = useMemo(
    () =>
      [...filterTasks(supervisorTasks, taskFilter)].sort((a, b) => {
        const aPriority = isTaskAwaitingSupervisor(a) ? 0 : a.status === TaskStatus.REWORK_REQUIRED ? 1 : 2;
        const bPriority = isTaskAwaitingSupervisor(b) ? 0 : b.status === TaskStatus.REWORK_REQUIRED ? 1 : 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [supervisorTasks, taskFilter],
  );

  const completed = completedTasks.length;
  const visibleTrees = useMemo(
    () => filterTrees(props.trees, treeQuery, treeFilter),
    [props.trees, treeFilter, treeQuery],
  );
  const nextTask = useMemo(() => awaitingCaptureTasks[0] ?? null, [awaitingCaptureTasks]);
  const unreadNotifications = useMemo(() => props.notifications.filter((notification) => !notification.read), [props.notifications]);
  const visibleNotifications = notificationFilter === 'unread' ? unreadNotifications : props.notifications;

  if (props.step === 'HOME') {
    const workflow = nextTask ? getTaskProofWorkflowState(nextTask, 'Supervisor') : null;
    const isOffline = props.dataSource?.source === 'cache';
    return (
      <ScrollView
        contentContainerStyle={styles.screen}
        refreshControl={
          props.onRefreshData ? (
            <RefreshControl
              refreshing={Boolean(props.dataSource?.loading)}
              onRefresh={() => void props.onRefreshData?.()}
              tintColor={colors.primaryDark}
            />
          ) : undefined
        }
      >
        <ScreenHeader
          title="Giám sát hiện trường"
          subtitle={isOffline ? 'Ca giám sát · dữ liệu đã lưu' : 'Ca giám sát hiện tại'}
          action={
            <Button
              size="compact"
              variant="ghost"
              icon="notifications-outline"
              onPress={() => props.setStep('NOTIFICATIONS')}
            >
              {unreadNotifications.length > 0 ? `${unreadNotifications.length} mới` : 'Thông báo'}
            </Button>
          }
        />

        {isOffline ? (
          <Notice
            tone="warning"
            title="Đang dùng dữ liệu đã lưu"
            body="Dữ liệu có thể chưa mới. Kết nối lại để tải."
            action={
              props.onRefreshData ? (
                <Button size="compact" variant="outline" onPress={props.onRefreshData}>
                  Thử lại
                </Button>
              ) : undefined
            }
          />
        ) : null}

        <View
          style={[
            styles.nextAction,
            awaitingCaptureTasks.length > 0 ? styles.nextAction_success : styles.nextAction_neutral,
          ]}
        >
          <Text style={styles.kicker}>Việc cần chụp bằng chứng tiếp theo</Text>
          <Text style={styles.nextTitle}>
            {nextTask && workflow ? workflow.activeActionText : 'Chưa có công việc chờ giám sát chụp bằng chứng'}
          </Text>
          <Text style={styles.body}>
            {nextTask
              ? `${nextTask.title} · ${nextTask.treeName} (${formatActorDisplayName(nextTask.assignedStaffName)})`
              : 'Khi nhân viên hiện trường hoàn tất xác nhận GPS, QR và danh mục việc, nhiệm vụ sẽ hiển thị tại đây.'}
          </Text>
          {nextTask && workflow ? (
            <Button
              icon="camera-outline"
              onPress={() => {
                props.setActiveTask(nextTask);
                props.setStep(getNextProofStep(nextTask, 'Supervisor'));
              }}
            >
              {workflow.activeActionText}
            </Button>
          ) : (
            <Button
              variant="outline"
              icon="clipboard-outline"
              onPress={() => {
                props.setActiveTask(null);
                props.setStep('WORK');
              }}
            >
              Xem danh sách việc
            </Button>
          )}
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <Ionicons name="camera-outline" size={15} color={colors.primaryDark} />
              <Text numberOfLines={1} style={styles.metricLabel}>
                Chờ chụp ảnh
              </Text>
            </View>
            <Text style={styles.metricValue}>{awaitingCaptureTasks.length}</Text>
          </View>
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.primaryDark} />
              <Text numberOfLines={1} style={styles.metricLabel}>
                Chờ duyệt
              </Text>
            </View>
            <Text style={styles.metricValue}>{waitingReviewTasks.length}</Text>
          </View>
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <Ionicons name="checkmark-circle-outline" size={15} color={colors.primaryDark} />
              <Text numberOfLines={1} style={styles.metricLabel}>
                Hoàn thành
              </Text>
            </View>
            <Text style={styles.metricValue}>{completed}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đi tới</Text>
          <ListRow
            icon="clipboard-outline"
            title="Công việc cần giám sát"
            subtitle={`${awaitingCaptureTasks.length} việc chờ chụp ảnh · ${openTasks.length} việc đang mở`}
            onPress={() => {
              props.setActiveTask(null);
              props.setStep('WORK');
            }}
          />
          <ListRow
            icon="leaf-outline"
            title="Cây xanh khu vực"
            subtitle={`${props.trees.length} cây trong khu vực phụ trách`}
            onPress={() => {
              props.setActiveTask(null);
              props.setStep('MY_TREES');
            }}
          />
        </View>
      </ScrollView>
    );
  }

  if (props.step === 'MY_TREES') {
    return (
      <StaffTrees
        assignedTrees={props.trees}
        visibleAssignedTrees={visibleTrees}
        staffTasks={supervisorTasks}
        query={treeQuery}
        activeFilter={treeFilter}
        loading={props.dataSource?.loading}
        onRefresh={props.onRefreshData}
        getCareHistoryByTree={props.getCareHistoryByTree}
        loadCareHistoryByTree={props.loadCareHistoryByTree}
        onQueryChange={setTreeQuery}
        onFilterChange={setTreeFilter}
        onOpenTask={(task) => {
          props.setActiveTask(task);
          props.setStep('DETAIL');
        }}
        onMap={(task) => {
          setMapReturnStep('MY_TREES');
          props.setActiveTask(task);
          props.setStep('MAP');
        }}
      />
    );
  }

  if (props.step === 'WORK') {
    return (
      <FlatList
        data={visibleTasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.screen}
        refreshControl={
          props.onRefreshData ? (
            <RefreshControl
              refreshing={Boolean(props.dataSource?.loading)}
              onRefresh={() => void props.onRefreshData?.()}
              tintColor={colors.primaryDark}
            />
          ) : undefined
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title="Công việc giám sát"
              subtitle={`${awaitingCaptureTasks.length} việc chờ chụp bằng chứng`}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {TASK_FILTER_OPTIONS.map((option) => {
                const active = taskFilter === option.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={option.id}
                    onPress={() => setTaskFilter(option.id)}
                    style={[styles.filter, active && styles.filterActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.resultLabel}>
              {visibleTasks.length}/{supervisorTasks.length} công việc
            </Text>
            {supervisorTasks.length === 0 ? (
              <EmptyState
                icon="camera-outline"
                title="Chưa có công việc giám sát"
                body="Công việc trong khu vực phụ trách sẽ hiển thị tại đây."
              />
            ) : visibleTasks.length === 0 ? (
              <EmptyState
                icon="camera-outline"
                title="Không có việc trong bộ lọc"
                body="Chọn một trạng thái khác để xem công việc giám sát."
              />
            ) : null}
          </View>
        }
        renderItem={({ item: task }) => {
          const status = getTaskStatusMeta(task.status);
          const overdue = isTaskOverdue(task);
          const wState = getTaskProofWorkflowState(task, 'Supervisor');
          const readyForSupervisor = isTaskAwaitingSupervisor(task);
          const actionHint =
            !readyForSupervisor && task.status !== TaskStatus.REWORK_REQUIRED && !wState.isSubmittedOrCompleted
              ? 'Chờ NV hiện trường xác nhận'
              : wState.activeActionText;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mở công việc ${task.title}`}
              onPress={() => {
                props.setActiveTask(task);
                props.setStep('DETAIL');
              }}
              style={({ pressed }) => [styles.taskRow, pressed && styles.pressed]}
            >
              <View style={styles.rowBetween}>
                <Badge tone={readyForSupervisor ? 'green' : status.tone}>
                  {readyForSupervisor ? 'Chờ chụp ảnh' : status.label}
                </Badge>
                <Text style={[styles.deadline, overdue && styles.deadlineOverdue]}>
                  {overdue ? 'Quá hạn' : `Hạn ${formatTaskDate(task.deadline)}`}
                </Text>
              </View>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.treeRow}>
                <Ionicons name="leaf-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.treeName}>
                  {task.treeName} · NV: {formatActorDisplayName(task.assignedStaffName)}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.proof}>
                  Bằng chứng giám sát {wState.proofCount}/{wState.totalRequired}
                </Text>
                <Text style={styles.nextHint}>{actionHint}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    );
  }

  if (props.step === 'ACCOUNT') {
    const email = props.authenticatedUser?.email ?? 'Không có thông tin phiên';
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <ScreenHeader title="Tài khoản" subtitle="Thông tin từ phiên đăng nhập hiện tại" />
        <View style={styles.identity}>
          <UserAvatar email={email} />
          <View style={styles.flex}>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.roleText}>Giám sát hiện trường</Text>
            <Badge tone="green">Đang đăng nhập</Badge>
          </View>
        </View>
        <View style={styles.section}>
          <SectionTitle icon="id-card-outline">Phiên làm việc</SectionTitle>
          <ListRow icon="mail-outline" title="Email" subtitle={email} />
          <ListRow icon="people-outline" title="Vai trò" subtitle="Giám sát hiện trường" />
          <ListRow
            icon="clipboard-outline"
            title="Công việc"
            subtitle={`${completed}/${supervisorTasks.length} đã hoàn thành`}
          />
          <ListRow
            icon="notifications-outline"
            title="Thông báo"
            subtitle={
              unreadNotifications.length ? `${unreadNotifications.length} cập nhật chưa đọc` : 'Không có cập nhật mới'
            }
            onPress={() => props.setStep('NOTIFICATIONS')}
          />
        </View>
        <Button variant="danger" icon="log-out-outline" onPress={props.onLogout}>
          Đăng xuất
        </Button>
      </ScrollView>
    );
  }

  if (props.step === 'NOTIFICATIONS') {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Header
          title="Thông báo"
          subtitle="Cập nhật nhiệm vụ cần giám sát và kiểm duyệt"
          onBack={() => props.setStep('HOME')}
        />
        <View style={styles.taskFilterPanel}>
          <View style={styles.rowBetween}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="notifications-outline" size={15} color={colors.primaryDark} />
              <Text style={styles.sectionTitleText}>Bộ lọc</Text>
            </View>
            {unreadNotifications.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={markingNotifications}
                onPress={async () => {
                  setMarkingNotifications(true);
                  const fallbackNotifications = props.notifications.map((notification) => ({
                    ...notification,
                    read: true,
                  }));
                  const savedNotifications = await props.markNotificationsRead(
                    unreadNotifications.map((notification) => notification.id),
                    fallbackNotifications,
                  );
                  props.updateNotifications(savedNotifications);
                  setMarkingNotifications(false);
                }}
              >
                <Text style={styles.linkText}>{markingNotifications ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.reasonChips}>
            {[
              { id: 'all' as const, label: `Tất cả (${props.notifications.length})` },
              { id: 'unread' as const, label: `Chưa đọc (${unreadNotifications.length})` },
            ].map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.id}
                onPress={() => setNotificationFilter(option.id)}
                style={[styles.filterChip, notificationFilter === option.id && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, notificationFilter === option.id && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {props.notifications.length === 0 ? (
          <EmptyState
            title="Không có thông báo mới"
            body="Các cập nhật giám sát hiện trường sẽ xuất hiện tại đây."
            icon="notifications-outline"
          />
        ) : visibleNotifications.length === 0 ? (
          <EmptyState
            title="Không có thông báo chưa đọc"
            body="Các cập nhật mới sẽ xuất hiện tại đây."
            icon="mail-open-outline"
          />
        ) : (
          visibleNotifications.map((notification) => (
            <Pressable
              accessibilityRole="button"
              key={notification.id}
              onPress={async () => {
                const fallbackNotifications = props.notifications.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
                );
                const savedNotifications = await props.markNotificationsRead([notification.id], fallbackNotifications);
                props.updateNotifications(savedNotifications);
                const task = props.tasks.find((item) => item.id === notification.taskId);
                if (task) {
                  props.setActiveTask(task);
                  props.setStep('DETAIL');
                }
              }}
            >
              <Card style={styles.listCard} tone={notification.read ? 'default' : 'green'}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>{notification.title}</Text>
                  <Badge tone={NOTIFICATION_TYPE_META[notification.type]?.tone ?? 'sky'}>
                    {NOTIFICATION_TYPE_META[notification.type]?.label ?? 'Thông báo'}
                  </Badge>
                </View>
                <Text style={styles.body}>{sanitizeNotificationText(notification.body)}</Text>
                <Text style={styles.deadline}>
                  {new Date(notification.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {notification.taskId ? <Text style={styles.linkText}>Mở công việc liên quan</Text> : null}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    );
  }

  const proof = (
    <StaffProofFlow
      role="Supervisor"
      step={props.step}
      setStep={props.setStep}
      activeTask={props.activeTask}
      setActiveTask={props.setActiveTask}
      tasks={props.tasks}
      trees={props.trees}
      staffTasks={supervisorTasks}
      openTasks={openTasks}
      mapReturnStep={mapReturnStep}
      setMapReturnStep={setMapReturnStep}
      userLat={props.userLat}
      userLng={props.userLng}
      setUserLat={props.setUserLat}
      setUserLng={props.setUserLng}
      updateTasks={props.updateTasks}
      getCareHistoryByTree={props.getCareHistoryByTree}
      loadCareHistoryByTree={props.loadCareHistoryByTree}
      lookupTreeByQr={props.lookupTreeByQr}
      startTask={props.startTask}
      submitTaskEvidence={props.submitTaskEvidence}
      reportFieldIssue={props.reportFieldIssue}
      resubmitRework={props.resubmitRework}
      createNotification={props.createNotification}
    />
  );

  if (proof) return proof;

  return (
    <View style={[styles.screen, styles.centerJustified]}>
      <EmptyState title="Không tìm thấy màn hình" body="Hãy quay lại Trang chủ hoặc Công việc để tiếp tục." />
      <Button onPress={() => props.setStep('HOME')}>Về Trang chủ</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomNavClearance + spacing.xl,
    gap: spacing.xl,
  },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  separator: { height: spacing.md },
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  emailText: { ...typography.section, color: colors.ink },
  roleText: { ...typography.body, color: colors.pewter, marginTop: 2, marginBottom: spacing.sm },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextAction: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderRadius: radius.card },
  nextAction_success: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  nextAction_neutral: { backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder },
  kicker: { ...typography.metadata, color: colors.neutralText },
  nextTitle: { ...typography.title, color: colors.ink },
  body: { ...typography.body, color: colors.neutralText },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.card,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricLabel: { ...typography.metadata, color: colors.pewter, flex: 1 },
  metricValue: { ...typography.display, fontSize: 24, lineHeight: 28, fontWeight: '600', color: colors.ink },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.section, color: colors.ink },
  filters: { gap: spacing.sm, paddingRight: spacing.xs },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  filterActive: { borderColor: colors.successBorder, backgroundColor: colors.successSurface },
  filterText: { ...typography.label, color: colors.neutralText },
  filterTextActive: { color: colors.successText },
  resultLabel: { ...typography.label, color: colors.pewter },
  taskRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  taskTitle: { ...typography.section, color: colors.ink },
  deadline: { ...typography.metadata, color: colors.pewter },
  deadlineOverdue: { color: colors.criticalText },
  treeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  treeName: { ...typography.body, color: colors.neutralText, flex: 1 },
  proof: { ...typography.label, color: colors.pewter },
  nextHint: { ...typography.label, color: colors.primaryDark, flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.72 },
  taskFilterPanel: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitleText: {
    color: colors.pewter,
    fontSize: 13,
    fontWeight: '600',
  },
  listCard: {
    gap: 10,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  linkText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successSurface,
  },
  filterChipText: {
    color: colors.pewter,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.successText,
  },
});
