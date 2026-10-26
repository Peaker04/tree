import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing, typography, controlSize } from '../theme/tokens';
import { BottomSheetModal, Button, Badge } from './AppPrimitives';

export type ScopeMode = 'single_tree' | 'multi_trees';

export interface TreeScopeItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  species?: string;
  healthStatus?: string;
}

export interface TreeScopeSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  trees: TreeScopeItem[];
  selectedTreeId?: string;
  selectedScope?: {
    mode?: ScopeMode;
    treeIds?: string[];
  };
  onConfirm: (scope: { mode: ScopeMode; treeIds: string[] }) => void;
}

export function TreeScopeSelectorSheet({
  visible,
  onClose,
  trees,
  selectedTreeId,
  selectedScope,
  onConfirm,
}: TreeScopeSelectorSheetProps) {
  const initialSelected = selectedTreeId || (selectedScope?.treeIds && selectedScope.treeIds[0]) || '';
  const [selectedId, setSelectedId] = useState<string>(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state on open
  useEffect(() => {
    if (visible) {
      setSelectedId(selectedTreeId || (selectedScope?.treeIds && selectedScope.treeIds[0]) || (trees[0]?.id ?? ''));
      setSearchQuery('');
    }
  }, [visible, selectedTreeId, selectedScope, trees]);

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

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm({
      mode: 'single_tree',
      treeIds: [selectedId],
    });
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Chọn cây mục tiêu"
      subtitle="Chọn 1 cây đơn lẻ hoặc Chọn nhiều cây trong Khu vực quản lý"
      maxHeight="88%"
    >
      <View style={styles.sheetContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.pewter} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên cây, số hiệu hoặc địa chỉ..."
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

        {/* Trees FlatList */}
        <FlatList
          data={filteredTrees}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.treeList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={32} color={colors.pewter} />
              <Text style={styles.emptyText}>Không tìm thấy cây nào phù hợp.</Text>
            </View>
          }
          renderItem={({ item: tree }) => {
            const isSelected = selectedId === tree.id;
            return (
              <Pressable
                key={tree.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedId(tree.id)}
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
                    <Badge tone="soft">{tree.code}</Badge>
                  </View>
                  <Text style={styles.treeMeta} numberOfLines={1}>
                    {tree.species ? `${tree.species} • ` : ''}
                    {tree.address ?? 'Khu vực quản lý'}
                  </Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          }}
        />

        {/* Footer Actions */}
        <View style={styles.footerBar}>
          <Button
            variant="forest"
            size="field"
            disabled={!selectedId}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlSize.field,
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.ink,
    padding: 0,
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
