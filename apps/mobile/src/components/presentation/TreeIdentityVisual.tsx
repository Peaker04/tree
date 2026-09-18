import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { mockTreeLandscapePhoto } from '../../assets/mockEvidenceAssets';
import { colors, radius } from '../../theme/tokens';
import { Tree } from '../../types';

export function TreeIdentityVisual({ tree, compact = false }: { tree: Tree; compact?: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel={`Ảnh thực tế khu vực cây ${tree.name}, mã QR ${tree.qrCode}`}
      style={[styles.visual, compact && styles.visualCompact]}
    >
      <Image source={mockTreeLandscapePhoto} resizeMode="cover" style={styles.photo} />
      <View style={styles.photoShade} />
      <View style={styles.qrBlock}>
        <Ionicons name="qr-code-outline" size={compact ? 22 : 30} color={colors.forest} />
      </View>
      {!compact ? (
        <View style={styles.qrLabel}>
          <Ionicons name="qr-code-outline" size={13} color={colors.forest} />
          <Text numberOfLines={1} style={styles.qrText}>
            {tree.qrCode}
          </Text>
        </View>
      ) : null}
      <View style={styles.idBadge}>
        <Text numberOfLines={1} style={styles.idText}>
          {tree.id}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  visual: {
    height: 164,
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.honeydew,
  },
  visualCompact: {
    width: 104,
    height: 112,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 35, 24, 0.16)',
  },
  qrBlock: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  qrLabel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qrText: {
    flex: 1,
    color: colors.forest,
    fontSize: 10,
    fontWeight: '900',
  },
  idBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  idText: {
    color: colors.forest,
    fontSize: 10,
    fontWeight: '900',
  },
});
