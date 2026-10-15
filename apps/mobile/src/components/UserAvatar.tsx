import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/tokens';

function getInitials(email: string) {
  const local = email.split('@')[0]?.trim() ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('vi'))
    .join('');
  return initials || 'NV';
}

export function UserAvatar({ email, size = 56 }: { email: string; size?: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Ảnh đại diện của ${email}`}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text allowFontScaling={false} style={[styles.initials, size < 52 && styles.initialsCompact]}>
        {getInitials(email)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  initials: { ...typography.title, color: colors.primaryDark },
  initialsCompact: { ...typography.section },
});
