import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, ListRow, Notice, ScreenHeader } from '../../components/AppPrimitives';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { Task, TaskStatus } from '../../types';
import { getTaskProofWorkflowState } from '../../domain/mobileWorkflow';

interface StaffHomeProps {
  openTaskCount: number;
  actionableTaskCount?: number;
  completionRate: number;
  completed: number;
  totalTasks: number;
  assignedTreeCount: number;
  waitingReviewCount: number;
  nextTask: Task | null;
  unreadNotificationCount: number;
  loading?: boolean;
  errorMessage?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  onOpenNotifications: () => void;
  onOpenWork: () => void;
  onOpenTrees: () => void;
  onOpenTask?: (task: Task) => void;
  onStartTaskProof?: (task: Task) => void;
}

export function StaffHome({
  openTaskCount,
  actionableTaskCount,
  completionRate,
  completed,
  totalTasks,
  assignedTreeCount,
  waitingReviewCount,
  nextTask,
  unreadNotificationCount,
  loading = false,
  errorMessage,
  isOffline = false,
  onRetry,
  onOpenNotifications,
  onOpenWork,
  onOpenTrees,
  onOpenTask,
  onStartTaskProof,
}: StaffHomeProps) {
  const actionable = actionableTaskCount ?? Math.max(0, openTaskCount - waitingReviewCount);
  const workflow = nextTask ? getTaskProofWorkflowState(nextTask, 'Staff') : null;
  const hasAssignments = totalTasks > 0;

  const summary = loading
    ? { title: 'Đang tải ca làm việc', body: 'Đang đồng bộ nhiệm vụ được giao.', tone: 'neutral' as const }
    : nextTask && actionable > 0 && workflow
      ? {
          title: workflow.activeActionText,
          body: `${nextTask.title} · ${nextTask.treeName}`,
          tone: nextTask.status === TaskStatus.REWORK_REQUIRED ? ('warning' as const) : ('success' as const),
        }
      : waitingReviewCount > 0
        ? {
            title: `${waitingReviewCount} báo cáo đang chờ duyệt`,
            body: 'Báo cáo đã gửi. Theo dõi trong danh sách việc.',
            tone: 'warning' as const,
          }
        : hasAssignments && openTaskCount === 0
          ? {
              title: 'Ca làm việc đã hoàn tất',
              body: `${completed}/${totalTasks} nhiệm vụ đã được hoàn thành.`,
              tone: 'success' as const,
            }
          : {
              title: 'Chưa có việc cần xử lý',
              body: 'Xem danh sách việc hoặc cây phụ trách.',
              tone: 'neutral' as const,
            };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Trang chủ"
        subtitle={isOffline ? 'Ca làm việc · dữ liệu đã lưu' : 'Ca làm việc hiện tại'}
        action={
          <Button size="compact" variant="ghost" icon="notifications-outline" onPress={onOpenNotifications}>
            {unreadNotificationCount > 0 ? `${unreadNotificationCount} mới` : 'Thông báo'}
          </Button>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screen}
        refreshControl={
          onRetry ? (
            <RefreshControl refreshing={Boolean(loading)} onRefresh={onRetry} tintColor={colors.primaryDark} />
          ) : undefined
        }
      >

      {isOffline ? (
        <Notice
          tone="warning"
          title="Đang dùng dữ liệu đã lưu"
          body="Dữ liệu có thể chưa mới. Kết nối lại để tải."
          action={
            onRetry ? (
              <Button size="compact" variant="outline" onPress={onRetry}>
                Thử lại
              </Button>
            ) : undefined
          }
        />
      ) : errorMessage ? (
        <Notice
          tone="danger"
          title="Không tải được ca làm việc"
          body={errorMessage}
          action={
            onRetry ? (
              <Button size="compact" variant="outline" onPress={onRetry}>
                Thử lại
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <View style={[styles.nextAction, styles[`nextAction_${summary.tone}`]]}>
        <Text style={styles.kicker}>Việc cần làm tiếp theo</Text>
        <Text style={styles.nextTitle}>{summary.title}</Text>
        <Text style={styles.body}>{summary.body}</Text>
        {nextTask && actionable > 0 && workflow ? (
          <Button
            icon="arrow-forward-outline"
            onPress={() => (onStartTaskProof ? onStartTaskProof(nextTask) : onOpenTask?.(nextTask))}
          >
            {workflow.activeActionText}
          </Button>
        ) : (
          <Button variant="outline" icon="clipboard-outline" onPress={onOpenWork}>
            Kiểm tra công việc
          </Button>
        )}
      </View>

      <View style={styles.metrics}>
        <Metric label="Cần xử lý" value={actionable} />
        <Metric label="Chờ duyệt" value={waitingReviewCount} />
        <Metric label="Hoàn thành" value={hasAssignments ? `${completionRate}%` : '—'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đi tới</Text>
        <ListRow
          icon="clipboard-outline"
          title="Công việc"
          subtitle={`${openTaskCount} việc đang mở · ${completed}/${totalTasks} hoàn thành`}
          onPress={onOpenWork}
        />
        <ListRow
          icon="leaf-outline"
          title="Cây của tôi"
          subtitle={`${assignedTreeCount} cây có quan hệ phân công`}
          onPress={onOpenTrees}
        />
        {nextTask && onOpenTask ? (
          <ListRow
            icon="document-text-outline"
            title="Chi tiết việc ưu tiên"
            subtitle={nextTask.title}
            status={<Badge tone="sky">Mở</Badge>}
            onPress={() => onOpenTask(nextTask)}
          />
        ) : null}
      </View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    label === 'Cần xử lý'
      ? 'time-outline'
      : label === 'Chờ duyệt'
        ? 'shield-checkmark-outline'
        : 'checkmark-circle-outline';

  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <Ionicons name={iconName} size={15} color={colors.primaryDark} />
        <Text numberOfLines={1} style={styles.metricLabel}>
          {label}
        </Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomNavClearance + spacing.xl,
    gap: spacing.xl,
  },
  nextAction: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderRadius: radius.card },
  nextAction_success: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  nextAction_warning: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
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
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
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
});
