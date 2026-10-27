import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, layout, radius, spacing, typography, controlSize } from '../theme/tokens';
import { BottomSheetModal, Button, Badge } from './AppPrimitives';

export type ScopeMode = 'single_tree' | 'multi_trees' | 'zone';

export interface TreeScopeItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  species?: string;
  healthStatus?: string;
  zoneId?: string;
}

export interface TreeZoneGroup {
  id: string;
  name: string;
  treeCount: number;
  treeIds: string[];
}

export interface TreeScopeSelection {
  mode: ScopeMode;
  treeIds: string[];
  zoneId?: string;
}

export interface TreeScopeSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  trees: TreeScopeItem[];
  selectedTreeId?: string;
  selectedScope?: TreeScopeSelection;
  onConfirm: (scope: TreeScopeSelection) => void;
}

export function TreeScopeSelectorSheet({
  visible,
  onClose,
  trees,
  selectedTreeId,
  selectedScope,
  onConfirm,
}: TreeScopeSelectorSheetProps) {
  const [activeMode, setActiveMode] = useState<ScopeMode>(selectedScope?.mode || 'single_tree');
  const [singleId, setSingleId] = useState<string>(
    selectedTreeId || (selectedScope?.treeIds && selectedScope.treeIds[0]) || (trees[0]?.id ?? ''),
  );
  const [multiIds, setMultiIds] = useState<Set<string>>(
    new Set(selectedScope?.treeIds?.length ? selectedScope.treeIds : [selectedTreeId || trees[0]?.id].filter(Boolean)),
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>(selectedScope?.zoneId || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Group trees into zones honestly by address/area
  const zones = useMemo<TreeZoneGroup[]>(() => {
    const map = new Map<string, { name: string; treeIds: string[] }>();
    trees.forEach((t) => {
      const zoneKey = t.zoneId || t.address?.trim() || 'Khu vực quản lý chung';
      const existing = map.get(zoneKey);
      if (existing) {
        existing.treeIds.push(t.id);
      } else {
        map.set(zoneKey, { name: zoneKey, treeIds: [t.id] });
      }
    });

    return Array.from(map.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      treeCount: val.treeIds.length,
      treeIds: val.treeIds,
    }));
  }, [trees]);

  // Sync state when opened
  useEffect(() => {
    if (visible) {
      const mode = selectedScope?.mode || 'single_tree';
      setActiveMode(mode);
      const initialId = selectedTreeId || (selectedScope?.treeIds && selectedScope.treeIds[0]) || (trees[0]?.id ?? '');
      setSingleId(initialId);
      setMultiIds(new Set(selectedScope?.treeIds?.length ? selectedScope.treeIds : [initialId].filter(Boolean)));
      setSelectedZoneId(selectedScope?.zoneId || zones[0]?.id || '');
      setSearchQuery('');
    }
  }, [visible, selectedTreeId, selectedScope, trees, zones]);

  // Filtered trees by search
  const filteredTrees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return trees;
    return trees.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.address && t.address.toLowerCase().includes(q)) ||
        (t.species && t.species.toLowerCase().includes(q)),
    );
  }, [trees, searchQuery]);

  // Filtered zones by search
  const filteredZones = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return zones;
    return zones.filter((z) => z.name.toLowerCase().includes(q));
  }, [zones, searchQuery]);

  // Toggle tree in multi-select
  const toggleTreeInMulti = (treeId: string) => {
    setMultiIds((prev) => {
      const next = new Set(prev);
      if (next.has(treeId)) {
        if (next.size > 1) next.delete(treeId); // keep at least 1
      } else {
        next.add(treeId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setMultiIds(new Set(trees.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    if (trees[0]?.id) {
      setMultiIds(new Set([trees[0].id]));
    }
  };

  const handleConfirm = () => {
    if (activeMode === 'single_tree') {
      if (!singleId) return;
      onConfirm({
        mode: 'single_tree',
        treeIds: [singleId],
      });
    } else if (activeMode === 'multi_trees') {
      const ids = Array.from(multiIds);
      if (!ids.length) return;
      onConfirm({
        mode: 'multi_trees',
        treeIds: ids,
      });
    } else if (activeMode === 'zone') {
      const zone = zones.find((z) => z.id === selectedZoneId) || zones[0];
      if (!zone) return;
      onConfirm({
        mode: 'zone',
        zoneId: zone.id,
        treeIds: zone.treeIds,
      });
    }
  };

  const canConfirm =
    activeMode === 'single_tree' ? Boolean(singleId) : activeMode === 'multi_trees' ? multiIds.size > 0 : Boolean(selectedZoneId);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Chọn cây mục tiêu"
      subtitle="Chọn 1 cây đơn lẻ, Chọn nhiều cây hoặc theo Khu vực"
      maxHeight="88%"
    >
      <View style={styles.sheetContainer}>
        {/* Mode Segmented Controls */}
        <View style={styles.segmentBar}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'single_tree' }}
            onPress={() => setActiveMode('single_tree')}
            style={[styles.segmentTab, activeMode === 'single_tree' && styles.segmentTabActive]}
          >
            <Ionicons
              name="radio-button-on-outline"
              size={15}
              color={activeMode === 'single_tree' ? colors.primaryDark : colors.pewter}
            />
            <Text style={[styles.segmentText, activeMode === 'single_tree' && styles.segmentTextActive]}>1 Cây</Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'multi_trees' }}
            onPress={() => setActiveMode('multi_trees')}
            style={[styles.segmentTab, activeMode === 'multi_trees' && styles.segmentTabActive]}
          >
            <Ionicons
              name="checkbox-outline"
              size={15}
              color={activeMode === 'multi_trees' ? colors.primaryDark : colors.pewter}
            />
            <Text style={[styles.segmentText, activeMode === 'multi_trees' && styles.segmentTextActive]}>Nhiều cây</Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'zone' }}
            onPress={() => setActiveMode('zone')}
            style={[styles.segmentTab, activeMode === 'zone' && styles.segmentTabActive]}
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={activeMode === 'zone' ? colors.primaryDark : colors.pewter}
            />
            <Text style={[styles.segmentText, activeMode === 'zone' && styles.segmentTextActive]}>Khu vực</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.pewter} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeMode === 'zone' ? 'Tìm theo tên khu vực, tuyến đường...' : 'Tìm tên cây, số hiệu, địa chỉ...'}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.pewter} />
            </Pressable>
          ) : null}
        </View>

        {/* Multi-tree Actions Header */}
        {activeMode === 'multi_trees' ? (
          <View style={styles.multiActionRow}>
            <Text style={styles.selectedCountText}>Đã chọn: {multiIds.size} cây</Text>
            <View style={styles.actionButtons}>
              <Pressable accessibilityRole="button" onPress={handleSelectAll} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Chọn tất cả</Text>
              </Pressable>
              <Text style={styles.dividerDot}>•</Text>
              <Pressable accessibilityRole="button" onPress={handleDeselectAll} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Bỏ chọn</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* List: Trees or Zones */}
        {activeMode === 'zone' ? (
          <FlatList
            data={filteredZones}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.treeList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={32} color={colors.pewter} />
                <Text style={styles.emptyText}>Không tìm thấy khu vực nào phù hợp.</Text>
              </View>
            }
            renderItem={({ item: zone }) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedZoneId(zone.id)}
                  style={[styles.treeRow, isSelected && styles.treeRowSelected]}
                >
                  <View style={[styles.treeIconCircle, isSelected && styles.treeIconCircleSelected]}>
                    <Ionicons name="location" size={18} color={isSelected ? colors.primaryDark : colors.pewter} />
                  </View>

                  <View style={styles.treeInfo}>
                    <View style={styles.treeNameRow}>
                      <Text style={[styles.treeName, isSelected && styles.treeNameSelected]} numberOfLines={1}>
                        {zone.name}
                      </Text>
                      <Badge tone={isSelected ? 'green' : 'neutral'}>{zone.treeCount} cây</Badge>
                    </View>
                    <Text style={styles.treeMeta} numberOfLines={1}>
                      Bao gồm toàn bộ {zone.treeCount} cây trong khu vực này
                    </Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredTrees}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.treeList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="leaf-outline" size={32} color={colors.pewter} />
                <Text style={styles.emptyText}>Không tìm thấy cây nào phù hợp.</Text>
              </View>
            }
            renderItem={({ item: tree }) => {
              const isSelected = activeMode === 'single_tree' ? singleId === tree.id : multiIds.has(tree.id);
              return (
                <Pressable
                  accessibilityRole={activeMode === 'single_tree' ? 'radio' : 'checkbox'}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    if (activeMode === 'single_tree') {
                      setSingleId(tree.id);
                    } else {
                      toggleTreeInMulti(tree.id);
                    }
                  }}
                  style={[styles.treeRow, isSelected && styles.treeRowSelected]}
                >
                  <View style={[styles.treeIconCircle, isSelected && styles.treeIconCircleSelected]}>
                    <Ionicons name="leaf" size={18} color={isSelected ? colors.primaryDark : colors.pewter} />
                  </View>

                  <View style={styles.treeInfo}>
                    <View style={styles.treeNameRow}>
                      <Text style={[styles.treeName, isSelected && styles.treeNameSelected]} numberOfLines={1}>
                        {tree.name}
                      </Text>
                      <Badge tone="neutral">{tree.code}</Badge>
                    </View>
                    <Text style={styles.treeMeta} numberOfLines={1}>
                      {tree.species ? `${tree.species} • ` : ''}
                      {tree.address ?? 'Khu vực quản lý'}
                    </Text>
                  </View>

                  {activeMode === 'single_tree' ? (
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                  ) : (
                    <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                      {isSelected ? <Ionicons name="checkmark" size={14} color={colors.snowWhite} /> : null}
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        )}

        {/* Footer Actions */}
        <View style={styles.footerBar}>
          <Button
            variant="forest"
            size="field"
            disabled={!canConfirm}
            onPress={handleConfirm}
            accessibilityLabel="Áp dụng phạm vi"
          >
            Áp dụng phạm vi
          </Button>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xs,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.control,
    padding: 3,
    marginBottom: spacing.sm,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.compact,
    gap: 4,
  },
  segmentTabActive: {
    backgroundColor: colors.card,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...typography.metadata,
    color: colors.pewter,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlSize.field,
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.ink,
    padding: 0,
  },
  multiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  selectedCountText: {
    ...typography.label,
    color: colors.primaryDark,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  linkButtonText: {
    ...typography.metadata,
    color: colors.infoText,
    fontWeight: '600',
  },
  dividerDot: {
    color: colors.muted,
  },
  treeList: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: spacing.md,
  },
  treeRowSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  treeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeIconCircleSelected: {
    backgroundColor: colors.snowWhite,
  },
  treeInfo: {
    flex: 1,
    gap: 3,
  },
  treeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  treeName: {
    ...typography.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  treeNameSelected: {
    color: colors.primaryDark,
  },
  treeMeta: {
    ...typography.metadata,
    color: colors.pewter,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.neutralBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.neutralBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkboxBoxSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.pewter,
  },
  footerBar: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.snowWhite,
  },
});
