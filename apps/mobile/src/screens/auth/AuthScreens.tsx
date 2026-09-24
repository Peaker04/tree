import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark, Button, Card, Field } from '../../components/AppPrimitives';
import { NovyxMark } from '../../components/NovyxMark';
import { colors, spacing } from '../../theme/tokens';

export function LoginScreen({
  authLoading,
  onLogin,
  errorMessage,
}: {
  authLoading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  errorMessage?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    const normalized = email.trim().toLowerCase();
    void onLogin(normalized, password);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
        <ScrollView
          contentContainerStyle={styles.loginWrap}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.logoBox}>
                <NovyxMark size={36} color={colors.brandForest} accentColor={colors.brandOlive} />
              </View>
              <Text style={styles.brandKicker}>Xác minh vận hành cây xanh</Text>
            </View>
            <Text style={styles.brand}>NOVYX</Text>
            <Text style={styles.brandBody}>Quản lý cây xanh, QR, GPS và bằng chứng ảnh cho đội vận hành đô thị.</Text>
          </View>

          <View style={styles.formStack}>
            {error || errorMessage ? (
              <Card tone="danger" style={styles.alertRow}>
                <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
                <Text style={styles.alertText}>{error || errorMessage}</Text>
              </Card>
            ) : null}
            <Field
              label="Email hoặc Số điện thoại"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
              placeholder="email@donvi.vn"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Mật khẩu"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((prev) => !prev)}
            />

            <Button disabled={authLoading} icon="key-outline" loading={authLoading} onPress={submit}>
              {authLoading ? 'Đang đăng nhập' : 'Đăng nhập'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SessionRestoreScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.screenPad, styles.centerJustified]}>
        <BrandMark />
        <Card tone="green" style={styles.sessionRestoreCard}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.primaryDark} />
          <Text style={styles.successTitle}>Đang khôi phục phiên đăng nhập</Text>
          <Text style={styles.bodyText}>NOVYX đang kiểm tra session bảo mật trên thiết bị.</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPad: {
    padding: spacing.screen,
    paddingTop: Platform.OS === 'android' ? spacing.screen + (StatusBar.currentHeight ?? 0) * 0.35 : spacing.screen,
    gap: spacing.section,
    paddingBottom: 34,
  },
  keyboardAvoider: {
    flex: 1,
  },
  loginWrap: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 20 + (StatusBar.currentHeight ?? 0) * 0.35 : 22,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 34,
    paddingTop: 4,
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.warmStone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 29,
    fontWeight: '600',
    color: colors.forest,
  },
  brandKicker: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  brandBody: {
    marginTop: 10,
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 340,
  },
  formStack: {
    gap: 14,
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
    fontWeight: '500',
  },

  sessionRestoreCard: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  bodyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  successTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
