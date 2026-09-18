import React from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

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

const CustomScanIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <Path d="M7 12h10" />
  </Svg>
);

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
  const height = 68;
  const center = width / 2;
  const radius = 36;
  const path = `M 0 0 L ${center - 55} 0 C ${center - 25} 0, ${center - 35} ${radius}, ${center} ${radius} C ${center + 35} ${radius}, ${center + 25} 0, ${center + 55} 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={styles.notchedNavWrapper}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path d={path} fill={colors.card} stroke={colors.primaryBorder} strokeWidth={1.2} />
        </Svg>
        <View style={[styles.topBorderSegment, { left: 0, width: center - 54 }]} />
        <View style={[styles.topBorderSegment, { right: 0, width: center - 54 }]} />
      </View>
      <View style={styles.fabContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quét mã QR"
          accessibilityState={{ selected: activeId === fabItem.id }}
          style={[styles.fabButton, activeId === fabItem.id && styles.fabButtonActive]}
          onPress={() => onPress(fabItem.id)}
        >
          {fabItem.icon === 'CUSTOM_SCAN' ? (
            <CustomScanIcon color="#fff" size={28} />
          ) : (
            <Ionicons name={fabItem.icon} size={28} color="#fff" />
          )}
        </Pressable>
      </View>
      <View style={[styles.notchedBarContent, { width, height }]}>
        <View style={styles.notchedBarSide}>
          {leftItems.map((item) => (
            <NavSideItem key={item.id} item={item} active={activeId === item.id} onPress={onPress} />
          ))}
        </View>
        <View style={styles.notchSpacer} />
        <View style={styles.notchedBarSide}>
          {rightItems.map((item) => (
            <NavSideItem key={item.id} item={item} active={activeId === item.id} onPress={onPress} />
          ))}
        </View>
      </View>
    </View>
  );
}

function NavSideItem({
  item,
  active,
  onPress,
}: {
  item: NavigationItem;
  active: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      style={styles.notchedNavItem}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.notchedNavIconShell}>
        <Ionicons name={item.icon} size={22} color={active ? colors.primaryDark : colors.muted} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.notchedNavLabel, active && styles.notchedNavLabelActive]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notchedNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 18,
  },
  topBorderSegment: {
    position: 'absolute',
    top: 0,
    height: 1,
    backgroundColor: colors.primaryBorder,
  },
  fabContainer: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    zIndex: 10,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 14,
  },
  fabButtonActive: {
    backgroundColor: colors.brandForest,
    shadowOpacity: 0.5,
  },
  notchedBarContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingBottom: Platform.OS === 'android' ? 10 : 4,
    paddingHorizontal: 6,
  },
  notchedBarSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  notchSpacer: {
    width: 60,
  },
  notchedNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 2,
    position: 'relative',
  },
  notchedNavIconShell: {
    width: 34,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchedNavLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    maxWidth: '100%',
    textAlign: 'center',
  },
  notchedNavLabelActive: {
    color: colors.primaryDark,
  },
});
