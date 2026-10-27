import { AppState } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PermissionResponse } from 'expo-camera';
import type { LocationPermissionResponse } from 'expo-location';
import {
  classifyPermissionResponse,
  getPermissionKindForPurpose,
  loadCameraPermission,
  loadForegroundLocationPermission,
  requestCameraPermission,
  requestForegroundLocationPermission,
  type DevicePermissionKind,
  type DevicePermissionPurpose,
  type DevicePermissionUiState,
} from '../services/devicePermissions';

type PurposePrompt = {
  kind: DevicePermissionKind;
  purpose: DevicePermissionPurpose;
  state: DevicePermissionUiState;
};

type RuntimeState = {
  camera?: string;
  location?: string;
};

const toRuntimeMessage = (kind: DevicePermissionKind, error: unknown) => {
  const detail = error instanceof Error ? error.message : '';
  const moduleName = kind === 'camera' ? 'expo-camera' : 'expo-location';
  return detail || `Runtime hiện tại chưa có ${moduleName}.`;
};

export function useDevicePermissions() {
  const [cameraPermission, setCameraPermission] = useState<PermissionResponse | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionResponse | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({});
  const [prompt, setPrompt] = useState<PurposePrompt | null>(null);
  const [activeCameraPurpose, setActiveCameraPurpose] = useState<DevicePermissionPurpose | null>(null);

  const setRuntimeUnavailable = useCallback((kind: DevicePermissionKind, error: unknown) => {
    setRuntimeState((current) => ({ ...current, [kind]: toRuntimeMessage(kind, error) }));
  }, []);

  const clearRuntimeUnavailable = useCallback((kind: DevicePermissionKind) => {
    setRuntimeState((current) => ({ ...current, [kind]: undefined }));
  }, []);

  const refreshCameraPermission = useCallback(async () => {
    try {
      const response = await loadCameraPermission();
      setCameraPermission(response);
      setPrompt((current) =>
        current?.kind === 'camera' ? { ...current, state: classifyPermissionResponse(response) } : current,
      );
      clearRuntimeUnavailable('camera');
      return response;
    } catch (error) {
      setRuntimeUnavailable('camera', error);
      return null;
    }
  }, [clearRuntimeUnavailable, setRuntimeUnavailable]);

  const refreshLocationPermission = useCallback(async () => {
    try {
      const response = await loadForegroundLocationPermission();
      setLocationPermission(response);
      setPrompt((current) =>
        current?.kind === 'location' ? { ...current, state: classifyPermissionResponse(response) } : current,
      );
      clearRuntimeUnavailable('location');
      return response;
    } catch (error) {
      setRuntimeUnavailable('location', error);
      return null;
    }
  }, [clearRuntimeUnavailable, setRuntimeUnavailable]);

  useEffect(() => {
    void refreshCameraPermission();
    void refreshLocationPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshCameraPermission();
        void refreshLocationPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshCameraPermission, refreshLocationPermission]);

  const showRationaleForPurpose = useCallback((purpose: DevicePermissionPurpose) => {
    const kind = getPermissionKindForPurpose(purpose);
    setPrompt({ kind, purpose, state: 'rationale' });
    if (kind === 'camera') {
      setActiveCameraPurpose(null);
    }
  }, []);

  const clearPermissionPrompt = useCallback(() => {
    setPrompt(null);
  }, []);

  const releaseCamera = useCallback(() => {
    setActiveCameraPurpose(null);
  }, []);

  const requestCameraForPurpose = useCallback(
    async (purpose: Exclude<DevicePermissionPurpose, 'staff-gps'>) => {
      setPrompt({ kind: 'camera', purpose, state: 'rationale' });
      try {
        const response = await requestCameraPermission();
        setCameraPermission(response);
        clearRuntimeUnavailable('camera');
        const nextState = classifyPermissionResponse(response);
        setPrompt({ kind: 'camera', purpose, state: nextState });
        setActiveCameraPurpose(nextState === 'granted' ? purpose : null);
        return response;
      } catch (error) {
        setRuntimeUnavailable('camera', error);
        setPrompt({ kind: 'camera', purpose, state: 'runtime-unavailable' });
        setActiveCameraPurpose(null);
        return null;
      }
    },
    [clearRuntimeUnavailable, setRuntimeUnavailable],
  );

  const requestLocationForPurpose = useCallback(
    async (purpose: Extract<DevicePermissionPurpose, 'staff-gps' | 'manager-tree-gps'> = 'staff-gps') => {
      try {
        const response = await requestForegroundLocationPermission();
        setLocationPermission(response);
        clearRuntimeUnavailable('location');
        const nextState = classifyPermissionResponse(response);
        if (nextState === 'granted') {
          setPrompt(null);
        } else {
          setPrompt({ kind: 'location', purpose, state: nextState });
        }
        return response;
      } catch (error) {
        setRuntimeUnavailable('location', error);
        setPrompt({ kind: 'location', purpose, state: 'runtime-unavailable' });
        return null;
      }
    },
    [clearRuntimeUnavailable, setRuntimeUnavailable],
  );

  const getPermissionStateForPurpose = useCallback(
    (purpose: DevicePermissionPurpose): DevicePermissionUiState => {
      const kind = getPermissionKindForPurpose(purpose);
      if (runtimeState[kind]) {
        return 'runtime-unavailable';
      }
      if (prompt?.purpose === purpose) {
        return prompt.state;
      }
      return classifyPermissionResponse(kind === 'camera' ? cameraPermission : locationPermission);
    },
    [cameraPermission, locationPermission, prompt, runtimeState],
  );

  const getRuntimeMessageForPurpose = useCallback(
    (purpose: DevicePermissionPurpose) => runtimeState[getPermissionKindForPurpose(purpose)],
    [runtimeState],
  );

  return useMemo(
    () => ({
      cameraPermission,
      locationPermission,
      activeCameraPurpose,
      requestCameraForPurpose,
      requestLocationForPurpose,
      showRationaleForPurpose,
      clearPermissionPrompt,
      releaseCamera,
      refreshCameraPermission,
      refreshLocationPermission,
      getPermissionStateForPurpose,
      getRuntimeMessageForPurpose,
    }),
    [
      activeCameraPurpose,
      cameraPermission,
      clearPermissionPrompt,
      getPermissionStateForPurpose,
      getRuntimeMessageForPurpose,
      locationPermission,
      refreshCameraPermission,
      refreshLocationPermission,
      releaseCamera,
      requestCameraForPurpose,
      requestLocationForPurpose,
      showRationaleForPurpose,
    ],
  );
}
