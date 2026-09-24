import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Card, SectionTitle } from '../AppPrimitives';
import { colors, radius } from '../../theme/tokens';
import { ChecklistItem, Task, TaskStatus, Tree } from '../../types';
import {
  formatTaskDate,
  formatTaskDateTime,
  getTaskProofCount,
  getTaskProofGaps,
  getTaskStatusMeta,
  isTaskOverdue,
} from '../../domain/mobileWorkflow';

export function Header({
  title,
  subtitle,
  onBack,
  dark,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  dark?: boolean;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.flex}>
        <Text style={[styles.headerTitle, dark && styles.headerTitleDark]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSub, dark && styles.headerSubDark]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function TaskCard({ task, compact }: { task: Task; compact?: boolean }) {
  const statusMeta = getTaskStatusMeta(task.status);
  const proofCount = getTaskProofCount(task);
  const proofGaps = getTaskProofGaps(task);
  const overdue = isTaskOverdue(task);
  return (
    <Card style={styles.listCard}>
      <View style={styles.rowBetween}>
        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        <Text style={styles.monoSmall}>{task.id}</Text>
      </View>
      <Text style={styles.itemTitle}>{task.title}</Text>
      <Text style={styles.itemSub}>Cây: {task.treeName}</Text>
      {!compact ? <TaskProofPills task={task} /> : null}
      {!compact ? <Text style={styles.bodyText}>{task.treeAddress}</Text> : null}
      <View style={styles.taskMetaRow}>
        {!compact ? <Text style={styles.monoSmall}>NV: {task.assignedStaffName}</Text> : null}
        <Text style={styles.monoSmall}>Hạn: {formatTaskDate(task.deadline)}</Text>
        <Text style={styles.monoSmall}>Bằng chứng: {proofCount}/5</Text>
      </View>
      {!compact ? (
        <View style={styles.taskSignalRow}>
          <View style={[styles.taskSignalPill, overdue && styles.taskSignalPillDanger]}>
            <Ionicons
              name={overdue ? 'time-outline' : 'calendar-outline'}
              size={13}
              color={overdue ? colors.danger : colors.mutedForeground}
            />
            <Text style={[styles.taskSignalText, overdue && styles.taskSignalTextDanger]}>
              {overdue ? 'Quá hạn' : `Cập nhật ${formatTaskDateTime(task.updatedAt)}`}
            </Text>
          </View>
          <View style={[styles.taskSignalPill, proofGaps.length === 0 && styles.taskSignalPillDone]}>
            <Ionicons
              name={proofGaps.length === 0 ? 'shield-checkmark-outline' : 'alert-circle-outline'}
              size={13}
              color={proofGaps.length === 0 ? colors.primaryDark : colors.amber}
            />
            <Text style={[styles.taskSignalText, proofGaps.length === 0 && styles.taskSignalTextDone]}>
              {proofGaps.length === 0 ? 'Đủ bằng chứng' : `${proofGaps.length} mục thiếu`}
            </Text>
          </View>
          {overdue ? <Text style={styles.monoSmall}>Cập nhật {formatTaskDateTime(task.updatedAt)}</Text> : null}
        </View>
      ) : null}
      {task.status === TaskStatus.REWORK_REQUIRED && task.rejectReason ? (
        <View style={styles.reworkReasonBox}>
          <Ionicons name="return-down-back-outline" size={16} color={colors.danger} />
          <View style={styles.flex}>
            <Text style={styles.metricLabel}>Lý do làm lại</Text>
            <Text style={styles.bodyText}>{task.rejectReason}</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function TaskProofPills({ task }: { task: Task }) {
  return (
    <View style={styles.taskProofPills}>
      <ProofPill done={Boolean(task.gpsCheck?.verified)} icon="location-outline" label="GPS" />
      <ProofPill done={Boolean(task.qrCheck?.verified)} icon="qr-code-outline" label="QR" />
      <ProofPill done={Boolean(task.beforePhoto && task.afterPhoto)} icon="images-outline" label="Ảnh" />
    </View>
  );
}

function ProofPill({
  done,
  icon,
  label,
}: {
  done: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={[styles.taskProofPill, done && styles.taskProofPillDone]}>
      <Ionicons name={icon} size={12} color={done ? colors.primaryDark : colors.mutedForeground} />
      <Text style={[styles.taskProofText, done && styles.taskProofTextDone]}>{label}</Text>
    </View>
  );
}

export function TaskSummary({ task, tree }: { task: Task; tree?: Tree | null }) {
  return (
    <>
      <TaskCard task={task} />
      <Card>
        <SectionTitle icon="leaf-outline">Hồ sơ cây mục tiêu</SectionTitle>
        <Text style={styles.itemTitle}>{tree?.name ?? task.treeName}</Text>
        <Text style={styles.itemSub}>{tree?.species}</Text>
        <Text style={styles.bodyText}>{task.treeAddress}</Text>
        <Text style={styles.monoSmall}>QR: {tree?.qrCode ?? task.treeId}</Text>
      </Card>
    </>
  );
}

export function ProofChainCard({ task }: { task: Task }) {
  const gpsTime = task.gpsCheck?.timestamp
    ? new Date(task.gpsCheck.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const checks = [
    {
      id: 'gps',
      label: 'GPS',
      body: task.gpsCheck?.verified
        ? `${task.gpsCheck.distance.toFixed(1)}m từ gốc${task.gpsCheck.accuracyMeters ? `, sai số ${task.gpsCheck.accuracyMeters.toFixed(0)}m` : ''}${gpsTime ? `, ${gpsTime}` : ''}`
        : 'Chưa xác minh trong bán kính hợp lệ',
      done: Boolean(task.gpsCheck?.verified),
      icon: 'location-outline' as const,
    },
    {
      id: 'qr',
      label: 'QR',
      body: task.qrCheck?.verified ? 'Đã quét đúng cây được giao' : 'Chưa quét đúng mã cây',
      done: Boolean(task.qrCheck?.verified),
      icon: 'qr-code-outline' as const,
    },
    {
      id: 'before',
      label: 'Ảnh trước',
      body: task.beforePhoto ? 'Đã có ảnh trước xử lý' : 'Thiếu ảnh trước xử lý',
      done: Boolean(task.beforePhoto),
      icon: 'image-outline' as const,
    },
    {
      id: 'after',
      label: 'Ảnh sau',
      body: task.afterPhoto ? 'Đã có ảnh sau xử lý' : 'Thiếu ảnh sau xử lý',
      done: Boolean(task.afterPhoto),
      icon: 'images-outline' as const,
    },
    {
      id: 'checklist',
      label: 'Checklist',
      body: task.checklist.every((item) => item.done) ? 'Tất cả hạng mục đã tick' : 'Còn hạng mục chưa hoàn thành',
      done: task.checklist.every((item) => item.done),
      icon: 'checkbox-outline' as const,
    },
  ];

  return (
    <Card>
      <View style={styles.rowBetween}>
        <SectionTitle icon="shield-checkmark-outline">Chuỗi bằng chứng</SectionTitle>
        <Badge tone={getTaskProofGaps(task).length === 0 ? 'green' : 'amber'}>{getTaskProofCount(task)}/5</Badge>
      </View>
      {checks.map((item) => (
        <View key={item.id} style={styles.proofChainRow}>
          <View style={[styles.proofChainIcon, item.done && styles.proofChainIconDone]}>
            <Ionicons name={item.icon} size={15} color={item.done ? colors.primaryDark : colors.mutedForeground} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{item.label}</Text>
            <Text style={styles.bodyText}>{item.body}</Text>
          </View>
          <Ionicons
            name={item.done ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={18}
            color={item.done ? colors.primary : colors.muted}
          />
        </View>
      ))}
    </Card>
  );
}

export function ChecklistLine({ item, index }: { item: ChecklistItem; index: number }) {
  return (
    <View style={styles.checkLine}>
      <View style={[styles.checkIndex, item.done && styles.checkIndexDone]}>
        <Text style={[styles.checkIndexText, item.done && styles.checkIndexTextDone]}>{index + 1}</Text>
      </View>
      <Text style={styles.checkText}>{item.text}</Text>
    </View>
  );
}

export function PhotoPair({ task }: { task: Task }) {
  const [preview, setPreview] = useState<'before' | 'after' | null>(null);
  const beforeEvidence = task.evidence?.find((item) => item.stage === 'before');
  const afterEvidence = task.evidence?.find((item) => item.stage === 'after');
  const canRenderImage = (uri?: string) => Boolean(uri && /^(https?:|file:|content:|data:)/i.test(uri));
  const beforePhotoUri = task.beforePhotoDisplayUrl ?? task.beforePhoto;
  const afterPhotoUri = task.afterPhotoDisplayUrl ?? task.afterPhoto;
  const beforeRenderable = canRenderImage(beforePhotoUri);
  const afterRenderable = canRenderImage(afterPhotoUri);

  return (
    <Card>
      <SectionTitle icon="images-outline">Ảnh trước và sau</SectionTitle>
      <View style={styles.photoRow}>
        <View style={styles.photoCol}>
          <Text style={styles.photoLabelBefore}>Trước</Text>
          {beforeRenderable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem ảnh trước xử lý"
              onPress={() => setPreview('before')}
            >
              <Image source={{ uri: beforePhotoUri! }} style={styles.photo} />
            </Pressable>
          ) : (
            <View style={[styles.photoMissing, task.beforePhoto ? styles.photoStored : styles.photo]}>
              <Ionicons
                name={task.beforePhoto ? 'cloud-done-outline' : 'image-outline'}
                size={20}
                color={task.beforePhoto ? colors.successText : colors.muted}
              />
              <Text style={styles.monoSmall}>{task.beforePhoto ? 'Đã lưu' : 'Chưa có ảnh'}</Text>
            </View>
          )}
          {beforeEvidence ? (
            <Text style={styles.monoSmall}>
              Ghi nhận{' '}
              {new Date(beforeEvidence.capturedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          ) : null}
        </View>
        <View style={styles.photoCol}>
          <Text style={styles.photoLabelAfter}>Sau</Text>
          {afterRenderable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem ảnh sau xử lý"
              onPress={() => setPreview('after')}
            >
              <Image source={{ uri: afterPhotoUri! }} style={styles.photo} />
            </Pressable>
          ) : (
            <View style={[styles.photoMissing, task.afterPhoto ? styles.photoStored : styles.photo]}>
              <Ionicons
                name={task.afterPhoto ? 'cloud-done-outline' : 'image-outline'}
                size={20}
                color={task.afterPhoto ? colors.successText : colors.muted}
              />
              <Text style={styles.monoSmall}>{task.afterPhoto ? 'Đã lưu' : 'Chưa có ảnh'}</Text>
            </View>
          )}
          {afterEvidence ? (
            <Text style={styles.monoSmall}>
              Ghi nhận{' '}
              {new Date(afterEvidence.capturedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          ) : null}
        </View>
      </View>
      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.photoPreviewBackdrop}>
          <View style={styles.photoPreviewHeader}>
            <Text style={styles.photoPreviewTitle}>{preview === 'before' ? 'Ảnh trước xử lý' : 'Ảnh sau xử lý'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng ảnh xem trước"
              style={styles.photoPreviewClose}
              onPress={() => setPreview(null)}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </Pressable>
          </View>
          {preview ? (
            <Image
              source={{ uri: preview === 'before' ? beforePhotoUri! : afterPhotoUri! }}
              style={styles.photoPreviewImage}
              resizeMode="contain"
            />
          ) : null}
          {beforeRenderable && afterRenderable ? (
            <View style={styles.photoPreviewSwitch}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: preview === 'before' }}
                style={[styles.photoPreviewSwitchButton, preview === 'before' && styles.photoPreviewSwitchActive]}
                onPress={() => setPreview('before')}
              >
                <Text style={styles.photoPreviewSwitchText}>Trước</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: preview === 'after' }}
                style={[styles.photoPreviewSwitchButton, preview === 'after' && styles.photoPreviewSwitchActive]}
                onPress={() => setPreview('after')}
              >
                <Text style={styles.photoPreviewSwitchText}>Sau</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </Card>
  );
}

export function Metric({
  label,
  value,
  suffix = '',
  tone = 'slate',
  bordered = true,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: 'slate' | 'green' | 'amber';
  bordered?: boolean;
}) {
  const content = (
    <View style={styles.metricInner}>
      <View style={styles.metricTopRow}>
        <Text style={styles.metricLabel} numberOfLines={2} adjustsFontSizeToFit>
          {label}
        </Text>
        <View
          style={[
            styles.metricDot,
            tone === 'green' ? styles.metricDotGreen : tone === 'amber' ? styles.metricDotAmber : styles.metricDotSlate,
          ]}
        />
      </View>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {suffix}
      </Text>
    </View>
  );

  if (!bordered) {
    return <View style={styles.metricTile}>{content}</View>;
  }

  return (
    <Card style={styles.metricCard} tone="flat">
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerSub: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  headerSubDark: {
    color: '#cbd5e1',
  },
  listCard: {
    gap: 10,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
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
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  taskSignalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  taskSignalPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardWarm,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskSignalPillDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  taskSignalPillDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#ffd5dc',
  },
  taskSignalText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  taskSignalTextDone: {
    color: colors.primaryDark,
  },
  taskSignalTextDanger: {
    color: colors.danger,
  },
  taskProofPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskProofPill: {
    minHeight: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskProofPillDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  taskProofText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  taskProofTextDone: {
    color: colors.primaryDark,
  },
  reworkReasonBox: {
    flexDirection: 'row',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ffd5dc',
    backgroundColor: colors.dangerSoft,
    padding: 11,
  },
  proofChainRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mineral,
    padding: 10,
    marginTop: 8,
  },
  proofChainIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofChainIconDone: {
    backgroundColor: colors.primarySoft,
  },
  checkLine: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  checkIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndexDone: {
    backgroundColor: colors.primarySoft,
  },
  checkIndexText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '900',
  },
  checkIndexTextDone: {
    color: colors.primaryDark,
  },
  checkText: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCol: {
    flex: 1,
    gap: 7,
  },
  photo: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: radius.md,
    backgroundColor: '#e2e8f0',
  },
  photoStored: {
    width: '100%',
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successSurface,
    padding: 8,
  },
  photoMissing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoLabelBefore: {
    textAlign: 'center',
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
  },
  photoLabelAfter: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  photoPreviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
    paddingTop: 52,
    paddingBottom: 34,
  },
  photoPreviewHeader: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoPreviewTitle: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  photoPreviewClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  photoPreviewImage: {
    flex: 1,
    width: '100%',
  },
  photoPreviewSwitch: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  photoPreviewSwitchButton: {
    minWidth: 92,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  photoPreviewSwitchActive: {
    backgroundColor: colors.primary,
  },
  photoPreviewSwitchText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  metricCard: {
    flex: 1,
    padding: 12,
  },
  metricTile: {
    flex: 1,
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metricInner: {
    gap: 4,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricDotGreen: {
    backgroundColor: colors.forestDepths || colors.primaryDark,
  },
  metricDotAmber: {
    backgroundColor: colors.amber,
  },
  metricDotSlate: {
    backgroundColor: colors.pewter || colors.muted,
  },
  metricValue: {
    color: colors.ink || colors.foreground,
    fontSize: 22,
    fontWeight: '600',
    marginTop: 4,
  },
});
