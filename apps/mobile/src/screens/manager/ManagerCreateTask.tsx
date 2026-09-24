import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type {
  AssignableStaffCatalogItem,
  CanonicalCreateTaskRequest,
  CreateNotificationRequest,
  OperationalTaskTypeCatalogItem,
} from '@novyx/contracts';
import { AppNotification, Task, Tree } from '../../types';
import { ActionBar, Button, Field, ScreenHeader } from '../../components/AppPrimitives';
import { colors, controlSize, layout, radius, spacing, typography } from '../../theme/tokens';
import { ManagerStep } from './ManagerArea';
import {
  CALENDAR_WEEKDAYS,
  TASK_DEADLINE_TIMES,
  createCalendarCells,
  createDefaultTaskDeadline,
  formatTaskDeadline,
  isSameLocalDay,
  isTaskDeadlineDateSelectable,
  startOfLocalDay,
} from '../../domain/taskDeadline';

export type ManagerCreateTaskProps = {
  trees: Tree[];
  taskTypes: OperationalTaskTypeCatalogItem[];
  assignableStaff: AssignableStaffCatalogItem[];
  loading: boolean;
  error?: string;
  onRetryCatalogs: () => Promise<void>;
  setActiveStep: (step: ManagerStep) => void;
  createTask: (request: CanonicalCreateTaskRequest) => Promise<Task>;
  createNotification: (input: CreateNotificationRequest) => Promise<AppNotification>;
};

type SelectorKind = 'tree' | 'staff' | 'taskType';
type SelectorItem = { id: string; title: string; subtitle: string; keywords: string };

const TIME_PRESETS = TASK_DEADLINE_TIMES;
const WEEKDAYS = CALENDAR_WEEKDAYS;
const startOfDay = startOfLocalDay;
const sameDay = isSameLocalDay;
const createDefaultDeadline = createDefaultTaskDeadline;
const formatVietnameseDateTime = formatTaskDeadline;

const getStaffIdentity = (staff: AssignableStaffCatalogItem) => {
  const displayName = staff.displayName.trim();
  const usableDisplayName = displayName && !/^staff$/i.test(displayName);
  return usableDisplayName
    ? { title: displayName, subtitle: staff.email }
    : { title: staff.email, subtitle: 'Nhân viên đang hoạt động' };
};

const getTaskTypeSummary = (_taskType?: OperationalTaskTypeCatalogItem) => 'Yêu cầu ảnh trước và sau';

const getSubmitError = (cause: unknown) => {
  const error = cause as { code?: string; status?: number; message?: string };
  if (error.code === 'NETWORK_ERROR' || error.status === 0) {
    return 'Mất kết nối. Dữ liệu đã nhập vẫn được giữ.';
  }
  if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (error.status === 403) return 'Bạn không có quyền tạo việc cho lựa chọn này.';
  if (error.status === 409) return 'Dữ liệu vừa thay đổi. Kiểm tra lại trước khi tạo.';
  if (error.status && error.status >= 500) {
    return 'Chưa tạo được việc. Dữ liệu vẫn được giữ.';
  }
  return 'Chưa tạo được việc. Kiểm tra và thử lại.';
};

export function ManagerCreateTask({
  trees,
  taskTypes,
  assignableStaff,
  loading,
  error,
  onRetryCatalogs,
  setActiveStep,
  createTask,
  createNotification,
}: ManagerCreateTaskProps) {
  const [treeId, setTreeId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [treeTouched, setTreeTouched] = useState(false);
  const [staffTouched, setStaffTouched] = useState(false);
  const [taskTypeTouched, setTaskTypeTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [deadlinePickerVisible, setDeadlinePickerVisible] = useState(false);
  const [selector, setSelector] = useState<SelectorKind>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const selectedTaskType = taskTypes.find((item) => item.id === taskTypeId);
  const selectedStaff = assignableStaff.find((item) => item.id === assignedStaffId);
  const selectedStaffIdentity = selectedStaff ? getStaffIdentity(selectedStaff) : undefined;
  const selectedTree = trees.find((item) => item.id === treeId);
  const catalogsReady = taskTypes.length > 0 && assignableStaff.length > 0;
  const missingCount = [
    title.trim().length >= 3,
    Boolean(deadline),
    Boolean(treeId),
    Boolean(assignedStaffId),
    Boolean(taskTypeId),
  ].filter((ready) => !ready).length;
  const canSubmit = Boolean(
    catalogsReady && treeId && taskTypeId && assignedStaffId && title.trim().length >= 3 && deadline && !submitting,
  );

  const selectorItems = useMemo<SelectorItem[]>(() => {
    if (selector === 'tree') {
      return trees.map((tree) => ({
        id: tree.id,
        title: tree.name,
        subtitle: `${tree.address} · ${tree.healthStatus}`,
        keywords: `${tree.name} ${tree.address} ${tree.species} ${tree.healthStatus} ${tree.id}`,
      }));
    }
    if (selector === 'staff') {
      return assignableStaff.map((staff) => ({
        id: staff.id,
        ...getStaffIdentity(staff),
        keywords: `${staff.email} ${staff.displayName}`,
      }));
    }
    return taskTypes.map((taskType) => ({
      id: taskType.id,
      title: taskType.name,
      subtitle: getTaskTypeSummary(taskType),
      keywords: taskType.name,
    }));
  }, [assignableStaff, selector, taskTypes, trees]);

  const chooseItem = (id: string) => {
    if (selector === 'tree') {
      setTreeId(id);
      setTreeTouched(true);
    }
    if (selector === 'staff') {
      setAssignedStaffId(id);
      setStaffTouched(true);
    }
    if (selector === 'taskType') {
      setTaskTypeId(id);
      setTaskTypeTouched(true);
    }
    setSelector(undefined);
  };

  const closeSelector = () => {
    if (selector === 'tree' && !treeId) setTreeTouched(true);
    if (selector === 'staff' && !assignedStaffId) setStaffTouched(true);
    if (selector === 'taskType' && !taskTypeId) setTaskTypeTouched(true);
    setSelector(undefined);
  };

  const submit = async () => {
    if (!canSubmit || !deadline) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await createTask({
        title: title.trim(),
        taskTypeId,
        description: description.trim(),
        treeId,
        assignedStaffId,
        deadline: deadline.toISOString(),
      });
      void createNotification({
        title: 'Đã tạo việc',
        body: `${title.trim()} đã được giao cho ${selectedStaffIdentity?.title ?? 'nhân viên'}.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      }).catch(() => undefined);
      setActiveStep('HOME');
    } catch (cause) {
      setSubmitError(getSubmitError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <ScreenHeader title="Tạo việc" subtitle="Giao một nhiệm vụ có bằng chứng" />

        <View style={styles.section}>
          <Field
            label="Tiêu đề công việc"
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTitleTouched(true)}
            placeholder="Ví dụ: Cắt tỉa cành khô"
            maxLength={120}
          />
          {titleTouched && title.trim().length < 3 ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              Nhập ít nhất 3 ký tự.
            </Text>
          ) : null}
          <SelectionField
            label="Hạn hoàn thành"
            value={deadline ? formatVietnameseDateTime(deadline) : undefined}
            placeholder="Chọn ngày và giờ"
            icon="calendar-outline"
            tone="info"
            error={deadlineTouched && !deadline ? 'Chọn ngày và giờ hoàn thành.' : undefined}
            onPress={() => setDeadlinePickerVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Phân công</Text>
            {loading ? <Text style={styles.sectionStatus}>Đang tải…</Text> : null}
          </View>

          {error ? (
            <View style={styles.catalogError}>
              <Ionicons name="cloud-offline-outline" size={20} color={colors.criticalText} />
              <View style={styles.flex}>
                <Text style={styles.catalogErrorTitle}>Chưa tải được danh mục</Text>
                <Text style={styles.catalogErrorText}>Kiểm tra kết nối rồi thử lại.</Text>
              </View>
              <Button size="compact" variant="outline" onPress={() => void onRetryCatalogs()}>
                Thử lại
              </Button>
            </View>
          ) : null}

          <View style={styles.assignmentGroup}>
            <SelectionField
              label="Cây mục tiêu"
              value={selectedTree?.name}
              detail={selectedTree ? `${selectedTree.address} · ${selectedTree.healthStatus}` : undefined}
              placeholder="Chọn cây"
              icon="leaf-outline"
              tone="success"
              disabled={loading || Boolean(error)}
              grouped
              error={treeTouched && !treeId ? 'Chọn cây mục tiêu.' : undefined}
              onPress={() => setSelector('tree')}
            />
            <View style={styles.groupDivider} />
            <SelectionField
              label="Người thực hiện"
              value={selectedStaffIdentity?.title}
              detail={selectedStaffIdentity?.subtitle}
              placeholder="Chọn nhân viên"
              icon="person-outline"
              tone="info"
              disabled={loading || Boolean(error)}
              grouped
              error={staffTouched && !assignedStaffId ? 'Chọn người thực hiện.' : undefined}
              onPress={() => setSelector('staff')}
            />
            <View style={styles.groupDivider} />
            <SelectionField
              label="Loại công việc"
              value={selectedTaskType?.name}
              detail={selectedTaskType ? getTaskTypeSummary(selectedTaskType) : undefined}
              placeholder="Chọn loại công việc"
              icon="cut-outline"
              tone="warning"
              disabled={loading || Boolean(error)}
              grouped
              error={taskTypeTouched && !taskTypeId ? 'Chọn loại công việc.' : undefined}
              onPress={() => setSelector('taskType')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Field
            label="Ghi chú cho nhân viên (không bắt buộc)"
            value={description}
            onChangeText={setDescription}
            placeholder="Lưu ý tại hiện trường"
            multiline
            maxLength={1000}
          />
        </View>

        {selectedTree && selectedTaskType && selectedStaff && deadline ? (
          <View style={styles.summary}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.successText} />
              <Text style={styles.summaryTitle}>Sẵn sàng tạo việc</Text>
            </View>
            <SummaryLine label="Cây" value={selectedTree.name} />
            <SummaryLine label="Nhân viên" value={selectedStaffIdentity?.title ?? selectedStaff.email} />
            <SummaryLine label="Loại việc" value={selectedTaskType.name} />
            <SummaryLine label="Hạn" value={formatVietnameseDateTime(deadline)} />
          </View>
        ) : null}

        {submitError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.criticalText} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <ActionBar>
          <View style={styles.readinessRow}>
            <Ionicons
              name={canSubmit ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={canSubmit ? colors.successText : colors.neutralText}
            />
            <Text style={[styles.readinessText, canSubmit && styles.readinessTextReady]}>
              {canSubmit ? 'Đã đủ thông tin' : `Còn ${missingCount} mục bắt buộc`}
            </Text>
          </View>
          <Button
            variant="forest"
            size="field"
            icon="send-outline"
            accessibilityLabel="Tạo công việc"
            onPress={() => void submit()}
            disabled={!canSubmit}
            loading={submitting}
          >
            Tạo việc
          </Button>
        </ActionBar>
      </ScrollView>

      <DateTimePickerModal
        key={`${deadlinePickerVisible}-${deadline?.toISOString() ?? 'new'}`}
        visible={deadlinePickerVisible}
        value={deadline}
        onClose={() => {
          if (!deadline) setDeadlineTouched(true);
          setDeadlinePickerVisible(false);
        }}
        onConfirm={(value) => {
          setDeadline(value);
          setDeadlineTouched(true);
          setDeadlinePickerVisible(false);
        }}
      />

      <SearchSelector
        key={selector ?? 'closed'}
        visible={Boolean(selector)}
        title={selector === 'tree' ? 'Chọn cây' : selector === 'staff' ? 'Chọn nhân viên' : 'Chọn loại công việc'}
        items={selectorItems}
        selectedId={selector === 'tree' ? treeId : selector === 'staff' ? assignedStaffId : taskTypeId}
        onSelect={chooseItem}
        onClose={closeSelector}
      />
    </KeyboardAvoidingView>
  );
}

function SelectionField({
  label,
  value,
  detail,
  placeholder,
  icon,
  tone = 'neutral',
  disabled,
  grouped,
  error,
  onPress,
}: {
  label: string;
  value?: string;
  detail?: string;
  placeholder: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  tone?: 'success' | 'info' | 'warning' | 'neutral';
  disabled?: boolean;
  grouped?: boolean;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.selectionFieldGroup, grouped && styles.selectionFieldGroupGrouped]}>
      {!grouped ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? 'chưa chọn'}`}
        accessibilityHint="Mở danh sách để chọn hoặc thay đổi"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.selectionField,
          grouped && styles.selectionFieldGrouped,
          disabled && styles.selectionFieldDisabled,
          error && styles.selectionFieldInvalid,
          pressed && styles.pressed,
        ]}
      >
        {icon ? (
          <View
            style={[
              styles.selectionIcon,
              tone === 'success'
                ? styles.selectionIconSuccess
                : tone === 'info'
                  ? styles.selectionIconInfo
                  : tone === 'warning'
                    ? styles.selectionIconWarning
                    : styles.selectionIconNeutral,
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={
                tone === 'success'
                  ? colors.successText
                  : tone === 'info'
                    ? colors.infoText
                    : tone === 'warning'
                      ? colors.warningText
                      : colors.neutralText
              }
            />
          </View>
        ) : null}
        <View style={styles.flex}>
          {grouped ? <Text style={styles.groupedFieldLabel}>{label}</Text> : null}
          <Text style={value ? styles.selectionValue : styles.selectionPlaceholder}>{value ?? placeholder}</Text>
          {detail ? <Text style={styles.selectionDetail}>{detail}</Text> : null}
          {error ? (
            <Text accessibilityRole="alert" style={styles.selectionError}>
              {error}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.pewter} />
      </Pressable>
    </View>
  );
}

function DateTimePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  value?: Date;
  onClose: () => void;
  onConfirm: (value: Date) => void;
}) {
  const initial = value ?? createDefaultDeadline();
  const [draft, setDraft] = useState(initial);
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const cells = createCalendarCells(month);
  const today = startOfDay(new Date());
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrevious = month > currentMonth;
  const selectedTime = `${String(draft.getHours()).padStart(2, '0')}:00`;

  const chooseDate = (date: Date) => {
    const next = new Date(date);
    next.setHours(draft.getHours(), 0, 0, 0);
    setDraft(next);
  };
  const chooseTime = (time: string) => {
    const [hour] = time.split(':').map(Number);
    const next = new Date(draft);
    next.setHours(hour, 0, 0, 0);
    setDraft(next);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.datePickerPage}>
        <View style={styles.selectorHeader}>
          <View>
            <Text style={styles.selectorTitle}>Chọn hạn hoàn thành</Text>
            <Text style={styles.datePickerValue}>{formatVietnameseDateTime(draft)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.monthHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tháng trước"
            disabled={!canGoPrevious}
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            style={[styles.monthButton, !canGoPrevious && styles.monthButtonDisabled]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthTitle}>
            Tháng {month.getMonth() + 1}, {month.getFullYear()}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tháng sau"
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.calendarGrid}>
          {WEEKDAYS.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
          {cells.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const disabled = !isTaskDeadlineDateSelectable(date);
            const selected = sameDay(date, draft);
            return (
              <Pressable
                key={date.toISOString()}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => chooseDate(date)}
                style={[styles.dayCell, selected && styles.dayCellSelected]}
              >
                <Text style={[styles.dayText, disabled && styles.dayTextDisabled, selected && styles.dayTextSelected]}>
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Giờ hoàn thành</Text>
        <View style={styles.timeGrid}>
          {TIME_PRESETS.map((time) => (
            <Pressable
              key={time}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedTime === time }}
              onPress={() => chooseTime(time)}
              style={[styles.timeOption, selectedTime === time && styles.timeOptionSelected]}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.timeTextSelected]}>{time}</Text>
            </Pressable>
          ))}
        </View>

        <Button variant="forest" size="field" onPress={() => onConfirm(draft)}>
          Xác nhận thời hạn
        </Button>
      </View>
    </Modal>
  );
}

function SearchSelector({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: SelectorItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) =>
    item.keywords.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.selectorPage}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <Field label="Tìm kiếm" value={query} onChangeText={setQuery} placeholder="Nhập tên hoặc thông tin liên quan" />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.selectorList}
          ListEmptyComponent={<Text style={styles.supporting}>Không tìm thấy kết quả phù hợp.</Text>}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(item.id)}
                style={({ pressed }) => [
                  styles.resultRow,
                  selected && styles.resultSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flex}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'chevron-forward'}
                  size={22}
                  color={selected ? colors.primaryDark : colors.pewter}
                />
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: layout.bottomNavClearance + spacing.xxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.md, marginBottom: spacing.sm },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.section, color: colors.ink },
  sectionStatus: { ...typography.label, color: colors.infoText },
  fieldLabel: { ...typography.label, color: colors.ink },
  fieldError: { ...typography.label, color: colors.warningText, marginTop: -spacing.sm },
  selectionIcon: {
    width: controlSize.minimumTouchTarget,
    height: controlSize.minimumTouchTarget,
    borderRadius: radius.compact,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSurface,
  },
  selectionIconSuccess: { backgroundColor: colors.successSurface },
  selectionIconInfo: { backgroundColor: colors.infoSurface },
  selectionIconWarning: { backgroundColor: colors.warningSurface },
  selectionIconNeutral: { backgroundColor: colors.neutralSurface },
  selectionFieldGroup: { gap: spacing.sm },
  selectionFieldGroupGrouped: { gap: 0 },
  groupedFieldLabel: { ...typography.metadata, color: colors.pewter, marginBottom: 2 },
  selectionField: {
    minHeight: controlSize.field,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.control,
    backgroundColor: colors.card,
  },
  selectionFieldGrouped: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  selectionFieldDisabled: { opacity: 0.45 },
  selectionFieldInvalid: { backgroundColor: colors.warningSurface },
  assignmentGroup: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  groupDivider: { height: 1, backgroundColor: colors.hairlineBorder },
  catalogError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.compact,
    backgroundColor: colors.criticalSurface,
    borderWidth: 1,
    borderColor: colors.criticalBorder,
  },
  catalogErrorTitle: { ...typography.bodyStrong, color: colors.criticalText },
  catalogErrorText: { ...typography.label, color: colors.neutralText },
  selectionValue: { ...typography.bodyStrong, color: colors.ink },
  selectionPlaceholder: { ...typography.body, color: colors.pewter },
  selectionDetail: { ...typography.metadata, color: colors.pewter, marginTop: 2 },
  selectionError: { ...typography.metadata, color: colors.warningText, marginTop: 2 },
  summary: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.card,
    backgroundColor: colors.successSurface,
    marginBottom: spacing.sm,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryTitle: { ...typography.section, color: colors.ink, marginBottom: spacing.xs },
  summaryLine: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  summaryLabel: { ...typography.body, color: colors.pewter },
  summaryValue: { ...typography.bodyStrong, color: colors.ink, flex: 1, textAlign: 'right' },
  errorBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: radius.compact,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.body, color: colors.criticalText, flex: 1 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  readinessText: { ...typography.label, color: colors.neutralText },
  readinessTextReady: { color: colors.successText },
  supporting: { ...typography.body, color: colors.pewter },
  pressed: { opacity: 0.72 },
  datePickerPage: {
    flex: 1,
    backgroundColor: colors.snowWhite,
    padding: layout.screenPadding,
    gap: spacing.xl,
  },
  datePickerValue: { ...typography.bodyStrong, color: colors.primaryDark, marginTop: spacing.xs },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: {
    width: controlSize.minimumTouchTarget,
    height: controlSize.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.warmStone,
  },
  monthButtonDisabled: { opacity: 0.35 },
  monthTitle: { ...typography.section, color: colors.ink },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
    ...typography.label,
    color: colors.pewter,
    paddingVertical: spacing.sm,
  },
  dayCell: {
    width: '14.285%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  dayCellSelected: { backgroundColor: colors.forestDepths },
  dayText: { ...typography.bodyStrong, color: colors.ink },
  dayTextDisabled: { color: colors.muted },
  dayTextSelected: { color: colors.snowWhite },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeOption: {
    minWidth: 72,
    minHeight: controlSize.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
  },
  timeOptionSelected: { borderColor: colors.successBorder, backgroundColor: colors.successSurface },
  timeText: { ...typography.bodyStrong, color: colors.neutralText },
  timeTextSelected: { color: colors.successText },
  selectorPage: { flex: 1, backgroundColor: colors.snowWhite, padding: layout.screenPadding, gap: spacing.lg },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorTitle: { ...typography.title, color: colors.ink },
  closeButton: {
    width: controlSize.minimumTouchTarget,
    height: controlSize.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorList: { gap: spacing.sm, paddingBottom: spacing.xxl },
  resultRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.compact,
    backgroundColor: colors.card,
  },
  resultSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  resultTitle: { ...typography.bodyStrong, color: colors.ink },
  resultSubtitle: { ...typography.label, color: colors.pewter, marginTop: 2 },
});
