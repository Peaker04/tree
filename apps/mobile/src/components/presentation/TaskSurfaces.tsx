import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Card, ScreenHeader, SectionTitle } from '../AppPrimitives';
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
  return <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} dark={dark} />;
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

export function ProofChainCard({ task, role }: { task: Task; role?: 'Staff' | 'Supervisor' }) {
  const gpsTime = task.gpsCheck?.timestamp
    ? new Date(task.gpsCheck.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const supGpsTime = task.supervisorGpsCheck?.timestamp
    ? new Date(task.supervisorGpsCheck.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const staffChecks = [
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
      id: 'checklist',
      label: 'Checklist',
      body: task.checklist.every((item) => item.done) ? 'Tất cả hạng mục đã tick' : 'Còn hạng mục chưa hoàn thành',
      done: task.checklist.every((item) => item.done),
      icon: 'checkbox-outline' as const,
    },
  ];

  const supervisorChecks = [
    {
      id: 'staff-checkin',
      label: 'Xác nhận NV hiện trường',
      body: task.staffCompletedAt
        ? `NV ${task.assignedStaffName} đã xác nhận GPS, QR & Checklist`
        : 'Đang chờ nhân viên hiện trường xác nhận tại cây',
      done: Boolean(task.staffCompletedAt),
      icon: 'person-circle-outline' as const,
    },
    {
      id: 'sup-gps',
      label: 'Vị trí GPS Giám sát',
      body: task.supervisorGpsCheck?.verified
        ? `${task.supervisorGpsCheck.distance.toFixed(1)}m từ gốc${supGpsTime ? `, ${supGpsTime}` : ''}`
        : task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified
          ? 'Đã xác minh vị trí tại hiện trường'
          : 'Chưa xác minh vị trí giám sát hiện trường',
      done: Boolean(
        task.supervisorGpsCheck?.verified || (task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified),
      ),
      icon: 'location-outline' as const,
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
  ];

  const defaultChecks = [staffChecks[0], staffChecks[1], supervisorChecks[2], supervisorChecks[3], staffChecks[2]];

  const checks = role === 'Staff' ? staffChecks : role === 'Supervisor' ? supervisorChecks : defaultChecks;
  const doneCount =
    role === 'Staff'
      ? staffChecks.filter((c) => c.done).length
      : role === 'Supervisor'
        ? [supervisorChecks[1], supervisorChecks[2], supervisorChecks[3]].filter((c) => c.done).length
        : getTaskProofCount(task);
  const totalCount = role === 'Staff' || role === 'Supervisor' ? 3 : 5;
  const allDone =
    role === 'Staff'
      ? doneCount === 3
      : role === 'Supervisor'
        ? doneCount === 3 && Boolean(task.staffCompletedAt)
        : getTaskProofGaps(task).length === 0;

  return (
    <Card>
      <View style={styles.rowBetween}>
        <SectionTitle icon="shield-checkmark-outline">Chuỗi bằng chứng</SectionTitle>
        <Badge tone={allDone ? 'green' : 'amber'}>
          {doneCount}/{totalCount}
        </Badge>
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
              <Ionicons name="close" size={26} color={colors.snowWhite} />
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
    minHeight: 56,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0,
  },
  headerTitleDark: {
    color: colors.snowWhite,
  },
  headerSub: {
    color: colors.pewter,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
  },
  headerSubDark: {
    color: colors.pewter,
  },
  listCard: {
    gap: 10,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  itemSub: {
    color: colors.pewter,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  bodyText: {
    color: colors.pewter,
    fontSize: 13,
    lineHeight: 19,
  },
  monoSmall: {
    color: colors.pewter,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  metricLabel: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    paddingTop: 10,
    marginTop: 2,
  },
  taskSignalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  taskSignalPill: {
    minHeight: 30,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.snowWhite,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskSignalPillDone: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  taskSignalPillDanger: {
    backgroundColor: colors.criticalSurface,
    borderColor: colors.criticalBorder,
  },
  taskSignalText: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '500',
  },
  taskSignalTextDone: {
    color: colors.successText,
  },
  taskSignalTextDanger: {
    color: colors.criticalText,
  },
  taskProofPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskProofPill: {
    minHeight: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.snowWhite,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskProofPillDone: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  taskProofText: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '500',
  },
  taskProofTextDone: {
    color: colors.successText,
  },
  reworkReasonBox: {
    flexDirection: 'row',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.criticalBorder,
    backgroundColor: colors.criticalSurface,
    padding: 12,
  },
  proofChainRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    paddingVertical: 10,
    marginTop: 6,
  },
  proofChainIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.snowWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofChainIconDone: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  checkLine: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  checkIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndexDone: {
    backgroundColor: colors.successSurface,
  },
  checkIndexText: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '600',
  },
  checkIndexTextDone: {
    color: colors.successText,
  },
  checkText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
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
    backgroundColor: colors.neutralSurface,
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
    color: colors.warningText,
    fontSize: 12,
    fontWeight: '600',
  },
  photoLabelAfter: {
    textAlign: 'center',
    color: colors.successText,
    fontSize: 12,
    fontWeight: '600',
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
    color: colors.snowWhite,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
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
    color: colors.snowWhite,
    fontSize: 14,
    fontWeight: '600',
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
