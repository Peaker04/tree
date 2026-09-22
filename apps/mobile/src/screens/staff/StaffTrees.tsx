import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BrandMark, Card, EmptyState } from '../../components/AppPrimitives';
import { TreeAssignmentCard, TreeSearchFilters } from '../../components/presentation/TreeSurfaces';
import { TreeIdentityVisual } from '../../components/presentation/TreeIdentityVisual';
import { colors } from '../../theme/tokens';
import { CareHistory, Task, TaskStatus, Tree } from '../../types';
import { TreeFilter } from '../../domain/mobileWorkflow';

export function StaffTrees({
  assignedTrees,
  visibleAssignedTrees,
  staffTasks,
  query,
  activeFilter,
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
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: TreeFilter) => void;
  onOpenTask: (task: Task) => void;
  onMap: (task: Task) => void;
}) {
  return (
    <FlatList
      data={visibleAssignedTrees}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.screenPad}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Card tone="warm" style={styles.treeHeroCard}>
            <View style={styles.heroContentRow}>
              <View style={styles.flex}>
                <BrandMark compact />
                <Text style={styles.lightHeroTitle}>Cây của tôi</Text>
                <Text style={styles.lightHeroBody}>
                  {assignedTrees.length} cây đang gắn với lịch chăm sóc của bạn trong công viên.
                </Text>
              </View>
              <TreeIdentityVisual tree={assignedTrees[0] ?? fallbackTree} compact />
            </View>
          </Card>
          <TreeSearchFilters
            query={query}
            onQueryChange={onQueryChange}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            resultCount={visibleAssignedTrees.length}
            totalCount={assignedTrees.length}
          />
          {assignedTrees.length === 0 ? (
            <EmptyState
              title="Chưa có cây được phân công"
              body="Khi quản lý giao việc, cây phụ trách sẽ hiển thị tại đây."
            />
          ) : visibleAssignedTrees.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy cây phù hợp"
              body="Thử đổi từ khóa, mã QR hoặc bộ lọc tình trạng để xem lại cây được giao."
            />
          ) : null}
        </View>
      }
      renderItem={({ item: tree }) => {
        const relatedTasks = staffTasks.filter((task) => task.treeId === tree.id);
        const activeRelatedTask = relatedTasks.find((task) => task.status !== TaskStatus.COMPLETED);
        const displayTask = activeRelatedTask ?? relatedTasks[0];
        return (
          <TreeAssignmentCard
            tree={tree}
            task={displayTask}
            careHistory={getCareHistoryByTree(tree.id)}
            loadCareHistory={loadCareHistoryByTree}
            onOpenTask={activeRelatedTask ? () => onOpenTask(activeRelatedTask) : undefined}
            onMap={activeRelatedTask ? () => onMap(activeRelatedTask) : undefined}
          />
        );
      }}
    />
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

const styles = StyleSheet.create({
  screenPad: {
    padding: 16,
    paddingBottom: 104,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 16,
  },
  unusedScreenPad: {
    padding: 16,
    paddingBottom: 104,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  treeHeroCard: {
    minHeight: 150,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lightHeroTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '600',
    marginTop: 14,
  },
  lightHeroBody: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 6,
  },
});
