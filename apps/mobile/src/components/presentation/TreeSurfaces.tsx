import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Card, EmptyState, Field, SectionTitle } from '../AppPrimitives';
import { colors, radius } from '../../theme/tokens';
import { CareHistory, Task, TaskStatus, Tree } from '../../types';
import { TreeIdentityVisual } from './TreeIdentityVisual';
import {
  TASK_FILTER_OPTIONS,
  TREE_FILTER_OPTIONS,
  TaskFilter,
  TreeFilter,
  getTaskStatusMeta,
} from '../../domain/mobileWorkflow';

export function TreeSearchFilters({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
  resultCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  activeFilter: TreeFilter;
  onFilterChange: (value: TreeFilter) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <Card style={styles.treeFilterPanel}>
      <Field
        label="Tìm cây"
        value={query}
        onChangeText={onQueryChange}
        placeholder="ID, tên, QR, vị trí..."
        autoCapitalize="none"
        rightIcon={query ? 'close-circle-outline' : 'search-outline'}
        onRightIconPress={query ? () => onQueryChange('') : undefined}
      />
      <View style={styles.filterMetaRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          {TREE_FILTER_OPTIONS.map((option) => {
            const active = activeFilter === option.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Lọc cây: ${option.label}`}
                accessibilityState={{ selected: active }}
                accessibilityHint={`Nhấn để ${active ? 'tắt' : 'bật'} bộ lọc ${option.label}`}
                key={option.id}
                onPress={() => onFilterChange(option.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.resultText}>
          {resultCount}/{totalCount} cây
        </Text>
      </View>
    </Card>
  );
}

export function TaskStatusFilters({
  activeFilter,
  onFilterChange,
  resultCount,
  totalCount,
}: {
  activeFilter: TaskFilter;
  onFilterChange: (value: TaskFilter) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <Card style={styles.taskFilterPanel}>
      <View style={styles.rowBetween}>
        <SectionTitle icon="funnel-outline">Lọc trạng thái</SectionTitle>
        <Text style={styles.resultText}>
          {resultCount}/{totalCount} việc
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
        {TASK_FILTER_OPTIONS.map((option) => {
          const active = activeFilter === option.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Lọc công việc: ${option.label}`}
              accessibilityState={{ selected: active }}
              accessibilityHint={`Nhấn để ${active ? 'tắt' : 'bật'} bộ lọc ${option.label}`}
              key={option.id}
              onPress={() => onFilterChange(option.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

export function TreeAssignmentCard({
  tree,
  task,
  careHistory,
  loadCareHistory,
  onOpenTask,
  onMap,
}: {
  tree: Tree;
  task?: Task;
  careHistory: CareHistory[];
  loadCareHistory: (treeId: string) => Promise<CareHistory[]>;
  onOpenTask?: () => void;
  onMap?: () => void;
}) {
  const healthTone =
    tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green';
  return (
    <Card tone="flat" style={styles.treeAssignmentCard}>
      <View style={styles.treeImageWrap}>
        <TreeIdentityVisual tree={tree} />
        <View style={styles.treeImageOverlay}>
          <Badge tone={healthTone}>{tree.healthStatus}</Badge>
        </View>
      </View>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>{tree.name}</Text>
          <Text style={styles.itemSub}>{tree.species}</Text>
        </View>
        <View style={styles.treeCode}>
          <Text style={styles.treeCodeText}>{tree.id.split('-')[1]}</Text>
        </View>
      </View>
      <Text style={styles.bodyText}>{tree.address}</Text>
      <View style={styles.treeMetaGrid}>
        <View style={styles.treeMetaBox}>
          <Text style={styles.metricLabel}>QR</Text>
          <Text style={styles.treeMetaValue}>{tree.qrCode}</Text>
        </View>
        <View style={styles.treeMetaBox}>
          <Text style={styles.metricLabel}>Tuổi cây</Text>
          <Text style={styles.treeMetaValue}>{tree.ageYears} năm</Text>
        </View>
      </View>
      {task ? (
        <View style={styles.relatedTaskCard}>
          <Text style={styles.metricLabel}>Công việc liên quan</Text>
          <Text style={styles.itemTitle}>{task.title}</Text>
          <Text style={styles.itemSub}>
            {task.status === TaskStatus.COMPLETED ? 'Đã hoàn thành' : 'Đang cần theo dõi'}
          </Text>
        </View>
      ) : null}
      <CareHistoryLoader treeId={tree.id} items={careHistory} loadCareHistory={loadCareHistory} />
      {onOpenTask || onMap ? (
        <View style={styles.twoCols}>
          {onOpenTask ? (
            <Button icon="document-text-outline" onPress={onOpenTask}>
              Chi tiết
            </Button>
          ) : null}
          {onMap ? (
            <Button variant="outline" icon="map-outline" onPress={onMap}>
              Vị trí
            </Button>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function TreeLookupResult({
  tree,
  task,
  careHistory,
  loadCareHistory,
  onOpenTask,
  onMap,
  onTrees,
}: {
  tree: Tree;
  task?: Task;
  careHistory: CareHistory[];
  loadCareHistory: (treeId: string) => Promise<CareHistory[]>;
  onOpenTask?: () => void;
  onMap?: () => void;
  onTrees: () => void;
}) {
  const healthTone =
    tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green';

  return (
    <Card tone="flat" style={[styles.treeAssignmentCard, { backgroundColor: "#f0fdf4" }]} >
      <TreeIdentityVisual tree={tree} />
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
        <View style={styles.treeMetaBox}>
          <Text style={styles.metricLabel}>QR</Text>
          <Text style={styles.treeMetaValue}>{tree.qrCode}</Text>
        </View>
        <View style={styles.treeMetaBox}>
          <Text style={styles.metricLabel}>Tọa độ</Text>
          <Text style={styles.treeMetaValue}>
            {tree.lat.toFixed(5)}, {tree.lng.toFixed(5)}
          </Text>
        </View>
      </View>
      {task ? (
        <View style={styles.relatedTaskCard}>
          <Text style={styles.metricLabel}>Công việc liên quan</Text>
          <Text style={styles.itemTitle}>{task.title}</Text>
          <Text style={styles.itemSub}>{getTaskStatusMeta(task.status).label}</Text>
        </View>
      ) : (
        <View style={styles.relatedTaskCard}>
          <Text style={styles.metricLabel}>Công việc liên quan</Text>
          <Text style={styles.bodyText}>Cây này hiện chưa có nhiệm vụ đang mở cho bạn.</Text>
        </View>
      )}
      <CareHistoryLoader treeId={tree.id} items={careHistory} loadCareHistory={loadCareHistory} />
      <View style={styles.twoCols}>
        {onOpenTask ? (
          <Button icon="document-text-outline" onPress={onOpenTask}>
            Mở việc
          </Button>
        ) : (
          <Button icon="leaf-outline" onPress={onTrees}>
            Cây của tôi
          </Button>
        )}
        {onMap ? (
          <Button variant="outline" icon="map-outline" onPress={onMap}>
            Vị trí
          </Button>
        ) : (
          <Button variant="outline" icon="copy-outline" onPress={onTrees}>
            Hồ sơ cây
          </Button>
        )}
      </View>
    </Card>
  );
}

export function CareHistoryLoader({
  treeId,
  items,
  loadCareHistory,
}: {
  treeId: string;
  items: CareHistory[];
  loadCareHistory: (treeId: string) => Promise<CareHistory[]>;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadCareHistory(treeId).finally(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadCareHistory, treeId]);

  return <CareHistoryPreview items={items} loading={loading} />;
}

function CareHistoryPreview({ items, loading }: { items: CareHistory[]; loading?: boolean }) {
  const latest = items[0];

  if (!latest) {
    return (
      <View style={styles.historyPreview}>
        <View style={styles.historyIcon}>
          <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.metricLabel}>Lịch sử chăm sóc</Text>
          <Text style={styles.bodyText}>
            {loading ? 'Đang tải lịch sử chăm sóc...' : 'Chưa có nghiệm thu được lưu cho cây này.'}
          </Text>
        </View>
      </View>
    );
  }

  const completedDate = new Date(latest.completedAt).toLocaleDateString('vi-VN');
  const evidenceCount = [latest.beforePhoto, latest.afterPhoto].filter(Boolean).length;
  const proofCount = [
    latest.gpsCheck?.verified,
    latest.qrCheck?.verified,
    Boolean(latest.beforePhoto),
    Boolean(latest.afterPhoto),
  ].filter(Boolean).length;

  return (
    <View style={styles.historyPreview}>
      <View style={styles.historyIcon}>
        <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowBetween}>
          <Text style={styles.metricLabel}>Lần chăm sóc gần nhất</Text>
          <Badge tone={latest.status === TaskStatus.COMPLETED ? 'green' : 'sky'}>
            {latest.status === TaskStatus.COMPLETED ? 'Đã duyệt' : 'Chờ duyệt'}
          </Badge>
        </View>
        <Text style={styles.itemTitle}>{latest.taskTitle}</Text>
        <Text style={styles.bodyText}>
          {latest.staffName} | {completedDate} | {evidenceCount} ảnh
        </Text>
        <View style={styles.historyProofRow}>
          <HistoryProofPill icon="location-outline" text={latest.gpsCheck?.verified ? 'GPS hợp lệ' : 'GPS thiếu'} />
          <HistoryProofPill icon="qr-code-outline" text={latest.qrCheck?.verified ? 'QR hợp lệ' : 'QR thiếu'} />
          <HistoryProofPill icon="images-outline" text={`${proofCount}/4 bằng chứng`} />
        </View>
        {latest.gpsCheck ? (
          <Text style={styles.monoSmall}>GPS: {latest.gpsCheck.distance.toFixed(1)}m từ gốc</Text>
        ) : null}
        {latest.notes ? <Text style={styles.bodyText}>Ghi chú: {latest.notes}</Text> : null}
      </View>
    </View>
  );
}

function HistoryProofPill({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.historyProofPill}>
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={styles.historyProofText}>{text}</Text>
    </View>
  );
}

export function InlineTreeEmpty({ title, body }: { title: string; body: string }) {
  return <EmptyState title={title} body={body} icon="leaf-outline" />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  treeFilterPanel: {
    gap: 12,
    backgroundColor: colors.cardWarm,
    borderColor: colors.primaryBorder,
  },
  taskFilterPanel: {
    gap: 12,
    backgroundColor: colors.cardWarm,
    borderColor: colors.border,
  },
  filterMetaRow: {
    gap: 10,
  },
  filterChips: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  resultText: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
  },
  treeAssignmentCard: {
    gap: 12,
  },
  treeImageWrap: {
    height: 164,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundAlt,
  },
  treeImageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  treeMetaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  treeMetaBox: {
    flex: 1,
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
    gap: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    padding: 12,
  },
  historyPreview: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyProofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  historyProofPill: {
    minHeight: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyProofText: {
    color: colors.primaryDark,
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
});
