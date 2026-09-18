import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Card, EmptyState, Field, GradientCard, SectionTitle } from '../../components/AppPrimitives';
import { ChecklistLine, Header, PhotoPair, ProofChainCard, TaskCard } from '../../components/presentation/TaskSurfaces';
import { getTaskProofCount, getTaskProofGaps, matchesTaskQuery } from '../../domain/mobileWorkflow';
import { colors, radius, spacing } from '../../theme/tokens';
import { Task, TaskStatus } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

const REWORK_REASON_OPTIONS = [
  'Ảnh before/after chưa đủ rõ',
  'GPS chưa khớp vị trí cây',
  'Checklist thiếu hạng mục',
  'Cần bổ sung vệ sinh hiện trường',
];

export function ManagerReview(props: ManagerAreaProps) {
  const [reviewQuery, setReviewQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTouched, setRejectTouched] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState<'approve' | 'reject' | null>(null);
  const pendingReview = props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW);
  const visiblePendingReview = pendingReview.filter((task) => matchesTaskQuery(task, reviewQuery));

  useEffect(() => {
    setRejectReason('');
    setRejectTouched(false);
  }, [props.reviewTask?.id]);

  if (props.activeStep === 'REVIEW_DETAIL' && props.reviewTask) {
    return (
      <ManagerReviewDetail
        {...props}
        reviewTask={props.reviewTask}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectTouched={rejectTouched}
        setRejectTouched={setRejectTouched}
        reviewSubmitting={reviewSubmitting}
        setReviewSubmitting={setReviewSubmitting}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Danh sách chờ duyệt" subtitle="Các báo cáo nghiệm thu hiện trường" />
      <GradientCard variant="review">
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.lightHeroTitle}>Kiểm tra bằng chứng</Text>
            <Text style={styles.lightHeroBody}>
              Ưu tiên báo cáo đủ GPS, QR, ảnh before/after và checklist trước khi phê duyệt.
            </Text>
          </View>
          <View style={styles.reviewHeroCount}>
            <Text style={styles.reviewHeroNumber}>{pendingReview.length}</Text>
            <Text style={styles.reviewHeroLabel}>chờ duyệt</Text>
          </View>
        </View>
      </GradientCard>
      <Card style={styles.taskFilterPanel}>
        <Field
          label="Tìm báo cáo"
          value={reviewQuery}
          onChangeText={setReviewQuery}
          placeholder="Mã task, cây, nhân viên, loại việc..."
          autoCapitalize="none"
          rightIcon={reviewQuery ? 'close-circle-outline' : 'search-outline'}
          onRightIconPress={reviewQuery ? () => setReviewQuery('') : undefined}
        />
        <Text style={styles.resultText}>
          {visiblePendingReview.length}/{pendingReview.length} báo cáo
        </Text>
      </Card>
      {pendingReview.length === 0 ? (
        <EmptyState title="Không có báo cáo tồn đọng" body="Mọi báo cáo hiện trường đã được xử lý." />
      ) : visiblePendingReview.length === 0 ? (
        <EmptyState
          title="Không tìm thấy báo cáo"
          body="Thử tìm theo mã task, cây hoặc nhân viên khác."
          icon="search-outline"
        />
      ) : (
        visiblePendingReview.map((task) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Duyệt báo cáo ${task.title}`}
            key={task.id}
            onPress={() => {
              props.setReviewTask(task);
              props.setActiveStep('REVIEW_DETAIL');
            }}
          >
            <TaskCard task={task} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function ManagerReviewDetail({
  reviewTask,
  rejectReason,
  setRejectReason,
  rejectTouched,
  setRejectTouched,
  reviewSubmitting,
  setReviewSubmitting,
  ...props
}: ManagerAreaProps & {
  reviewTask: Task;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  rejectTouched: boolean;
  setRejectTouched: (value: boolean) => void;
  reviewSubmitting: 'approve' | 'reject' | null;
  setReviewSubmitting: (value: 'approve' | 'reject' | null) => void;
}) {
  const reviewProofCount = getTaskProofCount(reviewTask);
  const reviewProofGaps = getTaskProofGaps(reviewTask);
  const cleanRejectReason = rejectReason.trim();
  const selectedRejectChip = REWORK_REASON_OPTIONS.includes(cleanRejectReason) ? cleanRejectReason : undefined;
  const gpsTimestamp = reviewTask.gpsCheck?.timestamp
    ? new Date(reviewTask.gpsCheck.timestamp).toLocaleString('vi-VN')
    : 'Chưa có timestamp';

  const completeReview = async () => {
    setReviewSubmitting('approve');
    const fallbackTask: Task = {
      ...reviewTask,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date().toISOString(),
    };
    await props.reviewTaskDecision(
      {
        taskId: reviewTask.id,
        decision: 'approve',
        reviewerId: 'MGR-01',
      },
      fallbackTask,
    );
    await props.createNotification({
      title: 'Báo cáo đã được phê duyệt',
      body: `${reviewTask.title} tại ${reviewTask.treeName} đã được quản lý duyệt.`,
      type: 'success',
      taskId: reviewTask.id,
    });
    setReviewSubmitting(null);
    props.setReviewTask(null);
    props.setActiveStep('REVIEW');
  };

  const requestRework = async () => {
    if (!cleanRejectReason) {
      setRejectTouched(true);
      return;
    }
    setReviewSubmitting('reject');
    const fallbackTask: Task = {
      ...reviewTask,
      status: TaskStatus.REWORK_REQUIRED,
      rejectReason: cleanRejectReason,
      updatedAt: new Date().toISOString(),
    };
    await props.reviewTaskDecision(
      {
        taskId: reviewTask.id,
        decision: 'request_rework',
        reviewerId: 'MGR-01',
        reason: cleanRejectReason,
        rejectReason: cleanRejectReason,
        reasonChips: selectedRejectChip ? [selectedRejectChip] : [],
      },
      fallbackTask,
    );
    await props.createNotification({
      title: 'Công việc cần làm lại',
      body: `${reviewTask.title}: ${cleanRejectReason}. Mở Công việc để tiếp tục đúng bước bằng chứng còn thiếu.`,
      type: 'warning',
      taskId: reviewTask.id,
    });
    setReviewSubmitting(null);
    props.setReviewTask(null);
    props.setActiveStep('REVIEW');
  };

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Duyệt bằng chứng" subtitle={reviewTask.id} onBack={() => props.setActiveStep('REVIEW')} />
      <GradientCard variant={reviewProofGaps.length === 0 ? 'canopy' : 'review'} contentStyle={styles.proofGateInner}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.successTitle}>
              {reviewProofGaps.length === 0 ? 'Bằng chứng đủ điều kiện' : 'Bằng chứng cần kiểm tra kỹ'}
            </Text>
            <Text style={styles.bodyText}>Manager phải xác nhận đúng cây, đúng vị trí và đủ ảnh trước khi duyệt.</Text>
          </View>
          <Badge tone={reviewProofGaps.length === 0 ? 'green' : 'amber'}>{reviewProofCount}/5</Badge>
        </View>
        {reviewProofGaps.length > 0 ? (
          <View style={styles.proofGapList}>
            {reviewProofGaps.map((gap) => (
              <Text key={gap} style={styles.bodyText}>
                - {gap}
              </Text>
            ))}
          </View>
        ) : null}
      </GradientCard>

      <Card>
        <SectionTitle icon="navigate-outline">GPS và QR</SectionTitle>
        <View style={styles.auditGrid}>
          <AuditBox label="Khoảng cách" value={`${reviewTask.gpsCheck?.distance.toFixed(1) ?? 'N/A'}m`} />
          <AuditBox label="Ngưỡng" value="10m" />
          <AuditBox label="Timestamp" value={gpsTimestamp} />
          <AuditBox label="QR" value={reviewTask.qrCheck?.verified ? reviewTask.qrCheck.scannedCode : 'Chưa hợp lệ'} />
        </View>
      </Card>

      <ProofChainCard task={reviewTask} />
      <PhotoPair task={reviewTask} />

      <Card>
        <SectionTitle icon="checkbox-outline">Checklist nhân viên</SectionTitle>
        {reviewTask.checklist.map((item, index) => (
          <ChecklistLine key={item.id} index={index} item={item} />
        ))}
      </Card>

      <Card>
        <SectionTitle icon="finger-print-outline">Ghi chú và metadata</SectionTitle>
        <View style={styles.auditGrid}>
          <AuditBox label="Nhân viên" value={reviewTask.assignedStaffName} />
          <AuditBox label="Hạn" value={new Date(reviewTask.deadline).toLocaleDateString('vi-VN')} />
          <AuditBox label="Cập nhật" value={new Date(reviewTask.updatedAt).toLocaleTimeString('vi-VN')} />
          <AuditBox label="Cây" value={reviewTask.treeName} />
        </View>
        <Text style={styles.bodyText}>Ghi chú: {reviewTask.notes || 'Không có ghi chú bổ sung.'}</Text>
      </Card>

      <Card tone="amber" style={styles.reviewDecisionCard}>
        <SectionTitle icon="return-down-back-outline">Yêu cầu làm lại</SectionTitle>
        <View style={styles.reasonChips}>
          {REWORK_REASON_OPTIONS.map((reason) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chọn lý do từ chối: ${reason}`}
              accessibilityState={{ selected: cleanRejectReason === reason }}
              key={reason}
              onPress={() => {
                setRejectReason(reason);
                setRejectTouched(false);
              }}
              style={[styles.reasonChip, cleanRejectReason === reason && styles.reasonChipActive]}
            >
              <Text style={[styles.reasonChipText, cleanRejectReason === reason && styles.reasonChipTextActive]}>
                {reason}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          label="Lý do từ chối"
          value={rejectReason}
          onChangeText={(value) => {
            setRejectReason(value);
            if (value.trim()) setRejectTouched(false);
          }}
          placeholder="Nhập lý do để nhân viên biết cần sửa gì"
          multiline
          style={styles.multilineInput}
        />
        <View style={styles.recoveryPath}>
          <Ionicons name="return-down-forward-outline" size={16} color={colors.amber} />
          <Text style={styles.bodyText}>
            Khi từ chối, Staff sẽ thấy lý do này trong Công việc và tiếp tục từ bước bằng chứng còn thiếu.
          </Text>
        </View>
        {rejectTouched && !cleanRejectReason ? (
          <Text style={styles.alertText}>Cần nhập lý do trước khi yêu cầu làm lại.</Text>
        ) : null}
      </Card>

      <View style={styles.reviewActionBar}>
        <Button
          variant="danger"
          style={styles.reviewActionButton}
          disabled={reviewSubmitting !== null}
          loading={reviewSubmitting === 'reject'}
          onPress={() => void requestRework()}
        >
          {reviewSubmitting === 'reject' ? 'Đang gửi...' : 'Từ chối'}
        </Button>
        <Button
          icon="checkmark-outline"
          style={styles.reviewActionButton}
          disabled={reviewProofGaps.length > 0 || reviewSubmitting !== null}
          loading={reviewSubmitting === 'approve'}
          onPress={() => void completeReview()}
        >
          {reviewSubmitting === 'approve'
            ? 'Đang duyệt...'
            : reviewProofGaps.length > 0
              ? 'Thiếu bằng chứng'
              : 'Phê duyệt'}
        </Button>
      </View>
    </ScrollView>
  );
}

function AuditBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.auditBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.auditValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenPad: {
    padding: spacing.screen,
    gap: spacing.section,
    paddingBottom: 104,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lightHeroTitle: {
    color: colors.forest,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  lightHeroBody: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
  },
  reviewHeroCount: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeroNumber: {
    color: colors.amber,
    fontSize: 22,
    fontWeight: '900',
  },
  reviewHeroLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  taskFilterPanel: {
    gap: 10,
    backgroundColor: colors.cardWarm,
  },
  resultText: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
  },
  proofGateInner: {
    gap: 10,
    minHeight: 0,
  },
  proofGapList: {
    gap: 4,
    paddingLeft: 2,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
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
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  auditValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 5,
  },
  reviewDecisionCard: {
    gap: 12,
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
    fontWeight: '700',
  },
  reasonChipTextActive: {
    color: colors.amber,
  },
  multilineInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  recoveryPath: {
    flexDirection: 'row',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: colors.card,
    padding: 11,
  },
  alertText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  reviewActionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  reviewActionButton: {
    flex: 1,
  },
});
