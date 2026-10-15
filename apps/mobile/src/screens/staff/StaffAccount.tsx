import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../../components/UserAvatar';
import type { AuthUser } from '@novyx/contracts';
import { Badge, Button, ListRow, ScreenHeader, SectionTitle } from '../../components/AppPrimitives';
import { colors, layout, spacing, typography } from '../../theme/tokens';

export function StaffAccount({
  authenticatedUser,
  onLogout,
  completed,
  total,
  notificationsCount,
  onOpenNotifications,
}: {
  authenticatedUser: AuthUser | null;
  onLogout: () => void;
  completed: number;
  total: number;
  notificationsCount: number;
  onOpenNotifications: () => void;
}) {
  const email = authenticatedUser?.email ?? 'Không có thông tin phiên';

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenHeader title="Tài khoản" subtitle="Thông tin từ phiên đăng nhập hiện tại" />

      <View style={styles.identity}>
        <UserAvatar email={email} />
        <View style={styles.flex}>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.role}>Nhân viên hiện trường</Text>
          <Badge tone="green">Đang đăng nhập</Badge>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle icon="id-card-outline">Phiên làm việc</SectionTitle>
        <ListRow icon="mail-outline" title="Email" subtitle={email} />
        <ListRow icon="people-outline" title="Vai trò" subtitle="Nhân viên hiện trường" />
        <ListRow icon="clipboard-outline" title="Công việc" subtitle={`${completed}/${total} đã hoàn thành`} />
        <ListRow
          icon="notifications-outline"
          title="Thông báo"
          subtitle={notificationsCount ? `${notificationsCount} cập nhật chưa đọc` : 'Không có cập nhật mới'}
          onPress={onOpenNotifications}
        />
      </View>

      <Button variant="danger" icon="log-out-outline" onPress={onLogout}>
        Đăng xuất
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.screenPadding, paddingBottom: layout.bottomNavClearance + spacing.xl, gap: spacing.xl },
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  email: { ...typography.section, color: colors.ink },
  role: { ...typography.body, color: colors.pewter, marginTop: 2, marginBottom: spacing.sm },
  section: { gap: spacing.sm },
});
