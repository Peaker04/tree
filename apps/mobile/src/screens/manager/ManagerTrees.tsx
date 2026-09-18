import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Card, EmptyState, GradientCard } from '../../components/AppPrimitives';
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
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Hồ sơ cây xanh" subtitle="Danh mục bồn cây thuộc phân khu quản lý" />
      <GradientCard variant="canopy">
        <View style={styles.heroContentRow}>
          <View style={styles.flex}>
            <Text style={styles.lightHeroTitle}>Bản đồ danh mục cây</Text>
            <Text style={styles.lightHeroBody}>
              Theo dõi {props.trees.length} cây, tình trạng sức khỏe, mã QR và lịch sử chăm sóc gần nhất.
            </Text>
          </View>
          <TreeIdentityVisual tree={props.trees[0] ?? fallbackTree} compact />
        </View>
      </GradientCard>
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
      ) : (
        visibleTrees.map((tree) => {
          const careHistory = props.getCareHistoryByTree(tree.id);
          const relatedTasks = props.tasks.filter((task) => task.treeId === tree.id);
          const activeTask = relatedTasks.find((task) => task.status !== 'Completed') ?? relatedTasks[0];
          const healthTone =
            tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green';
          return (
            <Card key={tree.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <View style={styles.treeCode}>
                    <Text style={styles.treeCodeText}>{tree.id.split('-')[1]}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.itemTitle}>{tree.name}</Text>
                    <Text style={styles.itemSub}>{tree.species}</Text>
                  </View>
                </View>
                <Badge tone={healthTone}>{tree.healthStatus}</Badge>
              </View>
              <Text style={styles.bodyText}>{tree.address}</Text>
              <View style={styles.treeMetaGrid}>
                <MetaBox label="QR" value={tree.qrCode} />
                <MetaBox label="Vị trí" value={`${tree.lat.toFixed(5)}, ${tree.lng.toFixed(5)}`} />
                <MetaBox label="Tuổi cây" value={`${tree.ageYears} năm`} />
                <MetaBox label="Việc" value={`${relatedTasks.length}`} />
              </View>
              {activeTask ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.relatedTaskCard}
                  onPress={() => {
                    props.setReviewTask(activeTask);
                    props.setActiveStep(activeTask.status === 'Waiting_Review' ? 'REVIEW_DETAIL' : 'REVIEW');
                  }}
                >
                  <View style={styles.flex}>
                    <Text style={styles.metricLabel}>Công việc liên quan</Text>
                    <Text style={styles.itemTitle}>{activeTask.title}</Text>
                    <Text style={styles.itemSub}>{getTaskStatusMeta(activeTask.status).label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
              <CareHistoryLoader treeId={tree.id} items={careHistory} loadCareHistory={props.loadCareHistoryByTree} />
            </Card>
          );
        })
      )}
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
    fontWeight: '900',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '900',
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
    fontWeight: '900',
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
