import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark, Button, Card, Field } from '../../components/AppPrimitives';
import { Header } from '../../components/presentation/TaskSurfaces';
import { NovyxMark } from '../../components/NovyxMark';
import { colors, radius, spacing } from '../../theme/tokens';
import type { Role } from '../../types';

export function LoginScreen({
  authLoading,
  onLogin,
  onForgot,
}: {
  authLoading: boolean;
  onLogin: (role: Role, email: string, password: string) => Promise<void>;
  onForgot: () => void;
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
    void onLogin(
      normalized.includes('manager') || normalized.includes('admin') ? 'Manager' : 'Staff',
      normalized,
      password,
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginWrap}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoBox}>
              <NovyxMark size={36} color={colors.brandForest} accentColor={colors.brandOlive} />
            </View>
            <Text style={styles.brandKicker}>Urban green verification</Text>
          </View>
          <Text style={styles.brand}>NOVYX</Text>
          <Text style={styles.brandBody}>Quản lý cây xanh, QR, GPS và bằng chứng ảnh cho đội vận hành đô thị.</Text>
        </View>

        <View style={styles.formStack}>
          {error ? (
            <Card tone="danger" style={styles.alertRow}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
              <Text style={styles.alertText}>{error}</Text>
            </Card>
          ) : null}
          <Field
            label="Email hoặc Số điện thoại"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="hung.nguyen@novyx.vn"
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
          <Pressable accessibilityRole="button" onPress={onForgot} hitSlop={10}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </Pressable>
          <Button disabled={authLoading} icon="key-outline" loading={authLoading} onPress={submit}>
            {authLoading ? 'Đang đăng nhập' : 'Đăng nhập'}
          </Button>
        </View>

        <View style={styles.quickLogin}>
          <Text style={styles.quickTitle}>Đăng nhập nhanh để kiểm thử</Text>
          <View style={styles.quickRow}>
            <Pressable
              accessibilityRole="button"
              disabled={authLoading}
              style={[styles.quickCard, styles.quickStaff, authLoading && styles.quickCardDisabled]}
              onPress={() => void onLogin('Staff', 'hung.nguyen@novyx.vn', 'demo123')}
            >
              <Text style={styles.quickRoleStaff}>Nhân viên</Text>
              <Text style={styles.quickDesc}>N.V. Hùng (Staff)</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={authLoading}
              style={[styles.quickCard, styles.quickManager, authLoading && styles.quickCardDisabled]}
              onPress={() => void onLogin('Manager', 'manager@novyx.vn', 'demo123')}
            >
              <Text style={styles.quickRoleManager}>Quản lý</Text>
              <Text style={styles.quickDesc}>Admin (Manager)</Text>
            </Pressable>
          </View>
        </View>
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

export function ForgotScreen({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.screenPad}>
        <Header title="Khôi phục mật khẩu" subtitle="Gửi mã OTP xác nhận cấp lại mật khẩu." onBack={onBack} />
        <View style={styles.formStack}>
          <Field
            label="Email đã đăng ký"
            placeholder="ten.nhanvien@novyx.vn"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {sent ? (
            <Card tone="green">
              <Text style={styles.successTitle}>Đã gửi liên kết</Text>
              <Text style={styles.bodyText}>Link đặt lại mật khẩu đã được gửi về email của bạn.</Text>
            </Card>
          ) : null}
          <Button onPress={() => setSent(true)} disabled={sent}>
            Gửi liên kết khôi phục
          </Button>
        </View>
      </ScrollView>
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
  loginWrap: {
    flex: 1,
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
    backgroundColor: colors.brandIvory || '#f7f3e9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  brand: {
    fontSize: 29,
    fontWeight: '900',
    color: colors.forest,
  },
  brandKicker: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
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
    fontWeight: '700',
  },
  linkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  quickLogin: {
    marginTop: 'auto',
    paddingTop: 18,
    gap: 12,
  },
  quickTitle: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    minHeight: 58,
    justifyContent: 'center',
  },
  quickStaff: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  quickManager: {
    backgroundColor: colors.skySoft,
    borderColor: '#ccebf4',
  },
  quickCardDisabled: {
    opacity: 0.5,
  },
  quickRoleStaff: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  quickRoleManager: {
    color: colors.sky,
    fontSize: 10,
    fontWeight: '900',
  },
  quickDesc: {
    marginTop: 4,
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '900',
  },
  centerJustified: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
