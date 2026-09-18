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
    rationale: 'NOVYX cần camera để quét đúng mã QR trên thân cây.',
  },
  'staff-task-qr': {
    title: 'Quét QR nhiệm vụ',
    rationale: 'NOVYX cần camera để quét đúng mã QR trên thân cây.',
  },
  'staff-before-photo': {
    title: 'Ảnh trước xử lý',
    rationale: 'NOVYX cần camera để chụp ảnh bằng chứng trước và sau khi xử lý.',
  },
  'staff-after-photo': {
    title: 'Ảnh sau xử lý',
    rationale: 'NOVYX cần camera để chụp ảnh bằng chứng trước và sau khi xử lý.',
  },
  'manager-qr-lookup': {
    title: 'Tra cứu QR cây',
    rationale: 'NOVYX cần camera để quét đúng mã QR trên thân cây.',
  },
  'staff-gps': {
    title: 'Xác minh GPS',
    rationale: 'NOVYX cần GPS để xác minh bạn đang đứng đúng cây trong bán kính nghiệm thu.',
  },
};

const deniedCopy: Record<DevicePermissionKind, string> = {
  camera: 'Chưa có quyền camera. Cấp quyền để quét QR hoặc chụp ảnh.',
  location: 'Chưa có quyền vị trí. Cấp quyền để lấy GPS hiện trường.',
};

const blockedCopy: Record<DevicePermissionKind, string> = {
  camera: 'Quyền camera đang bị chặn. Mở cài đặt Android và bật quyền Camera cho NOVYX.',
  location: 'Quyền vị trí đang bị chặn. Mở cài đặt Android và bật quyền Vị trí cho NOVYX.',
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
        <Text style={styles.body}>
          {runtimeMessage ?? 'Runtime hiện tại chưa hỗ trợ quyền thiết bị này. Hãy dùng dev client đúng SDK.'}
        </Text>
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '900',
  },
  body: {
    color: colors.foregroundSoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minHeight: 52,
  },
});
