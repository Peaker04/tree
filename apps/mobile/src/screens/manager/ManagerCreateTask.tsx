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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type {
  AssignableStaffCatalogItem,
  CanonicalCreateTaskRequest,
  CreateNotificationRequest,
  OperationalTaskTypeCatalogItem,
} from '@novyx/contracts';
import { AppNotification, Task, Tree } from '../../types';
import { BottomSheetModal, Button, Field, ScreenHeader } from '../../components/AppPrimitives';
import { DateRangePickerSheet, ShiftType } from '../../components/DateRangePickerSheet';
import { TreeScopeSelectorSheet, ScopeMode, TreeScopeItem } from '../../components/TreeScopeSelectorSheet';
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
type SelectorItem = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  initials?: string;
};

const TIME_PRESETS = TASK_DEADLINE_TIMES;
const WEEKDAYS = CALENDAR_WEEKDAYS;
const startOfDay = startOfLocalDay;
const sameDay = isSameLocalDay;
const createDefaultDeadline = createDefaultTaskDeadline;
const formatVietnameseDateTime = formatTaskDeadline;

const getStaffIdentity = (staff: AssignableStaffCatalogItem) => {
  const displayName = staff.displayName.trim();
  const usableDisplayName = displayName && !/^staff$/i.test(displayName);
  const title = usableDisplayName ? displayName : 'Nhân viên hiện trường';
  const subtitle = usableDisplayName ? staff.email : 'Đội phụ trách cây xanh';
  const initials =
    (usableDisplayName ? displayName : 'Nhân viên')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'NV';
  return { title, subtitle, initials };
};

const getTaskTypeSummary = (taskType?: OperationalTaskTypeCatalogItem) => {
  if (!taskType?.description) return 'Yêu cầu ảnh trước và sau';
  if (/manual testing/i.test(taskType.description) || /test/i.test(taskType.description)) {
    return 'Yêu cầu ảnh trước và sau';
  }
  return taskType.description;
};

const getSubmitError = (cause: unknown) => {
  const err = cause as { code?: string; status?: number; message?: string; details?: unknown };
  if (err.code === 'NETWORK_ERROR' || err.status === 0) {
    return 'Mất kết nối mạng. Dữ liệu đã nhập vẫn được giữ lại.';
  }
  if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (err.status === 403) return 'Bạn không có quyền tạo việc cho lựa chọn này.';
  if (err.status === 409) return 'Dữ liệu vừa thay đổi. Vui lòng kiểm tra lại trước khi tạo.';
  if (err.status && err.status >= 500) {
    return 'Hệ thống chưa tạo được việc. Dữ liệu vẫn được giữ.';
  }
  if (err.message && /future/i.test(err.message)) {
    return 'Hạn hoàn thành phải là thời gian trong tương lai. Vui lòng kiểm tra lại ngày và ca làm việc.';
  }
  if (err.message && !/HTTP/i.test(err.message) && !/Internal/i.test(err.message)) {
    return err.message;
  }
  return 'Chưa thể tạo việc. Vui lòng kiểm tra và thử lại.';
};

export function computeOperationalDeadline(dateStr: string, shift: ShiftType = 'full_day'): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];

  const hour = shift === 'morning' ? 11 : shift === 'afternoon' ? 17 : 18;
  const minute = shift === 'full_day' ? 0 : 30;

  const target = new Date(year, month, day, hour, minute, 0, 0);

  const now = new Date();
  const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;

  // If today and standard shift hour has already passed (e.g. creating in late evening):
  if (isToday && target.getTime() <= now.getTime()) {
    if (shift === 'full_day' && now.getHours() < 23) {
      target.setHours(23, 59, 0, 0);
    }
  }

  return target;
}

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
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string; shift?: ShiftType }>();
  const [treeScope, setTreeScope] = useState<{ mode: ScopeMode; zoneId?: string; treeIds: string[] }>();
  const [dateRangeSheetVisible, setDateRangeSheetVisible] = useState(false);
  const [treeScopeSheetVisible, setTreeScopeSheetVisible] = useState(false);
  const [selector, setSelector] = useState<SelectorKind>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const selectedTaskType = taskTypes.find((item) => item.id === taskTypeId);
  const selectedStaff = assignableStaff.find((item) => item.id === assignedStaffId);
  const selectedStaffIdentity = selectedStaff ? getStaffIdentity(selectedStaff) : undefined;
  const selectedTree = trees.find((item) => item.id === treeId);
  const catalogsReady = taskTypes.length > 0 && assignableStaff.length > 0;

  const treeScopeItems: TreeScopeItem[] = useMemo(() => {
    return trees.map((t) => ({
      id: t.id,
      code: t.id.startsWith('TRE-') && t.id.length > 10 ? `#${t.id.slice(-4).toUpperCase()}` : t.id,
      name: t.name,
      address: t.address,
      species: t.species,
      healthStatus: t.healthStatus,
    }));
  }, [trees]);

  const isDeadlineInPast = useMemo(() => {
    return Boolean(deadline && deadline.getTime() <= Date.now());
  }, [deadline]);

  const missingLabels = useMemo(() => {
    const list: string[] = [];
    if (title.trim().length < 3) list.push('tiêu đề');
    if (!deadline) list.push('thời hạn');
    else if (isDeadlineInPast) list.push('thời hạn trong tương lai');
    if (!treeId) list.push('cây mục tiêu');
    if (!assignedStaffId) list.push('người thực hiện');
    if (!taskTypeId) list.push('loại việc');
    return list;
  }, [assignedStaffId, deadline, isDeadlineInPast, taskTypeId, title, treeId]);

  const canSubmit = catalogsReady && missingLabels.length === 0 && !isDeadlineInPast && !submitting;

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
      keywords: `${taskType.name} ${taskType.description ?? ''}`,
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
        dateRange,
        scope: treeScope,
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <ScreenHeader title="Tạo việc" subtitle="Phân công nhiệm vụ chăm sóc cây xanh" />

        {/* 1. THỜI GIAN & CA LÀM VIỆC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian & ca làm việc</Text>

          {/* Quick Presets Row */}
          <View style={styles.quickPresetRow}>
            <Pressable
              accessibilityRole="button"
              style={[
                styles.quickPresetChip,
                dateRange?.startDate === dateRange?.endDate && styles.quickPresetChipActive,
              ]}
              onPress={() => {
                const now = new Date();
                const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const currentShift = dateRange?.shift || 'full_day';
                setDateRange({ startDate: dStr, endDate: dStr, shift: currentShift });
                const d = computeOperationalDeadline(dStr, currentShift);
                setDeadline(d);
                setDeadlineTouched(true);
              }}
            >
              <Text
                style={[
                  styles.quickPresetText,
                  dateRange?.startDate === dateRange?.endDate && styles.quickPresetTextActive,
                ]}
              >
                Hôm nay
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.quickPresetChip}
              onPress={() => {
                const now = new Date();
                const end = new Date();
                end.setDate(now.getDate() + 2);
                const sStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const eStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                const currentShift = dateRange?.shift || 'full_day';
                setDateRange({ startDate: sStr, endDate: eStr, shift: currentShift });
                const d = computeOperationalDeadline(eStr, currentShift);
                setDeadline(d);
                setDeadlineTouched(true);
              }}
            >
              <Text style={styles.quickPresetText}>3 ngày tới</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.quickPresetChip}
              onPress={() => {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(now);
                monday.setDate(now.getDate() + diffToMonday);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const sStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
                const eStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
                const currentShift = dateRange?.shift || 'full_day';
                setDateRange({ startDate: sStr, endDate: eStr, shift: currentShift });
                const d = computeOperationalDeadline(eStr, currentShift);
                setDeadline(d);
                setDeadlineTouched(true);
              }}
            >
              <Text style={styles.quickPresetText}>Tuần này</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={[styles.quickPresetChip, styles.quickPresetCalendarBtn]}
              onPress={() => setDateRangeSheetVisible(true)}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.quickPresetTextCalendar}>Tùy chọn ngày</Text>
            </Pressable>
          </View>

          {/* Shift Radio Chips */}
          <View style={styles.shiftSelectorRow}>
            {[
              { key: 'full_day' as const, label: 'Cả ngày', icon: 'time-outline' as const },
              { key: 'morning' as const, label: 'Ca sáng', icon: 'sunny-outline' as const },
              { key: 'afternoon' as const, label: 'Ca chiều', icon: 'partly-sunny-outline' as const },
            ].map((s) => {
              const active = (dateRange?.shift || 'full_day') === s.key;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.shiftChip, active && styles.shiftChipActive]}
                  onPress={() => {
                    const now = new Date();
                    const sStr =
                      dateRange?.startDate ||
                      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const eStr = dateRange?.endDate || sStr;
                    setDateRange({ startDate: sStr, endDate: eStr, shift: s.key });
                    const d = computeOperationalDeadline(eStr, s.key);
                    setDeadline(d);
                    setDeadlineTouched(true);
                  }}
                >
                  <Ionicons name={s.icon} size={14} color={active ? colors.snowWhite : colors.pewter} />
                  <Text style={[styles.shiftText, active && styles.shiftTextActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <SelectionField
            label="Hạn hoàn thành"
            value={
              dateRange
                ? `${dateRange.startDate.split('-').reverse().join('/')} — ${dateRange.endDate.split('-').reverse().join('/')} (${dateRange.shift === 'morning' ? 'Ca sáng' : dateRange.shift === 'afternoon' ? 'Ca chiều' : 'Cả ngày'})`
                : deadline
                  ? formatVietnameseDateTime(deadline)
                  : undefined
            }
            placeholder="Chọn ngày và giờ"
            icon="calendar-outline"
            tone={isDeadlineInPast ? 'warning' : 'info'}
            error={deadlineTouched && !deadline ? 'Chọn ngày và giờ hoàn thành.' : undefined}
            onPress={() => setDateRangeSheetVisible(true)}
          />
          {isDeadlineInPast ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              Hạn hoàn thành đã qua. Vui lòng chọn ca hoặc ngày trong tương lai.
            </Text>
          ) : null}

          <Field
            label="Tiêu đề công việc"
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTitleTouched(true)}
            placeholder="Ví dụ: Cắt tỉa cành khô định kỳ khu vực"
            maxLength={120}
          />
          {titleTouched && title.trim().length < 3 ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              Nhập ít nhất 3 ký tự.
            </Text>
          ) : null}
        </View>

        {/* 2. PHÂN CÔNG HIỆN TRƯỜNG */}
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
              value={
                treeScope?.mode === 'multi_trees'
                  ? `${treeScope.treeIds.length} cây đã chọn`
                  : treeScope?.mode === 'zone'
                    ? `Khu vực: ${treeScope.zoneId}`
                    : selectedTree?.name
              }
              detail={
                treeScope?.mode === 'multi_trees'
                  ? `Bao gồm ${selectedTree?.name || 'cây'} và ${treeScope.treeIds.length - 1} cây khác`
                  : treeScope?.mode === 'zone'
                    ? `Bao gồm toàn bộ ${treeScope.treeIds.length} cây trong khu vực`
                    : selectedTree
                      ? `${selectedTree.address} · ${selectedTree.healthStatus}`
                      : undefined
              }
              placeholder="Chọn cây"
              icon="leaf-outline"
              tone="success"
              disabled={loading || Boolean(error)}
              grouped
              error={treeTouched && !treeId ? 'Chọn cây mục tiêu.' : undefined}
              onPress={() => setTreeScopeSheetVisible(true)}
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

        {/* 3. HƯỚNG DẪN HIỆN TRƯỜNG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn hiện trường</Text>
          <Field
            label="Ghi chú cho nhân viên (không bắt buộc)"
            value={description}
            onChangeText={setDescription}
            placeholder="Lưu ý tại hiện trường hoặc yêu cầu dụng cụ..."
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* 4. TỔNG KẾT HỒ SƠ */}
        {selectedTree && selectedTaskType && selectedStaff && deadline ? (
          <View style={styles.summary}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.successText} />
              <Text style={styles.summaryTitle}>Hồ sơ đã sẵn sàng</Text>
            </View>
            <SummaryLine label="Tiêu đề" value={title.trim()} />
            <SummaryLine label="Cây mục tiêu" value={selectedTree.name} />
            <SummaryLine label="Người thực hiện" value={selectedStaffIdentity?.title ?? 'Nhân viên hiện trường'} />
            <SummaryLine label="Quy trình" value={selectedTaskType.name} />
            <SummaryLine label="Hạn chót" value={formatVietnameseDateTime(deadline)} />
          </View>
        ) : null}

        {submitError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.criticalText} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* 5. ACTION BAR TRONG LUỒNG CUỘN */}
        <View style={styles.actionBarSection}>
          <View style={styles.readinessRow}>
            <Ionicons
              name={canSubmit ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={canSubmit ? colors.successText : colors.warningText}
            />
            <Text style={[styles.readinessText, canSubmit && styles.readinessTextReady]}>
              {canSubmit ? 'Đã đủ thông tin để tạo việc' : `Còn thiếu: ${missingLabels.join(', ')}`}
            </Text>
          </View>
          <Button
            variant="forest"
            size="field"
            icon="send-outline"
            accessibilityLabel="Khởi tạo công việc"
            onPress={() => void submit()}
            disabled={!canSubmit}
            loading={submitting}
          >
            Khởi tạo công việc
          </Button>
        </View>
      </ScrollView>

      {/* MODAL: TÌM KIẾM & CHỌN MỤC TIÊU */}
      <SearchSelector
        key={selector ?? 'closed'}
        visible={Boolean(selector)}
        title={selector === 'tree' ? 'Chọn cây' : selector === 'staff' ? 'Chọn nhân viên' : 'Chọn loại công việc'}
        items={selectorItems}
        selectedId={selector === 'tree' ? treeId : selector === 'staff' ? assignedStaffId : taskTypeId}
        onSelect={chooseItem}
        onClose={closeSelector}
      />

      {/* BOTTOM SHEET: DẢI NGÀY & CA CHĂM SÓC */}
      <DateRangePickerSheet
        visible={dateRangeSheetVisible}
        onClose={() => {
          if (!deadline) setDeadlineTouched(true);
          setDateRangeSheetVisible(false);
        }}
        startDate={dateRange?.startDate}
        endDate={dateRange?.endDate}
        shift={dateRange?.shift}
        onConfirm={(range) => {
          setDateRange(range);
          const end = computeOperationalDeadline(range.endDate, range.shift || 'full_day');
          setDeadline(end);
          setDeadlineTouched(true);
          setDateRangeSheetVisible(false);
        }}
      />

      {/* BOTTOM SHEET: PHẠM VI CÂY */}
      <TreeScopeSelectorSheet
        visible={treeScopeSheetVisible}
        onClose={() => {
          if (!treeId) setTreeTouched(true);
          setTreeScopeSheetVisible(false);
        }}
        trees={treeScopeItems}
        selectedTreeId={treeId}
        selectedScope={treeScope}
        onConfirm={(scope) => {
          setTreeScope(scope);
          if (scope.treeIds.length > 0) {
            setTreeId(scope.treeIds[0]);
          }
          setTreeTouched(true);
          setTreeScopeSheetVisible(false);
        }}
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
          <Text style={value ? styles.selectionValue : styles.selectionPlaceholder} numberOfLines={1}>
            {value ?? placeholder}
          </Text>
          {detail ? (
            <Text style={styles.selectionDetail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
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

export function DateTimePickerModal({
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
      <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
        <View style={styles.selectorHeader}>
          <View style={styles.flex}>
            <Text style={styles.selectorTitle}>Thời hạn hoàn thành</Text>
            <Text style={styles.datePickerValue}>{formatVietnameseDateTime(draft)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.datePickerScrollContent}>
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
                  <Text
                    style={[styles.dayText, disabled && styles.dayTextDisabled, selected && styles.dayTextSelected]}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.subGroupHeader}>GIỜ HOÀN THÀNH</Text>
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
        </ScrollView>

        <View style={styles.modalFooterBar}>
          <Button variant="forest" size="field" onPress={() => onConfirm(draft)}>
            Xác nhận thời hạn
          </Button>
        </View>
      </SafeAreaView>
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
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={
        title.includes('cây')
          ? 'Chọn cây mục tiêu để thực hiện'
          : title.includes('nhân viên')
            ? 'Chọn người thực hiện nhiệm vụ'
            : 'Chọn quy trình kỹ thuật chuẩn hóa'
      }
      maxHeight="88%"
    >
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.pewter} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Nhập tên, số hiệu hoặc từ khóa..."
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS !== 'ios' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.pewter} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.selectorList}
        ListEmptyComponent={
          <View style={styles.emptyListWrap}>
            <Ionicons name="search-outline" size={32} color={colors.pewter} />
            <Text style={styles.supporting}>Không tìm thấy kết quả phù hợp.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [styles.resultRow, selected && styles.resultSelected, pressed && styles.pressed]}
            >
              {item.initials ? (
                <View style={[styles.avatarCircle, selected && styles.avatarCircleActive]}>
                  <Text style={[styles.avatarText, selected && styles.avatarTextActive]}>{item.initials}</Text>
                </View>
              ) : (
                <View style={styles.itemIconCircle}>
                  <Ionicons
                    name={title.includes('công việc') ? 'cut-outline' : 'leaf-outline'}
                    size={18}
                    color={colors.forestDepths}
                  />
                </View>
              )}

              <View style={styles.flex}>
                <Text style={[styles.resultTitle, selected && styles.resultTitleActive]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
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
    </BottomSheetModal>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.snowWhite,
  },
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
  subGroupHeader: {
    ...typography.metadata,
    color: colors.pewter,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
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
  actionBarSection: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  readinessText: { ...typography.label, color: colors.neutralText },
  readinessTextReady: { color: colors.successText },
  supporting: { ...typography.body, color: colors.pewter },
  pressed: { opacity: 0.72 },
  datePickerScrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
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
  modalFooterBar: {
    padding: layout.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.snowWhite,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  selectorTitle: { ...typography.title, color: colors.ink },
  closeButton: {
    width: controlSize.minimumTouchTarget,
    height: controlSize.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlSize.field,
    borderRadius: radius.control,
    backgroundColor: colors.neutralSurface,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.ink,
    padding: 0,
  },
  selectorList: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
  },
  emptyListWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
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
  resultTitleActive: { color: colors.primaryDark },
  resultSubtitle: { ...typography.label, color: colors.pewter, marginTop: 2 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: {
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  avatarTextActive: {
    color: colors.primaryDark,
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  quickPresetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  quickPresetChipActive: {
    backgroundColor: colors.forestDepths,
    borderColor: colors.forestDepths,
  },
  quickPresetText: {
    ...typography.metadata,
    color: colors.ink,
    fontWeight: '500',
  },
  quickPresetTextActive: {
    color: colors.snowWhite,
    fontWeight: '600',
  },
  quickPresetCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardWarm,
    borderColor: colors.willowGreen,
  },
  quickPresetTextCalendar: {
    ...typography.metadata,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  shiftSelectorRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
  },
  shiftChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.control,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  shiftChipActive: {
    backgroundColor: colors.forestDepths,
    borderColor: colors.forestDepths,
  },
  shiftText: {
    ...typography.metadata,
    color: colors.ink,
    fontWeight: '500',
  },
  shiftTextActive: {
    color: colors.snowWhite,
    fontWeight: '600',
  },
});
