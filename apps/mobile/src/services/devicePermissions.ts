import { Linking } from 'react-native';
import { Camera, PermissionStatus, type PermissionResponse } from 'expo-camera';
import * as Location from 'expo-location';
import type { LocationPermissionResponse } from 'expo-location';

export type DevicePermissionKind = 'camera' | 'location';
export type DevicePermissionPurpose =
  | 'staff-free-qr'
  | 'staff-task-qr'
  | 'staff-before-photo'
  | 'staff-after-photo'
  | 'manager-qr-lookup'
  | 'manager-tree-gps'
  | 'staff-gps';
export type DevicePermissionUiState =
  'checking' | 'not-determined' | 'rationale' | 'denied-retry' | 'blocked-settings' | 'granted' | 'runtime-unavailable';

export type AnyDevicePermissionResponse = PermissionResponse | LocationPermissionResponse;

export async function loadCameraPermission(): Promise<PermissionResponse> {
  return Camera.getCameraPermissionsAsync();
}

export async function requestCameraPermission(): Promise<PermissionResponse> {
  return Camera.requestCameraPermissionsAsync();
}

export async function loadForegroundLocationPermission(): Promise<LocationPermissionResponse> {
  return Location.getForegroundPermissionsAsync();
}

export async function requestForegroundLocationPermission(): Promise<LocationPermissionResponse> {
  return Location.requestForegroundPermissionsAsync();
}

export function classifyPermissionResponse(
  response: AnyDevicePermissionResponse | null | undefined,
): DevicePermissionUiState {
  if (!response) {
    return 'checking';
  }

  if (response.granted || response.status === PermissionStatus.GRANTED) {
    return 'granted';
  }

  if (response.status === PermissionStatus.UNDETERMINED) {
    return 'not-determined';
  }

  return response.canAskAgain ? 'denied-retry' : 'blocked-settings';
}

export async function openDeviceSettings(): Promise<void> {
  await Linking.openSettings();
}

export function getPermissionKindForPurpose(purpose: DevicePermissionPurpose): DevicePermissionKind {
  return purpose === 'staff-gps' || purpose === 'manager-tree-gps' ? 'location' : 'camera';
}
