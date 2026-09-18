import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Card, EmptyState, Field, SectionTitle } from '../../components/AppPrimitives';
import { DeviceCameraView, type DeviceCameraViewHandle } from '../../components/DeviceCameraView';
import { DevicePermissionState } from '../../components/DevicePermissionState';
import {
  Header,
  ChecklistLine,
  PhotoPair,
  ProofChainCard,
  TaskSummary,
} from '../../components/presentation/TaskSurfaces';
import { TreeLookupResult } from '../../components/presentation/TreeSurfaces';
import { getDistanceMeters } from '../../data';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';
import { openDeviceSettings, type DevicePermissionPurpose } from '../../services/devicePermissions';
import { colors, radius } from '../../theme/tokens';
import { AppNotification, CareHistory, Task, TaskStatus, Tree } from '../../types';
import { getMockPhotoSource, mockAfterPhotoUri, mockBeforePhotoUri } from '../../assets/mockEvidenceAssets';
import type { CreateNotificationRequest } from '@novyx/contracts';
import {
  StaffStep,
  getEvidenceTransportMeta,
  getNextProofStep,
  getTaskProofCount,
  getTaskProofGaps,
  getTaskStatusMeta,
  removePhotoEvidence,
  upsertPhotoEvidence,
} from '../../domain/mobileWorkflow';

type CameraRuntimeMode = 'mock' | 'native';
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
  userLat: number;
  userLng: number;
  setUserLat: (lat: number) => void;
  setUserLng: (lng: number) => void;
  updateTasks: (tasks: Task[]) => void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  lookupTreeByQr: (payload: string) => Promise<Tree | null>;
  syncTaskProgress: (task: Task) => Promise<Task>;
  submitTaskEvidence: (task: Task) => Promise<Task>;
  createNotification: (request: CreateNotificationRequest) => Promise<AppNotification>;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Dữ liệu ban đầu đang đặt gần cây để kiểm thử luồng.');
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<number | null>(null);
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null);
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [scannedTree, setScannedTree] = useState<Tree | null>(null);
  const [qrLookupLoading, setQrLookupLoading] = useState(false);
  const [qrLookupMessage, setQrLookupMessage] = useState('');
  const [cameraMode, setCameraMode] = useState<CameraRuntimeMode>('mock');
  const [cameraModule, setCameraModule] = useState<CameraModule | null>(null);
  const [cameraRuntimeMessage, setCameraRuntimeMessage] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [gpsPermissionVisible, setGpsPermissionVisible] = useState(false);
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
  const distance = activeTree ? getDistanceMeters(props.userLat, props.userLng, activeTree.lat, activeTree.lng) : 999;
  const selectedMapTask = props.activeTask ?? props.openTasks[0] ?? props.staffTasks[0] ?? null;
  const selectedMapTree = selectedMapTask ? props.trees.find((tree) => tree.id === selectedMapTask.treeId) : null;
  const assignedTreeIds = new Set(props.staffTasks.map((task) => task.treeId));
  const assignedTrees = props.trees.filter((tree) => assignedTreeIds.has(tree.id));

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

  useEffect(() => {
    if (cameraMode !== 'native') {
      setCameraModule(null);
      releaseCamera();
      return;
    }

    let mounted = true;

    import('expo-camera')
      .then((module) => {
        if (!mounted) return;
        setCameraRuntimeMessage('');
        setCameraModule(module);
      })
      .catch(() => {
        if (!mounted) return;
        setCameraRuntimeMessage(
          'Runtime hiện tại chưa có expo-camera. Cần rebuild dev client sau khi cài native module.',
        );
        setCameraModule(null);
        releaseCamera();
      });

    return () => {
      mounted = false;
    };
  }, [cameraMode, releaseCamera]);

  useEffect(() => {
    if (cameraMode !== 'native' || !staffCameraPurpose) {
      releaseCamera();
      return;
    }

    if (cameraPermission?.granted && activeCameraPurpose !== staffCameraPurpose) {
      void requestCameraForPurpose(staffCameraPurpose);
    }
  }, [
    activeCameraPurpose,
    cameraMode,
    cameraPermission?.granted,
    releaseCamera,
    requestCameraForPurpose,
    staffCameraPurpose,
  ]);

  const patchTask = (task: Task, patch: Partial<Task>) => {
    const nextTask = { ...task, ...patch, updatedAt: new Date().toISOString() };
    props.updateTasks(props.tasks.map((item) => (item.id === nextTask.id ? nextTask : item)));
    if (props.activeTask?.id === nextTask.id || selectedMapTask?.id === nextTask.id) {
      props.setActiveTask(nextTask);
    }
    void props.syncTaskProgress(nextTask).then((savedTask) => {
      if (props.activeTask?.id === savedTask.id || selectedMapTask?.id === savedTask.id) {
        props.setActiveTask(savedTask);
      }
    });
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
    const matchedTree = await props.lookupTreeByQr(payload);
    setQrLookupLoading(false);

    if (!matchedTree) {
      setScannedTree(null);
      setQrErrorMessage(`Không tìm thấy cây với mã ${payload}. Hãy kiểm tra lại QR hoặc đồng bộ dữ liệu.`);
      return;
    }

    resetQrError();
    setScannedTree(matchedTree);
    setQrLookupMessage(`Đã tra cứu ${matchedTree.qrCode} từ API hoặc dữ liệu fallback.`);
  };

  const readDeviceLocationAfterPermission = async () => {
    setLocating(true);
    try {
      const permission = await requestLocationForPurpose('staff-gps');
      if (!permission?.granted) {
        setLocationMessage(
          permission?.canAskAgain === false
            ? 'Quyền vị trí đang bị chặn. Mở cài đặt Android và bật quyền Vị trí cho NOVYX.'
            : 'Chưa có quyền vị trí. Cấp quyền để lấy GPS hiện trường.',
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
          : 'Không đọc được GPS thiết bị. Kiểm tra quyền vị trí hoặc tín hiệu ngoài trời.',
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
      status: TaskStatus.IN_PROGRESS,
      gpsCheck: {
        verified: nextDistance < 10,
        distance: nextDistance,
        timestamp: new Date().toISOString(),
        lat: props.userLat,
        lng: props.userLng,
        ...(locationAccuracyMeters !== null ? { accuracyMeters: locationAccuracyMeters } : {}),
      },
    });
    props.setStep(nextStep);
  };

  if (props.step === 'MAP') {
    return (
      <View style={[styles.screenPad, styles.mapScreen]}>
        <Header title="Bản đồ check-in" subtitle="Chọn cây, đứng trong bán kính 10m rồi quét QR" />
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
      </View>
    );
  }

  if (props.step === 'DETAIL' && props.activeTask) {
    const statusMeta = getTaskStatusMeta(props.activeTask.status);
    const proofGaps = getTaskProofGaps(props.activeTask);
    const canResumeProof =
      props.activeTask.status === TaskStatus.IN_PROGRESS || props.activeTask.status === TaskStatus.REWORK_REQUIRED;

    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Chi tiết công việc" subtitle={props.activeTask.id} onBack={() => props.setStep('WORK')} />
        <Card tone={statusMeta.tone === 'danger' ? 'danger' : statusMeta.tone === 'amber' ? 'amber' : 'soft'}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.metricLabel}>Trạng thái</Text>
              <Text style={styles.itemTitle}>{statusMeta.label}</Text>
            </View>
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          </View>
          {props.activeTask.status === TaskStatus.REWORK_REQUIRED && props.activeTask.rejectReason ? (
            <Text style={styles.bodyText}>Quản lý yêu cầu sửa: {props.activeTask.rejectReason}</Text>
          ) : null}
        </Card>
        <TaskSummary task={props.activeTask} tree={activeTree} />
        <Card>
          <SectionTitle icon="list-outline">Các bước thực hiện</SectionTitle>
          {props.activeTask.checklist.map((item, index) => (
            <ChecklistLine key={item.id} index={index} item={item} />
          ))}
        </Card>
        {proofGaps.length > 0 && canResumeProof ? (
          <Card tone="amber">
            <SectionTitle icon="build-outline">Cần hoàn thiện</SectionTitle>
            {proofGaps.map((gap) => (
              <Text key={gap} style={styles.bodyText}>
                - {gap}
              </Text>
            ))}
          </Card>
        ) : null}
        <Button
          icon={canResumeProof ? 'build-outline' : 'play-outline'}
          disabled={
            props.activeTask.status === TaskStatus.WAITING_REVIEW || props.activeTask.status === TaskStatus.COMPLETED
          }
          onPress={() => {
            resetQrError();
            patchActiveTask({
              status: TaskStatus.IN_PROGRESS,
              rejectReason:
                props.activeTask?.status === TaskStatus.REWORK_REQUIRED ? props.activeTask.rejectReason : undefined,
            });
            props.setStep(canResumeProof ? getNextProofStep(props.activeTask as Task) : 'GPS');
          }}
        >
          {props.activeTask.status === TaskStatus.WAITING_REVIEW
            ? 'Đang chờ quản lý duyệt'
            : props.activeTask.status === TaskStatus.COMPLETED
              ? 'Đã hoàn thành'
              : canResumeProof
                ? 'Hoàn thiện bằng chứng'
                : 'Bắt đầu công việc'}
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
          disabled={!verified}
          onPress={() => {
            if (activeTree) {
              resetQrError();
              checkInTask(props.activeTask as Task, activeTree);
            }
          }}
        >
          Check-in và quét QR
        </Button>
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
              <Text style={styles.qrPayloadText}>{scannedTree?.qrCode ?? 'Đưa mã QR cây vào khung'}</Text>
              <Text style={styles.headerSubDark}>Dùng được cả khi chưa có nhiệm vụ đang mở.</Text>
            </View>
            <Ionicons name="leaf-outline" size={32} color="#d9f7dd" />
          </View>
        </Card>
        {renderQrScanner({
          purpose: 'staff-free-qr',
          activeCameraPurpose,
          permissionState: getPermissionStateForPurpose('staff-free-qr'),
          cameraModule,
          cameraMode,
          cameraRuntimeMessage: cameraRuntimeMessage || getRuntimeMessageForPurpose('staff-free-qr') || '',
          height: Math.min(460, Math.max(320, windowHeight - 360)),
          onRequestPermission: () => void requestCameraForPurpose('staff-free-qr'),
          onMockMode: () => setCameraMode('mock'),
          onBarcodeScanned: (payload) => {
            const now = Date.now();
            if (now - qrScanLockRef.current < 1600) return;
            qrScanLockRef.current = now;
            void lookupTreeByQr(payload);
          },
          label: 'Quét mã trên thân cây',
        })}
        {renderQrState({
          cameraMode,
          cameraModule,
          cameraRuntimeMessage,
          qrErrorMessage,
          qrLookupLoading,
          qrLookupMessage,
        })}
        <View style={styles.qrActions}>
          <Button
            variant="outline"
            icon={cameraMode === 'native' ? 'phone-portrait-outline' : 'camera-outline'}
            onPress={() => {
              resetQrError();
              setCameraMode(cameraMode === 'native' ? 'mock' : 'native');
            }}
          >
            {cameraMode === 'native' ? 'Dùng mô phỏng' : 'Camera thật'}
          </Button>
          <Button
            icon="qr-code-outline"
            loading={qrLookupLoading}
            onPress={() => void lookupTreeByQr(assignedTrees[0]?.qrCode ?? props.trees[0]?.qrCode ?? 'NOVYX-TRE-0824')}
          >
            Mô phỏng quét cây
          </Button>
        </View>
        {scannedTree ? (
          <TreeLookupResult
            tree={scannedTree}
            {...(relatedTask ? { task: relatedTask } : {})}
            careHistory={props.getCareHistoryByTree(scannedTree.id)}
            loadCareHistory={props.loadCareHistoryByTree}
            onOpenTask={
              relatedTask
                ? () => {
                    props.setActiveTask(relatedTask);
                    props.setStep('DETAIL');
                  }
                : undefined
            }
            onMap={
              relatedTask
                ? () => {
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
        <Header title="Quét mã QR cây" subtitle={props.activeTask.treeId} onBack={() => props.setStep('GPS')} />
        <Card tone="dark" style={styles.qrContextCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.heroKicker}>Payload demo</Text>
              <Text style={styles.qrPayloadText}>{expectedQr}</Text>
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
          cameraMode,
          cameraRuntimeMessage: cameraRuntimeMessage || getRuntimeMessageForPurpose('staff-task-qr') || '',
          height: Math.min(520, Math.max(360, windowHeight - 292)),
          onRequestPermission: () => void requestCameraForPurpose('staff-task-qr'),
          onMockMode: () => setCameraMode('mock'),
          onBarcodeScanned: (payload) => {
            const now = Date.now();
            if (now - qrScanLockRef.current < 1600) return;
            qrScanLockRef.current = now;

            if (payload === expectedQr) {
              resetQrError();
              patchActiveTask({
                qrCheck: { verified: true, scannedCode: payload, timestamp: new Date().toISOString() },
              });
              props.setStep('BEFORE');
              return;
            }

            patchActiveTask({
              qrCheck: { verified: false, scannedCode: payload, timestamp: new Date().toISOString() },
            });
            setQrErrorMessage(`QR vừa quét (${payload}) không khớp cây của nhiệm vụ.`);
          },
          label: 'Đưa mã QR vào khung',
        })}
        {renderQrState({ cameraMode, cameraModule, cameraRuntimeMessage, qrErrorMessage })}
        <View style={styles.qrActions}>
          <Button
            variant="outline"
            icon={cameraMode === 'native' ? 'phone-portrait-outline' : 'camera-outline'}
            onPress={() => {
              resetQrError();
              setCameraMode(cameraMode === 'native' ? 'mock' : 'native');
            }}
          >
            {cameraMode === 'native' ? 'Dùng mô phỏng' : 'Camera thật'}
          </Button>
          <Button
            icon="checkmark-outline"
            onPress={() => {
              resetQrError();
              patchActiveTask({
                qrCheck: { verified: true, scannedCode: expectedQr, timestamp: new Date().toISOString() },
              });
              props.setStep('BEFORE');
            }}
          >
            Mô phỏng quét thành công
          </Button>
          <Button
            variant="outline"
            icon="close-circle-outline"
            onPress={() => {
              patchActiveTask({
                qrCheck: { verified: false, scannedCode: 'NOVYX-WRONG-TREE', timestamp: new Date().toISOString() },
              });
              setQrErrorMessage('QR vừa quét không khớp cây của nhiệm vụ. Hãy quét lại đúng mã trên thân cây.');
            }}
          >
            Mô phỏng sai mã
          </Button>
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
      if (!props.activeTask) return;
      let uri = isBefore ? mockBeforePhotoUri : mockAfterPhotoUri;

      if (cameraMode === 'native' && cameraRef.current?.takePictureAsync) {
        try {
          uri = (await cameraRef.current.takePictureAsync({ quality: 0.72 })).uri;
          setCameraRuntimeMessage('Ảnh thật đã được ghi nhận từ camera thiết bị.');
        } catch {
          setCameraRuntimeMessage('Không chụp được ảnh thật trong runtime này. Đang dùng ảnh mẫu để tiếp tục smoke.');
        }
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
          title={isBefore ? 'Chụp ảnh Before' : 'Chụp ảnh After'}
          subtitle={props.activeTask.treeName}
          onBack={() => props.setStep(isBefore ? 'QR' : 'CHECKLIST')}
          dark
        />
        {capturedPhoto ? (
          <View style={styles.cameraPreview}>
            <Image source={getMockPhotoSource(capturedPhoto, evidenceStage)} style={styles.cameraPreviewImage} />
            <View style={styles.photoPreviewBadge}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.successTitle}>Ảnh đã ghi nhận</Text>
            </View>
          </View>
        ) : cameraMode === 'native' ? (
          <DeviceCameraView
            purpose={photoCameraPurpose}
            activeCameraPurpose={activeCameraPurpose}
            permissionState={getPermissionStateForPurpose(photoCameraPurpose)}
            cameraModule={cameraModule}
            cameraRef={cameraRef}
            style={styles.cameraPreview}
            runtimeMessage={cameraRuntimeMessage || getRuntimeMessageForPurpose(photoCameraPurpose)}
            onRequestPermission={() => void requestCameraForPurpose(photoCameraPurpose)}
            onOpenSettings={() => void openDeviceSettings()}
            onCancel={() => setCameraMode('mock')}
          >
            <View style={styles.nativeCameraOverlay}>
              <Ionicons name="camera-outline" size={64} color="#e2e8f0" />
              <Text style={styles.cameraText}>{isBefore ? 'Ảnh before' : 'Ảnh after'}</Text>
            </View>
          </DeviceCameraView>
        ) : (
          <View style={styles.cameraPreview}>
            <Ionicons name="camera-outline" size={72} color="#e2e8f0" />
            <Text style={styles.cameraText}>Camera hiện trường</Text>
          </View>
        )}
        {cameraRuntimeMessage ? <Text style={styles.cameraHint}>{cameraRuntimeMessage}</Text> : null}
        {capturedPhoto ? (
          <View style={styles.photoMetaPanel}>
            <Text style={styles.metricLabel}>Metadata ảnh</Text>
            <Text style={styles.cameraHint}>
              {evidenceStage === 'before' ? 'Before' : 'After'} | {props.activeTask.treeId} | GPS{' '}
              {props.activeTask.gpsCheck?.accuracyMeters
                ? `accuracy ${props.activeTask.gpsCheck.accuracyMeters.toFixed(0)}m`
                : 'chưa có accuracy'}
            </Text>
          </View>
        ) : null}
        <View style={styles.cameraActions}>
          {capturedPhoto ? (
            <>
              <Button variant="outline" icon="refresh-outline" onPress={retakeEvidencePhoto}>
                Chụp lại
              </Button>
              <Button icon="arrow-forward-outline" onPress={() => props.setStep(isBefore ? 'CHECKLIST' : 'REVIEW')}>
                Dùng ảnh này
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                icon={cameraMode === 'native' ? 'phone-portrait-outline' : 'camera-outline'}
                onPress={() => setCameraMode(cameraMode === 'native' ? 'mock' : 'native')}
              >
                {cameraMode === 'native' ? 'Dùng mô phỏng' : 'Camera thật'}
              </Button>
              <Button icon="radio-button-on-outline" onPress={captureEvidencePhoto}>
                Chụp ảnh
              </Button>
            </>
          )}
        </View>
      </View>
    );
  }

  if (props.step === 'CHECKLIST' && props.activeTask) {
    const checklist = props.activeTask.checklist;
    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Checklist tác nghiệp" subtitle={props.activeTask.title} onBack={() => props.setStep('BEFORE')} />
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
    const evidenceTransport = getEvidenceTransportMeta(props.activeTask);

    return (
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Xem lại báo cáo" subtitle={props.activeTask.id} onBack={() => props.setStep('CHECKLIST')} />
        <Card tone={proofGaps.length === 0 ? 'green' : 'danger'} style={styles.proofGateCard}>
          <View style={styles.alertRow}>
            <Ionicons
              name={proofGaps.length === 0 ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={20}
              color={proofGaps.length === 0 ? colors.primary : colors.danger}
            />
            <Text style={proofGaps.length === 0 ? styles.successTitle : styles.alertText}>
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
        </Card>
        <ProofChainCard task={props.activeTask} />
        <Card tone={evidenceTransport.mode === 'multipart' ? 'green' : 'soft'}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <SectionTitle icon="cloud-upload-outline">Kênh gửi bằng chứng</SectionTitle>
              <Text style={styles.bodyText}>{evidenceTransport.label}</Text>
            </View>
            <Badge tone={evidenceTransport.mode === 'multipart' ? 'green' : 'sky'}>
              {evidenceTransport.mode === 'multipart' ? 'File thật' : 'Metadata'}
            </Badge>
          </View>
        </Card>
        <PhotoPair task={props.activeTask} />
        <Card>
          <SectionTitle icon="checkbox-outline">Checklist hiện trường</SectionTitle>
          {props.activeTask.checklist.map((item, index) => (
            <ChecklistLine key={item.id} index={index} item={item} />
          ))}
        </Card>
        <Card>
          <SectionTitle icon="document-text-outline">Ghi chú nghiệm thu</SectionTitle>
          <Field
            label="Ghi chú hiện trường"
            value={props.activeTask.notes ?? ''}
            onChangeText={(notes) => patchActiveTask({ notes })}
            placeholder="Ví dụ: đã thu gom cành khô phía Bắc, cần kiểm tra lại sau mưa..."
            multiline
            style={styles.multilineInput}
          />
        </Card>
        <Button
          icon={proofGaps.length === 0 ? 'send-outline' : 'build-outline'}
          variant={proofGaps.length === 0 ? 'primary' : 'outline'}
          disabled={submittingEvidence}
          onPress={async () => {
            const task = props.activeTask;
            if (!task) return;
            const gaps = getTaskProofGaps(task);
            if (gaps.length > 0) {
              props.setStep(getNextProofStep(task));
              return;
            }
            setSubmittingEvidence(true);
            const submittedTask: Task = {
              ...task,
              status: TaskStatus.WAITING_REVIEW,
              rejectReason: undefined,
              updatedAt: new Date().toISOString(),
            };
            const savedTask = await props.submitTaskEvidence(submittedTask);
            props.setActiveTask(savedTask);
            await props.createNotification({
              title: 'Báo cáo nghiệm thu mới',
              body: `Nhân viên Nguyễn Văn Hùng đã gửi báo cáo "${task.title}" chờ duyệt.`,
              type: 'success',
              taskId: task.id,
            });
            setSubmittingEvidence(false);
            props.setStep('SUCCESS');
          }}
        >
          {submittingEvidence
            ? 'Đang gửi...'
            : proofGaps.length === 0
              ? 'Gửi báo cáo nghiệm thu'
              : 'Hoàn thiện bằng chứng'}
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
        <Text style={styles.bigTitle}>Báo cáo đã gửi</Text>
        <Text style={styles.bodyText}>
          Công việc "{props.activeTask.title}" đã chuyển sang trạng thái chờ quản lý duyệt.
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
    cameraMode: mode,
    cameraRuntimeMessage: runtimeMessage,
    height,
    onRequestPermission,
    onMockMode,
    onBarcodeScanned,
    label,
  }: {
    purpose: Exclude<DevicePermissionPurpose, 'staff-gps'>;
    activeCameraPurpose: DevicePermissionPurpose | null;
    permissionState: ReturnType<typeof getPermissionStateForPurpose>;
    cameraModule: CameraModule | null;
    cameraMode: CameraRuntimeMode;
    cameraRuntimeMessage: string;
    height: number;
    onRequestPermission: () => void;
    onMockMode: () => void;
    onBarcodeScanned: (payload: string) => void;
    label: string;
  }) {
    if (mode === 'native') {
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
          onCancel={onMockMode}
          onBarcodeScanned={(result) => onBarcodeScanned(result.data)}
        >
          <View style={styles.nativeCameraOverlay}>
            <Ionicons name="scan-outline" size={54} color="#ffffff" />
            <Text style={styles.cameraText}>{label}</Text>
          </View>
        </DeviceCameraView>
      );
    }

    return (
      <View style={[styles.scannerBox, { height }]}>
        <Ionicons name="qr-code-outline" size={70} color="#fff" />
        <Text style={styles.scannerText}>{assignedTrees[0]?.qrCode ?? 'NOVYX-TRE-0824'}</Text>
      </View>
    );
  }
}

function renderQrState({
  cameraMode,
  cameraModule,
  cameraRuntimeMessage,
  qrErrorMessage,
  qrLookupLoading,
  qrLookupMessage,
}: {
  cameraMode: CameraRuntimeMode;
  cameraModule: CameraModule | null;
  cameraRuntimeMessage: string;
  qrErrorMessage: string;
  qrLookupLoading?: boolean;
  qrLookupMessage?: string;
}) {
  return (
    <>
      {cameraRuntimeMessage ? (
        <Text style={[styles.monoSmall, cameraMode === 'native' && !cameraModule && styles.alertText]}>
          {cameraRuntimeMessage}
        </Text>
      ) : null}
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
  const distance = getDistanceMeters(userLat, userLng, tree.lat, tree.lng);
  const verified = distance < 10;
  const region = {
    latitude: tree.lat,
    longitude: tree.lng,
    latitudeDelta: 0.0022,
    longitudeDelta: 0.0022,
  };
  const MapView = mapsModule?.default;
  const Circle = mapsModule?.Circle;
  const Marker = mapsModule?.Marker;
  const providerGoogle = mapsModule?.PROVIDER_GOOGLE;
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
        {MapView && Circle && Marker ? (
          <MapView
            provider={providerGoogle}
            style={styles.realMap}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
          >
            <Circle
              center={{ latitude: tree.lat, longitude: tree.lng }}
              radius={10}
              strokeColor="rgba(63,159,72,0.75)"
              fillColor="rgba(63,159,72,0.16)"
            />
            <Marker
              coordinate={{ latitude: tree.lat, longitude: tree.lng }}
              title={tree.name}
              description={`${tree.qrCode} | Vị trí cây mẫu`}
            />
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <View style={styles.mapFallbackIcon}>
              <Ionicons name="map-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.itemTitle}>Bản đồ chưa sẵn sàng trong runtime này</Text>
            <Text style={styles.bodyText}>
              Native module `react-native-maps` chưa có trong app binary. Các bước GPS và QR vẫn dùng được.
            </Text>
            <Text style={styles.monoSmall}>
              Cây: {tree.lat.toFixed(5)}, {tree.lng.toFixed(5)}
            </Text>
            <Text style={styles.monoSmall}>
              Thiết bị: {userLat.toFixed(5)}, {userLng.toFixed(5)}
            </Text>
          </View>
        )}
      </View>
      <Card style={styles.mapCheckinCard} tone={verified ? 'green' : 'amber'}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{task.treeName}</Text>
            <Text style={styles.itemSub}>{tree.address}</Text>
          </View>
          <Badge tone={verified ? 'green' : 'amber'}>{distance.toFixed(1)}m</Badge>
        </View>
        <View style={styles.checkinStatusRow}>
          <Ionicons
            name={verified ? 'checkmark-circle-outline' : 'navigate-outline'}
            size={19}
            color={verified ? colors.primaryDark : colors.amber}
          />
          <Text style={styles.bodyText}>
            {verified ? 'Thiết bị đang trong vùng check-in 10m.' : 'Đứng gần cây hơn để mở bước quét QR.'}
          </Text>
        </View>
        <Text style={styles.monoSmall}>{locationMessage}</Text>
        <View style={styles.gpsAuditGrid}>
          <View style={styles.gpsAuditBox}>
            <Text style={styles.metricLabel}>Độ chính xác</Text>
            <Text style={styles.treeMetaValue}>
              {locationAccuracyMeters === null ? 'Chưa có GPS thật' : `${locationAccuracyMeters.toFixed(0)}m`}
            </Text>
          </View>
          <View style={styles.gpsAuditBox}>
            <Text style={styles.metricLabel}>Thời điểm</Text>
            <Text style={styles.treeMetaValue}>
              {locationCapturedAt && locationAgeSeconds !== null ? `${locationAgeSeconds}s trước` : 'Dữ liệu mô phỏng'}
            </Text>
          </View>
        </View>
        <Badge tone={accuracyTone}>{accuracyTone === 'green' ? 'GPS đáng tin' : 'Cần làm mới GPS'}</Badge>
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
    fontSize: 10,
    fontWeight: '900',
  },
  heroKicker: {
    color: '#d9f7dd',
    fontSize: 12,
    fontWeight: '900',
  },
  headerSubDark: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  alertText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '900',
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
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
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
    color: '#cbd5e1',
    marginTop: 10,
    fontWeight: '700',
  },
  cameraHint: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '900',
    textAlign: 'center',
  },
});
