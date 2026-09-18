import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card } from '../../components/AppPrimitives';
import { DeviceCameraView } from '../../components/DeviceCameraView';
import { Header } from '../../components/presentation/TaskSurfaces';
import { TreeLookupResult } from '../../components/presentation/TreeSurfaces';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';
import { openDeviceSettings } from '../../services/devicePermissions';
import { colors, spacing } from '../../theme/tokens';
import { TaskStatus, Tree } from '../../types';
import type { ManagerAreaProps } from './ManagerArea';

type CameraRuntimeMode = 'mock' | 'native';
type CameraModule = typeof import('expo-camera');

export function ManagerQrLookup(props: ManagerAreaProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [qrScannedTree, setQrScannedTree] = useState<Tree | null>(null);
  const [qrLookupLoading, setQrLookupLoading] = useState(false);
  const [qrLookupMessage, setQrLookupMessage] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [cameraMode, setCameraMode] = useState<CameraRuntimeMode>('mock');
  const [cameraModule, setCameraModule] = useState<CameraModule | null>(null);
  const [cameraRuntimeMessage, setCameraRuntimeMessage] = useState('');
  const qrScanLockRef = useRef(0);
  const {
    cameraPermission,
    activeCameraPurpose,
    requestCameraForPurpose,
    releaseCamera,
    getPermissionStateForPurpose,
    getRuntimeMessageForPurpose,
  } = useDevicePermissions();

  useEffect(() => {
    let mounted = true;
    import('expo-camera')
      .then((mod) => {
        if (mounted) {
          setCameraModule(mod);
          setCameraRuntimeMessage('');
        }
      })
      .catch(() => {
        if (mounted) {
          setCameraMode('mock');
          setCameraRuntimeMessage('Camera không khả dụng, sử dụng mô phỏng.');
        }
      });
    return () => {
      mounted = false;
      releaseCamera();
    };
  }, [releaseCamera]);

  useEffect(() => {
    if (cameraMode !== 'native') {
      releaseCamera();
      return;
    }
    if (cameraPermission?.granted && activeCameraPurpose !== 'manager-qr-lookup') {
      void requestCameraForPurpose('manager-qr-lookup');
    }
  }, [activeCameraPurpose, cameraMode, cameraPermission?.granted, releaseCamera, requestCameraForPurpose]);

  const lookupTreeByQr = async (payload: string) => {
    const cleanPayload = payload.trim();
    if (!cleanPayload) return;
    setQrLookupLoading(true);
    setQrLookupMessage('');
    const matchedTree = await props.lookupTreeByQr(cleanPayload);
    setQrLookupLoading(false);

    if (!matchedTree) {
      setQrScannedTree(null);
      setQrErrorMessage(`Không tìm thấy cây với mã ${cleanPayload}. Hãy kiểm tra lại QR hoặc đồng bộ dữ liệu.`);
      return;
    }

    setQrErrorMessage('');
    setQrScannedTree(matchedTree);
    setQrLookupMessage(`Đã tra cứu ${matchedTree.qrCode} từ API hoặc dữ liệu fallback.`);
  };

  const relatedTask = qrScannedTree
    ? (props.tasks.find((task) => task.treeId === qrScannedTree.id && task.status !== TaskStatus.COMPLETED) ??
      props.tasks.find((task) => task.treeId === qrScannedTree.id))
    : null;
  const previewHeight = Math.min(460, Math.max(320, windowHeight - 360));

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Header
        title="Tra cứu QR cây"
        subtitle="Quét mã QR để xem thông tin nhanh"
        onBack={() => props.setActiveStep('HOME')}
      />
      <Card tone="dark" style={styles.qrContextCard}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.heroKicker}>Quản lý • Tra cứu cây</Text>
            <Text style={styles.qrPayloadText}>{qrScannedTree?.qrCode ?? 'Đưa mã QR cây vào khung'}</Text>
            <Text style={styles.headerSubDark}>Xem tình trạng cây, vị trí và công việc liên quan.</Text>
          </View>
          <Ionicons name="leaf-outline" size={32} color="#d9f7dd" />
        </View>
      </Card>

      {cameraMode === 'native' ? (
        <DeviceCameraView
          purpose="manager-qr-lookup"
          activeCameraPurpose={activeCameraPurpose}
          permissionState={getPermissionStateForPurpose('manager-qr-lookup')}
          cameraModule={cameraModule}
          style={[styles.nativeCameraPreview, { height: previewHeight }]}
          runtimeMessage={cameraRuntimeMessage || getRuntimeMessageForPurpose('manager-qr-lookup')}
          onRequestPermission={() => void requestCameraForPurpose('manager-qr-lookup')}
          onOpenSettings={() => void openDeviceSettings()}
          onCancel={() => setCameraMode('mock')}
          onBarcodeScanned={(result) => {
            const now = Date.now();
            if (now - qrScanLockRef.current < 1600) return;
            qrScanLockRef.current = now;
            void lookupTreeByQr(result.data);
          }}
        >
          <View style={styles.nativeCameraOverlay}>
            <Ionicons name="scan-outline" size={54} color="#ffffff" />
            <Text style={styles.cameraText}>Quét mã trên thân cây</Text>
          </View>
        </DeviceCameraView>
      ) : (
        <View style={[styles.scannerBox, { height: previewHeight }]}>
          <Ionicons name="qr-code-outline" size={70} color="#fff" />
          <Text style={styles.scannerText}>{props.trees[0]?.qrCode ?? 'NOVYX-TRE-0824'}</Text>
        </View>
      )}

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
      <View style={styles.qrActions}>
        <Button
          variant="outline"
          icon={cameraMode === 'native' ? 'phone-portrait-outline' : 'camera-outline'}
          onPress={() => {
            setQrErrorMessage('');
            setCameraMode(cameraMode === 'native' ? 'mock' : 'native');
          }}
        >
          {cameraMode === 'native' ? 'Dùng mô phỏng' : 'Camera thật'}
        </Button>
        <Button
          icon="qr-code-outline"
          loading={qrLookupLoading}
          onPress={() => void lookupTreeByQr(props.trees[0]?.qrCode ?? 'NOVYX-TRE-0824')}
        >
          Mô phỏng quét cây
        </Button>
        <Button variant="danger" icon="alert-circle-outline" onPress={() => void lookupTreeByQr('UNKNOWN-QR')}>
          Mã lạ
        </Button>
      </View>
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
      {qrScannedTree ? (
        <TreeLookupResult
          tree={qrScannedTree}
          task={relatedTask ?? undefined}
          careHistory={props.getCareHistoryByTree(qrScannedTree.id)}
          loadCareHistory={props.loadCareHistoryByTree}
          onTrees={() => props.setActiveStep('TREES')}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenPad: {
    padding: spacing.screen,
    gap: spacing.section,
    paddingBottom: 104,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  qrContextCard: {
    borderColor: '#2c6a45',
  },
  heroKicker: {
    color: '#d9f7dd',
    fontSize: 10,
    fontWeight: '700',
  },
  qrPayloadText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  headerSubDark: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
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
  cameraText: {
    color: '#cbd5e1',
    marginTop: 10,
    fontWeight: '700',
  },
  qrActions: {
    gap: 12,
    paddingBottom: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  monoSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
});
