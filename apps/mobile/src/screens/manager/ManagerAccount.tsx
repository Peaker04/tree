import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../../components/UserAvatar';
import { Badge, Button, ListRow, ScreenHeader, SectionTitle } from '../../components/AppPrimitives';
import { colors, layout, spacing, typography } from '../../theme/tokens';
import { TaskStatus } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

export function ManagerAccount(props: ManagerAreaProps) {
  const pending = props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW).length;
  const email = props.authenticatedUser?.email ?? 'Không có thông tin phiên';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Tài khoản" subtitle="Thông tin từ phiên đăng nhập hiện tại" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screen}>
        <View style={styles.identity}>
        <UserAvatar email={email} />
        <View style={styles.flex}>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.role}>Quản lý vận hành</Text>
          <Badge tone="green">Đang đăng nhập</Badge>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle icon="id-card-outline">Phiên làm việc</SectionTitle>
        <ListRow icon="mail-outline" title="Email" subtitle={email} />
        <ListRow icon="people-outline" title="Vai trò" subtitle="Quản lý vận hành" />
        <ListRow
          icon="checkmark-done-outline"
          title="Hàng chờ nghiệm thu"
          subtitle={pending ? `${pending} báo cáo cần kiểm tra` : 'Không có báo cáo đang chờ'}
          onPress={() => props.setActiveStep('REVIEW')}
        />
      </View>

      <Button variant="danger" icon="log-out-outline" onPress={props.onLogout}>
        Đăng xuất
      </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: { padding: layout.screenPadding, paddingBottom: layout.bottomNavClearance + spacing.xl, gap: spacing.xl },
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  email: { ...typography.section, color: colors.ink },
  role: { ...typography.body, color: colors.pewter, marginTop: 2, marginBottom: spacing.sm },
  section: { gap: spacing.sm },
});
