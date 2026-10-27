import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { PressableScale } from './AppPrimitives';
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

export const FAB_PROTRUSION = 28;
export const BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 64;

export function useBottomNavPadding(extraGap: number = spacing.xl): number {
  const insets = useSafeAreaInsets();
  const isAndroid3Key = Platform.OS === 'android' && insets.bottom >= 40;
  const bottomPadding = isAndroid3Key ? insets.bottom : Platform.OS === 'ios' ? insets.bottom : 0;
  return BASE_BAR_HEIGHT + bottomPadding + extraGap;
}

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Phân biệt 3 phím ảo (insets.bottom >= 40) và cử chỉ vuốt (insets.bottom < 40)
  const isAndroid3Key = Platform.OS === 'android' && insets.bottom >= 40;
  const bottomPadding = isAndroid3Key ? insets.bottom : Platform.OS === 'ios' ? insets.bottom : 0;

  const totalContainerHeight = BASE_BAR_HEIGHT + FAB_PROTRUSION + bottomPadding;
  const center = width / 2;
  const notchRadius = 32;
  const path = `M0 0 H${center - 52} C${center - 30} 0 ${center - 33} ${notchRadius} ${center} ${notchRadius} C${center + 33} ${notchRadius} ${center + 30} 0 ${center + 52} 0 H${width} V${BASE_BAR_HEIGHT} H0 Z`;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.rootContainer,
        {
          height: totalContainerHeight,
        },
      ]}
    >
      {/* 1. Bar Container neo cố định ở đáy, chiều cao = thanh bar + bottomPadding */}
      <View
        pointerEvents="box-none"
        style={[
          styles.barWrapper,
          {
            height: BASE_BAR_HEIGHT + bottomPadding,
          },
        ]}
      >
        {/* SVG khuyết nguyên bản */}
        <Svg
          pointerEvents="none"
          width={width}
          height={BASE_BAR_HEIGHT}
          viewBox={`0 0 ${width} ${BASE_BAR_HEIGHT}`}
          style={styles.backgroundSvg}
        >
          <Path d={path} fill={colors.card} stroke={colors.hairlineBorder} strokeWidth={1} />
        </Svg>

        {/* View lót đáy cùng màu card để lấp kín phần nền dưới thanh 3 phím Android */}
        {bottomPadding > 0 ? (
          <View
            style={[
              styles.bottomFiller,
              {
                top: BASE_BAR_HEIGHT - 1,
                height: bottomPadding + 1,
                backgroundColor: colors.card,
              },
            ]}
          />
        ) : null}

        {/* Hàng chứa các tab điều hướng, đẩy icon/chữ lên trên qua paddingBottom */}
        <View
          style={[
            styles.content,
            {
              height: BASE_BAR_HEIGHT + bottomPadding,
              paddingBottom: bottomPadding,
            },
          ]}
        >
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

      {/* 2. Nút FAB trung tâm: đặt ở top: 0 của Root Container (hoàn toàn nằm trong View cha) */}
      <View style={styles.fabSlot}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Quét mã QR"
          accessibilityState={{ selected: activeId === fabItem.id }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => onPress(fabItem.id)}
          scaleTo={0.92}
          style={[styles.fab, activeId === fabItem.id && styles.fabActive]}
        >
          {fabItem.icon === 'CUSTOM_SCAN' ? (
            <ScanIcon color={colors.snowWhite} size={26} />
          ) : (
            <Ionicons name={fabItem.icon} size={26} color={colors.snowWhite} />
          )}
        </PressableScale>
      </View>
    </View>
  );
}

function NavItem({ item, active, onPress }: { item: NavigationItem; active: boolean; onPress: (id: string) => void }) {
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
      onPress={() => onPress(item.id)}
      scaleTo={0.93}
      style={styles.item}
    >
      <Ionicons name={item.icon} size={22} color={active ? colors.primaryDark : colors.muted} />
      <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.label, active && styles.labelActive]}>
        {item.label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  barWrapper: {
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
  backgroundSvg: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
  bottomFiller: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: spacing.sm,
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
  fabSlot: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 20,
  },
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
