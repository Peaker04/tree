import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NovyxMark } from '../components/NovyxMark';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    // Logic đăng nhập ở đây
  };

  const handleQuickLogin = (role: 'Staff' | 'Manager') => {
    if (role === 'Staff') {
      setEmail('hung.nguyen@novyx.vn');
      setPassword('staff123');
    } else {
      setEmail('manager@novyx.vn');
      setPassword('admin123');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <NovyxMark size={40} />
          </View>
          <Text style={styles.title}>NOVYX</Text>
          <Text style={styles.subtitle}>URBAN GREEN VERIFICATION</Text>
          <Text style={styles.description}>Hệ thống quản lý cây xanh & xác minh{'\n'}công việc hiện trường</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>EMAIL HOẶC SỐ ĐIỆN THOẠI</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="hung.nguyen@novyx.vn"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>MẬT KHẨU</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Ionicons name="key-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickLoginContainer}>
          <Text style={styles.quickLoginTitle}>DÀNH CHO KIỂM THỬ NHANH (QUICK LOGIN)</Text>
          <View style={styles.quickLoginRow}>
            <TouchableOpacity style={styles.quickLoginButtonStaff} onPress={() => handleQuickLogin('Staff')}>
              <Text style={styles.quickLoginRoleStaff}>ROLE NHÂN VIÊN</Text>
              <Text style={styles.quickLoginDescStaff} numberOfLines={1}>
                N.V. Hùng (Staff)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLoginButtonManager} onPress={() => handleQuickLogin('Manager')}>
              <Text style={styles.quickLoginRoleManager}>ROLE QUẢN LÝ</Text>
              <Text style={styles.quickLoginDescManager} numberOfLines={1}>
                Admin (Manager)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 58,
    height: 58,
    backgroundColor: '#f7f3e9',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2e6d2a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    height: 50,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#065f46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickLoginContainer: {
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 24,
  },
  quickLoginTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickLoginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  quickLoginButtonStaff: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  quickLoginRoleStaff: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  quickLoginDescStaff: {
    fontSize: 12,
    fontWeight: '600',
    color: '#022c22',
  },
  quickLoginButtonManager: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderColor: '#e0f2fe',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  quickLoginRoleManager: {
    fontSize: 10,
    fontWeight: '700',
    color: '#075985',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  quickLoginDescManager: {
    fontSize: 12,
    fontWeight: '600',
    color: '#082f49',
  },
});
