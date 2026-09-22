import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, BrandMark, Button, Card, SectionTitle } from '../../components/AppPrimitives';
import { Header, Metric } from '../../components/presentation/TaskSurfaces';
import { colors, radius, spacing } from '../../theme/tokens';
import { TaskStatus } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

export function ManagerAccount(props: ManagerAreaProps) {
  const pendingReviewCount = props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW).length;

  const unreadNotifications = props.notifications.filter((notification) => !notification.read).length;

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header title="Tài khoản quản lý" subtitle="Kỹ sư Trưởng" />
      <Card tone="warm" style={styles.managerAccountHero}>
        <View style={styles.row}>
          <View style={styles.managerAvatarDark}>
            <Text style={styles.managerAvatarDarkText}>M</Text>
          </View>
          <View style={styles.flex}>
            <BrandMark compact dark />
            <Text style={styles.managerAccountName}>Kỹ sư Trưởng</Text>
            <Text style={styles.managerAccountRole}>Trưởng ban kỹ thuật NOVYX GreenOps</Text>
          </View>
        </View>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.cornsilk} />
            <Text style={styles.heroMetaText}>Quyền duyệt</Text>
          </View>
          <View style={styles.heroMetaPill}>
            <Ionicons name="business-outline" size={13} color={colors.cornsilk} />
            <Text style={styles.heroMetaText}>NOVYX HQ</Text>
          </View>
        </View>
      </Card>
      <Card tone="flat" style={styles.statsBar}>
        <Metric label="Cây quản lý" value={props.trees.length} tone="slate" bordered={false} />
        <View style={styles.statsDivider} />
        <Metric
          label="Chờ duyệt"
          value={props.tasks.filter((t) => t.status === 'WAITING_REVIEW').length}
          tone="amber"
          bordered={false}
        />
      </Card>
      <Card tone="soft" style={styles.accountInfoCard}>
        <SectionTitle icon="id-card-outline">Thông tin phiên làm việc</SectionTitle>
        <InfoRow label="Email" value="manager@novyx.vn" />
        <InfoRow label="Vai trò" value="Manager" />
        <InfoRow label="Phạm vi" value="Công viên Tao Đàn" />
        <InfoRow label="Thông báo chưa đọc" value={`${unreadNotifications}`} />
      </Card>
      <Pressable accessibilityRole="button" onPress={() => props.setActiveStep('REVIEW')}>
        <Card tone={pendingReviewCount > 0 ? 'amber' : 'green'} style={styles.accountInfoCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.accountShortcutIcon}>
                <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>Hàng chờ nghiệm thu</Text>
                <Text style={styles.bodyText}>
                  {pendingReviewCount > 0
                    ? `${pendingReviewCount} báo cáo cần kiểm tra trong phiên này.`
                    : 'Không có báo cáo đang chờ duyệt.'}
                </Text>
              </View>
            </View>
            <Badge tone={pendingReviewCount > 0 ? 'amber' : 'green'}>{pendingReviewCount}</Badge>
          </View>
        </Card>
      </Pressable>
      <Button variant="danger" icon="log-out-outline" onPress={props.onLogout}>
        Đăng xuất tài khoản
      </Button>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.accountInfoRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.auditValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenPad: {
    padding: spacing.screen,
    gap: spacing.section,
    paddingBottom: 34,
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  statsDivider: { width: 1, backgroundColor: colors.hairlineBorder, alignSelf: 'stretch', marginVertical: 4 },
  managerAccountHero: {
    minHeight: 168,
  },
  managerAvatarDark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.cornsilk,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,250,224,0.4)',
  },
  managerAvatarDarkText: {
    color: colors.forest,
    fontSize: 24,
    fontWeight: '600',
  },
  managerAccountName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  managerAccountRole: {
    color: '#d9f7dd',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroMetaPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,250,224,0.28)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: colors.cornsilk,
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  accountInfoCard: {
    gap: 10,
  },
  accountInfoRow: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountShortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  auditValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
});
