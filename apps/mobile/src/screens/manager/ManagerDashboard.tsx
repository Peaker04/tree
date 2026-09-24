import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Field, ListRow, Notice, ScreenHeader, SectionTitle } from '../../components/AppPrimitives';
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

  const nextAction =
    blocked.length > 0
      ? {
          title: `${blocked.length} công việc đang bị chặn`,
          body: 'Chọn cách xử lý bên dưới.',
          kind: 'blocked' as const,
        }
      : overdue.length > 0
        ? {
            title: `${overdue.length} công việc đã quá hạn`,
            body: 'Xử lý việc quá hạn trước.',
            kind: 'overdue' as const,
          }
        : pendingReview.length > 0
          ? {
              title: `${pendingReview.length} báo cáo đang chờ duyệt`,
              body:
                incompleteReview.length > 0
                  ? `${incompleteReview.length} báo cáo còn thiếu bằng chứng.`
                  : 'Duyệt bằng chứng và chọn kết quả.',
              kind: 'review' as const,
            }
          : {
              title: 'Tạo nhiệm vụ vận hành mới',
              body: `${open} nhiệm vụ đang mở.`,
              kind: 'create' as const,
            };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenHeader title="Tổng quan" subtitle="Ưu tiên vận hành cần xử lý" />

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

      <View style={styles.metrics}>
        <Metric label="Chờ duyệt" value={pendingReview.length} tone="warning" />
        <Metric label="Bị chặn" value={blocked.length} tone="danger" />
        <Metric label="Quá hạn" value={overdue.length} tone="danger" />
        <Metric label="Cây chú ý" value={riskyTrees.length} tone="warning" />
      </View>

      <View
        style={[
          styles.nextAction,
          nextAction.kind === 'blocked' && styles.nextActionDanger,
          nextAction.kind === 'overdue' && styles.nextActionWarning,
        ]}
      >
        <View style={styles.flex}>
          <Text
            style={[
              styles.nextActionLabel,
              nextAction.kind === 'blocked' && styles.textDanger,
              nextAction.kind === 'overdue' && styles.textWarning,
            ]}
          >
            Việc cần làm tiếp theo
          </Text>
          <Text style={styles.nextActionTitle}>{nextAction.title}</Text>
          <Text style={styles.body}>{nextAction.body}</Text>
        </View>
        {nextAction.kind === 'review' || nextAction.kind === 'create' ? (
          <Button
            icon={nextAction.kind === 'review' ? 'checkmark-done-outline' : 'add-outline'}
            onPress={() => props.setActiveStep(nextAction.kind === 'review' ? 'REVIEW' : 'CREATE')}
          >
            {nextAction.kind === 'review' ? 'Duyệt báo cáo' : 'Tạo việc'}
          </Button>
        ) : null}
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

      {(riskyTrees.length > 0 || overdue.length > 0) && (
        <View style={styles.section}>
          <SectionTitle icon="alert-circle-outline">Ngoại lệ cần chú ý</SectionTitle>
          {overdue.slice(0, 2).map((task) => (
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
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const semanticColor =
    tone === 'warning'
      ? colors.warningText
      : tone === 'danger'
        ? colors.criticalText
        : tone === 'info'
          ? colors.infoText
          : colors.neutralText;
  const color = value > 0 ? semanticColor : colors.neutralText;
  return (
    <View style={styles.metric}>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomNavClearance + spacing.xl,
    gap: spacing.xl,
  },
  flex: { flex: 1 },
  metrics: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  metric: { flex: 1, padding: spacing.md, gap: spacing.xs },
  metricLabel: { ...typography.metadata, color: colors.pewter },
  metricValue: { ...typography.metric },
  nextAction: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.successSurface,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  nextActionLabel: { ...typography.metadata, color: colors.successText },
  nextActionDanger: { backgroundColor: colors.criticalSurface, borderColor: colors.criticalBorder },
  nextActionWarning: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  textDanger: { color: colors.criticalText },
  textWarning: { color: colors.warningText },
  nextActionTitle: { ...typography.title, color: colors.ink, marginTop: spacing.xs },
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
});
