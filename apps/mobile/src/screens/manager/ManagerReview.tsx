import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  ListRow,
  Notice,
  ScreenHeader,
  SectionTitle,
} from '../../components/AppPrimitives';
import { ChecklistLine, PhotoPair } from '../../components/presentation/TaskSurfaces';
import {
  formatActorDisplayName,
  getTaskProofCount,
  getTaskProofGaps,
  matchesTaskQuery,
} from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { Task, TaskStatus } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

const REWORK_REASONS = [
  'Ảnh trước/sau chưa đủ rõ',
  'GPS chưa khớp vị trí cây',
  'Checklist còn thiếu',
  'Cần bổ sung vệ sinh hiện trường',
];

type Decision = 'APPROVE' | 'APPROVE_WITH_EXCEPTION' | 'REQUEST_REWORK' | 'CANCEL';
type DecisionTone = 'success' | 'corrective' | 'exceptional' | 'destructive';

const decisionToneColor: Record<DecisionTone, string> = {
  success: colors.successText,
  corrective: colors.warningText,
  exceptional: colors.infoText,
  destructive: colors.criticalText,
};

export function ManagerReview(props: ManagerAreaProps) {
  const [query, setQuery] = useState('');
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pending = [...props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const visible = pending.filter((task) => matchesTaskQuery(task, query));

  const handlePullRefresh = async () => {
    setPullRefreshing(true);
    try {
      await props.onRefreshData?.();
    } finally {
      setPullRefreshing(false);
    }
  };

  if (props.activeStep === 'REVIEW_DETAIL' && props.reviewTask) {
    return <ManagerReviewDetail {...props} reviewTask={props.reviewTask} />;
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(task) => task.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screen}
      refreshControl={
        props.onRefreshData ? (
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={handlePullRefresh}
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
          <ScreenHeader title="Duyệt báo cáo" subtitle={`${pending.length} báo cáo đang chờ nghiệm thu`} />

          {props.dataSource?.source !== 'rest' ? (
            <Notice
              tone={props.dataSource?.source === 'cache' ? 'warning' : 'danger'}
              title={props.dataSource?.source === 'cache' ? 'Đang xem hàng chờ đã lưu' : 'Không tải được hàng chờ'}
              body={props.dataSource?.message ?? 'Kiểm tra kết nối rồi thử lại.'}
              action={
                <Button size="compact" variant="outline" onPress={() => void props.onRefreshData?.()}>
                  Thử lại
                </Button>
              }
            />
          ) : null}

          {pending.length > 0 ? (
            <View style={styles.searchGroup}>
              <Field
                label="Tìm báo cáo"
                value={query}
                onChangeText={setQuery}
                placeholder="Tên việc, cây hoặc nhân viên"
                autoCapitalize="none"
                rightIcon={query ? 'close-circle-outline' : 'search-outline'}
                onRightIconPress={query ? () => setQuery('') : undefined}
              />
              <Text style={styles.resultLabel}>
                {visible.length}/{pending.length} báo cáo
              </Text>
            </View>
          ) : null}

          {pending.length === 0 ? (
            <EmptyState title="Không có báo cáo chờ duyệt" body="Hàng chờ nghiệm thu đang trống." />
          ) : visible.length === 0 ? (
            <EmptyState icon="search-outline" title="Không tìm thấy báo cáo" body="Thử đổi từ khóa tìm kiếm." />
          ) : null}
        </View>
      }
      renderItem={({ item: task }) => {
        const gaps = getTaskProofGaps(task);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mở báo cáo ${task.title}`}
            onPress={() => {
              props.setReviewTask(task);
              props.setActiveStep('REVIEW_DETAIL');
            }}
            style={({ pressed }) => [styles.reportRow, pressed && styles.pressed]}
          >
            <View style={styles.reportIcon}>
              <Ionicons
                name={gaps.length ? 'warning-outline' : 'shield-checkmark-outline'}
                size={21}
                color={gaps.length ? colors.warningText : colors.successText}
              />
            </View>
            <View style={styles.flex}>
              <Text numberOfLines={2} style={styles.reportTitle}>
                {task.title}
              </Text>
              <Text numberOfLines={1} style={styles.reportMeta}>
                {task.treeName} · <Text style={styles.reportAge}>{formatReviewAge(task.updatedAt)}</Text>
              </Text>
              <View style={styles.reportFooter}>
                <Text numberOfLines={1} style={[styles.reportMeta, styles.reportAssignee]}>
                  {getReviewStaffLabel(task.assignedStaffId, task.assignedStaffName, props.assignableStaff)}
                </Text>
                <Badge tone={gaps.length ? 'amber' : 'green'}>
                  {gaps.length ? `Thiếu ${gaps.length}` : `Đủ ${getTaskProofCount(task)}/5`}
                </Badge>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.pewter} />
          </Pressable>
        );
      }}
    />
  );
}

const getReworkTarget = (reason: string) => {
  const normalized = reason.toLocaleLowerCase('vi');
  if (normalized.includes('gps')) return 'GPS';
  if (normalized.includes('qr')) return 'QR';
  if (normalized.includes('checklist')) return 'CHECKLIST';
  if (normalized.includes('ảnh trước')) return 'BEFORE';
  if (normalized.includes('ảnh sau')) return 'AFTER';
  return 'EVIDENCE';
};

const getReviewStaffLabel = (
  assignedStaffId: string,
  assignedStaffName: string,
  staffCatalog: ManagerAreaProps['assignableStaff'],
) => {
  const staff = staffCatalog.find((item) => item.id === assignedStaffId);
  if (staff) {
    const displayName = staff.displayName.trim();
    return displayName && !/^staff$/i.test(displayName) ? displayName : formatActorDisplayName(staff.email);
  }
  return formatActorDisplayName(assignedStaffName);
};

const formatReviewAge = (updatedAt: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60_000));
  if (minutes < 1) return 'Vừa gửi';
  if (minutes < 60) return `Gửi ${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Gửi ${hours} giờ trước`;
  return `Gửi ${new Date(updatedAt).toLocaleDateString('vi-VN')}`;
};

function ManagerReviewDetail(props: ManagerAreaProps & { reviewTask: Task }) {
  const task = props.reviewTask;
  const gaps = getTaskProofGaps(task);
  const proofCount = getTaskProofCount(task);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setDecision(null);
    setReason('');
    setTouched(false);
    setSubmitError('');
  }, [task.id]);

  const reasonRequired =
    decision === 'REQUEST_REWORK' || decision === 'APPROVE_WITH_EXCEPTION' || decision === 'CANCEL';
  const approvalBlocked = decision === 'APPROVE' && gaps.length > 0;
  const canSubmit = Boolean(decision) && !approvalBlocked && (!reasonRequired || Boolean(reason.trim()));

  const selectDecision = (nextDecision: Decision) => {
    if (nextDecision !== decision) {
      setDecision(nextDecision);
      setReason('');
      setTouched(false);
      setSubmitError('');
    }
  };

  const submit = async () => {
    if (!decision) return;
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await props.reviewTaskDecision({
        taskId: task.id,
        expectedVersion: task.version ?? 0,
        decision,
        ...(decision === 'REQUEST_REWORK'
          ? { reworkReason: reason.trim(), targetedArea: getReworkTarget(reason) }
          : {}),
        ...(decision === 'APPROVE_WITH_EXCEPTION' ? { exceptionReason: reason.trim() } : {}),
        ...(decision === 'CANCEL' ? { notes: reason.trim() } : {}),
      });
      void props
        .createNotification({
          title:
            decision === 'REQUEST_REWORK'
              ? 'Công việc cần làm lại'
              : decision === 'CANCEL'
                ? 'Công việc đã hủy'
                : 'Báo cáo đã được xử lý',
          body: `${task.title} tại ${task.treeName} đã được quản lý cập nhật.`,
          type: decision === 'REQUEST_REWORK' || decision === 'CANCEL' ? 'warning' : 'success',
          taskId: task.id,
        })
        .catch(() => undefined);
      props.setReviewTask(null);
      props.setActiveStep('REVIEW');
    } catch {
      setSubmitError('Chưa lưu được. Dữ liệu vẫn được giữ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScreen} automaticallyAdjustKeyboardInsets>
      <ScreenHeader title="Duyệt bằng chứng" subtitle={task.title} onBack={() => props.setActiveStep('REVIEW')} />

      <Notice
        tone={gaps.length ? 'warning' : 'success'}
        title={gaps.length ? `Thiếu ${gaps.length} hạng mục` : `Đủ ${proofCount}/5 hạng mục`}
        body={gaps.length ? gaps.join(' · ') : undefined}
      />

      <View style={styles.section}>
        <SectionTitle icon="person-outline">Thông tin</SectionTitle>
        <ListRow icon="leaf-outline" title={task.treeName} subtitle={task.treeAddress} />
        <ListRow
          icon="person-outline"
          title="Người thực hiện"
          subtitle={getReviewStaffLabel(task.assignedStaffId, task.assignedStaffName, props.assignableStaff)}
        />
        <ListRow
          icon="camera-outline"
          title="Giám sát hiện trường"
          subtitle={formatActorDisplayName(
            task.supervisorName || task.assignedSupervisorName || 'Giám sát hiện trường',
          )}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle icon="navigate-outline">Xác minh hiện trường (Nhân viên)</SectionTitle>
        <VerificationRow
          label="GPS"
          value={task.gpsCheck?.verified ? `${task.gpsCheck.distance.toFixed(1)} m` : 'Chưa đạt'}
          done={Boolean(task.gpsCheck?.verified)}
        />
        <VerificationRow
          label="QR"
          value={task.qrCheck?.verified ? 'Đúng cây' : 'Chưa đạt'}
          done={Boolean(task.qrCheck?.verified)}
        />
        {task.staffCompletedAt ? (
          <VerificationRow
            label="Hoàn tất tại cây"
            value={new Date(task.staffCompletedAt).toLocaleString('vi-VN')}
            done
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionTitle icon="images-outline">Ảnh bằng chứng (Giám sát)</SectionTitle>
        {task.supervisorGpsCheck ? (
          <VerificationRow
            label="GPS giám sát"
            value={task.supervisorGpsCheck.verified ? `${task.supervisorGpsCheck.distance.toFixed(1)} m` : 'Chưa đạt'}
            done={Boolean(task.supervisorGpsCheck.verified)}
          />
        ) : null}
        <PhotoPair task={task} />
        {task.supervisorNotes ? <Text style={styles.notes}>Ghi chú giám sát: {task.supervisorNotes}</Text> : null}
      </View>

      <View style={styles.section}>
        <SectionTitle icon="checkbox-outline">Checklist</SectionTitle>
        {task.checklist.map((item, index) => (
          <ChecklistLine key={item.id} item={item} index={index} />
        ))}
        {task.notes && !task.notes.startsWith('Fixture ') ? (
          <Text style={styles.notes}>Ghi chú hiện trường: {task.notes}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionTitle icon="shield-checkmark-outline">Quyết định</SectionTitle>
        <DecisionOption
          tone="success"
          label="Duyệt nghiệm thu"
          description="Hoàn tất công việc."
          selected={decision === 'APPROVE'}
          disabled={gaps.length > 0}
          onPress={() => selectDecision('APPROVE')}
        />
        <DecisionOption
          tone="corrective"
          label="Yêu cầu làm lại"
          description="Trả phần cần sửa cho nhân viên."
          selected={decision === 'REQUEST_REWORK'}
          onPress={() => selectDecision('REQUEST_REWORK')}
        />
        <DecisionOption
          tone="exceptional"
          label="Duyệt có ngoại lệ"
          description="Chấp nhận và ghi rõ ngoại lệ."
          selected={decision === 'APPROVE_WITH_EXCEPTION'}
          onPress={() => selectDecision('APPROVE_WITH_EXCEPTION')}
        />
        <DecisionOption
          tone="destructive"
          label="Hủy công việc"
          description="Dừng công việc và ghi lý do."
          selected={decision === 'CANCEL'}
          onPress={() => selectDecision('CANCEL')}
        />

        {reasonRequired ? (
          <>
            {decision === 'REQUEST_REWORK' ? (
              <View style={styles.reasonChips}>
                {REWORK_REASONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: reason === option }}
                    key={option}
                    onPress={() => {
                      setReason(option);
                      setTouched(true);
                    }}
                    style={[styles.reasonChip, reason === option && styles.reasonChipSelected]}
                  >
                    <Text style={[styles.reasonChipText, reason === option && styles.reasonChipTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Field
              label={
                decision === 'REQUEST_REWORK'
                  ? 'Lý do và phần cần làm lại'
                  : decision === 'CANCEL'
                    ? 'Lý do hủy'
                    : 'Lý do ngoại lệ'
              }
              value={reason}
              onChangeText={(value) => {
                setReason(value);
                setTouched(true);
              }}
              placeholder="Nêu rõ bước cần xử lý"
              multiline
            />
            {!reason.trim() ? (
              <Text
                accessibilityRole={touched ? 'alert' : undefined}
                style={touched ? styles.errorText : styles.helperText}
              >
                {touched ? 'Cần nhập lý do.' : 'Nhập lý do để xác nhận.'}
              </Text>
            ) : null}
          </>
        ) : null}

        {approvalBlocked ? (
          <Notice tone="warning" title="Chưa thể duyệt" body="Bổ sung mục còn thiếu hoặc chọn quyết định khác." />
        ) : null}
        {submitError ? <Notice tone="danger" title="Chưa lưu được quyết định" body={submitError} /> : null}
        <Button loading={submitting} disabled={!canSubmit} icon="send-outline" onPress={() => void submit()}>
          Xác nhận quyết định
        </Button>
      </View>
    </ScrollView>
  );
}

function VerificationRow({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <ListRow
      icon={done ? 'checkmark-circle-outline' : 'alert-circle-outline'}
      title={label}
      subtitle={value}
      status={<Badge tone={done ? 'green' : 'amber'}>{done ? 'Đạt' : 'Thiếu'}</Badge>}
    />
  );
}

function DecisionOption({
  tone,
  label,
  description,
  selected,
  disabled,
  onPress,
}: {
  tone: DecisionTone;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.decision, selected && styles[`decisionSelected_${tone}`], disabled && styles.disabled]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={21}
        color={disabled ? colors.muted : selected ? decisionToneColor[tone] : colors.primaryDark}
      />
      <View style={styles.flex}>
        <Text style={styles.decisionTitle}>{label}</Text>
        <Text style={styles.reportMeta}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.screenPadding, paddingBottom: layout.bottomNavClearance + spacing.xl },
  detailScreen: { padding: layout.screenPadding, paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  separator: { height: spacing.md },
  searchGroup: { gap: spacing.sm },
  resultLabel: { ...typography.label, color: colors.pewter },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  reportRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconSurface,
  },
  reportTitle: { ...typography.section, color: colors.ink },
  reportFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  reportAssignee: { flex: 1 },
  reportAge: { ...typography.metadata, color: colors.pewter, marginTop: spacing.xs },
  reportMeta: { ...typography.body, color: colors.pewter, marginTop: 2 },
  section: { gap: spacing.sm },
  notes: { ...typography.body, color: colors.neutralText, paddingVertical: spacing.sm },
  decision: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.compact,
    backgroundColor: colors.card,
  },
  decisionSelected_success: { borderColor: colors.successBorder, backgroundColor: colors.successSurface },
  decisionSelected_corrective: { borderColor: colors.warningBorder, backgroundColor: colors.warningSurface },
  decisionSelected_exceptional: { borderColor: colors.infoBorder, backgroundColor: colors.infoSurface },
  decisionSelected_destructive: { borderColor: colors.criticalBorder, backgroundColor: colors.criticalSurface },
  decisionTitle: { ...typography.bodyStrong, color: colors.ink },
  disabled: { opacity: 0.48 },
  reasonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reasonChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  reasonChipSelected: { borderColor: colors.warningBorder, backgroundColor: colors.warningSurface },
  reasonChipText: { ...typography.label, color: colors.neutralText },
  reasonChipTextSelected: { color: colors.warningText },
  helperText: { ...typography.label, color: colors.neutralText },
  errorText: { ...typography.label, color: colors.criticalText },
  pressed: { opacity: 0.72 },
});
