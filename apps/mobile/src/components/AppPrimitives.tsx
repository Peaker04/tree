import React from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { colors, radius } from '../theme/tokens';
import { NovyxMark } from './NovyxMark';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'soft' | 'dark' | 'green' | 'sky' | 'danger' | 'amber' | 'flat' | 'warm';
}) {
  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}

export function GradientCard({
  children,
  style,
  contentStyle,
  variant = 'forest',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'forest' | 'light' | 'sky' | 'canopy' | 'review';
}) {
  const variantStyle =
    variant === 'review'
      ? styles.gradientCardReview
      : variant === 'canopy'
        ? styles.gradientCardCanopy
        : variant === 'sky'
          ? styles.gradientCardSky
          : variant === 'light'
            ? styles.gradientCardLight
            : styles.gradientCardForest;
  const glowStyle =
    variant === 'review'
      ? styles.gradientGlowReview
      : variant === 'canopy'
        ? styles.gradientGlowCanopy
        : variant === 'sky'
          ? styles.gradientGlowSky
          : variant === 'light'
            ? styles.gradientGlowLight
            : styles.gradientGlowForest;

  return (
    <View style={[styles.gradientCard, variantStyle, style]}>
      <View pointerEvents="none" style={[styles.gradientGlow, styles.gradientGlowTop, glowStyle]} />
      <View pointerEvents="none" style={[styles.gradientGlow, styles.gradientGlowBottom, glowStyle]} />
      <View pointerEvents="none" style={styles.gradientAccent} />
      <View style={[styles.gradientInner, contentStyle]}>{children}</View>
    </View>
  );
}

export function BrandMark({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <View style={styles.brandMark}>
      <View style={[styles.brandIcon, dark && styles.brandIconDark]}>
        <NovyxMark
          size={compact ? 22 : 26}
          color={dark ? colors.forest : colors.brandForest}
          accentColor={colors.brandOlive}
        />
      </View>
      <View>
        <Text style={[styles.brandText, compact && styles.brandTextCompact, dark && styles.brandTextDark]}>NOVYX</Text>
        {!compact ? <Text style={[styles.brandSub, dark && styles.brandSubDark]}>GreenOps</Text> : null}
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'forest';
  size?: 'default' | 'compact' | 'field';
  pill?: boolean;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        styles[`button_size_${size}`],
        pill && styles.button_pill,
        (pressed || loading) && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'forest' ? '#fff' : colors.primary}
          size="small"
        />
      ) : null}
      {!loading && icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={
            variant === 'primary' || variant === 'forest'
              ? '#fff'
              : (styles[`buttonText_${variant}`]?.color ?? colors.foreground)
          }
        />
      ) : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.buttonText, styles[`buttonText_${variant}`]]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Badge({
  children,
  tone = 'green',
  pill = false,
}: {
  children: React.ReactNode;
  tone?: 'green' | 'sky' | 'amber' | 'danger' | 'slate' | 'lime' | 'accent' | 'specimen' | 'neutral';
  pill?: boolean;
}) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`], pill && styles.badge_pill]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{children}</Text>
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
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          placeholderTextColor="#9ca3af"
          style={[styles.input, style]}
          selectionColor={colors.primary}
          {...props}
        />
        {rightIcon && onRightIconPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel ?? 'Xóa nội dung'}
            onPress={onRightIconPress}
            hitSlop={10}
            style={styles.inputIcon}
          >
            <Ionicons name={rightIcon} size={19} color="#94a3b8" />
          </Pressable>
        ) : rightIcon ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.inputIcon}>
            <Ionicons name={rightIcon} size={19} color="#94a3b8" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <View style={styles.sectionTitle}>
      {icon ? <Ionicons name={icon} size={15} color={colors.primary} /> : null}
      <Text style={styles.sectionTitleText}>{children}</Text>
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
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  gradientCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  gradientCardForest: {
    backgroundColor: colors.forestDeep,
    borderColor: '#2b6344',
  },
  gradientCardLight: {
    backgroundColor: colors.honeydew,
    borderColor: colors.primaryBorder,
  },
  gradientCardCanopy: {
    backgroundColor: colors.canopy,
    borderColor: colors.primaryBorder,
  },
  gradientCardSky: {
    backgroundColor: colors.sky,
    borderColor: '#5fb2c4',
  },
  gradientCardReview: {
    backgroundColor: colors.brandIvory,
    borderColor: '#ead879',
  },
  gradientGlow: {
    position: 'absolute',
    borderRadius: radius.full,
    opacity: 0.9,
  },
  gradientGlowTop: {
    width: 180,
    height: 180,
    top: -96,
    right: -54,
  },
  gradientGlowBottom: {
    width: 150,
    height: 150,
    left: -68,
    bottom: -92,
    opacity: 0.7,
  },
  gradientGlowForest: {
    backgroundColor: 'rgba(117, 201, 127, 0.26)',
  },
  gradientGlowLight: {
    backgroundColor: 'rgba(170, 208, 128, 0.22)',
  },
  gradientGlowCanopy: {
    backgroundColor: 'rgba(240, 247, 234, 0.5)',
  },
  gradientGlowSky: {
    backgroundColor: 'rgba(207, 232, 201, 0.24)',
  },
  gradientGlowReview: {
    backgroundColor: 'rgba(117, 201, 127, 0.18)',
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 5,
    backgroundColor: 'rgba(255, 250, 224, 0.34)',
  },
  gradientInner: {
    padding: 18,
    minHeight: 120,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.cornsilk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconDark: {
    backgroundColor: colors.cornsilk,
  },
  brandText: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  brandTextCompact: {
    fontSize: 15,
  },
  brandTextDark: {
    color: '#ffffff',
  },
  brandSub: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  brandSubDark: {
    color: '#cae8cf',
  },
  default: {},
  soft: {
    backgroundColor: colors.cardWarm,
    borderColor: colors.border,
  },
  dark: {
    backgroundColor: colors.dark,
    borderColor: '#1e293b',
  },
  green: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  sky: {
    backgroundColor: colors.skySoft,
    borderColor: '#dbeafe',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#ffe4e6',
  },
  amber: {
    backgroundColor: colors.amberSoft,
    borderColor: '#fde68a',
  },
  flat: {
    backgroundColor: colors.card,
    borderColor: colors.hairlineBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  warm: {
    backgroundColor: colors.warmStone,
    borderColor: colors.hairlineBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 16,
  },
  button_size_default: {
    minHeight: 48,
  },
  button_size_compact: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  button_size_field: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
  button_pill: {
    borderRadius: radius.pill,
  },
  button_primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  button_forest: {
    backgroundColor: colors.forestDepths,
    shadowOpacity: 0,
    elevation: 0,
  },
  button_secondary: {
    backgroundColor: colors.cornsilk,
    borderColor: '#ead879',
    borderWidth: 1,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fecdd3',
    borderWidth: 1,
  },
  button_outline: {
    backgroundColor: colors.card,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText_primary: {
    color: '#fff',
  },
  buttonText_forest: {
    color: colors.snowWhite,
  },
  buttonText_secondary: {
    color: colors.foreground,
  },
  buttonText_ghost: {
    color: colors.primary,
  },
  buttonText_danger: {
    color: colors.danger,
  },
  buttonText_outline: {
    color: colors.foreground,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badge_pill: {
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badge_green: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  badge_lime: {
    backgroundColor: colors.limePulse,
    borderColor: '#c0ea82',
  },
  badge_accent: {
    backgroundColor: colors.limePulse,
    borderColor: '#c0ea82',
  },
  badge_specimen: {
    backgroundColor: colors.warmStone,
    borderColor: colors.hairlineBorder,
  },
  badge_neutral: {
    backgroundColor: colors.warmStone,
    borderColor: colors.hairlineBorder,
  },
  badge_sky: {
    backgroundColor: colors.skySoft,
    borderColor: '#bae6fd',
  },
  badge_amber: {
    backgroundColor: colors.amberSoft,
    borderColor: '#fde68a',
  },
  badge_danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fecdd3',
  },
  badge_slate: {
    backgroundColor: colors.mineral,
    borderColor: colors.border,
  },
  badgeText_green: {
    color: '#047857',
  },
  badgeText_lime: {
    color: colors.forestDepths,
  },
  badgeText_accent: {
    color: colors.forestDepths,
  },
  badgeText_specimen: {
    color: colors.forestDepths,
  },
  badgeText_neutral: {
    color: colors.pewter,
  },
  badgeText_sky: {
    color: colors.sky,
  },
  badgeText_amber: {
    color: colors.amber,
  },
  badgeText_danger: {
    color: colors.danger,
  },
  badgeText_slate: {
    color: '#475569',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inputIcon: {
    minWidth: 44,
    paddingHorizontal: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  sectionTitleText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '900',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },
});
