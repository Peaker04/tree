import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, BottomSheetModal, Button } from './AppPrimitives';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { Tree } from '../types';

export interface ManualTreeCodeModalProps {
  visible: boolean;
  onClose: () => void;
  trees: Tree[];
  activeTree?: Tree | null;
  onSelectTreeCode: (scannedCode: string, isManualFallback?: boolean) => void;
}

export function ManualTreeCodeModal({
  visible,
  onClose,
  trees,
  activeTree,
  onSelectTreeCode,
}: ManualTreeCodeModalProps) {
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toUpperCase();

  const filteredTrees = useMemo(() => {
    if (!trimmedQuery) {
      return activeTree ? [activeTree] : trees.slice(0, 5);
    }
    return trees.filter((tree) => {
      const matchId = tree.id.toUpperCase().includes(trimmedQuery);
      const matchQr = (tree.qrCode || '').toUpperCase().includes(trimmedQuery);
      const matchName = tree.name.toUpperCase().includes(trimmedQuery);
      return matchId || matchQr || matchName;
    });
  }, [activeTree, trees, trimmedQuery]);

  const handleConfirm = useCallback((tree: Tree) => {
    onSelectTreeCode(tree.qrCode || tree.id, true);
    setQuery('');
    onClose();
  }, [onClose, onSelectTreeCode]);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.headerContainer}>
        {activeTree ? (
          <View style={styles.activeTaskTreeCard}>
            <View style={styles.activeTaskTreeHeader}>
              <Ionicons name="leaf-outline" size={18} color={colors.primary} />
              <Text style={styles.activeTaskTreeTitle}>Cây theo nhiệm vụ hiện tại</Text>
              <Badge tone="green">Được giao</Badge>
            </View>
            <Text style={styles.treeName}>{activeTree.name}</Text>
            <Text style={styles.treeMeta}>
              Mã: {activeTree.id} · QR: {activeTree.qrCode || 'Chưa gắn'}
            </Text>
            <Button
              variant="primary"
              size="compact"
              icon="checkmark-circle-outline"
              onPress={() => handleConfirm(activeTree)}
              accessibilityLabel={`Xác nhận cây nhiệm vụ ${activeTree.name}`}
            >
              Xác nhận đúng cây này
            </Button>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>
          {trimmedQuery ? `Kết quả tìm kiếm (${filteredTrees.length})` : 'Gợi ý danh mục cây'}
        </Text>
      </View>
    );
  }, [activeTree, filteredTrees.length, handleConfirm, trimmedQuery]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      title="Nhập mã cây thủ công"
      subtitle="Sử dụng khi mã QR bị mờ, rách hoặc camera không nhận diện"
      maxHeight="85%"
    >
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập mã cây (VD: TRE-DEV-01, QR-DEV-01)..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Ô nhập mã cây thủ công"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa ô nhập mã"
              hitSlop={10}
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filteredTrees}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => {
            const isMatchActive = activeTree?.id === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Chọn mã cây ${item.name}`}
                style={styles.treeItem}
                onPress={() => handleConfirm(item)}
              >
                <View style={styles.treeItemInfo}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    Mã: {item.id} · {item.species || 'Chưa phân loài'} · {item.address || 'Khu vực quản lý'}
                  </Text>
                </View>
                <Ionicons
                  name={isMatchActive ? 'checkmark-circle' : 'chevron-forward'}
                  size={20}
                  color={isMatchActive ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy cây khớp với mã "{query}".</Text>
              <Text style={styles.emptyHint}>Vui lòng kiểm tra lại ký tự hoặc liên hệ Giám sát cấp mã mới.</Text>
            </View>
          }
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    flex: 1,
    minHeight: 280,
  },
  headerContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...typography.body,
    color: colors.foreground,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  activeTaskTreeCard: {
    backgroundColor: colors.successSurface,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  activeTaskTreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeTaskTreeTitle: {
    ...typography.label,
    color: colors.primaryDark,
    flex: 1,
  },
  treeName: {
    ...typography.title,
    fontSize: 16,
    color: colors.foreground,
  },
  treeMeta: {
    ...typography.metadata,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    ...typography.label,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  treeItemInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  itemSub: {
    ...typography.metadata,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.metadata,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
