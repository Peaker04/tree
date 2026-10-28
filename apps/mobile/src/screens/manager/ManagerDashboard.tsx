import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  Button,
  Field,
  ListRow,
  MetricStatTile,
  Notice,
  ScreenHeader,
  SectionTitle,
} from '../../components/AppPrimitives';
import { getTaskProofGaps, getTreeRiskStatus, isTaskOverdue } from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { TaskStatus } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

export function ManagerDashboard(props: ManagerAreaProps) {
  const [managingTaskId, setManagingTaskId] = useState<string | null>(null);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [reassignReason, setReassignReason] = useState('');
  const [reassignStaffId, setReassignStaffId] = useState<string | null>(null);

  const pendingReview = props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW);
  const blocked = props.tasks.filter((task) => task.status === 'BLOCKED');
  const overdue = props.tasks.filter(isTaskOverdue);
  const actionableOverdue = overdue.filter((task) => task.status !== TaskStatus.WAITING_REVIEW);
  const riskyTrees = props.trees.filter((tree) => getTreeRiskStatus(tree) !== 'healthy');
  const incompleteReview = pendingReview.filter((task) => getTaskProofGaps(task).length > 0);
  const open = props.tasks.filter((task) => task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED').length;

  const cachedAt = props.dataSource?.cachedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(props.dataSource.cachedAt))
    : null;

  const heroPriority =
    blocked.length > 0
      ? {
          kind: 'blocked' as const,
          pretitle: 'SỰ CỐ KHẨN CẤP',
          title: `${blocked.length} công việc đang bị chặn`,
          body: 'Phát hiện sự cố kỹ thuật hoặc vật cản tại hiện trường cần quản lý can thiệp.',
          icon: 'alert-circle' as const,
          iconColor: colors.criticalText,
          count: blocked.length,
          actionLabel: 'Xử lý công việc bị chặn',
          actionIcon: 'warning-outline' as const,
          onPress: () => {
            // Handled in blocked section
          },
        }
      : overdue.length > 0
        ? {
            kind: 'overdue' as const,
            pretitle: 'ƯU TIÊN VẬN HÀNH',
            title: `${overdue.length} công việc đã quá hạn`,
            body: 'Ưu tiên rà soát và điều phối nhân sự xử lý để đảm bảo an toàn cây xanh.',
            icon: 'time' as const,
            iconColor: colors.warningText,
            count: overdue.length,
            actionLabel: 'Xem hàng chờ nghiệm thu',
            actionIcon: 'checkmark-done-outline' as const,
            onPress: () => props.setActiveStep('REVIEW'),
          }
        : pendingReview.length > 0
          ? {
              kind: 'review' as const,
              pretitle: 'CHỜ NGHIỆM THU',
              title: `${pendingReview.length} báo cáo đang chờ duyệt`,
              body:
                incompleteReview.length > 0
                  ? `${incompleteReview.length} báo cáo còn thiếu bằng chứng, cần kiểm tra kỹ.`
                  : 'Nhân viên đã nộp đủ hồ sơ ảnh đối chứng. Sẵn sàng nghiệm thu.',
              icon: 'shield-checkmark' as const,
              iconColor: colors.successText,
              count: pendingReview.length,
              actionLabel: 'Duyệt báo cáo ngay',
              actionIcon: 'checkmark-done-outline' as const,
              onPress: () => props.setActiveStep('REVIEW'),
            }
          : {
              kind: 'stable' as const,
              pretitle: 'TRẠNG THÁI VẬN HÀNH',
              title: 'Vận hành ổn định',
              body: `Tất cả công việc trong tiến độ chăm sóc. ${open} nhiệm vụ đang mở.`,
              icon: 'leaf' as const,
              iconColor: colors.forestDepths,
              count: 0,
              actionLabel: 'Giao việc mới',
              actionIcon: 'add-outline' as const,
              onPress: () => props.setActiveStep('CREATE'),
            };

  const [pullRefreshing, setPullRefreshing] = useState(false);
  const handlePullRefresh = async () => {
    setPullRefreshing(true);
    try {
      await props.onRefreshData?.();
    } finally {
      setPullRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Tổng quan" subtitle="Ưu tiên vận hành cần xử lý" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screen}
        refreshControl={
          props.onRefreshData ? (
            <RefreshControl refreshing={pullRefreshing} onRefresh={handlePullRefresh} tintColor={colors.primaryDark} />
          ) : undefined
        }
      >
        {props.dataSource?.source !== 'rest' ? (
          <Notice
            tone={props.dataSource?.source === 'cache' ? 'warning' : 'danger'}
            title={props.dataSource?.source === 'cache' ? 'Đang xem dữ liệu đã lưu' : 'Không tải được dữ liệu vận hành'}
            body={
              props.dataSource?.source === 'cache' && cachedAt
                ? `Bản lưu lúc ${cachedAt}. Kiểm tra kết nối rồi thử lại.`
                : (props.dataSource?.message ?? 'Kiểm tra kết nối rồi thử lại.')
            }
            action={
              <Button
                size="compact"
                variant="outline"
                loading={props.dataSource?.loading}
                onPress={() => void props.onRefreshData?.()}
              >
                Thử lại
              </Button>
            }
          />
        ) : null}

        {/* 1. HERO OPERATIONAL PRIORITY CARD */}
        <View
          style={[
            styles.heroCard,
            heroPriority.kind === 'blocked' && styles.heroCardDanger,
            heroPriority.kind === 'overdue' && styles.heroCardWarning,
            heroPriority.kind === 'review' && styles.heroCardSuccess,
          ]}
        >
          <View style={styles.heroHeader}>
            <View
              style={[
                styles.heroIconBadge,
                heroPriority.kind === 'blocked' && styles.heroIconBadgeDanger,
                heroPriority.kind === 'overdue' && styles.heroIconBadgeWarning,
                heroPriority.kind === 'review' && styles.heroIconBadgeSuccess,
              ]}
            >
              <Ionicons name={heroPriority.icon} size={20} color={heroPriority.iconColor} />
            </View>
            <View style={styles.flex}>
              <Text
                style={[
                  styles.heroPretitle,
                  heroPriority.kind === 'blocked' && styles.textDanger,
                  heroPriority.kind === 'overdue' && styles.textWarning,
                  heroPriority.kind === 'review' && styles.textSuccess,
                ]}
              >
                {heroPriority.pretitle}
              </Text>
              <Text style={styles.heroTitle}>{heroPriority.title}</Text>
            </View>
            {heroPriority.count > 0 ? (
              <View
                style={[
                  styles.heroCountBadge,
                  heroPriority.kind === 'blocked' && styles.heroCountBadgeDanger,
                  heroPriority.kind === 'overdue' && styles.heroCountBadgeWarning,
                  heroPriority.kind === 'review' && styles.heroCountBadgeSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.heroCountBadgeText,
                    heroPriority.kind === 'blocked' && styles.textDanger,
                    heroPriority.kind === 'overdue' && styles.textWarning,
                    heroPriority.kind === 'review' && styles.textSuccess,
                  ]}
                >
                  {heroPriority.count}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heroDescription}>{heroPriority.body}</Text>
          <View style={styles.heroActionRow}>
            <Button size="compact" variant="primary" icon={heroPriority.actionIcon} onPress={heroPriority.onPress}>
              {heroPriority.actionLabel}
            </Button>
          </View>
        </View>

        {/* 2. STREAMLINED METRICS BAR (4 PILLS IN ONE SLEEK ROW) */}
        <View style={styles.metricsBar}>
          <MetricStatTile
            label="Chờ duyệt"
            value={pendingReview.length}
            tone="warning"
            icon="shield-checkmark-outline"
            onPress={() => props.setActiveStep('REVIEW')}
          />
          <MetricStatTile label="Bị chặn" value={blocked.length} tone="danger" icon="ban-outline" />
          <MetricStatTile
            label="Quá hạn"
            value={overdue.length}
            tone="danger"
            icon="time-outline"
            onPress={() => props.setActiveStep('REVIEW')}
          />
          <MetricStatTile
            label="Cây chú ý"
            value={riskyTrees.length}
            tone="warning"
            icon="leaf-outline"
            onPress={() => props.setActiveStep('TREES')}
          />
        </View>

        {/* 3. TIẾN ĐỘ CHĂM SÓC CÂY ĐỊNH KỲ */}
        <View style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <View style={styles.routineIconBadge}>
              <Ionicons name="leaf" size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.routineTitle}>Tiến độ điều phối chăm sóc</Text>
              <Text style={styles.routineSubtitle}>
                {props.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length}/{props.tasks.length} việc hoàn
                thành (
                {props.tasks.length > 0
                  ? Math.round(
                      (props.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length / props.tasks.length) * 100,
                    )
                  : 0}
                %)
              </Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${props.tasks.length > 0 ? Math.min(100, Math.round((props.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length / props.tasks.length) * 100)) : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {blocked.length > 0 ? (
          <View style={styles.section}>
            <SectionTitle icon="warning-outline">Công việc bị chặn</SectionTitle>
            {blocked.map((task) => (
              <View key={task.id} style={styles.exceptionRow}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <Text style={styles.itemTitle}>{task.title}</Text>
                    <Text style={styles.body}>{task.treeName}</Text>
                  </View>
                  <Badge tone="danger">Bị chặn</Badge>
                </View>
                {task.notes ? <Text style={styles.body}>{task.notes}</Text> : null}
                <View style={styles.actions}>
                  <Button
                    size="compact"
                    disabled={managingTaskId !== null}
                    loading={managingTaskId === task.id}
                    onPress={async () => {
                      setManagingTaskId(task.id);
                      try {
                        await props.resumeBlockedTask?.({
                          taskId: task.id,
                          expectedVersion: task.version ?? 0,
                          resolutionNotes: 'Quản lý cho phép tiếp tục công việc',
                        });
                      } finally {
                        setManagingTaskId(null);
                      }
                    }}
                  >
                    Tiếp tục
                  </Button>
                  <Button
                    size="compact"
                    variant="outline"
                    disabled={managingTaskId !== null}
                    onPress={() => {
                      setReassigningTaskId(reassigningTaskId === task.id ? null : task.id);
                      setReassignReason('');
                      setReassignStaffId(null);
                    }}
                  >
                    Đổi người
                  </Button>
                  <Button
                    size="compact"
                    variant="danger"
                    disabled={managingTaskId !== null}
                    onPress={async () => {
                      setManagingTaskId(task.id);
                      try {
                        await props.cancelTask?.({
                          taskId: task.id,
                          expectedVersion: task.version ?? 0,
                          cancelReason: 'Quản lý hủy công việc do sự cố',
                        });
                      } finally {
                        setManagingTaskId(null);
                      }
                    }}
                  >
                    Hủy
                  </Button>
                </View>

                {reassigningTaskId === task.id ? (
                  <View style={styles.reassignPanel}>
                    <Field
                      label="Lý do đổi người"
                      value={reassignReason}
                      onChangeText={setReassignReason}
                      placeholder="Nêu lý do cần thay đổi"
                    />
                    <Text style={styles.fieldLabel}>Người thực hiện mới</Text>
                    {props.assignableStaff.map((staff) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: reassignStaffId === staff.id }}
                        key={staff.id}
                        onPress={() => setReassignStaffId(staff.id)}
                        style={[styles.staffChoice, reassignStaffId === staff.id && styles.staffChoiceSelected]}
                      >
                        <Ionicons
                          name={reassignStaffId === staff.id ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={colors.primaryDark}
                        />
                        <Text style={styles.itemTitle}>{staff.email}</Text>
                      </Pressable>
                    ))}
                    <Button
                      disabled={!reassignReason.trim() || !reassignStaffId || managingTaskId !== null}
                      loading={managingTaskId === task.id}
                      onPress={async () => {
                        if (!reassignStaffId) return;
                        setManagingTaskId(task.id);
                        try {
                          await props.reassignTask?.({
                            taskId: task.id,
                            expectedVersion: task.version ?? 0,
                            newStaffId: reassignStaffId,
                            reason: reassignReason.trim(),
                          });
                          setReassigningTaskId(null);
                        } finally {
                          setManagingTaskId(null);
                        }
                      }}
                    >
                      Xác nhận đổi người
                    </Button>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {pendingReview.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <SectionTitle icon="shield-checkmark-outline">Hàng chờ nghiệm thu</SectionTitle>
              <Badge tone="amber">{pendingReview.length}</Badge>
            </View>
            {pendingReview.slice(0, 3).map((task) => (
              <ListRow
                key={task.id}
                icon="clipboard-outline"
                title={task.title}
                subtitle={`${task.treeName} · ${getTaskProofGaps(task).length ? `${getTaskProofGaps(task).length} mục thiếu` : 'Đủ bằng chứng'}`}
                onPress={() => {
                  props.setReviewTask(task);
                  props.setActiveStep('REVIEW_DETAIL');
                }}
              />
            ))}
          </View>
        ) : null}

        {(riskyTrees.length > 0 || actionableOverdue.length > 0) && (
          <View style={styles.section}>
            <SectionTitle icon="alert-circle-outline">Ngoại lệ cần chú ý</SectionTitle>
            {actionableOverdue.slice(0, 2).map((task) => (
              <ListRow
                key={`overdue-${task.id}`}
                icon="time-outline"
                title={task.title}
                subtitle={`${task.treeName} · Quá hạn`}
                status={<Badge tone="danger">Quá hạn</Badge>}
              />
            ))}
            {riskyTrees.slice(0, 2).map((tree) => (
              <ListRow
                key={`tree-${tree.id}`}
                icon="leaf-outline"
                title={tree.name}
                subtitle={tree.address}
                status={<Badge tone={tree.healthStatus === 'Sâu bệnh' ? 'danger' : 'amber'}>{tree.healthStatus}</Badge>}
                onPress={() => props.setActiveStep('TREES')}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <SectionTitle icon="navigate-outline">Lối tắt</SectionTitle>
          {pendingReview.length > 0 ? (
            <ListRow
              icon="add-circle-outline"
              title="Tạo việc"
              subtitle="Giao một nhiệm vụ vận hành mới"
              onPress={() => props.setActiveStep('CREATE')}
            />
          ) : null}
          <ListRow
            icon="leaf-outline"
            title="Hồ sơ cây"
            subtitle={`${props.trees.length} cây trong phạm vi vận hành`}
            onPress={() => props.setActiveStep('TREES')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomNavClearance + spacing.xl,
    gap: spacing.xl,
  },
  flex: { flex: 1 },
  heroCard: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.cardWarm,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: spacing.md,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroCardDanger: {
    backgroundColor: colors.criticalSurface,
    borderColor: colors.criticalBorder,
  },
  heroCardWarning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  heroCardSuccess: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconBadgeDanger: { backgroundColor: 'rgba(217, 72, 72, 0.12)' },
  heroIconBadgeWarning: { backgroundColor: 'rgba(217, 153, 33, 0.14)' },
  heroIconBadgeSuccess: { backgroundColor: 'rgba(46, 125, 82, 0.14)' },
  heroPretitle: {
    ...typography.metadata,
    letterSpacing: 0.5,
    fontWeight: '600',
    color: colors.pewter,
  },
  textDanger: { color: colors.criticalText },
  textWarning: { color: colors.warningText },
  textSuccess: { color: colors.successText },
  heroTitle: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
    color: colors.ink,
    marginTop: 2,
  },
  heroCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  heroCountBadgeDanger: { backgroundColor: 'rgba(217, 72, 72, 0.1)', borderColor: colors.criticalBorder },
  heroCountBadgeWarning: { backgroundColor: 'rgba(217, 153, 33, 0.1)', borderColor: colors.warningBorder },
  heroCountBadgeSuccess: { backgroundColor: 'rgba(46, 125, 82, 0.1)', borderColor: colors.successBorder },
  heroCountBadgeText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.ink,
  },
  heroDescription: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsBar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 58,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  metricPillDanger: {
    backgroundColor: colors.criticalSurface,
    borderColor: colors.criticalBorder,
  },
  metricPillWarning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  metricPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricPillValue: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  metricPillLabel: {
    ...typography.metadata,
    fontSize: 12,
    lineHeight: 15,
    color: colors.pewter,
    textAlign: 'center',
  },
  section: { gap: spacing.sm },
  body: { ...typography.body, color: colors.pewter },
  itemTitle: { ...typography.bodyStrong, color: colors.ink, flexShrink: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  exceptionRow: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reassignPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.compact,
    backgroundColor: colors.neutralSurface,
  },
  fieldLabel: { ...typography.label, color: colors.ink },
  staffChoice: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.control,
    backgroundColor: colors.card,
  },
  staffChoiceSelected: { borderColor: colors.successBorder, backgroundColor: colors.successSurface },
  routineCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.cardWarm,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: spacing.sm,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.successSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  routineSubtitle: {
    ...typography.metadata,
    color: colors.pewter,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
});
