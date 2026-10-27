import { useCallback, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, EmptyState, Field, ScreenHeader } from '../../components/AppPrimitives';
import {
  TREE_FILTER_OPTIONS,
  TreeFilter,
  formatTreeAge,
  getNextActionTask,
  getTaskStatusMeta,
} from '../../domain/mobileWorkflow';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { CareHistory, Task, Tree } from '../../types';

export function StaffTrees({
  assignedTrees,
  visibleAssignedTrees,
  staffTasks,
  query,
  activeFilter,
  loading = false,
  onRefresh,
  getCareHistoryByTree,
  loadCareHistoryByTree,
  onQueryChange,
  onFilterChange,
  onOpenTask,
  onMap,
}: {
  assignedTrees: Tree[];
  visibleAssignedTrees: Tree[];
  staffTasks: Task[];
  query: string;
  activeFilter: TreeFilter;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: TreeFilter) => void;
  onOpenTask: (task: Task) => void;
  onMap: (task: Task) => void;
}) {
  const [expandedTreeId, setExpandedTreeId] = useState<string | null>(null);
  const [historyLoadingTreeId, setHistoryLoadingTreeId] = useState<string | null>(null);
  const [historyErrorTreeId, setHistoryErrorTreeId] = useState<string | null>(null);
  const filtered = Boolean(query.trim()) || activeFilter !== 'all';

  const toggle = useCallback(
    async (treeId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (expandedTreeId === treeId) {
        setExpandedTreeId(null);
        return;
      }
      setExpandedTreeId(treeId);
      setHistoryErrorTreeId(null);
      if (getCareHistoryByTree(treeId).length > 0) return;
      setHistoryLoadingTreeId(treeId);
      try {
        await loadCareHistoryByTree(treeId);
      } catch {
        setHistoryErrorTreeId(treeId);
      } finally {
        setHistoryLoadingTreeId(null);
      }
    },
    [expandedTreeId, getCareHistoryByTree, loadCareHistoryByTree],
  );

  const renderItem = useCallback(
    ({ item: tree }: { item: Tree }) => {
      const related = staffTasks.filter((task) => task.treeId === tree.id);
      const activeTask = getNextActionTask(related);
      return (
        <StaffTreeRow
          tree={tree}
          task={activeTask}
          history={getCareHistoryByTree(tree.id)}
          expanded={expandedTreeId === tree.id}
          loading={historyLoadingTreeId === tree.id}
          error={historyErrorTreeId === tree.id}
          onToggle={() => void toggle(tree.id)}
          onOpenTask={activeTask ? () => onOpenTask(activeTask) : undefined}
          onMap={activeTask ? () => onMap(activeTask) : undefined}
        />
      );
    },
    [expandedTreeId, getCareHistoryByTree, historyErrorTreeId, historyLoadingTreeId, onMap, onOpenTask, staffTasks, toggle],
  );

  return (
    <FlatList
      data={visibleAssignedTrees}
      keyExtractor={(tree) => tree.id}
      keyboardShouldPersistTaps="handled"
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
          <ScreenHeader title="Cây của tôi" subtitle={`${assignedTrees.length} cây có quan hệ phân công`} />
          {assignedTrees.length > 0 ? (
            <>
              <Field
                label="Tìm cây"
                value={query}
                onChangeText={onQueryChange}
                placeholder="Tên, QR, loài hoặc vị trí"
                autoCapitalize="none"
                rightIcon={query ? 'close-circle-outline' : 'search-outline'}
                onRightIconPress={query ? () => onQueryChange('') : undefined}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {TREE_FILTER_OPTIONS.map((option) => {
                  const active = activeFilter === option.id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={option.id}
                      onPress={() => onFilterChange(option.id)}
                      style={[styles.filter, active && styles.filterActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={styles.resultLabel}>
                {visibleAssignedTrees.length}/{assignedTrees.length} cây
              </Text>
            </>
          ) : null}
          {visibleAssignedTrees.length === 0 ? (
            <EmptyState
              icon={filtered ? 'search-outline' : 'leaf-outline'}
              title={filtered ? 'Không tìm thấy cây phù hợp' : 'Chưa có cây được phân công'}
              body={
                filtered ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Cây sẽ xuất hiện khi có nhiệm vụ thật được giao cho bạn.'
              }
            />
          ) : null}
        </View>
      }
      renderItem={renderItem}
    />
  );
}

function StaffTreeRow({
  tree,
  task,
  history,
  expanded,
  loading,
  error,
  onToggle,
  onOpenTask,
  onMap,
}: {
  tree: Tree;
  task?: Task;
  history: CareHistory[];
  expanded: boolean;
  loading: boolean;
  error: boolean;
  onToggle: () => void;
  onOpenTask?: () => void;
  onMap?: () => void;
}) {
  const healthTone =
    tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green';
  const latest = history[0];

  return (
    <View style={styles.treeRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Thu gọn' : 'Mở'} hồ sơ ${tree.name}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <Ionicons name="leaf-outline" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{tree.name}</Text>
            <Badge tone={healthTone}>{tree.healthStatus}</Badge>
          </View>
          <Text style={styles.species} numberOfLines={1}>
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
        <View style={styles.detail}>
          <View style={styles.facts}>
            <View style={styles.flex}>
              <Text style={styles.factLabel}>Địa điểm</Text>
              <Text style={styles.factValue}>{tree.address}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.factLabel}>Tuổi cây</Text>
              <Text style={styles.factValue}>{formatTreeAge(tree.ageYears)}</Text>
            </View>
          </View>
          <View style={styles.history}>
            <Ionicons name="time-outline" size={18} color={colors.primaryDark} />
            <View style={styles.flex}>
              <Text style={styles.factLabel}>Lịch sử gần nhất</Text>
              <Text style={styles.historyText}>
                {loading
                  ? 'Đang tải lịch sử…'
                  : error
                    ? 'Không tải được lịch sử. Thu gọn rồi mở lại để thử lại.'
                    : latest
                      ? `${latest.taskTitle} · ${new Date(latest.completedAt).toLocaleDateString('vi-VN')}`
                      : 'Chưa có nghiệm thu được lưu cho cây này.'}
              </Text>
            </View>
          </View>
          {task ? (
            <View style={styles.actions}>
              {onOpenTask ? (
                <Button size="compact" icon="document-text-outline" onPress={onOpenTask}>
                  Mở công việc
                </Button>
              ) : null}
              {onMap ? (
                <Button size="compact" variant="outline" icon="map-outline" onPress={onMap}>
                  Vị trí
                </Button>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  treeRow: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  summary: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    backgroundColor: colors.iconSurface,
  },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { ...typography.section, color: colors.ink, flex: 1 },
  species: { ...typography.body, color: colors.pewter, marginTop: 2 },
  taskRelation: { ...typography.label, color: colors.infoText, marginTop: spacing.xs },
  noTask: { ...typography.label, color: colors.pewter, marginTop: spacing.xs },
  detail: {
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.neutralSurface,
  },
  facts: { flexDirection: 'row', gap: spacing.md },
  factLabel: { ...typography.metadata, color: colors.pewter },
  factValue: { ...typography.bodyStrong, color: colors.ink, marginTop: 2 },
  history: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  historyText: { ...typography.body, color: colors.neutralText, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pressed: { opacity: 0.72 },
});
