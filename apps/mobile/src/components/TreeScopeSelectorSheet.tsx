import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing, typography, controlSize } from '../theme/tokens';
import { BottomSheetModal, Button } from './AppPrimitives';

export type ScopeMode = 'zone' | 'multi_trees' | 'single_tree';

export interface TreeScopeItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  zoneId?: string;
  zoneName?: string;
}

export interface ZoneOption {
  id: string;
  name: string;
  treeCount: number;
  description?: string;
}

export interface TreeScopeSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  trees: TreeScopeItem[];
  zones?: ZoneOption[];
  selectedScope?: {
    mode: ScopeMode;
    zoneId?: string;
    treeIds: string[];
  };
  onConfirm: (scope: { mode: ScopeMode; zoneId?: string; treeIds: string[] }) => void;
}

export function TreeScopeSelectorSheet({
  visible,
  onClose,
  trees,
  zones: propZones,
  selectedScope,
  onConfirm,
}: TreeScopeSelectorSheetProps) {
  const [activeMode, setActiveMode] = useState<ScopeMode>(selectedScope?.mode || 'zone');
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(selectedScope?.zoneId);
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>(selectedScope?.treeIds || []);
  const [searchQuery, setSearchQuery] = useState('');

  // Infer zones from trees if not explicitly provided
  const derivedZones: ZoneOption[] = useMemo(() => {
    if (propZones && propZones.length > 0) return propZones;
    const zoneMap = new Map<string, { name: string; count: number }>();
    trees.forEach((t) => {
      const zId = t.zoneId || 'ZONE-DEFAULT';
      const zName = t.zoneName || 'Khu vực Trung tâm';
      const curr = zoneMap.get(zId) || { name: zName, count: 0 };
      curr.count += 1;
      zoneMap.set(zId, curr);
    });
    return Array.from(zoneMap.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      treeCount: val.count,
    }));
  }, [propZones, trees]);

  // Sync state on open
  useEffect(() => {
    if (visible) {
      const mode = selectedScope?.mode || (derivedZones.length > 0 ? 'zone' : 'multi_trees');
      setActiveMode(mode);
      setSelectedZoneId(selectedScope?.zoneId || derivedZones[0]?.id);
      setSelectedTreeIds(selectedScope?.treeIds || (trees[0] ? [trees[0].id] : []));
      setSearchQuery('');
    }
  }, [visible, selectedScope, derivedZones, trees]);

  // When zone is selected in 'zone' mode, auto-select all trees in that zone
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const treesInZone = trees.filter((t) => (t.zoneId || 'ZONE-DEFAULT') === zoneId);
    setSelectedTreeIds(treesInZone.map((t) => t.id));
  };

  const handleToggleTree = (treeId: string) => {
    if (activeMode === 'single_tree') {
      setSelectedTreeIds([treeId]);
    } else {
      if (selectedTreeIds.includes(treeId)) {
        setSelectedTreeIds(selectedTreeIds.filter((id) => id !== treeId));
      } else {
        setSelectedTreeIds([...selectedTreeIds, treeId]);
      }
    }
  };

  const handleSelectAllFiltered = (filteredTreeIds: string[]) => {
    const combined = Array.from(new Set([...selectedTreeIds, ...filteredTreeIds]));
    setSelectedTreeIds(combined);
  };

  const handleDeselectAllFiltered = (filteredTreeIds: string[]) => {
    setSelectedTreeIds(selectedTreeIds.filter((id) => !filteredTreeIds.includes(id)));
  };

  // Filtered trees by search
  const filteredTrees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return trees;
    return trees.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.address && t.address.toLowerCase().includes(q)),
    );
  }, [trees, searchQuery]);

  const handleConfirm = () => {
    if (selectedTreeIds.length === 0) return;
    onConfirm({
      mode: activeMode,
      zoneId: activeMode === 'zone' ? selectedZoneId : undefined,
      treeIds: selectedTreeIds,
    });
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Phạm vi cây chăm sóc"
      subtitle="Điều phối theo khu vực tập trung hoặc danh sách cây"
      maxHeight="92%"
    >
      <View style={styles.container}>
        {/* Scope Mode Segmented Bar */}
        <View style={styles.modeTabs}>
          <Pressable
            accessibilityRole="button"
            style={[styles.modeTab, activeMode === 'zone' && styles.modeTabActive]}
            onPress={() => {
              setActiveMode('zone');
              if (selectedZoneId) handleSelectZone(selectedZoneId);
            }}
          >
            <Ionicons
              name="location-outline"
              size={16}
              color={activeMode === 'zone' ? colors.snowWhite : colors.pewter}
            />
            <Text style={[styles.modeTabText, activeMode === 'zone' && styles.modeTabTextActive]}>Khu vực</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[styles.modeTab, activeMode === 'multi_trees' && styles.modeTabActive]}
            onPress={() => setActiveMode('multi_trees')}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={activeMode === 'multi_trees' ? colors.snowWhite : colors.pewter}
            />
            <Text style={[styles.modeTabText, activeMode === 'multi_trees' && styles.modeTabTextActive]}>
              Chọn nhiều cây
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[styles.modeTab, activeMode === 'single_tree' && styles.modeTabActive]}
            onPress={() => {
              setActiveMode('single_tree');
              if (selectedTreeIds.length > 1) {
                setSelectedTreeIds([selectedTreeIds[0]]);
              }
            }}
          >
            <Ionicons
              name="leaf-outline"
              size={16}
              color={activeMode === 'single_tree' ? colors.snowWhite : colors.pewter}
            />
            <Text style={[styles.modeTabText, activeMode === 'single_tree' && styles.modeTabTextActive]}>
              1 cây đơn lẻ
            </Text>
          </Pressable>
        </View>

        {/* Content based on Active Mode */}
        {activeMode === 'zone' ? (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <View style={styles.zoneList}>
              {derivedZones.map((z) => {
                const isSelected = selectedZoneId === z.id;
                return (
                  <Pressable
                    key={z.id}
                    accessibilityRole="button"
                    onPress={() => handleSelectZone(z.id)}
                    style={[styles.zoneCard, isSelected && styles.zoneCardActive]}
                  >
                    <View style={styles.zoneHeader}>
                      <View style={styles.zoneIconCircle}>
                        <Ionicons
                          name="business-outline"
                          size={20}
                          color={isSelected ? colors.primaryDark : colors.pewter}
                        />
                      </View>
                      <View style={styles.zoneInfo}>
                        <Text style={styles.zoneName}>{z.name}</Text>
                        <Text style={styles.zoneMeta}>{z.treeCount} cây trong khu vực</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={22}
                        color={isSelected ? colors.primaryDark : colors.pewter}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.treeSelectionContainer}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.pewter} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm mã cây, tên loài, địa chỉ..."
                placeholderTextColor={colors.pewter}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.pewter} />
                </Pressable>
              ) : null}
            </View>

            {/* Quick action bar for multi_trees */}
            {activeMode === 'multi_trees' ? (
              <View style={styles.batchActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelectAllFiltered(filteredTrees.map((t) => t.id))}
                >
                  <Text style={styles.batchActionText}>Chọn tất cả ({filteredTrees.length})</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleDeselectAllFiltered(filteredTrees.map((t) => t.id))}
                >
                  <Text style={styles.batchActionText}>Bỏ chọn</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Tree List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
              <View style={styles.treeList}>
                {filteredTrees.map((tree) => {
                  const isChecked = selectedTreeIds.includes(tree.id);
                  const displayCode =
                    tree.code && tree.code.length > 10 ? `#${tree.code.slice(-4).toUpperCase()}` : tree.code;
                  return (
                    <Pressable
                      key={tree.id}
                      accessibilityRole="button"
                      onPress={() => handleToggleTree(tree.id)}
                      style={[styles.treeCard, isChecked && styles.treeCardActive]}
                    >
                      <View style={styles.treeCardBody}>
                        <View style={styles.treeHeader}>
                          {displayCode ? (
                            <View style={styles.treeCodeBadge}>
                              <Text style={styles.treeCodeText}>{displayCode}</Text>
                            </View>
                          ) : null}
                          <Text style={styles.treeName} numberOfLines={1} ellipsizeMode="tail">
                            {tree.name}
                          </Text>
                        </View>
                        {tree.address ? (
                          <Text style={styles.treeAddress} numberOfLines={1} ellipsizeMode="tail">
                            {tree.address}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name={
                          activeMode === 'single_tree'
                            ? isChecked
                              ? 'radio-button-on'
                              : 'radio-button-off'
                            : isChecked
                              ? 'checkbox'
                              : 'square-outline'
                        }
                        size={22}
                        color={isChecked ? colors.primaryDark : colors.pewter}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Footer Summary & Confirm */}
        <View style={styles.footerContainer}>
          <View style={styles.summaryBadgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="leaf" size={14} color={colors.primaryDark} />
              <Text style={styles.badgePillText}>Đã chọn: {selectedTreeIds.length} cây</Text>
            </View>
            {activeMode === 'zone' && selectedZoneId ? (
              <Text style={styles.zoneSummaryLabel} numberOfLines={1}>
                {derivedZones.find((z) => z.id === selectedZoneId)?.name}
              </Text>
            ) : null}
          </View>

          <Button
            variant="primary"
            size="field"
            disabled={selectedTreeIds.length === 0}
            onPress={handleConfirm}
            style={styles.confirmBtn}
          >
            Áp dụng phạm vi ({selectedTreeIds.length} cây)
          </Button>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 520,
    gap: spacing.md,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  modeTabActive: {
    backgroundColor: colors.forestDepths,
  },
  modeTabText: {
    ...typography.metadata,
    color: colors.pewter,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: colors.snowWhite,
  },
  scrollArea: {
    maxHeight: 320,
  },
  zoneList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  zoneCard: {
    minHeight: 56,
    backgroundColor: colors.cardWarm,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  zoneCardActive: {
    backgroundColor: colors.successSurface,
    borderColor: colors.willowGreen,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  zoneIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  zoneMeta: {
    ...typography.metadata,
    color: colors.pewter,
    marginTop: 2,
  },
  treeSelectionContainer: {
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },
  batchActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  batchActionText: {
    ...typography.metadata,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  treeList: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  treeCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.control,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: spacing.sm,
  },
  treeCardActive: {
    backgroundColor: colors.successSurface,
    borderColor: colors.willowGreen,
  },
  treeCardBody: {
    flex: 1,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  treeCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  treeCodeText: {
    ...typography.metadata,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  treeName: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 14,
    flex: 1,
  },
  treeAddress: {
    ...typography.metadata,
    color: colors.pewter,
    marginTop: 2,
  },
  footerContainer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.successSurface,
  },
  badgePillText: {
    ...typography.metadata,
    color: colors.forestDepths,
    fontWeight: '600',
  },
  zoneSummaryLabel: {
    ...typography.metadata,
    color: colors.pewter,
    maxWidth: '55%',
  },
  confirmBtn: {
    minHeight: controlSize.field,
  },
});
