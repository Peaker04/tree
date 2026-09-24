import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { DevicePermissionState } from './DevicePermissionState';
import {
  getPermissionKindForPurpose,
  type DevicePermissionPurpose,
  type DevicePermissionUiState,
} from '../services/devicePermissions';

type CameraModule = typeof import('expo-camera');

export type DeviceCameraViewHandle = {
  takePictureAsync?: (options: { quality: number }) => Promise<{ uri: string }>;
};

type DeviceCameraViewProps = {
  purpose: DevicePermissionPurpose;
  activeCameraPurpose: DevicePermissionPurpose | null;
  permissionState: DevicePermissionUiState;
  cameraModule?: CameraModule | null;
  cameraRef?: React.Ref<DeviceCameraViewHandle>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onBarcodeScanned?: (result: BarcodeScanningResult) => void;
  onRequestPermission?: () => void;
  onOpenSettings?: () => void;
  onCancel?: () => void;
  runtimeMessage?: string;
};

export function DeviceCameraView({
  purpose,
  activeCameraPurpose,
  permissionState,
  cameraModule,
  cameraRef,
  style,
  children,
  onBarcodeScanned,
  onRequestPermission,
  onOpenSettings,
  onCancel,
  runtimeMessage,
}: DeviceCameraViewProps) {
  const kind = getPermissionKindForPurpose(purpose);
  const canRenderPreview = permissionState === 'granted' && activeCameraPurpose === purpose && Boolean(cameraModule);

  if (!canRenderPreview) {
    return (
      <DevicePermissionState
        kind={kind}
        purpose={purpose}
        state={permissionState === 'granted' && !cameraModule ? 'runtime-unavailable' : permissionState}
        runtimeMessage={runtimeMessage}
        onRequest={onRequestPermission}
        onOpenSettings={onOpenSettings}
        onCancel={onCancel}
      />
    );
  }

  return (
    <View style={style}>
      <CameraView
        ref={cameraRef as React.Ref<CameraView>}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={onBarcodeScanned ? { barcodeTypes: ['qr'] } : undefined}
        onBarcodeScanned={onBarcodeScanned}
      />
      {children ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
