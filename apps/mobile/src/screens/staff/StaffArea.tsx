import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Card, EmptyState } from '../../components/AppPrimitives';
import { Header } from '../../components/presentation/TaskSurfaces';
import {
  filterTasks,
  filterTrees,
  getNextActionTask,
  getNextProofStep,
  StaffStep,
  TaskFilter,
  TreeFilter,
} from '../../domain/mobileWorkflow';
import { colors, radius } from '../../theme/tokens';
import { AppNotification, CareHistory, Task, TaskStatus, Tree } from '../../types';
import type {
  AuthUser,
  CreateNotificationRequest,
  ReportFieldIssueRequest,
  ResubmitReworkRequest,
} from '@novyx/contracts';
import { StaffAccount } from './StaffAccount';
import { StaffHome } from './StaffHome';
import { StaffProofFlow } from './StaffProofFlow';
import { StaffTrees } from './StaffTrees';
import { StaffWork } from './StaffWork';

const NOTIFICATION_TYPE_META: Record<
  AppNotification['type'],
  { label: string; tone: 'danger' | 'amber' | 'green' | 'sky' }
> = {
  danger: { label: 'Khẩn cấp', tone: 'danger' },
  warning: { label: 'Cần làm lại', tone: 'amber' },
  success: { label: 'Thành công', tone: 'green' },
  info: { label: 'Thông tin', tone: 'sky' },
};

export function StaffArea(props: {
  authenticatedUser: AuthUser | null;
  authenticatedStaffId: string | null;
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
  const [staffTreeQuery, setStaffTreeQuery] = useState('');
  const [staffTreeFilter, setStaffTreeFilter] = useState<TreeFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [mapReturnStep, setMapReturnStep] = useState<StaffStep>('MY_TREES');
  const [markingNotifications, setMarkingNotifications] = useState(false);
  const staffTasks = props.authenticatedStaffId
    ? props.tasks.filter((task) => task.assignedStaffId === props.authenticatedStaffId)
    : [];
  const openTasks = staffTasks.filter((task) => task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED');
  const completedTasks = staffTasks.filter((task) => task.status === TaskStatus.COMPLETED);
  const waitingReviewTasks = staffTasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW);
  const actionableTasks = staffTasks.filter(
    (task) =>
      task.status === TaskStatus.PENDING ||
      task.status === TaskStatus.IN_PROGRESS ||
      task.status === TaskStatus.REWORK_REQUIRED,
  );
  const visibleTasks = filterTasks(staffTasks, taskFilter);
  const completed = completedTasks.length;
  const assignedTreeIds = new Set(staffTasks.map((task) => task.treeId));
  const assignedTrees = props.trees.filter((tree) => assignedTreeIds.has(tree.id));
  const visibleAssignedTrees = filterTrees(assignedTrees, staffTreeQuery, staffTreeFilter);
  const waitingReview = waitingReviewTasks.length;
  const completionRate = Math.round((completed / Math.max(staffTasks.length, 1)) * 100);
  const nextTask = getNextActionTask(staffTasks);
  const unreadNotifications = props.notifications.filter((notification) => !notification.read);
  const visibleNotifications = notificationFilter === 'unread' ? unreadNotifications : props.notifications;

  if (props.step === 'HOME') {
    return (
      <StaffHome
        openTaskCount={openTasks.length}
        actionableTaskCount={actionableTasks.length}
        completionRate={completionRate}
        completed={completed}
        totalTasks={staffTasks.length}
        assignedTreeCount={assignedTrees.length}
        waitingReviewCount={waitingReview}
        nextTask={nextTask}
        unreadNotificationCount={unreadNotifications.length}
        loading={props.dataSource?.loading}
        errorMessage={props.dataSource?.message}
        isOffline={props.dataSource?.source === 'cache'}
        onRetry={props.onRefreshData}
        onOpenNotifications={() => props.setStep('NOTIFICATIONS')}
        onOpenWork={() => {
          props.setActiveTask(null);
          props.setStep('WORK');
        }}
        onOpenTrees={() => {
          props.setActiveTask(null);
          props.setStep('MY_TREES');
        }}
        onOpenTask={(task) => {
          props.setActiveTask(task);
          props.setStep('DETAIL');
        }}
        onStartTaskProof={async (task) => {
          let currentTask = task;
          if (task.status === TaskStatus.PENDING || task.status === 'PENDING') {
            try {
              const started = await props.startTask(task);
              currentTask = { ...task, ...started };
            } catch {
              // Offline fallback: OutboxDispatcher will auto-start PENDING task upon sync
            }
          }
          props.setActiveTask(currentTask);
          props.setStep(getNextProofStep(currentTask));
        }}
      />
    );
  }

  if (props.step === 'MY_TREES') {
    return (
      <StaffTrees
        assignedTrees={assignedTrees}
        visibleAssignedTrees={visibleAssignedTrees}
        staffTasks={staffTasks}
        query={staffTreeQuery}
        activeFilter={staffTreeFilter}
        getCareHistoryByTree={props.getCareHistoryByTree}
        loadCareHistoryByTree={props.loadCareHistoryByTree}
        onQueryChange={setStaffTreeQuery}
        onFilterChange={setStaffTreeFilter}
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
      <StaffWork
        openTaskCount={openTasks.length}
        visibleTasks={visibleTasks}
        totalTasks={staffTasks.length}
        activeFilter={taskFilter}
        onFilterChange={setTaskFilter}
        onOpenTask={(task) => {
          props.setActiveTask(task);
          props.setStep('DETAIL');
        }}
      />
    );
  }

  if (props.step === 'ACCOUNT') {
    return (
      <StaffAccount
        authenticatedUser={props.authenticatedUser}
        onLogout={props.onLogout}
        completed={completed}
        total={staffTasks.length}
        notificationsCount={unreadNotifications.length}
        onOpenNotifications={() => props.setStep('NOTIFICATIONS')}
      />
    );
  }

  if (props.step === 'NOTIFICATIONS') {
    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Thông báo" subtitle="Cập nhật nhiệm vụ và kiểm duyệt hiện trường" />
        <Card style={styles.taskFilterPanel}>
          <View style={styles.rowBetween}>
            <HeaderLabel />
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
        </Card>
        {props.notifications.length === 0 ? (
          <EmptyState
            title="Không có thông báo mới"
            body="Các cập nhật tác nghiệp sẽ xuất hiện ở đây."
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
                <Text style={styles.bodyText}>{notification.body}</Text>
                <Text style={styles.monoSmall}>
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
      step={props.step}
      setStep={props.setStep}
      activeTask={props.activeTask}
      setActiveTask={props.setActiveTask}
      tasks={props.tasks}
      trees={props.trees}
      staffTasks={staffTasks}
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
    <View style={[styles.screenPad, styles.centerJustified]}>
      <EmptyState title="Không tìm thấy màn hình" body="Hãy quay lại Trang chủ hoặc Công việc để tiếp tục." />
      <Button onPress={() => props.setStep('HOME')}>Về Trang chủ</Button>
    </View>
  );
}

function HeaderLabel() {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name="notifications-outline" size={15} color={colors.primary} />
      <Text style={styles.sectionTitleText}>Bộ lọc</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenPad: {
    padding: 16,
    paddingBottom: 104,
    gap: 16,
  },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskFilterPanel: {
    gap: 12,
    backgroundColor: colors.cardWarm,
    borderColor: colors.border,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
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
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitleText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    gap: 10,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  linkText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
});
