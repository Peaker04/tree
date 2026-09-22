import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  BrandMark,
  Button,
  Card,
  EmptyState,
  Field,
  
  SectionTitle,
} from '../../components/AppPrimitives';
import { ChecklistLine } from '../../components/presentation/TaskSurfaces';
import { TreeIdentityVisual } from '../../components/presentation/TreeIdentityVisual';
import { filterTrees } from '../../domain/mobileWorkflow';
import { colors, radius, spacing } from '../../theme/tokens';
import { Task, TaskStatus, type Tree } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

const TASK_TYPE_OPTIONS: {
  id: Task['taskType'];
  label: string;
  checklist: string[];
}[] = [
  {
    id: 'Tưới nước',
    label: 'Tưới nước',
    checklist: [
      'Kiểm tra độ ẩm gốc bồn cây trước khi tưới',
      'Tưới đủ lượng nước 50L - 100L quanh gốc',
      'Nhặt sạch rác thải và cỏ dại quanh bồn',
    ],
  },
  {
    id: 'Cắt tỉa cành',
    label: 'Cắt tỉa',
    checklist: [
      'Khoanh vùng an toàn trước khi cắt tỉa',
      'Cắt tỉa cành khô hoặc che khuất lối đi',
      'Thu gom cành lá và chụp ảnh sau xử lý',
    ],
  },
  {
    id: 'Kiểm tra sâu bệnh',
    label: 'Sâu bệnh',
    checklist: [
      'Kiểm tra thân, lá và gốc cây có dấu hiệu sâu bệnh',
      'Ghi nhận vùng bất thường bằng ảnh hiện trường',
      'Đề xuất xử lý hoặc phun thuốc nếu cần',
    ],
  },
  {
    id: 'Bón phân',
    label: 'Bón phân',
    checklist: [
      'Xới nhẹ đất quanh gốc trước khi bón',
      'Bón đúng lượng phân theo hướng dẫn chăm sóc',
      'Tưới bổ sung sau khi bón phân',
    ],
  },
];

export function ManagerCreateTask(props: ManagerAreaProps) {
  const defaultTree = props.trees[0];
  const defaultStaff = props.staff[0];
  const [title, setTitle] = useState(defaultTree ? `Tưới nước - ${defaultTree.name}` : '');
  const [treeId, setTreeId] = useState(defaultTree?.id ?? '');
  const [staffId, setStaffId] = useState(defaultStaff?.id ?? '');
  const [taskType, setTaskType] = useState<Task['taskType']>('Tưới nước');
  const [deadline, setDeadline] = useState('2026-07-15');
  const [instruction, setInstruction] = useState('Ưu tiên hoàn thành trong ca sáng, chụp rõ trước và sau khi xử lý.');
  const [treeQuery, setTreeQuery] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedTree = props.trees.find((tree) => tree.id === treeId) ?? defaultTree;
  const selectedStaff = props.staff.find((staff) => staff.id === staffId) ?? defaultStaff;
  const selectedTaskType = TASK_TYPE_OPTIONS.find((option) => option.id === taskType) ?? TASK_TYPE_OPTIONS[0];
  const visibleTrees = filterTrees(props.trees, treeQuery, 'all');
  const deadlineTime = new Date(deadline.trim()).getTime();
  const deadlineInvalid = !deadline.trim() || Number.isNaN(deadlineTime);
  const validation = {
    title: !title.trim() ? 'Cần nhập tiêu đề công việc.' : '',
    tree: !selectedTree ? 'Cần chọn cây mục tiêu.' : '',
    staff: !selectedStaff ? 'Cần chọn nhân viên phụ trách.' : '',
    taskType: !selectedTaskType ? 'Cần chọn loại tác nghiệp.' : '',
    deadline: deadlineInvalid ? 'Hạn hoàn thành cần đúng định dạng ngày, ví dụ 2026-07-15.' : '',
  };
  const invalid = Object.values(validation).some(Boolean);
  const checklist = useMemo(
    () =>
      selectedTaskType.checklist.map((text, index) => ({
        id: `${taskType}-${index + 1}`,
        text,
        done: false,
      })),
    [selectedTaskType.checklist, taskType],
  );
  const deadlineDate = deadlineInvalid
    ? deadline || 'Chưa có hạn'
    : new Date(deadline.trim()).toLocaleDateString('vi-VN');

  const handleCreateTask = async () => {
    setSubmitted(true);
    if (invalid || !selectedTree || !selectedStaff) return;

    setCreatingTask(true);
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      taskType,
      description: instruction.trim()
        ? instruction.trim()
        : `Thực hiện nghiệp vụ ${taskType.toLowerCase()} cho ${selectedTree.name}.`,
      treeId: selectedTree.id,
      treeName: selectedTree.name,
      treeAddress: selectedTree.address,
      assignedStaffId: selectedStaff.id,
      assignedStaffName: selectedStaff.name,
      deadline: deadline.trim(),
      status: TaskStatus.PENDING,
      checklist,
      createdAt: now,
      updatedAt: now,
    };
    const savedTask = await props.createTask(
      {
        title: newTask.title,
        taskType: newTask.taskType,
        description: newTask.description,
        treeId: newTask.treeId,
        assignedStaffId: selectedStaff.id,
        deadline: newTask.deadline,
        checklist,
      },
      newTask,
    );
    await props.createNotification({
      title: 'Công việc mới được phân công',
      body: `Bạn được giao việc "${savedTask.title}" tại ${selectedTree.name}, hạn ${new Date(
        savedTask.deadline,
      ).toLocaleDateString('vi-VN')}.`,
      type: 'info',
      taskId: savedTask.id,
    });
    setCreatingTask(false);
    props.setActiveStep('HOME');
  };

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Tạo công việc mới" subtitle="Giao việc cho nhân viên hiện trường" />
      <Card tone="green">
        <View style={styles.heroContentRow}>
          <View style={styles.flex}>
            <BrandMark compact />
            <Text style={styles.lightHeroTitle}>Giao việc ngoài hiện trường</Text>
            <Text style={styles.lightHeroBody}>
              Chọn cây, nhân viên, loại tác nghiệp và checklist để tạo nhiệm vụ có đủ QR, GPS và ảnh nghiệm thu.
            </Text>
          </View>
          <TreeIdentityVisual tree={selectedTree ?? fallbackTree} compact />
        </View>
      </Card>

      {submitted && invalid ? (
        <Card tone="danger" style={styles.alertRow}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.alertText}>Vui lòng hoàn thiện các trường bắt buộc trước khi tạo việc.</Text>
        </Card>
      ) : null}

      <Card tone="soft" style={styles.createPreviewCard}>
        <SectionTitle icon="reader-outline">Bản nháp phân công</SectionTitle>
        <Text style={styles.itemTitle}>{title || 'Chưa có tiêu đề'}</Text>
        <Text style={styles.bodyText}>
          {selectedTree?.name ?? 'Chưa chọn cây'} | {selectedStaff?.name ?? 'Chưa chọn nhân viên'} | hạn {deadlineDate}
        </Text>
        <View style={styles.createStepRow}>
          <PreviewPill icon="leaf-outline" text={selectedTree ? 'Cây' : 'Thiếu cây'} valid={Boolean(selectedTree)} />
          <PreviewPill icon="person-outline" text={selectedStaff?.id ?? 'Thiếu NV'} valid={Boolean(selectedStaff)} />
          <PreviewPill icon="checkbox-outline" text={`${checklist.length} mục`} valid={Boolean(selectedTaskType)} />
        </View>
      </Card>

      <Card style={styles.createSectionCard}>
        <SectionTitle icon="create-outline">Nội dung công việc</SectionTitle>
        <Field label="Tiêu đề công việc" value={title} onChangeText={setTitle} />
        {submitted && validation.title ? <Text style={styles.alertText}>{validation.title}</Text> : null}
        <Field label="Hạn hoàn thành" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />
        {submitted && validation.deadline ? <Text style={styles.alertText}>{validation.deadline}</Text> : null}
        <Field
          label="Hướng dẫn chăm sóc"
          value={instruction}
          onChangeText={setInstruction}
          placeholder="Ghi chú cho nhân viên hiện trường"
          multiline
          style={styles.multilineInput}
        />
      </Card>

      <Card style={styles.createSectionCard}>
        <SectionTitle icon="construct-outline">Loại tác nghiệp</SectionTitle>
        <View style={styles.chips}>
          {TASK_TYPE_OPTIONS.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chọn loại tác nghiệp ${option.label}`}
              accessibilityState={{ selected: taskType === option.id }}
              key={option.id}
              onPress={() => {
                setTaskType(option.id);
                setTitle(`${option.label} - ${selectedTree?.name ?? 'cây xanh'}`);
              }}
              style={[styles.chip, taskType === option.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, taskType === option.id && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.createSectionCard}>
        <SectionTitle icon="leaf-outline">Chọn cây mục tiêu</SectionTitle>
        <Field
          label="Tìm cây"
          value={treeQuery}
          onChangeText={setTreeQuery}
          placeholder="ID, tên cây, QR, vị trí..."
          autoCapitalize="none"
          rightIcon={treeQuery ? 'close-circle-outline' : 'search-outline'}
          onRightIconPress={treeQuery ? () => setTreeQuery('') : undefined}
        />
        {submitted && validation.tree ? <Text style={styles.alertText}>{validation.tree}</Text> : null}
        {visibleTrees.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy cây"
            body="Thử tìm bằng mã cây, QR hoặc khu vực khác."
          />
        ) : (
          visibleTrees.map((tree) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chọn cây ${tree.name}`}
              accessibilityState={{ selected: treeId === tree.id }}
              key={tree.id}
              style={[styles.selectRow, treeId === tree.id && styles.selectRowActive]}
              onPress={() => {
                setTreeId(tree.id);
                setTitle(`${selectedTaskType.label} - ${tree.name}`);
              }}
            >
              <Ionicons
                name={treeId === tree.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={colors.primary}
              />
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{tree.name}</Text>
                <Text style={styles.itemSub}>{tree.address}</Text>
                <Text style={styles.monoSmall}>QR: {tree.qrCode}</Text>
              </View>
              <Badge
                tone={
                  tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green'
                }
              >
                {tree.healthStatus}
              </Badge>
            </Pressable>
          ))
        )}
      </Card>

      <Card style={styles.createSectionCard}>
        <SectionTitle icon="people-outline">Người phụ trách</SectionTitle>
        {submitted && validation.staff ? <Text style={styles.alertText}>{validation.staff}</Text> : null}
        {props.staff.map((staff) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chọn nhân viên ${staff.name}`}
            accessibilityState={{ selected: staffId === staff.id }}
            key={staff.id}
            style={[styles.selectRow, staffId === staff.id && styles.selectRowActive]}
            onPress={() => setStaffId(staff.id)}
          >
            <Ionicons
              name={staffId === staff.id ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={colors.primary}
            />
            <View style={styles.flex}>
              <Text style={styles.itemTitle}>{staff.name}</Text>
              <Text style={styles.itemSub}>{staff.email}</Text>
            </View>
            <Badge tone={staff.workload > 4 ? 'amber' : 'green'}>{staff.workload} việc</Badge>
          </Pressable>
        ))}
      </Card>

      <Card tone="green" style={styles.createSectionCard}>
        <SectionTitle icon="checkbox-outline">Checklist sẽ giao</SectionTitle>
        {checklist.map((item, index) => (
          <ChecklistLine key={item.id} index={index} item={item} />
        ))}
      </Card>

      <Button
        icon="checkmark-done-outline"
        disabled={invalid || creatingTask}
        loading={creatingTask}
        onPress={handleCreateTask}
      >
        {creatingTask ? 'Đang giao việc...' : 'Tạo việc'}
      </Button>
    </ScrollView>
  );
}

const fallbackTree: Tree = {
  id: 'TRE-DEMO',
  name: 'Cây NOVYX mẫu',
  species: 'GreenOps demo',
  lat: 0,
  lng: 0,
  address: 'Khu vực demo',
  qrCode: 'NOVYX-TRE-DEMO',
  healthStatus: 'Khỏe mạnh',
  riskStatus: 'healthy',
  ageYears: 1,
};

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PreviewPill({
  icon,
  text,
  valid,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  valid: boolean;
}) {
  return (
    <View style={[styles.createStepPill, !valid && styles.createStepPillInvalid]}>
      <Ionicons name={icon} size={13} color={valid ? colors.primaryDark : colors.danger} />
      <Text style={[styles.createStepText, !valid && styles.createStepTextInvalid]}>{text}</Text>
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
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '600',
  },
  headerSub: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lightHeroTitle: {
    color: colors.forest,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    marginTop: 12,
  },
  lightHeroBody: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  createPreviewCard: {
    gap: 10,
  },
  createSectionCard: {
    gap: 12,
  },
  createStepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  createStepPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createStepPillInvalid: {
    borderColor: '#fecdd3',
    backgroundColor: colors.dangerSoft,
  },
  createStepText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '500',
  },
  createStepTextInvalid: {
    color: colors.danger,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  chipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.amber,
  },
  selectRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    minHeight: 52,
    paddingVertical: 10,
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  selectRowActive: {
    backgroundColor: colors.primarySoft,
  },
  multilineInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
});
