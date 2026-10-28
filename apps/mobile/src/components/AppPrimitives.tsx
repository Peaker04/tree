import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  DimensionValue,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, controlSize, layout, radius, spacing, typography } from '../theme/tokens';
import { NovyxMark } from './NovyxMark';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type CardTone = 'default' | 'soft' | 'dark' | 'green' | 'sky' | 'danger' | 'amber' | 'flat' | 'warm';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'forest';
export type ButtonSize = 'default' | 'compact' | 'field';
export type BadgeTone = 'green' | 'sky' | 'amber' | 'danger' | 'slate' | 'lime' | 'accent' | 'specimen' | 'neutral';

export const primitiveContract = {
  surface: { defaultElevation: 0, nesting: 'prohibited' },
  button: { primaryActionsPerContext: 1, minimumTouchTarget: controlSize.minimumTouchTarget },
  badge: { oneLine: true, internalEnumsProhibited: true },
  field: { visibleLabelRequired: true, errorOwnedByContext: true },
} as const;

export function Screen({
  children,
  scroll = true,
  bottomNav = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bottomNav?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const contentStyle = [styles.screenContent, bottomNav && styles.screenContentWithNav, style];
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={contentStyle}>
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
  dark = false,
  borderBottom = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  dark?: boolean;
  borderBottom?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screenHeaderWrap,
        { paddingTop: insets.top },
        dark && styles.screenHeaderDark,
        borderBottom && styles.screenHeaderBorder,
      ]}
    >
      <View style={styles.screenHeader}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack}
            style={[styles.headerButton, dark && styles.headerButtonDark]}
          >
            <Ionicons name="chevron-back" size={22} color={dark ? colors.snowWhite : colors.ink} />
          </Pressable>
        ) : null}
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[styles.screenTitle, dark && styles.screenTitleDark]}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.screenSubtitle, dark && styles.screenSubtitleDark]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: CardTone;
}) {
  return <View style={[styles.surface, styles[`surface_${tone}`], style]}>{children}</View>;
}

export function BrandMark({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <View style={styles.brandMark}>
      <View style={styles.brandIcon}>
        <NovyxMark size={compact ? 22 : 26} color={colors.brandForest} accentColor={colors.brandOlive} />
      </View>
      <View>
        <Text style={[styles.brandText, compact && styles.brandTextCompact, dark && styles.textOnDark]}>NOVYX</Text>
        {!compact ? <Text style={[styles.brandSub, dark && styles.textOnDarkMuted]}>GreenOps</Text> : null}
      </View>
    </View>
  );
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'default',
  pill = false,
  icon,
  disabled,
  loading,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const foreground =
    variant === 'primary' || variant === 'forest'
      ? colors.snowWhite
      : variant === 'danger'
        ? colors.criticalText
        : colors.ink;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          styles[`button_${variant}`],
          styles[`buttonSize_${size}`],
          pill && styles.pill,
          (disabled || loading) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {loading ? <ActivityIndicator color={foreground} size="small" /> : null}
        {!loading && icon ? <Ionicons name={icon} size={18} color={foreground} /> : null}
        <Text numberOfLines={size === 'field' ? 2 : 1} style={[styles.buttonText, { color: foreground }]}>
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function AnimatedScreenTransition({
  screenKey,
  children,
  style,
}: {
  screenKey?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    fadeAnim.setValue(0.7);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [screenKey, fadeAnim]);

  return <Animated.View style={[{ flex: 1, opacity: fadeAnim }, style]}>{children}</Animated.View>;
}

export function Badge({
  children,
  tone = 'green',
  pill = true,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  pill?: boolean;
}) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`], pill && styles.pill]}>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {children}
      </Text>
    </View>
  );
}

export function Field({
  label,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  style,
  ...props
}: TextInputProps & {
  label: string;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          placeholderTextColor={colors.muted}
          selectionColor={colors.primaryDark}
          style={[styles.input, props.multiline && styles.multilineInput, style]}
          {...props}
        />
        {rightIcon ? (
          onRightIconPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rightIconAccessibilityLabel ?? 'Thao tác trường nhập'}
              onPress={onRightIconPress}
              style={styles.inputIcon}
            >
              <Ionicons name={rightIcon} size={19} color={colors.pewter} />
            </Pressable>
          ) : (
            <View accessibilityElementsHidden style={styles.inputIcon}>
              <Ionicons name={rightIcon} size={19} color={colors.pewter} />
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

export function Notice({
  tone = 'neutral',
  title,
  body,
  action,
}: {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const icon: IconName =
    tone === 'danger'
      ? 'alert-circle-outline'
      : tone === 'warning'
        ? 'warning-outline'
        : tone === 'success'
          ? 'checkmark-circle-outline'
          : tone === 'info'
            ? 'information-circle-outline'
            : 'ellipse-outline';
  const color =
    tone === 'danger'
      ? colors.criticalText
      : tone === 'warning'
        ? colors.warningText
        : tone === 'success'
          ? colors.successText
          : tone === 'info'
            ? colors.infoText
            : colors.neutralText;
  return (
    <View style={[styles.notice, styles[`notice_${tone}`]]}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={styles.flex}>
        <Text style={[styles.noticeTitle, { color }]}>{title}</Text>
        {body ? <Text style={styles.noticeBody}>{body}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.98,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  hitSlop,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  accessibilityRole?: React.ComponentProps<typeof Pressable>['accessibilityRole'];
  accessibilityLabel?: string;
  accessibilityState?: React.ComponentProps<typeof Pressable>['accessibilityState'];
  hitSlop?: React.ComponentProps<typeof Pressable>['hitSlop'];
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: scaleTo,
      duration: 70,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      bounciness: 0,
      speed: 16,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[{ transform: [{ scale: scaleAnim }] }, style as ViewStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function ListRow({
  title,
  subtitle,
  icon,
  status,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  status?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      {icon ? (
        <View style={styles.listIcon}>
          <Ionicons name={icon} size={19} color={colors.primaryDark} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {status}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </>
  );
  return onPress ? (
    <PressableScale accessibilityRole="button" onPress={onPress} style={[styles.listRow]}>
      {content}
    </PressableScale>
  ) : (
    <View style={styles.listRow}>{content}</View>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <View style={styles.actionBar}>{children}</View>;
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <View style={styles.sectionHeading}>
      {icon ? <Ionicons name={icon} size={16} color={colors.primaryDark} /> : null}
      <Text style={styles.sectionHeadingText}>{children}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon = 'checkmark-circle-outline',
}: {
  title: string;
  body: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.primaryDark} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '92%',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
}) {
  const [modalVisible, setModalVisible] = React.useState(visible);
  const screenHeight = Dimensions.get('window').height || 900;
  const backdropAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetAnim = React.useRef(new Animated.Value(visible ? 0 : screenHeight)).current;

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            sheetAnim.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.8) {
            onClose();
          } else {
            Animated.spring(sheetAnim, {
              toValue: 0,
              bounciness: 0,
              speed: 12,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, sheetAnim],
  );

  const handleShow = () => {
    sheetAnim.setValue(screenHeight);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  React.useEffect(() => {
    if (visible) {
      sheetAnim.setValue(screenHeight);
      backdropAnim.setValue(0);
      setModalVisible(true);
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: screenHeight,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [visible, modalVisible, backdropAnim, sheetAnim, screenHeight]);

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose} onShow={handleShow}>
      <View style={styles.sheetOverlay}>
        <Animated.View style={[styles.sheetBackdrop, { opacity: backdropAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng lớp phủ"
            style={styles.flex}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={[styles.sheetContainer, { maxHeight, transform: [{ translateY: sheetAnim }] }]}>
          <View {...panResponder.panHandlers} style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>
          {title ? (
            <View style={styles.sheetHeader}>
              <View style={styles.flex}>
                <Text style={styles.sheetTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={onClose}
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={20} color={colors.pewter} />
              </Pressable>
            </View>
          ) : null}
          {Platform.OS === 'ios' ? (
            <KeyboardAvoidingView
              behavior="padding"
              keyboardVerticalOffset={24}
              style={[styles.sheetBody, styles.flex]}
            >
              {children}
            </KeyboardAvoidingView>
          ) : (
            <View style={[styles.sheetBody, styles.flex]}>{children}</View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
  icon?: IconName;
  badge?: number | string;
}

export function SegmentedFilterBar<T extends string>({
  options,
  selectedId,
  onSelect,
  variant = 'segmented',
  style,
}: {
  options: readonly FilterOption<T>[] | FilterOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  variant?: 'segmented' | 'scrollable';
  style?: StyleProp<ViewStyle>;
}) {
  if (variant === 'scrollable') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollableFilterRow, style]}
      >
        {options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <PressableScale
              key={opt.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              scaleTo={0.95}
              onPress={() => onSelect(opt.id)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              {opt.icon ? (
                <Ionicons name={opt.icon} size={14} color={active ? colors.snowWhite : colors.pewter} />
              ) : null}
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{opt.label}</Text>
              {opt.badge !== undefined ? (
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{opt.badge}</Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.segmentedBar, style]}>
      {options.map((opt) => {
        const active = selectedId === opt.id;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(opt.id)}
            style={[styles.segmentTab, active && styles.segmentTabActive]}
          >
            {opt.icon ? (
              <Ionicons name={opt.icon} size={16} color={active ? colors.primaryDark : colors.pewter} />
            ) : null}
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
            {opt.badge !== undefined ? (
              <View style={[styles.segmentBadge, active && styles.segmentBadgeActive]}>
                <Text style={[styles.segmentBadgeText, active && styles.segmentBadgeTextActive]}>{opt.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelectableItemRow({
  title,
  subtitle,
  badge,
  icon = 'leaf',
  selected,
  mode = 'radio',
  onPress,
  disabled,
  style,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: IconName;
  selected: boolean;
  mode?: 'radio' | 'checkbox';
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, disabled }}
      scaleTo={0.98}
      disabled={disabled}
      onPress={onPress}
      style={[styles.selectableRow, selected && styles.selectableRowSelected, style]}
    >
      <View style={[styles.selectableIconCircle, selected && styles.selectableIconCircleSelected]}>
        <Ionicons name={icon} size={18} color={selected ? colors.primaryDark : colors.pewter} />
      </View>

      <View style={styles.selectableInfo}>
        <View style={styles.selectableTitleRow}>
          <Text style={[styles.selectableTitle, selected && styles.selectableTitleSelected]} numberOfLines={1}>
            {title}
          </Text>
          {badge ? <Badge tone={selected ? 'green' : 'neutral'}>{badge}</Badge> : null}
        </View>
        {subtitle ? (
          <Text style={styles.selectableSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {mode === 'radio' ? (
        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      ) : (
        <View style={[styles.checkboxBox, selected && styles.checkboxBoxSelected]}>
          {selected ? <Ionicons name="checkmark" size={14} color={colors.snowWhite} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

export function MetricStatTile({
  label,
  value,
  icon,
  tone = 'neutral',
  onPress,
  style,
}: {
  label: string;
  value: number | string;
  icon?: IconName;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const countColor =
    tone === 'danger'
      ? colors.criticalText
      : tone === 'warning'
        ? colors.warningText
        : tone === 'success'
          ? colors.successText
          : colors.ink;
  const iconColor =
    tone === 'danger'
      ? colors.criticalText
      : tone === 'warning'
        ? colors.warningText
        : tone === 'success'
          ? colors.primaryDark
          : colors.pewter;

  const content = (
    <View style={[styles.metricStatTile, styles[`metricStatTile_${tone}`], style]}>
      <View style={styles.metricStatTopRow}>
        {icon ? <Ionicons name={icon} size={16} color={iconColor} /> : null}
        <Text style={[styles.metricStatValue, { color: countColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text style={styles.metricStatLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return onPress ? (
    <PressableScale accessibilityRole="button" scaleTo={0.96} onPress={onPress} style={styles.flex}>
      {content}
    </PressableScale>
  ) : (
    <View style={styles.flex}>{content}</View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.snowWhite },
  screenContent: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md, gap: layout.sectionGap },
  screenContentWithNav: { paddingBottom: layout.bottomNavClearance + spacing.xxl },
  screenHeaderWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding,
  },
  screenHeaderDark: {
    backgroundColor: '#020617',
  },
  screenHeaderBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairlineBorder,
  },
  headerButtonDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  screenTitleDark: {
    color: colors.snowWhite,
  },
  screenSubtitleDark: {
    color: '#94a3b8',
  },
  screenHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  screenTitle: { ...typography.display, color: colors.ink },
  screenSubtitle: { ...typography.body, color: colors.pewter, marginTop: 2 },
  surface: {
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.card,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.card,
  },
  surface_default: {},
  surface_flat: {},
  surface_soft: { backgroundColor: colors.cardWarm },
  surface_warm: { backgroundColor: colors.warmStone },
  surface_dark: { backgroundColor: colors.forestDepths, borderColor: colors.forestDepths },
  surface_green: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  surface_sky: { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder },
  surface_amber: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  surface_danger: { backgroundColor: colors.criticalSurface, borderColor: colors.criticalBorder },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.compact,
    backgroundColor: colors.cornsilk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { ...typography.title, color: colors.forestDepths },
  brandTextCompact: { ...typography.section },
  brandSub: { ...typography.metadata, color: colors.pewter },
  textOnDark: { color: colors.snowWhite },
  textOnDarkMuted: { color: colors.honeydew },
  button: {
    minHeight: controlSize.default,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  button_primary: { backgroundColor: colors.primaryDark },
  button_forest: { backgroundColor: colors.forestDepths },
  button_secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairlineBorder },
  button_outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.neutralBorder },
  button_ghost: { backgroundColor: 'transparent' },
  button_danger: { backgroundColor: colors.criticalSurface, borderWidth: 1, borderColor: colors.criticalBorder },
  buttonSize_default: { minHeight: controlSize.default },
  buttonSize_compact: { minHeight: controlSize.compact, paddingHorizontal: spacing.md, borderRadius: radius.compact },
  buttonSize_field: { minHeight: controlSize.field },
  buttonText: {
    flexShrink: 1,
    textAlign: 'center',
    ...typography.bodyStrong,
  },
  pill: { borderRadius: radius.pill },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.42 },
  badge: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  badgeText: { ...typography.metadata },
  badge_green: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  badge_lime: { backgroundColor: colors.limonade, borderColor: colors.willowGreen },
  badge_accent: { backgroundColor: colors.limonade, borderColor: colors.willowGreen },
  badge_specimen: { backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder },
  badge_neutral: { backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder },
  badge_sky: { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder },
  badge_amber: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  badge_danger: { backgroundColor: colors.criticalSurface, borderColor: colors.criticalBorder },
  badge_slate: { backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder },
  badgeText_green: { color: colors.successText },
  badgeText_lime: { color: colors.forestDepths },
  badgeText_accent: { color: colors.forestDepths },
  badgeText_specimen: { color: colors.neutralText },
  badgeText_neutral: { color: colors.neutralText },
  badgeText_sky: { color: colors.infoText },
  badgeText_amber: { color: colors.warningText },
  badgeText_danger: { color: colors.criticalText },
  badgeText_slate: { color: colors.neutralText },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.ink },
  inputShell: {
    minHeight: controlSize.field,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: controlSize.field,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  inputIcon: { minWidth: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  multilineInput: {
    height: undefined,
    minHeight: 80,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.compact,
  },
  notice_neutral: { backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder },
  notice_info: { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder },
  notice_success: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  notice_warning: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  notice_danger: { backgroundColor: colors.criticalSurface, borderColor: colors.criticalBorder },
  noticeTitle: { ...typography.bodyStrong },
  noticeBody: { ...typography.body, color: colors.neutralText, marginTop: 2 },
  listRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    backgroundColor: colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: { ...typography.bodyStrong, color: colors.ink },
  listSubtitle: { ...typography.label, color: colors.pewter, marginTop: 2 },
  actionBar: { gap: spacing.sm, backgroundColor: 'transparent' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHeadingText: { ...typography.section, color: colors.ink },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    backgroundColor: colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.section, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.pewter, textAlign: 'center', marginTop: spacing.xs },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 28, 20, 0.28)',
  },
  sheetContainer: {
    height: '82%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairlineBorder,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  sheetTitle: {
    ...typography.title,
    color: colors.ink,
  },
  sheetSubtitle: {
    ...typography.label,
    color: colors.pewter,
    marginTop: 2,
  },
  sheetCloseButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.control,
    padding: 3,
    marginBottom: spacing.sm,
    gap: 4,
    height: 42,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: radius.compact,
    gap: 6,
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
    ...typography.label,
    color: colors.pewter,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  segmentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: colors.hairlineBorder,
    marginLeft: 2,
  },
  segmentBadgeActive: {
    backgroundColor: colors.successSurface,
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.pewter,
  },
  segmentBadgeTextActive: {
    color: colors.primaryDark,
  },
  scrollableFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: colors.forestDepths,
    borderColor: colors.forestDepths,
  },
  filterPillText: {
    ...typography.metadata,
    color: colors.ink,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: colors.snowWhite,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: colors.neutralSurface,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.pewter,
  },
  filterBadgeTextActive: {
    color: colors.snowWhite,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    gap: spacing.md,
  },
  selectableRowSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  selectableIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectableIconCircleSelected: {
    backgroundColor: colors.snowWhite,
  },
  selectableInfo: {
    flex: 1,
    gap: 3,
  },
  selectableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  selectableTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  selectableTitleSelected: {
    color: colors.primaryDark,
  },
  selectableSubtitle: {
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
  metricStatTile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.card,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  metricStatTile_neutral: {},
  metricStatTile_success: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  metricStatTile_warning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  metricStatTile_danger: {
    backgroundColor: colors.criticalSurface,
    borderColor: colors.criticalBorder,
  },
  metricStatTile_info: {
    backgroundColor: colors.infoSurface,
    borderColor: colors.infoBorder,
  },
  metricStatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricStatValue: {
    ...typography.display,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.ink,
  },
  metricStatLabel: {
    ...typography.metadata,
    color: colors.pewter,
  },
});
