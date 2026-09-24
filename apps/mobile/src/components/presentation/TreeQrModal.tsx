import React from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { create } from 'qrcode';
import Svg, { Rect } from 'react-native-svg';
import { Button } from '../AppPrimitives';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import type { Tree } from '../../types';

const QR_SIZE = 29;

function getQrCells(value: string) {
  const modules = create(value, { errorCorrectionLevel: 'M' }).modules;
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < modules.size; y += 1) {
    for (let x = 0; x < modules.size; x += 1) {
      if (modules.data[y * modules.size + x]) cells.push({ x, y });
    }
  }
  return { cells, size: modules.size };
}

async function shareQr(tree: Tree, pngBase64: string) {
  const FileSystem = await import('expo-file-system/legacy');
  const fileUri = `${FileSystem.cacheDirectory}novyx-${tree.id}-qr.png`;
  await FileSystem.writeAsStringAsync(fileUri, pngBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Share.share({ url: fileUri, message: `${tree.name}\n${tree.qrCode}` });
}

export function TreeQrModal({ tree, onClose }: { tree: Tree | null; onClose: () => void }) {
  const [sharing, setSharing] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const qrRef = React.useRef<Svg>(null);
  if (!tree) return null;
  const qr = getQrCells(tree.qrCode);
  const cell = QR_SIZE / qr.size;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>Mã QR của cây</Text>
              <Text style={styles.subtitle}>{tree.name}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng mã QR"
              onPress={onClose}
              style={styles.close}
            >
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.qrSurface}>
            <Svg ref={qrRef} width="100%" height="100%" viewBox={`-2 -2 ${QR_SIZE + 4} ${QR_SIZE + 4}`}>
              <Rect x={-2} y={-2} width={QR_SIZE + 4} height={QR_SIZE + 4} fill="#ffffff" />
              {qr.cells.map(({ x, y }) => (
                <Rect
                  key={`${x}-${y}`}
                  x={x * cell}
                  y={y * cell}
                  width={cell + 0.02}
                  height={cell + 0.02}
                  fill="#13231a"
                />
              ))}
            </Svg>
          </View>

          <Text style={styles.help}>
            Dùng mã này để in hoặc lưu nhãn, sau đó gắn nhãn vào đúng cây ngoài hiện trường.
          </Text>
          {shareError ? <Text style={styles.error}>{shareError}</Text> : null}
          <Button
            icon="download-outline"
            loading={sharing}
            onPress={async () => {
              setSharing(true);
              setShareError(null);
              try {
                const pngBase64 = await new Promise<string>((resolve, reject) => {
                  if (!qrRef.current) {
                    reject(new Error('QR_NOT_READY'));
                    return;
                  }
                  qrRef.current.toDataURL(resolve);
                });
                await shareQr(tree, pngBase64);
              } catch {
                setShareError('Không thể mở bảng chia sẻ. Hãy thử lại.');
              } finally {
                setSharing(false);
              }
            }}
          >
            Lưu hoặc in mã QR
          </Button>
          <Button variant="outline" onPress={onClose}>
            Xong
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.cameraOverlay },
  sheet: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radius.container,
    borderTopRightRadius: radius.container,
    backgroundColor: colors.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { ...typography.body, color: colors.pewter, marginTop: spacing.xs },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qrSurface: {
    width: 260,
    height: 260,
    maxWidth: '100%',
    alignSelf: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: radius.card,
    backgroundColor: '#ffffff',
  },
  help: { ...typography.body, color: colors.neutralText, textAlign: 'center' },
  error: { ...typography.body, color: colors.criticalText, textAlign: 'center' },
});
