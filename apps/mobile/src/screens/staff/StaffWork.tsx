import { useCallback } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, EmptyState, ScreenHeader, SegmentedFilterBar } from '../../components/AppPrimitives';
import {
  TaskFilter,
  createStaffFilterOptions,
  formatTaskDate,
  getTaskProofWorkflowState,
  getTaskStatusMeta,
  isTaskAwaitingSupervisor,
  isTaskOverdue,
} from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { Task, TaskStatus } from '../../types';

export function StaffWork({
  openTaskCount,
  visibleTasks,
  totalTasks,
  activeFilter,
  allTasks,
  loading = false,
  onRefresh,
  onFilterChange,
  onOpenTask,
}: {
  openTaskCount: number;
  visibleTasks: Task[];
  totalTasks: number;
  activeFilter: TaskFilter;
  allTasks?: Task[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onFilterChange: (value: TaskFilter) => void;
  onOpenTask: (task: Task) => void;
}) {
  const renderItem = useCallback(
    ({ item: task }: { item: Task }) => <StaffTaskRow task={task} onPress={() => onOpenTask(task)} />,
    [onOpenTask],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Công việc" subtitle={`${openTaskCount} việc đang mở`} />
      <FlatList
        data={visibleTasks}
        keyExtractor={(task) => task.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screen}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(loading)}
              onRefresh={() => void onRefresh()}
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
            <SegmentedFilterBar
              variant="scrollable"
              options={createStaffFilterOptions(allTasks && allTasks.length > 0 ? allTasks : visibleTasks)}
              selectedId={activeFilter}
              onSelect={(id) => onFilterChange(id)}
            />
            <Text style={styles.resultLabel}>
              {visibleTasks.length}/{totalTasks} công việc
            </Text>
            {totalTasks === 0 ? (
              <EmptyState
                title="Chưa có công việc được giao"
                body="Nhiệm vụ mới sẽ xuất hiện sau khi quản lý phân công."
              />
            ) : visibleTasks.length === 0 ? (
              <EmptyState
                icon="funnel-outline"
                title="Không có việc trong bộ lọc"
                body="Chọn một trạng thái khác để xem công việc."
              />
            ) : null}
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
}

function StaffTaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  const status = getTaskStatusMeta(task.status);
  const overdue = isTaskOverdue(task);
  const wState = getTaskProofWorkflowState(task, 'Staff');
  const awaitingSupervisor = isTaskAwaitingSupervisor(task);
  const nextHint =
    task.status === TaskStatus.REWORK_REQUIRED
      ? 'Mở để xem phần cần làm lại'
      : task.status === TaskStatus.WAITING_REVIEW
        ? 'Đã nộp, đang chờ quản lý duyệt'
        : task.status === TaskStatus.COMPLETED
          ? 'Đã hoàn thành'
          : awaitingSupervisor
            ? 'Đã xác nhận hiện trường, chờ giám sát chụp ảnh'
            : 'Mở để tiếp tục bước xác nhận';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở công việc ${task.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.taskRow, pressed && styles.pressed]}
    >
      <View style={styles.rowBetween}>
        <Badge tone={status.tone}>{status.label}</Badge>
        <Text style={[styles.deadline, overdue && styles.deadlineOverdue]}>
          {task.dateRange
            ? `${task.dateRange.startDate.split('-').slice(1).reverse().join('/')} - ${task.dateRange.endDate.split('-').slice(1).reverse().join('/')}${task.dateRange.shift === 'morning' ? ' (Sáng)' : task.dateRange.shift === 'afternoon' ? ' (Chiều)' : ''}`
            : overdue
              ? 'Quá hạn'
              : `Hạn ${formatTaskDate(task.deadline)}`}
        </Text>
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.treeRow}>
        <Ionicons name="leaf-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.treeName}>{task.treeName}</Text>
      </View>
      {task.status === TaskStatus.REWORK_REQUIRED && task.rejectReason ? (
        <View style={styles.reworkBox}>
          <Ionicons name="return-down-back-outline" size={17} color={colors.warningText} />
          <Text style={styles.reworkText}>{task.rejectReason}</Text>
        </View>
      ) : null}
      <View style={styles.rowBetween}>
        <Text style={styles.proof}>
          Bằng chứng {wState.proofCount}/{wState.totalRequired}
        </Text>
        <Text style={styles.nextHint}>{nextHint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: { padding: layout.screenPadding, paddingBottom: layout.bottomNavClearance + spacing.xl },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  separator: { height: spacing.md },
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
  reworkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.control,
    backgroundColor: colors.warningSurface,
  },
  reworkText: { ...typography.body, color: colors.warningText, flex: 1 },
  proof: { ...typography.label, color: colors.pewter },
  nextHint: { ...typography.label, color: colors.primaryDark, flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.72 },
});
