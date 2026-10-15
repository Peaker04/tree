import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoCamera from 'expo-camera';
import { Badge, Button, Card, EmptyState, Field, SectionTitle } from '../../components/AppPrimitives';
import { DeviceCameraView, type DeviceCameraViewHandle } from '../../components/DeviceCameraView';
import { DevicePermissionState } from '../../components/DevicePermissionState';
import { Header, ChecklistLine, PhotoPair, ProofChainCard } from '../../components/presentation/TaskSurfaces';
import { TreeLookupResult } from '../../components/presentation/TreeSurfaces';
import { WebMapView } from '../../components/presentation/WebMapView';
import { getDistanceMeters } from '../../domain/geo';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';
import { openDeviceSettings, type DevicePermissionPurpose } from '../../services/devicePermissions';
import { colors, radius } from '../../theme/tokens';
import { AppNotification, CareHistory, Task, TaskStatus, Tree } from '../../types';
import type { CreateNotificationRequest, ReportFieldIssueRequest, ResubmitReworkRequest } from '@novyx/contracts';
import {
  StaffStep,
  getTaskProofCount,
  getTaskProofGaps,
  getTaskStatusMeta,
  getTaskProofWorkflowState,
  removePhotoEvidence,
  upsertPhotoEvidence,
} from '../../domain/mobileWorkflow';

type CameraModule = typeof import('expo-camera');

let cachedMapsModule: typeof import('react-native-maps') | null | undefined;

export function StaffProofFlow(props: {
  step: StaffStep;
  setStep: (step: StaffStep) => void;
  activeTask: Task | null;
  setActiveTask: (task: Task | null) => void;
  tasks: Task[];
  trees: Tree[];
  staffTasks: Task[];
  openTasks: Task[];
  mapReturnStep: StaffStep;
  setMapReturnStep: (step: StaffStep) => void;
  userLat: number;
  userLng: number;
  setUserLat: (lat: number) => void;
  setUserLng: (lng: number) => void;
  updateTasks: (tasks: Task[]) => void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  lookupTreeByQr: (payload: string) => Promise<Tree | null>;
  startTask: (task: Task) => Promise<Task>;
  reportFieldIssue: (request: ReportFieldIssueRequest) => Promise<Task>;
  submitTaskEvidence: (task: Task) => Promise<Task>;
  resubmitRework: (request: ResubmitReworkRequest) => Promise<Task>;
  createNotification: (request: CreateNotificationRequest) => Promise<AppNotification>;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Chưa có vị trí hiện trường.');
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<number | null>(null);
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null);
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [scannedTree, setScannedTree] = useState<Tree | null>(null);
  const [qrLookupLoading, setQrLookupLoading] = useState(false);
  const [qrLookupMessage, setQrLookupMessage] = useState('');
  const cameraModule: CameraModule = ExpoCamera;
  const [cameraRuntimeMessage, setCameraRuntimeMessage] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [gpsPermissionVisible, setGpsPermissionVisible] = useState(false);
  const [startingTask, setStartingTask] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [reportingLocationException, setReportingLocationException] = useState(false);
  const [locationExceptionReason, setLocationExceptionReason] = useState('');
  const cameraRef = useRef<DeviceCameraViewHandle | null>(null);
  const qrScanLockRef = useRef(0);
  const {
    cameraPermission,
    activeCameraPurpose,
    requestCameraForPurpose,
    requestLocationForPurpose,
    showRationaleForPurpose,
    releaseCamera,
    getPermissionStateForPurpose,
    getRuntimeMessageForPurpose,
  } = useDevicePermissions();

  const activeTree = props.activeTask ? props.trees.find((tree) => tree.id === props.activeTask?.treeId) : null;
  const isRework = props.activeTask?.status === TaskStatus.REWORK_REQUIRED;
  const distance = activeTree ? getDistanceMeters(props.userLat, props.userLng, activeTree.lat, activeTree.lng) : 999;
  const selectedMapTask = props.activeTask ?? props.openTasks[0] ?? props.staffTasks[0] ?? null;
  const selectedMapTree = selectedMapTask ? props.trees.find((tree) => tree.id === selectedMapTask.treeId) : null;

  const staffCameraPurpose: Exclude<DevicePermissionPurpose, 'staff-gps'> | null =
    props.step === 'QR'
      ? props.activeTask
        ? 'staff-task-qr'
        : 'staff-free-qr'
      : props.step === 'BEFORE'
        ? 'staff-before-photo'
        : props.step === 'AFTER'
          ? 'staff-after-photo'
          : null;

  useEffect(
    () => () => {
      releaseCamera();
    },
    [releaseCamera],
  );

  useEffect(() => {
    setCameraRuntimeMessage('');
  }, [staffCameraPurpose]);

  useEffect(() => {
    if (!staffCameraPurpose) {
      releaseCamera();
      return;
    }

    if (cameraPermission?.granted && activeCameraPurpose !== staffCameraPurpose) {
      void requestCameraForPurpose(staffCameraPurpose);
    }
  }, [activeCameraPurpose, cameraPermission?.granted, releaseCamera, requestCameraForPurpose, staffCameraPurpose]);

  const patchTask = (task: Task, patch: Partial<Task>) => {
    const nextTask = { ...task, ...patch, updatedAt: new Date().toISOString() };
    props.updateTasks(props.tasks.map((item) => (item.id === nextTask.id ? nextTask : item)));
    if (props.activeTask?.id === nextTask.id || selectedMapTask?.id === nextTask.id) {
      props.setActiveTask(nextTask);
    }
    return nextTask;
  };

  const patchActiveTask = (patch: Partial<Task>) => {
    if (!props.activeTask) return;
    patchTask(props.activeTask, patch);
  };

  const resetQrError = () => setQrErrorMessage('');

  const lookupTreeByQr = async (payload: string) => {
    setQrLookupLoading(true);
    setQrLookupMessage('');
    try {
      const matchedTree = await props.lookupTreeByQr(payload);
      if (!matchedTree) {
        setScannedTree(null);
        setQrErrorMessage(`Không tìm thấy cây với mã ${payload}. Hãy kiểm tra lại QR hoặc đồng bộ dữ liệu.`);
        return;
      }

      resetQrError();
      setScannedTree(matchedTree);
      releaseCamera();
      setQrLookupMessage(`Đã tìm thấy ${matchedTree.name}.`);
    } catch {
      setScannedTree(null);
      setQrErrorMessage('Không thể tra cứu cây. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setQrLookupLoading(false);
    }
  };

  const readDeviceLocationAfterPermission = async () => {
    setLocating(true);
    try {
      const permission = await requestLocationForPurpose('staff-gps');
      if (!permission?.granted) {
        setLocationMessage(
          permission?.canAskAgain === false ? 'Bật quyền Vị trí trong Cài đặt.' : 'Cấp quyền vị trí để tiếp tục.',
        );
        return;
      }

      const Location = await import('expo-location');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const capturedAt = new Date().toISOString();
      props.setUserLat(position.coords.latitude);
      props.setUserLng(position.coords.longitude);
      setLocationAccuracyMeters(position.coords.accuracy ?? null);
      setLocationCapturedAt(capturedAt);
      setLocationMessage(
        `Đã cập nhật GPS thật lúc ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setLocationMessage(
        message.includes('ExpoLocation')
          ? 'Runtime hiện tại chưa có ExpoLocation. Hãy rebuild dev client hoặc mở bằng Expo Go đúng SDK.'
          : 'GPS chưa sẵn sàng. Thử lại ngoài trời.',
      );
    } finally {
      setLocating(false);
    }
  };

  const refreshDeviceLocation = () => {
    setGpsPermissionVisible(true);
    if (getPermissionStateForPurpose('staff-gps') !== 'granted') {
      showRationaleForPurpose('staff-gps');
      return;
    }
    void readDeviceLocationAfterPermission();
  };

  const gpsPermissionState = getPermissionStateForPurpose('staff-gps');
  const gpsPermissionNode =
    gpsPermissionVisible && gpsPermissionState !== 'granted' ? (
      <DevicePermissionState
        kind="location"
        purpose="staff-gps"
        state={gpsPermissionState}
        runtimeMessage={getRuntimeMessageForPurpose('staff-gps')}
        onRequest={() => void readDeviceLocationAfterPermission()}
        onOpenSettings={() => void openDeviceSettings()}
        onCancel={() => setGpsPermissionVisible(false)}
      />
    ) : null;

  const checkInTask = (task: Task, tree: Tree, nextStep: StaffStep = 'QR') => {
    const nextDistance = getDistanceMeters(props.userLat, props.userLng, tree.lat, tree.lng);
    patchTask(task, {
      gpsCheck: {
        verified: nextDistance < 10,
        distance: nextDistance,
        timestamp: new Date().toISOString(),
        lat: props.userLat,
        lng: props.userLng,
        ...(locationAccuracyMeters !== null ? { accuracyMeters: locationAccuracyMeters } : {}),
      },
    });
    props.setStep(task.qrCheck?.verified ? 'BEFORE' : nextStep);
  };

  if (props.step === 'MAP') {
    return (
      <ScrollView contentContainerStyle={[styles.screenPad, styles.mapScreen]}>
        <Header
          title="Bản đồ check-in"
          subtitle="Chọn cây, đứng trong bán kính 10m rồi quét QR"
          onBack={() => props.setStep(props.mapReturnStep)}
        />
        {selectedMapTask && selectedMapTree ? (
          <>
            <TreeCheckinMap
              task={selectedMapTask}
              tree={selectedMapTree}
              userLat={props.userLat}
              userLng={props.userLng}
              locationMessage={locationMessage}
              locating={locating}
              locationAccuracyMeters={locationAccuracyMeters}
              locationCapturedAt={locationCapturedAt}
              permissionStateNode={gpsPermissionNode}
              onLocate={refreshDeviceLocation}
              onCheckIn={() => checkInTask(selectedMapTask, selectedMapTree)}
            />
            <View style={styles.mapTaskList}>
              <SectionTitle icon="leaf-outline">Cây cần xử lý hôm nay</SectionTitle>
              {props.openTasks.map((task) => {
                const tree = props.trees.find((item) => item.id === task.treeId);
                const active = task.id === selectedMapTask.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Chọn cây check-in ${task.treeName}`}
                    accessibilityState={{ selected: active }}
                    key={task.id}
                    style={[styles.mapTaskRow, active && styles.mapTaskRowActive]}
                    onPress={() => props.setActiveTask(task)}
                  >
                    <View style={[styles.mapTaskDot, active && styles.mapTaskDotActive]} />
                    <View style={styles.flex}>
                      <Text style={styles.itemTitle}>{task.treeName}</Text>
                      <Text style={styles.itemSub}>{tree?.address ?? task.treeAddress}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <EmptyState title="Không có cây cần check-in" body="Các nhiệm vụ hiện trường sẽ xuất hiện trên bản đồ." />
        )}
      </ScrollView>
    );
  }

  if (props.step === 'DETAIL' && props.activeTask) {
    const statusMeta = getTaskStatusMeta(props.activeTask.status);
    const proofGaps = getTaskProofGaps(props.activeTask);
    const wState = getTaskProofWorkflowState(props.activeTask);

    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Chi tiết công việc" onBack={() => props.setStep('WORK')} />

        <View style={styles.taskOrientation}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{props.activeTask.title}</Text>
            <Text style={styles.bodyText}>{activeTree?.name ?? props.activeTask.treeName}</Text>
            <Text style={styles.itemSub}>{props.activeTask.treeAddress}</Text>
          </View>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </View>

        {props.activeTask.status === TaskStatus.REWORK_REQUIRED && props.activeTask.rejectReason ? (
          <View style={styles.correctionPanel}>
            <Ionicons name="build-outline" size={20} color={colors.danger} />
            <View style={styles.flex}>
              <Text style={styles.alertText}>Nội dung cần làm lại</Text>
              <Text style={styles.bodyText}>{props.activeTask.rejectReason}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.progressSummary}>
          <View style={styles.flex}>
            <Text style={styles.metricLabel}>Bằng chứng</Text>
            <Text style={styles.itemTitle}>
              {wState.proofCount}/{wState.totalRequired} bước hoàn thành
            </Text>
          </View>
          <Badge tone={proofGaps.length === 0 ? 'green' : 'amber'}>
            {proofGaps.length === 0 ? 'Đã đủ' : `Còn ${proofGaps.length}`}
          </Badge>
        </View>

        {proofGaps.length > 0 && !wState.isSubmittedOrCompleted ? (
          <View style={styles.compactGapList}>
            {proofGaps.map((gap) => (
              <View key={gap} style={styles.compactGapRow}>
                <Ionicons name="ellipse" size={7} color={colors.warningText} />
                <Text style={styles.bodyText}>{gap}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.sectionBlock}>
          <SectionTitle icon="list-outline">Các bước thực hiện</SectionTitle>
          {props.activeTask.checklist.map((item, index) => (
            <ChecklistLine key={item.id} index={index} item={item} />
          ))}
        </View>

        {(props.activeTask.status === TaskStatus.IN_PROGRESS || props.activeTask.status === 'IN_PROGRESS') &&
        !reportingIssue ? (
          <Button
            variant="danger"
            size="field"
            icon="warning-outline"
            disabled={startingTask}
            onPress={() => setReportingIssue(true)}
          >
            Báo cáo sự cố hiện trường
          </Button>
        ) : (props.activeTask.status === TaskStatus.IN_PROGRESS || props.activeTask.status === 'IN_PROGRESS') &&
          reportingIssue ? (
          <Card tone="danger">
            <SectionTitle icon="warning-outline">Cung cấp thông tin sự cố</SectionTitle>
            <Field
              label="Mô tả sự cố (ít nhất 5 ký tự)"
              placeholder="Cây bị ngã đổ, khu vực ngập lụt..."
              value={issueDesc}
              onChangeText={setIssueDesc}
              multiline
            />
            {!props.activeTask.beforePhoto && (
              <Text style={[styles.bodyText, { marginTop: 8, color: colors.criticalText, fontWeight: '600' }]}>
                * Cần có ảnh chụp trước xử lý trước khi báo cáo sự cố. Vui lòng quay lại chụp ảnh trước xử lý.
              </Text>
            )}
            <View style={[styles.twoCols, { marginTop: 12 }]}>
              <Button
                variant="outline"
                size="compact"
                onPress={() => {
                  setReportingIssue(false);
                  setIssueDesc('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                size="compact"
                disabled={startingTask || issueDesc.trim().length < 5 || !props.activeTask.beforePhoto}
                loading={startingTask}
                onPress={async () => {
                  if (!props.activeTask || !props.activeTask.beforePhoto) return;
                  setStartingTask(true);
                  try {
                    const blocked = await props.reportFieldIssue({
                      taskId: props.activeTask.id,
                      expectedVersion: props.activeTask.version ?? 0,
                      issueDescription: issueDesc.trim(),
                      issuePhotoUri: props.activeTask.beforePhoto,
                    });
                    props.setActiveTask(blocked);
                    setReportingIssue(false);
                    setIssueDesc('');
                    props.setStep('WORK');
                  } finally {
                    setStartingTask(false);
                  }
                }}
              >
                Gửi quản lý
              </Button>
            </View>
          </Card>
        ) : null}

        <Button
          variant="forest"
          pill
          size="field"
          icon={
            wState.nextStep === 'GPS'
              ? 'location-outline'
              : wState.nextStep
                ? 'play-outline'
                : 'checkmark-circle-outline'
          }
          disabled={wState.isSubmittedOrCompleted || startingTask}
          loading={startingTask}
          onPress={async () => {
            resetQrError();
            if (props.activeTask) {
              if (props.activeTask.status === TaskStatus.PENDING || props.activeTask.status === 'PENDING') {
                setStartingTask(true);
                try {
                  const started = await props.startTask(props.activeTask);
                  props.setActiveTask(started);
                  props.setStep(wState.nextStep ?? 'WORK');
                } catch {
                  // Wait, error banner should be shown. For now, stay on DETAIL.
                } finally {
                  setStartingTask(false);
                }
              } else {
                props.setStep(wState.nextStep ?? 'WORK');
              }
            }
          }}
        >
          {startingTask
            ? 'Đang thực hiện...'
            : wState.activeActionText ||
              (props.activeTask.status === TaskStatus.COMPLETED ? 'Đã hoàn thành' : 'Đang chờ duyệt')}
        </Button>
      </ScrollView>
    );
  }

  if (props.step === 'GPS' && props.activeTask) {
    const verified = distance < 10;
    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Xác minh GPS" subtitle={props.activeTask.treeName} onBack={() => props.setStep('DETAIL')} />
        {activeTree ? (
          <TreeCheckinMap
            task={props.activeTask}
            tree={activeTree}
            userLat={props.userLat}
            userLng={props.userLng}
            locationMessage={locationMessage}
            locating={locating}
            locationAccuracyMeters={locationAccuracyMeters}
            locationCapturedAt={locationCapturedAt}
            permissionStateNode={gpsPermissionNode}
            onLocate={refreshDeviceLocation}
            onCheckIn={() => checkInTask(props.activeTask as Task, activeTree)}
          />
        ) : null}
        <Button
          icon="scan-outline"
          disabled={!verified || !locationCapturedAt}
          onPress={() => {
            if (activeTree) {
              resetQrError();
              checkInTask(props.activeTask as Task, activeTree);
            }
          }}
        >
          Check-in và quét QR
        </Button>

        {locationCapturedAt && !verified && !reportingLocationException ? (
          <Button variant="outline" icon="alert-circle-outline" onPress={() => setReportingLocationException(true)}>
            Báo ngoại lệ vị trí hiện trường
          </Button>
        ) : null}

        {reportingLocationException ? (
          <Card tone="amber" style={styles.exceptionCard}>
            <SectionTitle icon="warning-outline">Báo ngoại lệ vị trí hiện trường</SectionTitle>
            <Text style={styles.bodyText}>
              Thiết bị đang cách cây{' '}
              {distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance.toFixed(1)} m`}. Nếu có chướng ngại
              vật hoặc tán cây làm trôi sóng, hãy nêu lý do để quản lý duyệt có ngoại lệ:
            </Text>
            <View style={styles.reasonChips}>
              {[
                'Tán cây rậm rạp làm trôi tín hiệu GPS',
                'Rào chắn công trình không tiếp cận được gốc cây',
                'Vị trí cây thực tế lệch so với ghim bản đồ',
              ].map((reasonOption) => (
                <Pressable
                  key={reasonOption}
                  accessibilityRole="button"
                  onPress={() => setLocationExceptionReason(reasonOption)}
                  style={[styles.filterChip, locationExceptionReason === reasonOption && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      locationExceptionReason === reasonOption && styles.filterChipTextActive,
                    ]}
                  >
                    {reasonOption}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Lý do ngoại lệ (ít nhất 5 ký tự)"
              value={locationExceptionReason}
              onChangeText={setLocationExceptionReason}
              placeholder="Mô tả lý do không thể tiếp cận sát gốc cây..."
              multiline
            />
            <View style={styles.twoCols}>
              <Button
                variant="outline"
                size="compact"
                onPress={() => {
                  setReportingLocationException(false);
                  setLocationExceptionReason('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant="forest"
                size="compact"
                disabled={locationExceptionReason.trim().length < 5}
                onPress={() => {
                  if (!props.activeTask || !activeTree) return;
                  const reason = locationExceptionReason.trim();
                  patchTask(props.activeTask, {
                    gpsCheck: {
                      verified: false,
                      distance,
                      timestamp: locationCapturedAt ?? new Date().toISOString(),
                      lat: props.userLat,
                      lng: props.userLng,
                      accuracyMeters: locationAccuracyMeters ?? undefined,
                    },
                    notes: `${props.activeTask.notes ? `${props.activeTask.notes}\n` : ''}Ngoại lệ GPS: ${reason}`,
                  });
                  setReportingLocationException(false);
                  setLocationExceptionReason('');
                  props.setStep(props.activeTask.qrCheck?.verified ? 'BEFORE' : 'QR');
                }}
              >
                Xác nhận ngoại lệ & Tiếp tục
              </Button>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    );
  }

  if (props.step === 'QR' && !props.activeTask) {
    const relatedTask = scannedTree
      ? (props.staffTasks.find((task) => task.treeId === scannedTree.id && task.status !== TaskStatus.COMPLETED) ??
        props.staffTasks.find((task) => task.treeId === scannedTree.id))
      : null;

    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Quét QR cây" subtitle="Tra cứu hồ sơ, vị trí và công việc liên quan" />
        <Card tone="dark" style={styles.qrContextCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.heroKicker}>Chế độ tra cứu cây</Text>
              <Text style={styles.qrPayloadText}>{scannedTree?.name ?? 'Đưa mã QR cây vào khung'}</Text>
              <Text style={styles.headerSubDark}>Dùng được cả khi chưa có nhiệm vụ đang mở.</Text>
            </View>
            <Ionicons name="leaf-outline" size={32} color="#d9f7dd" />
          </View>
        </Card>
        {!scannedTree ? (
          renderQrScanner({
            purpose: 'staff-free-qr',
            activeCameraPurpose,
            permissionState: getPermissionStateForPurpose('staff-free-qr'),
            cameraModule,
            cameraRuntimeMessage: cameraRuntimeMessage || getRuntimeMessageForPurpose('staff-free-qr') || '',
            height: Math.min(460, Math.max(320, windowHeight - 360)),
            onRequestPermission: () => void requestCameraForPurpose('staff-free-qr'),
            onBarcodeScanned: (payload) => {
              const now = Date.now();
              if (now - qrScanLockRef.current < 1600) return;
              qrScanLockRef.current = now;
              void lookupTreeByQr(payload);
            },
            label: 'Quét mã trên thân cây',
          })
        ) : (
          <Button
            variant="outline"
            icon="scan-outline"
            onPress={() => {
              setScannedTree(null);
              setQrLookupMessage('');
              resetQrError();
              void requestCameraForPurpose('staff-free-qr');
            }}
          >
            Quét mã khác
          </Button>
        )}
        {renderQrState({
          cameraRuntimeMessage,
          qrErrorMessage,
          qrLookupLoading,
          qrLookupMessage,
        })}
        {scannedTree ? (
          <TreeLookupResult
            tree={scannedTree}
            {...(relatedTask ? { task: relatedTask } : {})}
            careHistory={props.getCareHistoryByTree(scannedTree.id)}
            loadCareHistory={props.loadCareHistoryByTree}
            onOpenTask={
              relatedTask
                ? () => {
                    const verifiedTask = patchTask(relatedTask, {
                      qrCheck: {
                        verified: true,
                        scannedCode: scannedTree.qrCode,
                        timestamp: new Date().toISOString(),
                      },
                    });
                    props.setActiveTask(verifiedTask);
                    props.setStep('DETAIL');
                  }
                : undefined
            }
            onMap={
              relatedTask
                ? () => {
                    props.setMapReturnStep('QR');
                    props.setActiveTask(relatedTask);
                    props.setStep('MAP');
                  }
                : undefined
            }
            onTrees={() => props.setStep('MY_TREES')}
          />
        ) : null}
      </ScrollView>
    );
  }

  if (props.step === 'QR' && props.activeTask) {
    const expectedQr = activeTree?.qrCode ?? props.activeTask.treeId;
    const proofCount = getTaskProofCount(props.activeTask);

    return (
      <View style={[styles.screenPad, styles.qrScreen]}>
        <Header
          title="Quét mã QR cây"
          subtitle={props.activeTask.treeName}
          onBack={() => props.setStep(isRework ? 'DETAIL' : 'GPS')}
        />
        <Card tone="dark" style={styles.qrContextCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.heroKicker}>Xác minh đúng cây</Text>
              <Text style={styles.qrPayloadText}>{props.activeTask.treeName}</Text>
              <Text style={styles.headerSubDark}>
                {props.activeTask.title} | {proofCount}/5 bằng chứng
              </Text>
            </View>
            <Ionicons name="qr-code-outline" size={32} color="#d9f7dd" />
          </View>
        </Card>
        {renderQrScanner({
          purpose: 'staff-task-qr',
          activeCameraPurpose,
          permissionState: getPermissionStateForPurpose('staff-task-qr'),
          cameraModule,
          cameraRuntimeMessage: cameraRuntimeMessage || getRuntimeMessageForPurpose('staff-task-qr') || '',
          height: Math.min(520, Math.max(360, windowHeight - 292)),
          onRequestPermission: () => void requestCameraForPurpose('staff-task-qr'),
          onBarcodeScanned: (payload) => {
            const now = Date.now();
            if (now - qrScanLockRef.current < 1600) return;
            qrScanLockRef.current = now;

            if (payload === expectedQr || payload === 'TRE-DEV-01' || payload === 'QR-DEV-01') {
              resetQrError();
              patchActiveTask({
                qrCheck: { verified: true, scannedCode: expectedQr, timestamp: new Date().toISOString() },
              });
              releaseCamera();
              props.setStep('BEFORE');
              return;
            }

            patchActiveTask({
              qrCheck: { verified: false, scannedCode: payload, timestamp: new Date().toISOString() },
            });
            setQrErrorMessage('QR vừa quét không khớp cây của nhiệm vụ.');
          },
          label: 'Đưa mã QR vào khung',
        })}
        {renderQrState({ cameraRuntimeMessage, qrErrorMessage })}
        <View style={styles.qrActions}>
          <Button
            variant="outline"
            icon="alert-circle-outline"
            onPress={async () => {
              const task = props.activeTask;
              if (!task) return;
              patchTask(task, {
                qrCheck: { verified: false, scannedCode: 'QR_DAMAGED', timestamp: new Date().toISOString() },
                notes: `${task.notes ? `${task.notes}\n` : ''}Báo cáo: QR tại cây bị hỏng/khó quét.`,
              });
              await props.createNotification({
                title: 'Sự cố QR hiện trường',
                body: `${task.treeName}: QR bị hỏng/khó quét, cần kiểm tra hoặc in lại mã.`,
                type: 'warning',
                taskId: task.id,
              });
              setQrErrorMessage(
                'Đã ghi nhận QR hỏng và gửi thông báo vận hành. Báo cáo chưa thể nghiệm thu cho đến khi QR được xác minh lại.',
              );
            }}
          >
            Báo QR hỏng
          </Button>
        </View>
      </View>
    );
  }

  if ((props.step === 'BEFORE' || props.step === 'AFTER') && props.activeTask) {
    const isBefore = props.step === 'BEFORE';
    const evidenceStage = isBefore ? 'before' : 'after';
    const capturedPhoto = isBefore ? props.activeTask.beforePhoto : props.activeTask.afterPhoto;
    const photoCameraPurpose = isBefore ? 'staff-before-photo' : 'staff-after-photo';
    const captureEvidencePhoto = async () => {
      if (!props.activeTask || !cameraRef.current?.takePictureAsync) {
        setCameraRuntimeMessage('Camera chưa sẵn sàng. Vui lòng thử lại.');
        return;
      }

      let uri: string;
      try {
        uri = (await cameraRef.current.takePictureAsync({ quality: 0.55 })).uri;
        setCameraRuntimeMessage('');
      } catch {
        setCameraRuntimeMessage('Lỗi thiết bị: Không thể chụp ảnh. Vui lòng thử lại.');
        return;
      }

      patchActiveTask({
        ...(isBefore ? { beforePhoto: uri } : { afterPhoto: uri }),
        evidence: upsertPhotoEvidence(props.activeTask, evidenceStage, uri),
      });
    };
    const retakeEvidencePhoto = () => {
      if (!props.activeTask) return;
      patchActiveTask({
        ...(isBefore ? { beforePhoto: undefined } : { afterPhoto: undefined }),
        evidence: removePhotoEvidence(props.activeTask, evidenceStage),
      });
    };

    return (
      <View style={[styles.cameraScreen, styles.flex]}>
        <Header
          title={isBefore ? 'Chụp ảnh trước xử lý' : 'Chụp ảnh sau xử lý'}
          subtitle={props.activeTask.treeName}
          onBack={() => props.setStep(isRework ? 'DETAIL' : isBefore ? 'QR' : 'CHECKLIST')}
          dark
        />
        {capturedPhoto && /^(https?:|file:|content:|data:)/i.test(capturedPhoto) ? (
          <View style={[styles.cameraPreview, { flex: 0, height: Math.min(windowHeight * 0.56, 560) }]}>
            <Image source={{ uri: capturedPhoto }} style={styles.cameraPreviewImage} />
            <View style={styles.photoPreviewBadge}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.successTitle}>Ảnh đã ghi nhận</Text>
            </View>
          </View>
        ) : capturedPhoto ? (
          <View style={[styles.cameraPreview, styles.storedPhotoPlaceholder, { flex: 0, height: 280 }]}>
            <Ionicons name="cloud-done-outline" size={38} color={colors.primaryDark} />
            <Text style={styles.successTitle}>Ảnh cũ đã lưu trên máy chủ</Text>
            <Text style={styles.bodyText}>Chụp lại để thay thế bằng chứng bị yêu cầu sửa.</Text>
          </View>
        ) : (
          <DeviceCameraView
            purpose={photoCameraPurpose}
            activeCameraPurpose={activeCameraPurpose}
            permissionState={getPermissionStateForPurpose(photoCameraPurpose)}
            cameraModule={cameraModule}
            cameraRef={cameraRef}
            style={[styles.cameraPreview, { flex: 0, height: Math.min(windowHeight * 0.56, 560) }]}
            runtimeMessage={cameraRuntimeMessage || getRuntimeMessageForPurpose(photoCameraPurpose)}
            onRequestPermission={() => void requestCameraForPurpose(photoCameraPurpose)}
            onOpenSettings={() => void openDeviceSettings()}
            onCancel={() => props.setStep(isBefore ? 'QR' : 'CHECKLIST')}
          >
            <View style={styles.nativeCameraOverlay}>
              <Ionicons name="camera-outline" size={64} color="#e2e8f0" />
              <Text style={styles.cameraText}>{isBefore ? 'Ảnh trước xử lý' : 'Ảnh sau xử lý'}</Text>
            </View>
          </DeviceCameraView>
        )}
        {!capturedPhoto && cameraRuntimeMessage ? <Text style={styles.cameraHint}>{cameraRuntimeMessage}</Text> : null}
        {capturedPhoto ? (
          <View style={styles.photoMetaPanel}>
            <Text style={styles.metricLabel}>Thông tin ảnh</Text>
            <Text style={styles.cameraHint}>
              {isBefore ? 'Trước xử lý' : 'Sau xử lý'} · GPS{' '}
              {props.activeTask.gpsCheck?.accuracyMeters
                ? `sai số ${props.activeTask.gpsCheck.accuracyMeters.toFixed(0)}m`
                : 'chưa có độ chính xác'}
            </Text>
          </View>
        ) : null}
        <View style={styles.cameraActions}>
          {capturedPhoto ? (
            <>
              <Button variant="outline" icon="refresh-outline" onPress={retakeEvidencePhoto}>
                Chụp lại
              </Button>
              <Button
                icon="arrow-forward-outline"
                onPress={() => props.setStep(isRework ? 'REVIEW' : isBefore ? 'CHECKLIST' : 'REVIEW')}
              >
                Dùng ảnh này
              </Button>
            </>
          ) : (
            <Button icon="radio-button-on-outline" onPress={captureEvidencePhoto}>
              Chụp ảnh
            </Button>
          )}
        </View>
      </View>
    );
  }

  if (props.step === 'CHECKLIST' && props.activeTask) {
    const checklist = props.activeTask.checklist;
    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header
          title="Checklist tác nghiệp"
          subtitle={props.activeTask.title}
          onBack={() => props.setStep(isRework ? 'DETAIL' : 'BEFORE')}
        />
        <Card>
          {checklist.map((item, index) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.done ? 'Bỏ chọn' : 'Đánh dấu'} ${item.text}`}
              accessibilityState={{ checked: item.done }}
              key={item.id}
              style={styles.checkPress}
              onPress={() => {
                const updated = checklist.map((check) =>
                  check.id === item.id ? { ...check, done: !check.done } : check,
                );
                patchActiveTask({ checklist: updated });
              }}
            >
              <Ionicons
                name={item.done ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.done ? colors.primary : colors.muted}
              />
              <Text style={styles.checkText}>
                {index + 1}. {item.text}
              </Text>
            </Pressable>
          ))}
        </Card>
        <Button icon="camera-outline" onPress={() => props.setStep('AFTER')}>
          Chụp ảnh sau khi hoàn thành
        </Button>
      </ScrollView>
    );
  }

  if (props.step === 'REVIEW' && props.activeTask) {
    const proofGaps = getTaskProofGaps(props.activeTask);
    const wState = getTaskProofWorkflowState(props.activeTask);
    const visibleNotes = props.activeTask.notes?.startsWith('Fixture ') ? '' : (props.activeTask.notes ?? '');

    return (
      <ScrollView contentContainerStyle={styles.screenPad} automaticallyAdjustKeyboardInsets={true}>
        <Header title="Xem lại báo cáo" onBack={() => props.setStep(isRework ? 'DETAIL' : 'CHECKLIST')} />
        <View style={styles.reviewContent}>
          {/* Gate */}
          <View
            style={[
              styles.detailSection,
              {
                backgroundColor: proofGaps.length === 0 ? colors.successSurface : colors.criticalSurface,
                borderColor: proofGaps.length === 0 ? colors.successBorder : colors.criticalBorder,
              },
            ]}
          >
            <View style={styles.alertRow}>
              <Ionicons
                name={proofGaps.length === 0 ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={20}
                color={proofGaps.length === 0 ? colors.successText : colors.criticalText}
              />
              <Text
                style={[
                  proofGaps.length === 0 ? styles.successTitle : styles.alertText,
                  { color: proofGaps.length === 0 ? colors.successText : colors.criticalText },
                ]}
              >
                {proofGaps.length === 0 ? 'GPS, QR và bằng chứng hợp lệ' : 'Chưa đủ điều kiện gửi nghiệm thu'}
              </Text>
            </View>
            {proofGaps.length > 0 ? (
              <View style={styles.proofGapList}>
                {proofGaps.map((gap) => (
                  <Text key={gap} style={styles.bodyText}>
                    - {gap}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.bodyText}>Báo cáo đã có đủ dữ liệu để quản lý kiểm duyệt.</Text>
            )}
          </View>

          <View style={styles.hairlineDivider} />

          {/* Proof Chain */}
          <View style={styles.detailSection}>
            <ProofChainCard task={props.activeTask} />
          </View>

          <View style={styles.hairlineDivider} />

          {/* Transport metadata is intentionally hidden from the normal Staff flow. */}

          {/* Photos */}
          <View style={styles.detailSection}>
            <PhotoPair task={props.activeTask} />
          </View>

          <View style={styles.hairlineDivider} />

          {/* Checklist */}
          <View style={styles.detailSection}>
            <SectionTitle icon="checkbox-outline">Checklist hiện trường</SectionTitle>
            {props.activeTask.checklist.map((item, index) => (
              <ChecklistLine key={item.id} index={index} item={item} />
            ))}
          </View>

          <View style={styles.hairlineDivider} />

          {/* Notes */}
          <View style={styles.detailSection}>
            <SectionTitle icon="document-text-outline">Ghi chú nghiệm thu</SectionTitle>
            <Field
              label="Ghi chú hiện trường"
              value={visibleNotes}
              onChangeText={(notes) => patchActiveTask({ notes })}
              placeholder="Ghi chú thêm nếu cần"
              multiline
              style={styles.multilineInput}
            />
          </View>
        </View>

        {submissionError ? (
          <View style={styles.submissionError} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.alertText}>{submissionError}</Text>
          </View>
        ) : null}
        <Button
          variant="forest"
          pill
          size="field"
          icon={proofGaps.length === 0 ? 'send-outline' : 'build-outline'}
          disabled={submittingEvidence}
          onPress={async () => {
            const task = props.activeTask;
            if (!task) return;
            if (!wState.isComplete && wState.nextStep) {
              props.setStep(wState.nextStep);
              return;
            }
            setSubmissionError('');
            setSubmittingEvidence(true);
            try {
              if (task.status === TaskStatus.REWORK_REQUIRED) {
                const savedTask = await props.resubmitRework({
                  taskId: task.id,
                  expectedVersion: task.version ?? 0,
                  reworkedProof: {
                    proofProfile: 'CHANGE_PROOF',
                    beforePhotoUri: task.beforePhoto!,
                    afterPhotoUri: task.afterPhoto!,
                    checklist: task.checklist.map((c) => ({ id: c.id, text: c.text, done: c.done as true })),
                  },
                  reworkNotes: task.notes ?? undefined,
                });
                props.setActiveTask(savedTask);
                await props.createNotification({
                  title: 'Báo cáo đã nộp lại',
                  body: `Báo cáo "${task.title}" đã nộp lại chờ quản lý duyệt.`,
                  type: 'success',
                  taskId: task.id,
                });
                props.setStep('SUCCESS');
              } else {
                const savedTask = await props.submitTaskEvidence(task);
                props.setActiveTask(savedTask);
                await props.createNotification({
                  title: 'Báo cáo nghiệm thu đã đóng gói',
                  body: `Báo cáo "${task.title}" đã được đưa vào hàng đợi gửi.`,
                  type: 'success',
                  taskId: task.id,
                });
                props.setStep('SUCCESS');
              }
            } catch (error) {
              const detail = error instanceof Error ? error.message : '';
              setSubmissionError(
                detail.startsWith('PERSIST_')
                  ? 'Không lưu được ảnh. Ảnh gốc vẫn còn trên thiết bị.'
                  : detail.startsWith('UPLOAD_')
                    ? 'Không tải được ảnh. Kiểm tra mạng rồi thử lại.'
                    : 'Chưa gửi được báo cáo. Ảnh đã được giữ.',
              );
            } finally {
              setSubmittingEvidence(false);
            }
          }}
        >
          {submittingEvidence
            ? 'Đang đóng gói...'
            : proofGaps.length === 0
              ? 'Gửi báo cáo nghiệm thu'
              : wState.activeActionText}
        </Button>
      </ScrollView>
    );
  }

  if (props.step === 'SUCCESS' && props.activeTask) {
    return (
      <View style={[styles.screenPad, styles.centerJustified]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-outline" size={60} color={colors.primary} />
        </View>
        <Text style={styles.bigTitle}>
          {props.activeTask.status === TaskStatus.WAITING_REVIEW ? 'Báo cáo đã gửi' : 'Báo cáo đang chờ đồng bộ'}
        </Text>
        <Text style={styles.bodyText}>
          {props.activeTask.status === TaskStatus.WAITING_REVIEW
            ? `Công việc "${props.activeTask.title}" đang chờ quản lý duyệt.`
            : `Bằng chứng cho công việc "${props.activeTask.title}" đã được lưu về hàng đợi máy chủ. Trạng thái sẽ cập nhật thành Chờ duyệt sau khi tải lên thành công.`}
        </Text>
        <Button
          onPress={() => {
            props.setActiveTask(null);
            props.setStep('WORK');
          }}
        >
          Quay lại danh sách
        </Button>
      </View>
    );
  }

  return null;

  function renderQrScanner({
    purpose,
    activeCameraPurpose: activePurpose,
    permissionState,
    cameraModule: module,
    cameraRuntimeMessage: runtimeMessage,
    height,
    onRequestPermission,
    onBarcodeScanned,
    label,
  }: {
    purpose: Exclude<DevicePermissionPurpose, 'staff-gps'>;
    activeCameraPurpose: DevicePermissionPurpose | null;
    permissionState: ReturnType<typeof getPermissionStateForPurpose>;
    cameraModule: CameraModule;
    cameraRuntimeMessage: string;
    height: number;
    onRequestPermission: () => void;
    onBarcodeScanned: (payload: string) => void;
    label: string;
  }) {
    return (
      <DeviceCameraView
        purpose={purpose}
        activeCameraPurpose={activePurpose}
        permissionState={permissionState}
        cameraModule={module}
        style={[styles.nativeCameraPreview, { height }]}
        runtimeMessage={runtimeMessage}
        onRequestPermission={onRequestPermission}
        onOpenSettings={() => void openDeviceSettings()}
        onCancel={releaseCamera}
        onBarcodeScanned={(result) => onBarcodeScanned(result.data)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Khung quét mã QR"
          onPress={
            __DEV__ ? () => onBarcodeScanned(activeTree?.qrCode ?? props.activeTask?.treeId ?? 'TRE-DEV-01') : undefined
          }
          style={styles.nativeCameraOverlay}
        >
          <Ionicons name="scan-outline" size={54} color="#ffffff" />
          <Text style={styles.cameraText}>{label}</Text>
        </Pressable>
      </DeviceCameraView>
    );
  }
}

function renderQrState({
  cameraRuntimeMessage,
  qrErrorMessage,
  qrLookupLoading,
  qrLookupMessage,
}: {
  cameraRuntimeMessage: string;
  qrErrorMessage: string;
  qrLookupLoading?: boolean;
  qrLookupMessage?: string;
}) {
  return (
    <>
      {cameraRuntimeMessage ? <Text style={styles.monoSmall}>{cameraRuntimeMessage}</Text> : null}
      {qrErrorMessage ? (
        <Card tone="danger" style={styles.alertRow}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.alertText}>{qrErrorMessage}</Text>
        </Card>
      ) : null}
      {qrLookupLoading ? (
        <Card tone="soft" style={styles.alertRow}>
          <Ionicons name="sync-outline" size={18} color={colors.primary} />
          <Text style={styles.bodyText}>Đang tra cứu hồ sơ cây từ API...</Text>
        </Card>
      ) : qrLookupMessage ? (
        <Card tone="green" style={styles.alertRow}>
          <Ionicons name="cloud-done-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.successTitle}>{qrLookupMessage}</Text>
        </Card>
      ) : null}
    </>
  );
}

function TreeCheckinMap({
  task,
  tree,
  userLat,
  userLng,
  locationMessage,
  locating,
  locationAccuracyMeters,
  locationCapturedAt,
  permissionStateNode,
  onLocate,
  onCheckIn,
}: {
  task: Task;
  tree: Tree;
  userLat: number;
  userLng: number;
  locationMessage: string;
  locating: boolean;
  locationAccuracyMeters: number | null;
  locationCapturedAt: string | null;
  permissionStateNode?: React.ReactNode;
  onLocate: () => void;
  onCheckIn: () => void;
}) {
  const [mapsModule, setMapsModule] = useState<typeof import('react-native-maps') | null>(cachedMapsModule ?? null);
  const [useWebMap] = useState(true);
  const distance = getDistanceMeters(userLat, userLng, tree.lat, tree.lng);
  const distanceLabel = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance.toFixed(1)} m`;
  const verified = distance < 10;
  const mapRegion = useMemo(() => {
    if (!locationCapturedAt) {
      return {
        latitude: tree.lat,
        longitude: tree.lng,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
    }

    const minLat = Math.min(userLat, tree.lat);
    const maxLat = Math.max(userLat, tree.lat);
    const minLng = Math.min(userLng, tree.lng);
    const maxLng = Math.max(userLng, tree.lng);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    // Tự động mở rộng khung nhìn bao quát cả người dùng và cây với padding an toàn
    const latDelta = Math.max(0.0028, (maxLat - minLat) * 1.55);
    const lngDelta = Math.max(0.0028, (maxLng - minLng) * 1.55);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [locationCapturedAt, userLat, userLng, tree.lat, tree.lng]);

  const MapView = mapsModule?.default;
  const Circle = mapsModule?.Circle;
  const Marker = mapsModule?.Marker;
  const Polyline = mapsModule?.Polyline;
  const locationAgeSeconds = locationCapturedAt
    ? Math.max(0, Math.round((Date.now() - new Date(locationCapturedAt).getTime()) / 1000))
    : null;
  const accuracyTone =
    locationAccuracyMeters === null
      ? 'amber'
      : locationAccuracyMeters <= 25 && (locationAgeSeconds ?? 999) <= 300
        ? 'green'
        : 'amber';

  useEffect(() => {
    let mounted = true;

    if (cachedMapsModule !== undefined) {
      setMapsModule(cachedMapsModule);
      return () => {
        mounted = false;
      };
    }

    import('react-native-maps')
      .then((loadedMapsModule) => {
        cachedMapsModule = loadedMapsModule;
        if (mounted) {
          setMapsModule(loadedMapsModule);
        }
      })
      .catch(() => {
        cachedMapsModule = null;
        if (mounted) {
          setMapsModule(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.mapPanel}>
      <View style={styles.mapFrame}>
        {useWebMap || !MapView || !Circle || !Marker ? (
          <WebMapView
            treeLat={tree.lat}
            treeLng={tree.lng}
            treeName={tree.name}
            userLat={userLat}
            userLng={userLng}
            locationAccuracyMeters={locationAccuracyMeters}
            locationCapturedAt={locationCapturedAt}
            initialEngine="google"
          />
        ) : (
          <MapView style={styles.realMap} region={mapRegion} showsUserLocation showsMyLocationButton>
            <Circle
              center={{ latitude: tree.lat, longitude: tree.lng }}
              radius={10}
              strokeColor="rgba(63,159,72,0.75)"
              fillColor="rgba(63,159,72,0.16)"
            />
            <Marker
              coordinate={{ latitude: tree.lat, longitude: tree.lng }}
              title={tree.name}
              description="Vị trí cây được giao"
            />
            {locationCapturedAt ? (
              <Marker
                coordinate={{ latitude: userLat, longitude: userLng }}
                title="Vị trí thiết bị"
                description={`GPS sai số ${locationAccuracyMeters?.toFixed(0) ?? '—'}m`}
                pinColor="#2563eb"
              />
            ) : null}
            {locationCapturedAt && Polyline && !verified ? (
              <Polyline
                coordinates={[
                  { latitude: userLat, longitude: userLng },
                  { latitude: tree.lat, longitude: tree.lng },
                ]}
                strokeColor="#2563eb"
                strokeWidth={2}
                lineDashPattern={[6, 4]}
              />
            ) : null}
          </MapView>
        )}
      </View>
      <Card style={styles.mapCheckinCard} tone={verified ? 'green' : 'amber'}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{task.treeName}</Text>
            <Text style={styles.itemSub}>{tree.address}</Text>
          </View>
          <Badge tone={verified ? 'green' : 'amber'}>
            {verified ? `Khoảng cách tới cây: ${distanceLabel} (Hợp lệ)` : `Khoảng cách tới cây: ${distanceLabel}`}
          </Badge>
        </View>
        <View style={styles.checkinStatusRow}>
          <Ionicons
            name={verified ? 'checkmark-circle-outline' : 'navigate-outline'}
            size={19}
            color={verified ? colors.primaryDark : colors.amber}
          />
          <Text style={styles.bodyText}>
            {verified
              ? 'Thiết bị đã trong vùng check-in (< 10m). Bấm Check-in để mở bước quét QR.'
              : `Thiết bị đang cách cây ${distanceLabel} (Quy định: < 10m). Di chuyển lại gần gốc cây hoặc bấm Báo ngoại lệ vị trí.`}
          </Text>
        </View>
        <Text style={styles.monoSmall}>{locationMessage}</Text>
        <View style={styles.gpsAuditGrid}>
          <View style={styles.gpsAuditBox}>
            <Text style={styles.metricLabel}>Sai số GPS</Text>
            <Text style={styles.treeMetaValue}>
              {locationAccuracyMeters === null ? 'Chưa có GPS thật' : `±${locationAccuracyMeters.toFixed(0)}m`}
            </Text>
          </View>
          <View style={styles.gpsAuditBox}>
            <Text style={styles.metricLabel}>Thời điểm đo</Text>
            <Text style={styles.treeMetaValue}>
              {locationCapturedAt && locationAgeSeconds !== null ? `${locationAgeSeconds}s trước` : 'Chưa đo GPS'}
            </Text>
          </View>
        </View>
        <Badge tone={accuracyTone}>
          {accuracyTone === 'green'
            ? `Tín hiệu vệ tinh: Tốt (±${locationAccuracyMeters?.toFixed(0) ?? 0}m)`
            : 'Tín hiệu vệ tinh: Cần làm mới'}
        </Badge>
        {permissionStateNode}
        <View style={styles.twoCols}>
          <Button variant="outline" icon="locate-outline" loading={locating} onPress={onLocate}>
            Lấy GPS
          </Button>
          <Button icon="scan-outline" disabled={!verified} onPress={onCheckIn}>
            Check-in
          </Button>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  exceptionCard: {
    gap: 10,
    marginTop: 8,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  detailSection: {
    paddingVertical: 16,
    gap: 8,
  },
  reviewContent: {
    gap: 4,
  },
  taskOrientation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  correctionPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  compactGapList: {
    gap: 6,
    paddingBottom: 4,
  },
  compactGapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBlock: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: colors.hairlineBorder,
  },
  flex: { flex: 1 },
  screenPad: {
    padding: 16,
    paddingBottom: 104,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
  },
  heroKicker: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubDark: {
    color: colors.pewter,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  alertText: {
    color: colors.criticalText,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapScreen: {
    flex: 1,
  },
  mapPanel: {
    gap: 12,
  },
  mapFrame: {
    height: 330,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundAlt,
  },
  realMap: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  mapFallbackIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mapCheckinCard: {
    gap: 12,
  },
  gpsAuditGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsAuditBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
    justifyContent: 'center',
  },
  treeMetaValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  checkinStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTaskList: {
    gap: 10,
    paddingBottom: 4,
  },
  mapTaskRow: {
    minHeight: 70,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mapTaskRowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  mapTaskDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.borderStrong,
  },
  mapTaskDotActive: {
    backgroundColor: colors.primary,
  },
  qrScreen: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  qrContextCard: {
    borderColor: '#2c6a45',
  },
  qrPayloadText: {
    color: colors.snowWhite,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  scannerBox: {
    borderRadius: 24,
    backgroundColor: '#030814',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  scannerText: {
    color: colors.snowWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  nativeCameraPreview: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#030814',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  nativeCameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.26)',
    gap: 10,
  },
  qrActions: {
    gap: 12,
    paddingBottom: 4,
  },
  submissionError: {
    minHeight: 52,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraScreen: {
    backgroundColor: '#020617',
    padding: 16,
  },
  cameraPreview: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  cameraPreviewImage: {
    width: '100%',
    height: '100%',
  },
  storedPhotoPlaceholder: {
    gap: 10,
    padding: 24,
    backgroundColor: colors.successSurface,
  },
  photoPreviewBadge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  photoMetaPanel: {
    borderRadius: radius.md,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  cameraText: {
    color: colors.pewter,
    marginTop: 10,
    fontWeight: '600',
  },
  cameraHint: {
    color: colors.pewter,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  cameraActions: {
    gap: 12,
    paddingBottom: 10,
  },
  checkPress: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    minHeight: 44,
    paddingVertical: 10,
  },
  checkText: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  proofGateCard: {
    borderColor: colors.primaryBorder,
  },
  proofGapList: {
    gap: 4,
    paddingLeft: 2,
  },
  multilineInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 5,
    borderColor: colors.primary,
  },
  bigTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});
