import { useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, EmptyState, Field, Notice, ScreenHeader, SectionTitle } from '../../components/AppPrimitives';
import { DevicePermissionState } from '../../components/DevicePermissionState';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';
import { openDeviceSettings } from '../../services/devicePermissions';
import { filterTrees, formatTreeAge, getTaskStatusMeta } from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { TaskStatus, type CareHistory, type Task, type Tree } from '../../types';
import type { TreeFilter } from '../../domain/mobileWorkflow';
import { TreeQrModal } from '../../components/presentation/TreeQrModal';
import { TreeSearchFilters } from '../../components/presentation/TreeSurfaces';
import type { TreeHealthStatus } from '@novyx/contracts';
import type { ManagerAreaProps } from './ManagerArea';

export function ManagerTrees(props: ManagerAreaProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TreeFilter>('all');
  const [expandedTreeId, setExpandedTreeId] = useState<string | null>(null);
  const [historyLoadingTreeId, setHistoryLoadingTreeId] = useState<string | null>(null);
  const [historyErrorTreeId, setHistoryErrorTreeId] = useState<string | null>(null);
  const [addingTree, setAddingTree] = useState(false);
  const [treeName, setTreeName] = useState('');
  const [species, setSpecies] = useState('');
  const [address, setAddress] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [customSpecies, setCustomSpecies] = useState(false);
  const [healthStatus, setHealthStatus] = useState<TreeHealthStatus | null>(null);
  const [qrTree, setQrTree] = useState<Tree | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    capturedAt: Date;
  } | null>(null);
  const [treeMutation, setTreeMutation] = useState<{
    loading: boolean;
    locating: boolean;
    submitted: boolean;
    error?: string;
  }>({
    loading: false,
    locating: false,
    submitted: false,
  });
  const {
    requestLocationForPurpose,
    clearPermissionPrompt,
    getPermissionStateForPurpose,
    getRuntimeMessageForPurpose,
  } = useDevicePermissions();
  const permissionState = getPermissionStateForPurpose('manager-tree-gps');
  const speciesSuggestions = [...new Set(props.trees.map((tree) => tree.species).filter(Boolean))].slice(0, 4);
  const visibleTrees = filterTrees(props.trees, query, filter);
  const filtered = Boolean(query.trim()) || filter !== 'all';

  const captureCoordinates = async () => {
    setTreeMutation((current) => ({ ...current, locating: true, error: undefined }));
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const captured = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? 0,
        capturedAt: new Date(position.timestamp),
      };
      setCoordinates(captured);
      if (!address.trim()) {
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: captured.lat, longitude: captured.lng });
          const suggestedAddress = [place?.name, place?.street, place?.district, place?.city]
            .filter(Boolean)
            .join(', ');
          if (suggestedAddress) setAddress(suggestedAddress);
        } catch {
          // GPS remains valid when address lookup is unavailable; the location field stays editable.
        }
      }
      clearPermissionPrompt();
    } catch {
      setTreeMutation((current) => ({
        ...current,
        error: 'Không lấy được GPS. Ra nơi thoáng và thử lại.',
      }));
    } finally {
      setTreeMutation((current) => ({ ...current, locating: false }));
    }
  };

  const requestPermissionAndCapture = async () => {
    const response = await requestLocationForPurpose('manager-tree-gps');
    if (response?.granted) await captureCoordinates();
  };

  const submitTree = async () => {
    setTreeMutation((current) => ({ ...current, submitted: true, error: undefined }));
    const parsedAge = ageYears.trim() ? Number.parseInt(ageYears, 10) : 0;
    const resolvedName = treeName.trim() || species.trim();
    const resolvedAddress = address.trim() || `Vị trí ${coordinates?.lat.toFixed(6)}, ${coordinates?.lng.toFixed(6)}`;
    if (!resolvedName || !species.trim() || !coordinates || !healthStatus || Number.isNaN(parsedAge)) {
      return;
    }
    setTreeMutation({ loading: true, locating: false, submitted: true });
    try {
      const createdTree = await props.createTree({
        name: resolvedName,
        species: species.trim(),
        address: resolvedAddress,
        lat: coordinates.lat,
        lng: coordinates.lng,
        healthStatus,
        ageYears: Math.max(0, parsedAge),
      });
      setAddingTree(false);
      setTreeName('');
      setSpecies('');
      setAddress('');
      setAgeYears('');
      setHealthStatus(null);
      setCustomSpecies(false);
      setCoordinates(null);
      setQrTree(createdTree);
      setTreeMutation({ loading: false, locating: false, submitted: false });
    } catch {
      setTreeMutation({
        loading: false,
        locating: false,
        submitted: true,
        error: 'Không thể tạo cây. Kiểm tra kết nối rồi thử lại.',
      });
    }
  };

  const toggleTree = async (treeId: string) => {
    if (expandedTreeId === treeId) {
      setExpandedTreeId(null);
      return;
    }

    setExpandedTreeId(treeId);
    setHistoryErrorTreeId(null);
    if (props.getCareHistoryByTree(treeId).length > 0) return;

    setHistoryLoadingTreeId(treeId);
    try {
      await props.loadCareHistoryByTree(treeId);
    } catch {
      setHistoryErrorTreeId(treeId);
    } finally {
      setHistoryLoadingTreeId(null);
    }
  };

  return (
    <>
      <FlatList
        data={visibleTrees}
        keyExtractor={(tree) => tree.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screen}
        refreshControl={
          props.onRefreshData ? (
            <RefreshControl
              refreshing={Boolean(props.dataSource?.loading)}
              onRefresh={() => void props.onRefreshData?.()}
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
            <ScreenHeader
              title="Hồ sơ cây"
              subtitle={`${props.trees.length} cây trong phạm vi vận hành`}
              action={
                <Button
                  size="compact"
                  icon={addingTree ? 'close-outline' : 'add-outline'}
                  onPress={() => {
                    setAddingTree(!addingTree);
                  }}
                >
                  {addingTree ? 'Đóng' : 'Thêm cây'}
                </Button>
              }
            />

            {addingTree ? (
              <View style={styles.createTreePanel}>
                <SectionTitle icon="leaf-outline">Khởi tạo cây tại hiện trường</SectionTitle>
                <Text style={styles.sectionHint}>
                  Bắt đầu bằng vị trí thật; NOVYX sẽ gợi ý địa điểm để giảm nhập thủ công.
                </Text>

                {permissionState === 'granted' ? (
                  <Notice
                    tone={coordinates ? 'success' : 'info'}
                    title={coordinates ? 'Đã xác định vị trí cây' : 'GPS đã sẵn sàng'}
                    body={
                      coordinates
                        ? `Độ chính xác ±${Math.round(coordinates.accuracy)} m · ${coordinates.capturedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Đứng tại cây rồi lấy một tọa độ hiện tại.'
                    }
                    action={
                      <Button
                        size="compact"
                        variant="outline"
                        icon="locate-outline"
                        loading={treeMutation.locating}
                        onPress={() => void captureCoordinates()}
                      >
                        {coordinates ? 'Đo lại' : 'Lấy GPS'}
                      </Button>
                    }
                  />
                ) : (
                  <DevicePermissionState
                    kind="location"
                    purpose="manager-tree-gps"
                    state={permissionState}
                    runtimeMessage={getRuntimeMessageForPurpose('manager-tree-gps')}
                    onRequest={() => void requestPermissionAndCapture()}
                    onOpenSettings={() => void openDeviceSettings()}
                    onCancel={clearPermissionPrompt}
                  />
                )}

                <Field
                  label="Địa điểm (không bắt buộc)"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="NOVYX tự gợi ý từ GPS; có thể chỉnh lại"
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Loài cây</Text>
                  {speciesSuggestions.length > 0 ? (
                    <View style={styles.optionWrap}>
                      {speciesSuggestions.map((item) => (
                        <Pressable
                          key={item}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: species === item }}
                          onPress={() => {
                            setCustomSpecies(false);
                            setSpecies(item);
                          }}
                          style={[styles.option, species === item && styles.optionSelected]}
                        >
                          <Text style={[styles.optionText, species === item && styles.optionTextSelected]}>{item}</Text>
                        </Pressable>
                      ))}
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: customSpecies }}
                        onPress={() => {
                          setCustomSpecies(true);
                          setSpecies('');
                        }}
                        style={[styles.option, customSpecies && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, customSpecies && styles.optionTextSelected]}>Loài khác</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  {customSpecies || speciesSuggestions.length === 0 ? (
                    <Field label="Tên loài" value={species} onChangeText={setSpecies} placeholder="Nhập tên loài cây" />
                  ) : null}
                  {treeMutation.submitted && !species.trim() ? (
                    <Text style={styles.fieldError}>Chọn hoặc nhập loài cây.</Text>
                  ) : null}
                </View>

                <Field
                  label="Tên hiển thị (không bắt buộc)"
                  value={treeName}
                  onChangeText={setTreeName}
                  placeholder={species ? `Mặc định: ${species}` : 'Mặc định theo loài cây'}
                />
                <Field
                  label="Tuổi cây (không bắt buộc)"
                  value={ageYears}
                  onChangeText={setAgeYears}
                  placeholder="Chưa xác định"
                  keyboardType="number-pad"
                />
                {treeMutation.submitted && ageYears.trim() && Number.isNaN(Number.parseInt(ageYears, 10)) ? (
                  <Text style={styles.fieldError}>Nhập tuổi cây bằng số.</Text>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tình trạng ban đầu</Text>
                  <View style={styles.optionWrap}>
                    {(['Khỏe mạnh', 'Cần chăm sóc', 'Sâu bệnh'] as TreeHealthStatus[]).map((status) => (
                      <Pressable
                        key={status}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: healthStatus === status }}
                        onPress={() => setHealthStatus(status)}
                        style={[styles.option, healthStatus === status && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, healthStatus === status && styles.optionTextSelected]}>
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {treeMutation.submitted && !healthStatus ? (
                    <Text style={styles.fieldError}>Chọn tình trạng ban đầu.</Text>
                  ) : null}
                </View>

                {treeMutation.submitted && !coordinates ? (
                  <Text style={styles.fieldError}>Lấy GPS hiện tại trước khi lưu.</Text>
                ) : null}
                {treeMutation.error ? <Text style={styles.formError}>{treeMutation.error}</Text> : null}
                <Button size="field" loading={treeMutation.loading} onPress={() => void submitTree()}>
                  Tạo hồ sơ cây
                </Button>
              </View>
            ) : null}

            {props.dataSource?.source !== 'rest' ? (
              <Notice
                tone={props.dataSource?.source === 'cache' ? 'warning' : 'danger'}
                title={
                  props.dataSource?.source === 'cache' ? 'Đang xem danh mục đã lưu' : 'Không tải được danh mục cây'
                }
                body={props.dataSource?.message ?? 'Kiểm tra kết nối rồi thử lại.'}
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

            {props.trees.length > 0 ? (
              <TreeSearchFilters
                query={query}
                onQueryChange={setQuery}
                activeFilter={filter}
                onFilterChange={setFilter}
                resultCount={visibleTrees.length}
                totalCount={props.trees.length}
              />
            ) : null}

            {visibleTrees.length === 0 ? (
              <EmptyState
                icon={filtered ? 'search-outline' : 'leaf-outline'}
                title={filtered ? 'Không tìm thấy cây phù hợp' : 'Chưa có cây trong phạm vi'}
                body={filtered ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Cây sẽ xuất hiện khi được cấp vào phạm vi.'}
              />
            ) : null}
          </View>
        }
        renderItem={({ item: tree }) => {
          const relatedTasks = props.tasks.filter((task) => task.treeId === tree.id);
          const pendingReview = relatedTasks.find(
            (task) => task.status === TaskStatus.WAITING_REVIEW || task.status === 'WAITING_REVIEW',
          );
          const activeTask =
            pendingReview ??
            relatedTasks.find(
              (task) =>
                task.status !== TaskStatus.COMPLETED && task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
            );
          const expanded = expandedTreeId === tree.id;
          return (
            <ManagerTreeRow
              tree={tree}
              task={activeTask}
              history={props.getCareHistoryByTree(tree.id)}
              expanded={expanded}
              historyLoading={historyLoadingTreeId === tree.id}
              historyError={historyErrorTreeId === tree.id}
              onToggle={() => void toggleTree(tree.id)}
              onOpenQr={() => setQrTree(tree)}
              onOpenReview={
                pendingReview
                  ? () => {
                      props.setReviewTask(pendingReview);
                      props.setActiveStep('REVIEW_DETAIL');
                    }
                  : undefined
              }
            />
          );
        }}
      />
      <TreeQrModal tree={qrTree} onClose={() => setQrTree(null)} />
    </>
  );
}

function ManagerTreeRow({
  tree,
  task,
  history,
  expanded,
  historyLoading,
  historyError,
  onToggle,
  onOpenQr,
  onOpenReview,
}: {
  tree: Tree;
  task?: Task;
  history: CareHistory[];
  expanded: boolean;
  historyLoading: boolean;
  historyError: boolean;
  onToggle: () => void;
  onOpenQr: () => void;
  onOpenReview?: () => void;
}) {
  const healthTone =
    tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green';
  const latestHistory = history[0];

  return (
    <View style={styles.treeRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Thu gọn' : 'Mở'} hồ sơ ${tree.name}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.treeSummary, pressed && styles.pressed]}
      >
        <View style={styles.treeIcon}>
          <Ionicons name="leaf-outline" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={styles.treeName}>{tree.name}</Text>
            <Badge tone={healthTone}>{tree.healthStatus}</Badge>
          </View>
          <Text style={styles.treeSpecies} numberOfLines={1}>
            {tree.species} · {tree.address}
          </Text>
          {task ? (
            <Text style={styles.taskRelation} numberOfLines={1}>
              {getTaskStatusMeta(task.status).label}: {task.title}
            </Text>
          ) : (
            <Text style={styles.noTask}>Không có công việc đang mở</Text>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.pewter} />
      </Pressable>

      {expanded ? (
        <View style={styles.treeDetail}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={colors.pewter} />
            <Text style={styles.treeAddress}>{tree.address}</Text>
          </View>
          <View style={styles.factRow}>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Nhãn nhận dạng</Text>
              <Button size="compact" variant="outline" icon="qr-code-outline" onPress={onOpenQr}>
                Mở mã QR
              </Button>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Tuổi cây</Text>
              <Text style={styles.factValue}>{formatTreeAge(tree.ageYears)}</Text>
            </View>
          </View>

          <View style={styles.historyRow}>
            <Ionicons name="time-outline" size={18} color={colors.primaryDark} />
            <View style={styles.flex}>
              <Text style={styles.factLabel}>Lịch sử chăm sóc gần nhất</Text>
              <Text style={styles.historyText}>
                {historyLoading
                  ? 'Đang tải lịch sử…'
                  : historyError
                    ? 'Không tải được lịch sử. Thu gọn rồi mở lại để thử lại.'
                    : latestHistory
                      ? `${latestHistory.taskTitle} · ${new Date(latestHistory.completedAt).toLocaleDateString('vi-VN')}`
                      : 'Chưa có nghiệm thu được lưu cho cây này.'}
              </Text>
            </View>
          </View>

          {onOpenReview ? (
            <Button size="compact" icon="checkmark-done-outline" onPress={onOpenReview}>
              Mở báo cáo chờ duyệt
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomNavClearance + spacing.xl,
  },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  createTreePanel: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  formError: { ...typography.body, color: colors.criticalText },
  fieldError: { ...typography.metadata, color: colors.criticalText, marginTop: -spacing.xs },
  sectionHint: { ...typography.body, color: colors.pewter },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.ink },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.control,
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.primaryDark, backgroundColor: colors.successSurface },
  optionText: { ...typography.body, color: colors.neutralText },
  optionTextSelected: { ...typography.bodyStrong, color: colors.primaryDark },
  separator: { height: spacing.md },
  resultLabel: { ...typography.label, color: colors.pewter },
  flex: { flex: 1 },
  treeRow: {
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  treeSummary: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  treeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconSurface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  treeName: { ...typography.section, color: colors.ink, flex: 1 },
  treeSpecies: { ...typography.body, color: colors.pewter, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  treeAddress: { ...typography.body, color: colors.neutralText, flex: 1 },
  taskRelation: { ...typography.label, color: colors.infoText, marginTop: spacing.xs },
  noTask: { ...typography.label, color: colors.pewter, marginTop: spacing.xs },
  treeDetail: {
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.neutralSurface,
  },
  factRow: { flexDirection: 'row', gap: spacing.md },
  fact: { flex: 1, gap: spacing.xs },
  factLabel: { ...typography.metadata, color: colors.pewter },
  factValue: { ...typography.bodyStrong, color: colors.ink },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  historyText: { ...typography.body, color: colors.neutralText, marginTop: 2 },
  pressed: { opacity: 0.72 },
});
