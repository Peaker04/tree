import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, EmptyState, Button } from '../../components/AppPrimitives';
import { TreeAssignmentCard } from '../../components/presentation/TreeSurfaces';
import { CareHistoryLoader, TreeSearchFilters } from '../../components/presentation/TreeSurfaces';
import { TreeIdentityVisual } from '../../components/presentation/TreeIdentityVisual';
import { Header } from '../../components/presentation/TaskSurfaces';
import { filterTrees, getTaskStatusMeta } from '../../domain/mobileWorkflow';
import { colors, radius, spacing } from '../../theme/tokens';
import type { TreeFilter } from '../../domain/mobileWorkflow';
import type { Tree } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

export function ManagerTrees(props: ManagerAreaProps) {
  const [managerTreeQuery, setManagerTreeQuery] = useState('');
  const [managerTreeFilter, setManagerTreeFilter] = useState<TreeFilter>('all');
  const visibleTrees = filterTrees(props.trees, managerTreeQuery, managerTreeFilter);

  return (
    <FlatList
      data={visibleTrees}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.screenPad}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Header title="Hồ sơ cây xanh" subtitle="Danh mục bồn cây thuộc phân khu quản lý" />
      <Card tone="warm">
        <View style={styles.heroContentRow}>
          <View style={styles.flex}>
            <Text style={styles.lightHeroTitle}>Bản đồ danh mục cây</Text>
            <Text style={styles.lightHeroBody}>
              Theo dõi {props.trees.length} cây, tình trạng sức khỏe, mã QR và lịch sử chăm sóc gần nhất.
            </Text>
          </View>
          <TreeIdentityVisual tree={props.trees[0] ?? fallbackTree} compact />
        </View>
      </Card>
      <TreeSearchFilters
        query={managerTreeQuery}
        onQueryChange={setManagerTreeQuery}
        activeFilter={managerTreeFilter}
        onFilterChange={setManagerTreeFilter}
        resultCount={visibleTrees.length}
        totalCount={props.trees.length}
      />
          {visibleTrees.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy hồ sơ cây"
              body="Thử tìm theo mã cây, tên, QR hoặc vị trí khác."
            />
          ) : null}
        </View>
      }
      renderItem={({ item: tree }) => {
        const relatedTasks = props.tasks.filter((t) => t.treeId === tree.id);
        const pendingTask = relatedTasks.find((t) => t.status === 'WAITING_REVIEW');
        return (
          <TreeAssignmentCard
            tree={tree}
            task={pendingTask}
            careHistory={props.getCareHistoryByTree(tree.id)}
            loadCareHistory={props.loadCareHistoryByTree}
            onOpenTask={pendingTask ? () => {
              props.setReviewTask(pendingTask);
              props.setActiveStep('REVIEW_DETAIL');
            } : undefined}
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

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.treeMetaBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.treeMetaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerContainer: { gap: 16, marginBottom: 16 },
  screenPad: {
    padding: spacing.screen,
    gap: spacing.section,
    paddingBottom: 34,
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
  },
  lightHeroBody: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
  },
  listCard: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '500',
  },
  treeCode: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeCodeText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
  treeMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  treeMetaBox: {
    width: '47%',
    borderRadius: radius.md,
    backgroundColor: colors.mineral,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
  },
  treeMetaValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  relatedTaskCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    padding: 12,
  },
});
