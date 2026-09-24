import React from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView>
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
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={onBack}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.flex}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        styles[`buttonSize_${size}`],
        pill && styles.pill,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} size="small" /> : null}
      {!loading && icon ? <Ionicons name={icon} size={18} color={foreground} /> : null}
      <Text numberOfLines={size === 'field' ? 2 : 1} style={[styles.buttonText, { color: foreground }]}>
        {children}
      </Text>
    </Pressable>
  );
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.snowWhite },
  screenContent: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md, gap: layout.sectionGap },
  screenContentWithNav: { paddingBottom: layout.bottomNavClearance + spacing.xxl },
  screenHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  button_primary: { backgroundColor: colors.primaryDark },
  button_forest: { backgroundColor: colors.forestDepths },
  button_secondary: { backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningBorder },
  button_outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.neutralBorder },
  button_ghost: { backgroundColor: 'transparent' },
  button_danger: { backgroundColor: colors.criticalSurface, borderWidth: 1, borderColor: colors.criticalBorder },
  buttonSize_default: { minHeight: controlSize.default },
  buttonSize_compact: { minHeight: controlSize.compact, paddingHorizontal: spacing.md },
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
});
