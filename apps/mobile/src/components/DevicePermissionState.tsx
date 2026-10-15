import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card } from './AppPrimitives';
import { colors, radius } from '../theme/tokens';
import type {
  DevicePermissionKind,
  DevicePermissionPurpose,
  DevicePermissionUiState,
} from '../services/devicePermissions';

type DevicePermissionStateProps = {
  kind: DevicePermissionKind;
  purpose: DevicePermissionPurpose;
  state: DevicePermissionUiState;
  runtimeMessage?: string;
  onRequest?: () => void;
  onOpenSettings?: () => void;
  onCancel?: () => void;
};

const purposeCopy: Record<
  DevicePermissionPurpose,
  {
    title: string;
    rationale: string;
  }
> = {
  'staff-free-qr': {
    title: 'Quét QR cây',
    rationale: 'Dùng camera để quét QR cây.',
  },
  'staff-task-qr': {
    title: 'Quét QR nhiệm vụ',
    rationale: 'Dùng camera để quét QR cây.',
  },
  'staff-before-photo': {
    title: 'Ảnh trước xử lý',
    rationale: 'Dùng camera để chụp ảnh bằng chứng.',
  },
  'staff-after-photo': {
    title: 'Ảnh sau xử lý',
    rationale: 'Dùng camera để chụp ảnh bằng chứng.',
  },
  'manager-qr-lookup': {
    title: 'Tra cứu QR cây',
    rationale: 'Dùng camera để tra cứu cây.',
  },
  'manager-tree-gps': {
    title: 'Vị trí cây',
    rationale: 'Dùng GPS để lưu vị trí cây.',
  },
  'staff-gps': {
    title: 'Xác minh GPS',
    rationale: 'Dùng GPS để xác minh đúng cây.',
  },
};

const deniedCopy: Record<DevicePermissionKind, string> = {
  camera: 'Cấp quyền camera để tiếp tục.',
  location: 'Cấp quyền vị trí để tiếp tục.',
};

const blockedCopy: Record<DevicePermissionKind, string> = {
  camera: 'Bật quyền Camera trong Cài đặt để tiếp tục.',
  location: 'Bật quyền Vị trí trong Cài đặt để tiếp tục.',
};

const grantedCopy: Record<DevicePermissionKind, string> = {
  camera: 'Camera thật đã sẵn sàng.',
  location: 'GPS đã sẵn sàng để lấy tọa độ hiện trường.',
};

const requestCopy: Record<DevicePermissionKind, string> = {
  camera: 'Cho phép camera',
  location: 'Cho phép GPS',
};

export function DevicePermissionState({
  kind,
  purpose,
  state,
  runtimeMessage,
  onRequest,
  onOpenSettings,
  onCancel,
}: DevicePermissionStateProps) {
  const copy = purposeCopy[purpose];

  if (state === 'checking') {
    return (
      <Card tone="soft" style={styles.card}>
        <StateHeader icon="sync-outline" title={copy.title} />
        <Text style={styles.body}>Đang kiểm tra quyền thiết bị...</Text>
      </Card>
    );
  }

  if (state === 'granted') {
    return (
      <Card tone="green" style={styles.card}>
        <StateHeader icon="checkmark-circle-outline" title={copy.title} />
        <Text style={styles.body}>{grantedCopy[kind]}</Text>
      </Card>
    );
  }

  if (state === 'runtime-unavailable') {
    return (
      <Card tone="danger" style={styles.card}>
        <StateHeader icon="warning-outline" title={copy.title} />
        <Text style={styles.body}>{runtimeMessage ?? 'Thiết bị chưa sẵn sàng. Thử mở lại ứng dụng.'}</Text>
        <ActionRow onCancel={onCancel} />
      </Card>
    );
  }

  if (state === 'blocked-settings') {
    return (
      <Card tone="danger" style={styles.card}>
        <StateHeader icon="lock-closed-outline" title={copy.title} />
        <Text style={styles.body}>{blockedCopy[kind]}</Text>
        <ActionRow
          primaryLabel="Mở cài đặt"
          primaryIcon="settings-outline"
          onPrimary={onOpenSettings}
          onCancel={onCancel}
        />
      </Card>
    );
  }

  if (state === 'denied-retry') {
    return (
      <Card tone="amber" style={styles.card}>
        <StateHeader icon="alert-circle-outline" title={copy.title} />
        <Text style={styles.body}>{deniedCopy[kind]}</Text>
        <ActionRow
          primaryLabel="Thử cấp quyền lại"
          primaryIcon="refresh-outline"
          onPrimary={onRequest}
          onCancel={onCancel}
        />
      </Card>
    );
  }

  return (
    <Card tone="amber" style={styles.card}>
      <StateHeader icon="shield-checkmark-outline" title={copy.title} />
      <Text style={styles.body}>{copy.rationale}</Text>
      <ActionRow
        primaryLabel={requestCopy[kind]}
        primaryIcon="checkmark-outline"
        onPrimary={onRequest}
        onCancel={onCancel}
        cancelLabel="Để sau"
      />
    </Card>
  );
}

function StateHeader({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.iconShell}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function ActionRow({
  primaryLabel,
  primaryIcon,
  onPrimary,
  onCancel,
  cancelLabel = 'Quay lại',
}: {
  primaryLabel?: string;
  primaryIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onPrimary?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  return (
    <View style={styles.actions}>
      {primaryLabel ? (
        <Button icon={primaryIcon} onPress={onPrimary} style={styles.actionButton}>
          {primaryLabel}
        </Button>
      ) : null}
      <Button variant="ghost" onPress={onCancel} style={styles.actionButton}>
        {cancelLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconShell: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.iconBorder,
    backgroundColor: colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    color: colors.foregroundSoft,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minHeight: 52,
  },
});
