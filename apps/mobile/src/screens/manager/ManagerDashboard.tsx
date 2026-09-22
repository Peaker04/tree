import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, BrandMark, Button, Card, SectionTitle } from '../../components/AppPrimitives';
import { Metric, TaskCard } from '../../components/presentation/TaskSurfaces';
import { TreeIdentityVisual } from '../../components/presentation/TreeIdentityVisual';
import { getTaskProofGaps, getTreeRiskStatus, isTaskOverdue } from '../../domain/mobileWorkflow';
import { colors, radius, spacing } from '../../theme/tokens';
import { TaskStatus, type Tree } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';
import { mockTreeLandscapePhoto } from '../../assets/mockEvidenceAssets';

export function ManagerDashboard(props: ManagerAreaProps) {
  const [managingTaskId, setManagingTaskId] = useState<string | null>(null);
  const total = props.tasks.length;
  const completed = props.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
  const pendingReview = props.tasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW);
  const active = props.tasks.filter((task) => task.status !== TaskStatus.COMPLETED).length;
  const riskTrees = props.trees.filter((tree) => getTreeRiskStatus(tree) !== 'healthy');
  const qrIssueTasks = props.tasks.filter((task) => task.notes?.includes('QR tại cây bị hỏng'));
  const overdueTasks = props.tasks.filter(isTaskOverdue);
  const incompleteReview = pendingReview.filter((task) => getTaskProofGaps(task).length > 0);

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <View style={styles.headerBlock}>
        <BrandMark />
        <Badge tone="sky">NOVYX HQ</Badge>
      </View>
      <Card tone="warm" style={styles.adminHero}>
        <View style={styles.heroContentRow}>
          <View style={styles.flex}>
            <BrandMark compact dark />
            <Text style={styles.heroTitle}>Bảng điều khiển cây xanh</Text>
            <Text style={styles.heroBody}>
              Theo dõi nghiệm thu, phân công và sức khỏe cây trong cùng một luồng vận hành.
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="qr-code-outline" size={13} color={colors.cornsilk} />
                <Text style={styles.heroMetaText}>QR + GPS</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.cornsilk} />
                <Text style={styles.heroMetaText}>{pendingReview.length} nghiệm thu</Text>
              </View>
            </View>
          </View>
          <Image source={mockTreeLandscapePhoto} style={styles.heroImage} />
        </View>
      </Card>

      <Card tone="flat" style={styles.statsBar}>
        <Metric label="Tổng việc" value={total} tone="slate" bordered={false} />
        <View style={styles.statsDivider} />
        <Metric label="Hoàn thành" value={completed} tone="green" bordered={false} />
        <View style={styles.statsDivider} />
        <Metric label="Đang mở" value={active} tone="amber" bordered={false} />
        <View style={styles.statsDivider} />
        <Metric label="Cây quản lý" value={props.trees.length} tone="green" bordered={false} />
      </Card>

      <Card tone="warm" style={styles.opsPulseInner}>
        <SectionTitle icon="analytics-outline">Tình hình tác nghiệp ngày</SectionTitle>
        <PulseRow label="Đã xong" value={completed} tone="green" />
        <PulseRow label="Đang chạy / chờ" value={active} tone="amber" />
        <PulseRow label="Cần kiểm duyệt" value={pendingReview.length} tone="sky" />
        {incompleteReview.length > 0 ? (
          <PulseRow label="Thiếu bằng chứng" value={incompleteReview.length} tone="danger" />
        ) : null}
      </Card>

      <Card tone="soft" style={styles.quickActionPanel}>
        <SectionTitle icon="flash-outline">Hành động nhanh</SectionTitle>
        <View style={styles.twoCols}>
          <Button icon="add-outline" onPress={() => props.setActiveStep('CREATE')}>
            Tạo việc
          </Button>
          <Button variant="outline" icon="eye-outline" onPress={() => props.setActiveStep('REVIEW')}>
            Duyệt
          </Button>
        </View>
        <Button variant="outline" icon="leaf-outline" onPress={() => props.setActiveStep('TREES')}>
          Hồ sơ cây
        </Button>
      </Card>

      {/* Blocked Tasks Section */}
      {props.tasks.some((t) => t.status === 'BLOCKED') ? (
        <Card tone="danger" style={styles.quickActionPanel}>
          <SectionTitle icon="warning-outline">Sự cố hiện trường</SectionTitle>
          {props.tasks
            .filter((t) => t.status === 'BLOCKED')
            .map((task) => (
              <View key={task.id} style={{ gap: 8, marginBottom: 8 }}>
                <TaskCard task={task} compact />
                <View style={styles.twoCols}>
                  <Button
                    disabled={managingTaskId !== null}
                    size="compact"
                    icon="play-outline"
                    onPress={async () => {
                      setManagingTaskId(task.id);
                      try {
                        await props.resumeBlockedTask?.({
                          taskId: task.id,
                          expectedVersion: task.version ?? 0,
                          resolutionNotes: 'Quản lý cho phép tiếp tục công việc',
                        });
                      } finally {
                        setManagingTaskId(null);
                      }
                    }}
                  >
                    Khôi phục
                  </Button>
                  <Button
                    disabled={managingTaskId !== null}
                    variant="danger"
                    size="compact"
                    icon="close-outline"
                    onPress={async () => {
                      setManagingTaskId(task.id);
                      try {
                        await props.cancelTask?.({
                          taskId: task.id,
                          expectedVersion: task.version ?? 0,
                          cancelReason: 'Quản lý hủy công việc do sự cố',
                        });
                      } finally {
                        setManagingTaskId(null);
                      }
                    }}
                  >
                    Hủy task
                  </Button>
                </View>
              </View>
            ))}
        </Card>
      ) : null}

      <Card
        tone="flat"
        style={[styles.reviewQueueInner, { backgroundColor: pendingReview.length > 0 ? '#fffbeb' : '#f0fdf4' }]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <SectionTitle icon="shield-checkmark-outline">Hàng chờ nghiệm thu</SectionTitle>
            <Text style={styles.bodyText}>
              {pendingReview.length > 0
                ? `${pendingReview.length} báo cáo cần kiểm tra bằng chứng.`
                : 'Không có báo cáo tồn đọng.'}
            </Text>
          </View>
          <Badge tone={pendingReview.length > 0 ? 'amber' : 'green'}>{pendingReview.length}</Badge>
        </View>
        {pendingReview.slice(0, 2).map((task) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mở báo cáo ${task.title}`}
            key={task.id}
            style={styles.reviewQueueRow}
            onPress={() => {
              props.setReviewTask(task);
              props.setActiveStep('REVIEW_DETAIL');
            }}
          >
            <View style={styles.flex}>
              <Text style={styles.itemTitle}>{task.title}</Text>
              <Text style={styles.itemSub}>{task.treeName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>

      <Card tone="soft">
        <View style={styles.managerSectionHeader}>
          <View style={styles.flex}>
            <SectionTitle icon="pulse-outline">Cây cần chú ý</SectionTitle>
            <Text style={styles.bodyText}>Tập trung những cây lệch chuẩn sức khỏe hoặc quá hạn chăm sóc.</Text>
          </View>
          <TreeIdentityVisual tree={riskTrees[0] ?? fallbackTree} compact />
        </View>
        {riskTrees.length === 0 ? (
          <Text style={styles.bodyText}>Danh mục cây đang ổn định.</Text>
        ) : (
          riskTrees.slice(0, 3).map((tree) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mở hồ sơ cây cần chú ý ${tree.name}`}
              key={tree.id}
              style={styles.reviewQueueRow}
              onPress={() => props.setActiveStep('TREES')}
            >
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{tree.name}</Text>
                <Text style={styles.itemSub}>{tree.address}</Text>
              </View>
              <Badge tone={tree.healthStatus === 'Sâu bệnh' ? 'danger' : 'amber'}>{tree.healthStatus}</Badge>
            </Pressable>
          ))
        )}
      </Card>

      {qrIssueTasks.length > 0 || overdueTasks.length > 0 ? (
        <Card tone="amber">
          <SectionTitle icon="alert-circle-outline">Ngoại lệ vận hành</SectionTitle>
          {[...qrIssueTasks, ...overdueTasks].slice(0, 3).map((task) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mở ngoại lệ vận hành ${task.title}`}
              key={task.id}
              style={styles.reviewQueueRow}
              onPress={() => {
                props.setReviewTask(task);
                props.setActiveStep(task.status === TaskStatus.WAITING_REVIEW ? 'REVIEW_DETAIL' : 'REVIEW');
              }}
            >
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{task.treeName}</Text>
                <Text style={styles.bodyText}>{task.notes ?? `${task.title} đang quá hạn.`}</Text>
              </View>
              <Badge tone="amber">{task.id}</Badge>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card tone="green">
        <SectionTitle icon="qr-code-outline">Payload QR demo</SectionTitle>
        <Text style={styles.bodyText}>In 1-2 mã dưới đây để demo luồng quét tại cây thật hoặc mô phỏng.</Text>
        {props.trees.slice(0, 2).map((tree) => (
          <View key={tree.id} style={styles.qrPayloadRow}>
            <View style={styles.flex}>
              <Text style={styles.itemTitle}>{tree.name}</Text>
              <Text style={styles.monoSmall}>{tree.qrCode}</Text>
            </View>
            <Badge
              tone={
                tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green'
              }
            >
              {tree.id}
            </Badge>
          </View>
        ))}
      </Card>
      <SectionTitle icon="time-outline">Nhật ký gần đây</SectionTitle>
      {props.tasks.slice(0, 3).map((task) => (
        <TaskCard key={task.id} task={task} compact />
      ))}
    </ScrollView>
  );
}

const fallbackTree: Tree = {
  id: 'TRE-DEMO',
  name: 'Cây NOVYX mẫu',
  species: 'GreenOps demo',
  lat: 0,
  lng: 0,
  address: 'Khu vực demo',
  qrCode: 'NOVYX-TRE-DEMO',
  healthStatus: 'Khỏe mạnh',
  riskStatus: 'healthy',
  ageYears: 1,
};

function PulseRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'sky' | 'danger';
}) {
  return (
    <View style={styles.opsPulseRow}>
      <Text style={styles.itemTitle}>{label}</Text>
      <Text
        style={[
          styles.metricStrong,
          tone === 'green' && styles.metricGreen,
          tone === 'amber' && styles.metricAmber,
          tone === 'sky' && styles.metricSky,
          tone === 'danger' && styles.metricDanger,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenPad: {
    padding: spacing.screen,
    gap: spacing.section,
    paddingBottom: 104,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  adminHero: {
    minHeight: 184,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 12,
  },
  heroBody: {
    color: '#d9f7dd',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
  },
  heroImage: {
    width: 96,
    height: 128,
    borderRadius: radius.lg,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
  opsPulseInner: {
    gap: 8,
    minHeight: 0,
  },
  opsPulseRow: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(170, 208, 128, 0.38)',
    backgroundColor: 'rgba(255,255,251,0.66)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionPanel: {
    gap: 8,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewQueueInner: {
    gap: 12,
    minHeight: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewQueueRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 11,
  },
  managerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  qrPayloadRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 11,
    marginTop: 8,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricStrong: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricGreen: { color: colors.primary },
  metricAmber: { color: colors.amber },
  metricSky: { color: colors.sky },
  metricDanger: { color: colors.danger },
});
