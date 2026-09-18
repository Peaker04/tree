import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, BrandMark, Button, Card } from '../../components/AppPrimitives';
import { Metric } from '../../components/presentation/TaskSurfaces';
import { colors, radius } from '../../theme/tokens';
import { Task, TaskStatus } from '../../types';
import { mockTreeLandscapePhoto } from '../../assets/mockEvidenceAssets';
import { formatTaskDate, getTaskProofWorkflowState, ProofStepKey, StaffStep } from '../../domain/mobileWorkflow';

const avatarPhoto = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80';

interface StaffHomeProps {
  openTaskCount: number;
  actionableTaskCount?: number;
  completionRate: number;
  completed: number;
  totalTasks: number;
  assignedTreeCount: number;
  waitingReviewCount: number;
  nextTask: Task | null;
  unreadNotificationCount: number;
  loading?: boolean;
  errorMessage?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  onOpenNotifications: () => void;
  onOpenWork: () => void;
  onOpenTrees: () => void;
  onOpenTask?: (task: Task) => void;
  onStartTaskProof?: (task: Task) => void;
}

const getStepIcon = (step: StaffStep | ProofStepKey | null): keyof typeof Ionicons.glyphMap => {
  switch (step) {
    case 'GPS':
      return 'location-outline';
    case 'QR':
      return 'qr-code-outline';
    case 'BEFORE':
    case 'AFTER':
      return 'camera-outline';
    case 'CHECKLIST':
      return 'checkbox-outline';
    case 'REVIEW':
      return 'send-outline';
    default:
      return 'arrow-forward-outline';
  }
};

export function StaffHome({
  openTaskCount,
  actionableTaskCount,
  completionRate,
  completed,
  totalTasks,
  assignedTreeCount,
  waitingReviewCount,
  nextTask,
  unreadNotificationCount,
  loading = false,
  errorMessage,
  isOffline = false,
  onRetry,
  onOpenNotifications,
  onOpenWork,
  onOpenTrees,
  onOpenTask,
  onStartTaskProof,
}: StaffHomeProps) {
  const workflowState = nextTask ? getTaskProofWorkflowState(nextTask) : null;
  const effectiveActionableCount = actionableTaskCount ?? Math.max(0, openTaskCount - waitingReviewCount);
  const hasNoAssignments = totalTasks === 0;
  const isAllWaitingReview = totalTasks > 0 && effectiveActionableCount === 0 && waitingReviewCount > 0;
  const isShiftFullyCompleted = totalTasks > 0 && openTaskCount === 0 && waitingReviewCount === 0;

  const heroBodyText = loading
    ? 'Đang đồng bộ dữ liệu ca trực thực địa...'
    : hasNoAssignments
      ? 'Hiện tại bạn chưa có nhiệm vụ được phân công trong ca trực hôm nay. Bạn có thể theo dõi danh sách cây phụ trách.'
      : isAllWaitingReview
        ? `Đã hoàn tất nộp báo cáo toàn bộ ca trực (${waitingReviewCount} việc đang chờ quản lý phê duyệt).`
        : isShiftFullyCompleted
          ? `Đã hoàn tất toàn bộ ${totalTasks} nhiệm vụ trong ca trực. Theo dõi cây phụ trách và chờ phân công mới.`
          : `${effectiveActionableCount} việc cần xử lý. Bắt đầu bằng việc xác thực GPS tại gốc cây trước khi quét QR.`;

  return (
    <ScrollView
      style={styles.screenContainer}
      contentContainerStyle={styles.screenPad}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.headerBlock}>
        <BrandMark />
        <View style={styles.headerRightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thông báo${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} chưa đọc` : ''}`}
            onPress={onOpenNotifications}
            style={styles.bellButton}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {unreadNotificationCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Image
            source={{ uri: avatarPhoto }}
            accessibilityRole="image"
            accessibilityLabel="Ảnh đại diện nhân viên"
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Offline Alert Indicator */}
      {isOffline ? (
        <View style={styles.offlinePill}>
          <Ionicons name="cloud-offline-outline" size={13} color={colors.pewter} />
          <Text style={styles.offlineText}>Chế độ ngoại tuyến • Đang dùng dữ liệu lưu trên thiết bị</Text>
        </View>
      ) : null}

      {/* Error Notice Banner with Retry */}
      {errorMessage ? (
        <Card tone="danger" style={styles.errorCard}>
          <View style={styles.errorContentRow}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          {onRetry ? (
            <Button variant="outline" size="compact" onPress={onRetry}>
              Thử lại
            </Button>
          ) : null}
        </Card>
      ) : null}

      {/* Hero Greeting & Field Shift Context */}
      <Card tone="warm" style={styles.heroCard}>
        <View style={styles.heroContentRow}>
          <View style={styles.flex}>
            <View style={styles.kickerRow}>
              <View style={[styles.statusDotLive, isOffline && styles.statusDotOffline]} />
              <Text style={styles.heroKicker}>
                {isOffline ? 'NGOẠI TUYẾN • NV: HÙNG' : 'CA TRỰC HIỆN TRƯỜNG • NV: HÙNG'}
              </Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Theo dõi cây & nhiệm vụ hôm nay
            </Text>
            <Text style={styles.heroBody}>{heroBodyText}</Text>
          </View>
          <Image
            source={mockTreeLandscapePhoto}
            accessibilityRole="image"
            accessibilityLabel="Ảnh minh họa ca trực hiện trường"
            style={styles.heroImage}
          />
        </View>
      </Card>

      {/* Quick Metrics Bar - Single grouped Linear surface with hairline dividers & responsive font scaling */}
      <Card tone="flat" style={styles.statsBar}>
        <Metric
          label="Tiến độ"
          value={hasNoAssignments ? '--' : completionRate}
          suffix={hasNoAssignments ? '' : '%'}
          tone={hasNoAssignments ? 'slate' : 'green'}
          bordered={false}
        />
        <View style={styles.statsDivider} />
        <Metric label="Cây phụ trách" value={assignedTreeCount} tone="slate" bordered={false} />
        <View style={styles.statsDivider} />
        <Metric label="Chờ duyệt" value={waitingReviewCount} tone="amber" bordered={false} />
      </Card>

      {/* Shift Progress - Seed Lime Accent & Semantic 0/0 Handling */}
      <Card tone="flat" style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>{hasNoAssignments ? 'Chỉ tiêu ca trực' : 'Tiến độ công việc hôm nay'}</Text>
          {hasNoAssignments ? (
            <Badge tone="neutral" pill>
              Chưa giao việc
            </Badge>
          ) : isAllWaitingReview ? (
            <Badge tone="amber" pill>
              Đã nộp {completed} / {totalTasks} ({completionRate}%)
            </Badge>
          ) : (
            <Badge tone="accent" pill>
              {completed} / {totalTasks} việc ({completionRate}%)
            </Badge>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: hasNoAssignments ? '0%' : `${Math.min(completionRate, 100)}%` }]}
          />
        </View>
        <Text style={styles.captionText}>
          {hasNoAssignments
            ? 'Hiện chưa có chỉ tiêu công việc nào được phân công cho ca trực này.'
            : isAllWaitingReview
              ? 'Toàn bộ nhiệm vụ đã hoàn thành 5 bước bằng chứng và đã gửi quản lý duyệt.'
              : 'Bằng chứng thực địa cần hoàn tất đầy đủ 5 bước để hoàn thành nhiệm vụ.'}
        </Text>
      </Card>

      {/* Main Content Area: Loading vs Priority Task vs All Waiting Review vs Fully Completed vs Standby */}
      {loading && totalTasks === 0 ? (
        /* Loading Skeleton / Standby indicator */
        <Card tone="warm" style={styles.loadingCard}>
          <ActivityIndicator color={colors.forestDepths} size="small" />
          <Text style={styles.loadingText}>Đang tải dữ liệu nhiệm vụ ca trực...</Text>
        </Card>
      ) : nextTask && effectiveActionableCount > 0 && workflowState ? (
        /* Actionable Priority Task Card */
        <Card tone="flat" style={styles.priorityCard}>
          <View style={styles.priorityHeaderRow}>
            <Badge
              tone={
                nextTask.status === TaskStatus.REWORK_REQUIRED
                  ? 'danger'
                  : nextTask.status === TaskStatus.IN_PROGRESS
                    ? 'sky'
                    : 'accent'
              }
              pill
            >
              {nextTask.status === TaskStatus.REWORK_REQUIRED
                ? 'CẦN LÀM LẠI'
                : nextTask.status === TaskStatus.IN_PROGRESS
                  ? 'ĐANG THỰC HIỆN'
                  : 'ƯU TIÊN XỬ LÝ TIẾP'}
            </Badge>
            <Text style={styles.monoTaskId}>#{nextTask.id}</Text>
          </View>

          <View style={styles.taskMetaSection}>
            <Text style={styles.taskTreeTitle} numberOfLines={1}>
              {nextTask.treeName}
            </Text>
            <Text style={styles.taskTypeSubtitle}>
              {nextTask.taskType} • Hạn chót: {formatTaskDate(nextTask.deadline)}
            </Text>
            <Text style={styles.taskAddress} numberOfLines={1}>
              {nextTask.treeAddress}
            </Text>
          </View>

          {/* Domain-derived 5-Step Proof Chain Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.rowBetween}>
              <Text style={styles.stepperTitle}>Chuỗi bằng chứng thực địa bắt buộc:</Text>
              <Text style={styles.monoSmall}>
                {workflowState.proofCount}/{workflowState.totalRequired} hoàn tất
              </Text>
            </View>
            <View style={styles.stepperRow}>
              {workflowState.steps.map((step, idx) => (
                <React.Fragment key={step.key}>
                  <View
                    accessibilityRole="text"
                    accessibilityLabel={`Bước ${step.label}: ${
                      step.done
                        ? 'Đã hoàn thành'
                        : step.isCurrent
                          ? 'Cần thực hiện tiếp theo'
                          : 'Đang chờ điều kiện trước'
                    }`}
                    style={[
                      styles.stepPill,
                      step.done && styles.stepPillDone,
                      step.isCurrent && styles.stepPillCurrent,
                    ]}
                  >
                    <Ionicons
                      name={step.done ? 'checkmark' : step.isCurrent ? getStepIcon(step.key) : 'ellipse'}
                      size={step.isCurrent ? 12 : 10}
                      color={step.done ? colors.forestDepths : step.isCurrent ? colors.forestDepths : colors.pewter}
                    />
                    <Text
                      style={[
                        styles.stepPillText,
                        step.done && styles.stepPillTextDone,
                        step.isCurrent && styles.stepPillTextCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {idx < workflowState.steps.length - 1 ? (
                    <Ionicons name="chevron-forward" size={10} color={colors.hairlineBorder} />
                  ) : null}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Primary Action Button - Guaranteed valid proof step */}
          {workflowState.nextStep ? (
            <Button
              variant="forest"
              pill
              size="field"
              icon={getStepIcon(workflowState.nextStep)}
              accessibilityLabel={workflowState.activeActionText}
              onPress={() => {
                if (onStartTaskProof) {
                  onStartTaskProof(nextTask);
                } else if (onOpenTask) {
                  onOpenTask(nextTask);
                } else {
                  onOpenWork();
                }
              }}
            >
              {workflowState.activeActionText}
            </Button>
          ) : null}

          {/* Focused Secondary Action: open task detail only */}
          {onOpenTask ? (
            <View style={styles.prioritySecondaryRow}>
              <Button
                variant="outline"
                pill
                size="default"
                icon="document-text-outline"
                accessibilityLabel="Xem chi tiết công việc"
                onPress={() => onOpenTask(nextTask)}
                style={styles.flex}
              >
                Chi tiết công việc
              </Button>
            </View>
          ) : null}
        </Card>
      ) : isAllWaitingReview ? (
        /* State 3: All tasks submitted and waiting for manager review */
        <Card tone="warm" style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircleAmber}>
            <Ionicons name="time-outline" size={24} color={colors.amber} />
          </View>
          <Badge tone="amber" pill>
            ĐANG CHỜ DUYỆT
          </Badge>
          <Text style={styles.emptyTitle}>Đã nộp toàn bộ báo cáo ca trực</Text>
          <Text style={styles.emptyBody}>
            Bạn đã hoàn tất thu thập đủ 5 bước bằng chứng cho tất cả nhiệm vụ. Hiện có {waitingReviewCount} báo cáo đang
            chờ quản lý phê duyệt.
          </Text>
          <View style={styles.twoCols}>
            <Button variant="forest" pill size="default" icon="leaf-outline" onPress={onOpenTrees} style={styles.flex}>
              Cây phụ trách ({assignedTreeCount})
            </Button>
            <Button
              variant="outline"
              pill
              size="default"
              icon="clipboard-outline"
              onPress={onOpenWork}
              style={styles.flex}
            >
              Xem danh sách việc
            </Button>
          </View>
        </Card>
      ) : isShiftFullyCompleted ? (
        /* State 4: Valid shift fully completed and approved */
        <Card tone="warm" style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircleCompleted}>
            <Ionicons name="checkmark-done" size={24} color={colors.forestDepths} />
          </View>
          <Badge tone="accent" pill>
            HOÀN THÀNH TOÀN BỘ
          </Badge>
          <Text style={styles.emptyTitle}>Ca trực hiện tại đã hoàn tất</Text>
          <Text style={styles.emptyBody}>
            Toàn bộ {totalTasks} nhiệm vụ trong ca trực đã được quản lý nghiệm thu thành công. Bạn có thể kiểm tra cây
            phụ trách hoặc xem lại lịch sử.
          </Text>
          <View style={styles.twoCols}>
            <Button variant="forest" pill size="default" icon="leaf-outline" onPress={onOpenTrees} style={styles.flex}>
              Cây phụ trách ({assignedTreeCount})
            </Button>
            <Button
              variant="outline"
              pill
              size="default"
              icon="clipboard-outline"
              onPress={onOpenWork}
              style={styles.flex}
            >
              Lịch sử việc
            </Button>
          </View>
        </Card>
      ) : (
        /* State 1: Standby / No assignments */
        <Card tone="warm" style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircleNeutral}>
            <Ionicons name="calendar-outline" size={24} color={colors.pewter} />
          </View>
          <Badge tone="neutral" pill>
            CHƯA PHÂN CÔNG
          </Badge>
          <Text style={styles.emptyTitle}>Chưa có nhiệm vụ được giao</Text>
          <Text style={styles.emptyBody}>
            Hiện tại chưa có nhiệm vụ nào cần thực hiện trong ca trực hôm nay. Hãy kiểm tra danh sách cây hoặc chờ điều
            phối viên giao việc.
          </Text>
          <View style={styles.twoCols}>
            <Button variant="forest" pill size="default" icon="leaf-outline" onPress={onOpenTrees} style={styles.flex}>
              Cây phụ trách ({assignedTreeCount})
            </Button>
            <Button
              variant="outline"
              pill
              size="default"
              icon="clipboard-outline"
              onPress={onOpenWork}
              style={styles.flex}
            >
              Kiểm tra việc
            </Button>
          </View>
        </Card>
      )}

      {/* Quick Navigation Footnote */}
      <View style={styles.quickNavRow}>
        <Button variant="outline" pill size="default" icon="clipboard-outline" onPress={onOpenWork} style={styles.flex}>
          Danh sách việc ({openTaskCount})
        </Button>
        <Button variant="outline" pill size="default" icon="leaf-outline" onPress={onOpenTrees} style={styles.flex}>
          Cây của tôi ({assignedTreeCount})
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.snowWhite,
  },
  screenPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 104,
    gap: 14,
  },
  flex: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.warmStone,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignSelf: 'flex-start',
  },
  offlineText: {
    color: colors.pewter,
    fontSize: 11,
    fontWeight: '500',
  },
  errorCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroCard: {
    padding: 16,
    borderColor: colors.hairlineBorder,
    borderWidth: 1,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forestDepths,
  },
  statusDotOffline: {
    backgroundColor: colors.pewter,
  },
  heroKicker: {
    color: colors.pewter,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  heroBody: {
    color: colors.pewter,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  heroImage: {
    width: 76,
    height: 76,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  statsDivider: {
    width: 1,
    backgroundColor: colors.hairlineBorder,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  progressCard: {
    padding: 14,
    gap: 10,
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.warmStone,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.forestDepths,
  },
  captionText: {
    color: colors.pewter,
    fontSize: 11,
    lineHeight: 16,
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  loadingText: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '500',
  },
  priorityCard: {
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  monoTaskId: {
    color: colors.pewter,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  monoSmall: {
    color: colors.pewter,
    fontSize: 10,
    fontWeight: '500',
  },
  taskMetaSection: {
    gap: 3,
  },
  taskTreeTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  taskTypeSubtitle: {
    color: colors.forestDepths,
    fontSize: 13,
    fontWeight: '500',
  },
  taskAddress: {
    color: colors.pewter,
    fontSize: 12,
    lineHeight: 17,
  },
  stepperContainer: {
    backgroundColor: colors.warmStone,
    borderRadius: radius.compact,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  stepperTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  stepPillDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  stepPillCurrent: {
    backgroundColor: colors.limePulse,
    borderColor: '#c0ea82',
  },
  stepPillText: {
    color: colors.pewter,
    fontSize: 10,
    fontWeight: '500',
  },
  stepPillTextDone: {
    color: colors.forestDepths,
    fontWeight: '600',
  },
  stepPillTextCurrent: {
    color: colors.forestDepths,
    fontWeight: '600',
  },
  prioritySecondaryRow: {
    flexDirection: 'row',
  },
  emptyStateCard: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  emptyIconCircleCompleted: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.limePulse,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconCircleAmber: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconCircleNeutral: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.warmStone,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.pewter,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 290,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
