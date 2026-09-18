import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card } from '../../components/AppPrimitives';
import { Header, Metric } from '../../components/presentation/TaskSurfaces';
import { colors } from '../../theme/tokens';

const avatarPhoto = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80';

export function StaffAccount({
  onLogout,
  completed,
  total,
  notificationsCount,
  onOpenNotifications,
}: {
  onLogout: () => void;
  completed: number;
  total: number;
  notificationsCount: number;
  onOpenNotifications: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Tài khoản nhân viên" subtitle="Nguyễn Văn Hùng" />
      <Card>
        <View style={styles.row}>
          <Image source={{ uri: avatarPhoto }} style={styles.bigAvatar} />
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>Nguyễn Văn Hùng</Text>
            <Text style={styles.itemSub}>Nhân viên kỹ thuật hiện trường</Text>
            <Text style={styles.bodyText}>hung.nguyen@novyx.vn</Text>
          </View>
        </View>
      </Card>
      <View style={styles.statsGrid}>
        <Metric label="Hoàn thành" value={completed} tone="green" />
        <Metric label="Tổng nhiệm vụ" value={total} tone="slate" />
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenNotifications}>
        <Card style={styles.listCard} tone={notificationsCount > 0 ? 'green' : 'default'}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.accountShortcutIcon}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>Thông báo</Text>
                <Text style={styles.bodyText}>
                  {notificationsCount > 0 ? `${notificationsCount} cập nhật mới cần xem.` : 'Không có cập nhật mới.'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
        </Card>
      </Pressable>
      <Button variant="danger" icon="log-out-outline" onPress={onLogout}>
        Đăng xuất tài khoản
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenPad: {
    padding: 16,
    paddingBottom: 104,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  listCard: {
    gap: 10,
  },
  accountShortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
