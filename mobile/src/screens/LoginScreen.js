import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../api/client';
import { Shield, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap: username, mat_khau: password })
      });
      const data = await res.json();

      if (!data.success) {
        setLoading(false);
        setErrorMsg(data.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
        return;
      }

      const user = data.data;
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userRole', user.vai_tro);
      await AsyncStorage.setItem('username', user.ten_dang_nhap);
      await AsyncStorage.setItem('hoTen', user.ho_ten || user.ten_dang_nhap);
      await AsyncStorage.setItem('taiKhoanId', String(user.tai_khoan_id));
      await AsyncStorage.setItem('hoSoId', String(user.ho_so_id || ''));

      setLoading(false);
      onLoginSuccess(user.vai_tro);
    } catch (e) {
      setLoading(false);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra IP LAN.');
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Brand Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Shield size={36} color="#fff" />
          </View>
          <Text style={styles.brandName}>Stellar Academy</Text>
          <Text style={styles.subtitle}>Quản lý thông minh cho trung tâm</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên đăng nhập"
            placeholderTextColor="#8892b0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#8892b0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
              {secureText ? <EyeOff size={18} color="#8892b0" /> : <Eye size={18} color="#8892b0" />}
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 Stellar Academy · All rights reserved</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 40,
  },
});
