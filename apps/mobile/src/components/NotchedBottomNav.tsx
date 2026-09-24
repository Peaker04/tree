import React from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { colors, controlSize, elevation, radius, spacing, typography } from '../theme/tokens';

export type NavigationIcon = React.ComponentProps<typeof Ionicons>['name'];
export type NavigationItem = { id: string; label: string; icon: NavigationIcon };
export type NavigationFabItem = { id: string; icon: NavigationIcon | 'CUSTOM_SCAN' };

export const LOCKED_BOTTOM_NAV_LABELS = [
  'Trang chủ',
  'Cây của tôi',
  'Công việc',
  'Tài khoản',
  'Tổng quan',
  'Giao việc',
  'Duyệt',
] as const;

function ScanIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
    </Svg>
  );
}

export function NotchedBottomNav({
  leftItems,
  rightItems,
  fabItem,
  activeId,
  onPress,
}: {
  leftItems: NavigationItem[];
  rightItems: NavigationItem[];
  fabItem: NavigationFabItem;
  activeId: string;
  onPress: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const barHeight = Platform.OS === 'ios' ? 82 : 72;
  const center = width / 2;
  const notchRadius = 32;
  const path = `M0 0 H${center - 52} C${center - 30} 0 ${center - 33} ${notchRadius} ${center} ${notchRadius} C${center + 33} ${notchRadius} ${center + 30} 0 ${center + 52} 0 H${width} V${barHeight} H0 Z`;

  return (
    <View style={[styles.wrapper, { height: barHeight }]}>
      <Svg
        pointerEvents="none"
        width={width}
        height={barHeight}
        viewBox={`0 0 ${width} ${barHeight}`}
        style={styles.background}
      >
        <Path d={path} fill={colors.card} stroke={colors.hairlineBorder} strokeWidth={1} />
      </Svg>

      <View style={styles.fabSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quét mã QR"
          accessibilityState={{ selected: activeId === fabItem.id }}
          onPress={() => onPress(fabItem.id)}
          style={({ pressed }) => [styles.fab, activeId === fabItem.id && styles.fabActive, pressed && styles.pressed]}
        >
          {fabItem.icon === 'CUSTOM_SCAN' ? (
            <ScanIcon color={colors.snowWhite} size={26} />
          ) : (
            <Ionicons name={fabItem.icon} size={26} color={colors.snowWhite} />
          )}
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.side}>
          {leftItems.map((item) => (
            <NavItem key={item.id} item={item} active={activeId === item.id} onPress={onPress} />
          ))}
        </View>
        <View style={styles.centerGap} />
        <View style={styles.side}>
          {rightItems.map((item) => (
            <NavItem key={item.id} item={item} active={activeId === item.id} onPress={onPress} />
          ))}
        </View>
      </View>
    </View>
  );
}

function NavItem({ item, active, onPress }: { item: NavigationItem; active: boolean; onPress: (id: string) => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Ionicons name={item.icon} size={22} color={active ? colors.primaryDark : colors.muted} />
      <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.label, active && styles.labelActive]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: elevation.navigation,
    elevation: elevation.navigation,
  },
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 14 : spacing.sm,
  },
  side: { flex: 1, flexDirection: 'row' },
  centerGap: { width: 64 },
  item: {
    flex: 1,
    minHeight: controlSize.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  label: { ...typography.metadata, color: colors.muted, textAlign: 'center' },
  labelActive: { color: colors.primaryDark, fontWeight: '600' },
  fabSlot: { position: 'absolute', top: -27, alignSelf: 'center', zIndex: 2 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActive: { backgroundColor: colors.forestDepths },
  pressed: { opacity: 0.72 },
});
