import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoCamera from 'expo-camera';
import { Badge, Button, ListRow, Notice, ScreenHeader, SectionTitle } from '../../components/AppPrimitives';
import { DeviceCameraView } from '../../components/DeviceCameraView';
import { ManualTreeCodeModal } from '../../components/ManualTreeCodeModal';
import { TreeQrModal } from '../../components/presentation/TreeQrModal';
import { formatTreeAge, getTaskStatusMeta } from '../../domain/mobileWorkflow';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';
import { openDeviceSettings } from '../../services/devicePermissions';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { TaskStatus, Tree } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

type CameraModule = typeof import('expo-camera');

export function ManagerQrLookup(props: ManagerAreaProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [tree, setTree] = useState<Tree | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [manualCodeModalVisible, setManualCodeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const scanLock = useRef(0);
  const cameraModule: CameraModule = ExpoCamera;
  const {
    cameraPermission,
    activeCameraPurpose,
    requestCameraForPurpose,
    releaseCamera,
    getPermissionStateForPurpose,
    getRuntimeMessageForPurpose,
  } = useDevicePermissions();

  useEffect(() => () => releaseCamera(), [releaseCamera]);
  useEffect(() => {
    if (cameraPermission?.granted && activeCameraPurpose !== 'manager-qr-lookup') {
      void requestCameraForPurpose('manager-qr-lookup');
    }
  }, [activeCameraPurpose, cameraPermission?.granted, requestCameraForPurpose]);

  const lookup = async (payload: string) => {
    const code = payload.trim();
    if (!code || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await props.lookupTreeByQr(code);
      setTree(result);
      if (result) releaseCamera();
      if (!result) setMessage('Không tìm thấy cây. Quét lại mã QR.');
    } catch {
      setTree(null);
      setMessage('Không thể tra cứu. Kiểm tra mạng rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const relatedTask = tree
    ? (props.tasks.find((task) => task.treeId === tree.id && task.status !== TaskStatus.COMPLETED) ??
      props.tasks.find((task) => task.treeId === tree.id))
    : null;
  const previewHeight = Math.min(420, Math.max(300, windowHeight - 390));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tra cứu QR cây"
        subtitle="Quét mã để xem hồ sơ và công việc liên quan"
        onBack={() => props.setActiveStep('HOME')}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screen}>

        {!tree ? (
          <>
            <DeviceCameraView
              purpose="manager-qr-lookup"
              activeCameraPurpose={activeCameraPurpose}
              permissionState={getPermissionStateForPurpose('manager-qr-lookup')}
              cameraModule={cameraModule}
              style={[styles.camera, { height: previewHeight }]}
              runtimeMessage={getRuntimeMessageForPurpose('manager-qr-lookup')}
              onRequestPermission={() => void requestCameraForPurpose('manager-qr-lookup')}
              onOpenSettings={() => void openDeviceSettings()}
              onCancel={() => props.setActiveStep('HOME')}
              onBarcodeScanned={(result) => {
                const now = Date.now();
                if (now - scanLock.current < 1600) return;
                scanLock.current = now;
                void lookup(result.data);
              }}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame}>
                  <Ionicons name="qr-code-outline" size={42} color={colors.snowWhite} />
                </View>
                <Text style={styles.cameraTitle}>Đặt mã QR cây trong khung</Text>
                <Text style={styles.cameraBody}>Chỉ tra cứu, không thay đổi công việc.</Text>
              </View>
            </DeviceCameraView>

            <Button
              variant="outline"
              icon="keypad-outline"
              onPress={() => setManualCodeModalVisible(true)}
              accessibilityLabel="Nhập mã cây bằng tay"
            >
              Nhập mã cây bằng tay
            </Button>

            {loading ? (
              <Notice tone="info" title="Đang tra cứu hồ sơ cây" body="Vui lòng giữ nguyên thiết bị trong giây lát." />
            ) : null}
            {message ? (
              <Notice
                tone="danger"
                title="Chưa tìm thấy hồ sơ"
                body={message}
                action={
                  <Button size="compact" variant="outline" onPress={() => setMessage('')}>
                    Quét lại
                  </Button>
                }
              />
            ) : null}
          </>
        ) : (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons name="leaf-outline" size={25} color={colors.primaryDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.treeName}>{tree.name}</Text>
                <Text style={styles.treeSpecies}>{tree.species}</Text>
              </View>
              <Badge
                tone={
                  tree.healthStatus === 'Sâu bệnh' ? 'danger' : tree.healthStatus === 'Cần chăm sóc' ? 'amber' : 'green'
                }
              >
                {tree.healthStatus}
              </Badge>
            </View>

            <View style={styles.factGroup}>
              <ListRow icon="location-outline" title="Vị trí" subtitle={tree.address} />
              <View style={styles.divider} />
              <ListRow icon="time-outline" title="Tuổi cây" subtitle={formatTreeAge(tree.ageYears)} />
            </View>

            <View style={styles.section}>
              <SectionTitle icon="clipboard-outline">Công việc liên quan</SectionTitle>
              {relatedTask ? (
                <View style={styles.relatedTask}>
                  <ListRow
                    icon="document-text-outline"
                    title={relatedTask.title}
                    subtitle={`${getTaskStatusMeta(relatedTask.status).label} · ${relatedTask.assignedStaffName}`}
                  />
                  {relatedTask.status === TaskStatus.WAITING_REVIEW ? (
                    <Button
                      icon="checkmark-done-outline"
                      onPress={() => {
                        props.setReviewTask(relatedTask);
                        props.setActiveStep('REVIEW_DETAIL');
                      }}
                    >
                      Duyệt báo cáo
                    </Button>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.body}>Cây này chưa có công việc đang mở.</Text>
              )}
            </View>

            <Button
              variant="primary"
              icon="add-circle-outline"
              onPress={() => props.setActiveStep('CREATE')}
            >
              Giao việc cho cây này
            </Button>
            <Button icon="leaf-outline" onPress={() => props.setActiveStep('TREES')}>
              Mở hồ sơ cây
            </Button>
            <View style={styles.secondaryActions}>
              <Button variant="outline" icon="qr-code-outline" onPress={() => setQrVisible(true)}>
                Mở mã QR
              </Button>
              <Button
                variant="outline"
                icon="refresh-outline"
                onPress={() => {
                  setTree(null);
                  setMessage('');
                  void requestCameraForPurpose('manager-qr-lookup');
                }}
              >
                Quét mã khác
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
      <TreeQrModal tree={qrVisible ? tree : null} onClose={() => setQrVisible(false)} />
      <ManualTreeCodeModal
        visible={manualCodeModalVisible}
        onClose={() => setManualCodeModalVisible(false)}
        trees={props.trees}
        onSelectTreeCode={(code) => void lookup(code)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: { padding: layout.screenPadding, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  camera: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.ink },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.cameraOverlay,
  },
  scanFrame: {
    width: 164,
    height: 164,
    borderWidth: 3,
    borderColor: colors.snowWhite,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: { ...typography.section, color: colors.snowWhite, textAlign: 'center' },
  cameraBody: { ...typography.body, color: colors.honeydew, textAlign: 'center', maxWidth: 320 },
  result: { gap: spacing.lg },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconSurface,
  },
  treeName: { ...typography.title, color: colors.ink },
  treeSpecies: { ...typography.body, color: colors.pewter, marginTop: 2 },
  section: { gap: spacing.sm },
  factGroup: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  divider: { height: 1, backgroundColor: colors.hairlineBorder },
  relatedTask: { gap: spacing.sm },
  body: { ...typography.body, color: colors.pewter },
  secondaryActions: { flexDirection: 'row', gap: spacing.sm },
});
