import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Import các màn hình
import LoginScreen from './src/screens/LoginScreen';
import StudentHome from './src/screens/student/StudentHome';
import StudentQR from './src/screens/student/StudentQR';
import TeacherHome from './src/screens/teacher/TeacherHome';
import TeacherQR from './src/screens/teacher/TeacherQR';
import AdminHome from './src/screens/admin/AdminHome';
import AdminScanner from './src/screens/admin/AdminScanner';

// Import Icons
import { Home, QrCode, ScanLine } from 'lucide-react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(''); // 'hoc_vien', 'giao_vien', 'admin', 'le_tan'
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'qr'
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Kiểm tra phiên đăng nhập
  const checkSession = async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      const hoSoId = await AsyncStorage.getItem('hoSoId');
      
      if (userRole && hoSoId) {
        setRole(userRole);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setRole('');
      }
    } catch (e) {
      console.error('Lỗi kiểm tra phiên đăng nhập:', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = async (userRole) => {
    setRole(userRole);
    setIsLoggedIn(true);
    setCurrentTab('home');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userRole', 'hoSoId', 'taiKhoanId', 'userName', 'userCode']);
      setIsLoggedIn(false);
      setRole('');
      setCurrentTab('home');
    } catch (e) {
      console.error('Lỗi đăng xuất:', e);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang khởi động ứng dụng...</Text>
      </View>
    );
  }

  // Nếu chưa đăng nhập, hiển thị màn hình Login
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  // 1. Phân luồng giao diện Học viên
  const renderStudentFlow = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.contentArea}>
          {currentTab === 'home' ? (
            <StudentHome onLogout={handleLogout} />
          ) : (
            <StudentQR />
          )}
        </View>
        
        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'home' && styles.tabActive]}
            onPress={() => setCurrentTab('home')}
          >
            <Home size={22} color={currentTab === 'home' ? '#ff6b35' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'home' && styles.labelActive]}>Trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'qr' && styles.tabActive]}
            onPress={() => setCurrentTab('qr')}
          >
            <QrCode size={22} color={currentTab === 'qr' ? '#ff6b35' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'qr' && styles.labelActive]}>Mã QR của tôi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 2. Phân luồng giao diện Giáo viên
  const renderTeacherFlow = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.contentArea}>
          {currentTab === 'home' ? (
            <TeacherHome onLogout={handleLogout} />
          ) : (
            <TeacherQR />
          )}
        </View>
        
        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'home' && styles.tabActive]}
            onPress={() => setCurrentTab('home')}
          >
            <Home size={22} color={currentTab === 'home' ? '#0066cc' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'home' && styles.labelActiveTeacher]}>Lịch dạy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'qr' && styles.tabActive]}
            onPress={() => setCurrentTab('qr')}
          >
            <QrCode size={22} color={currentTab === 'qr' ? '#0066cc' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'qr' && styles.labelActiveTeacher]}>Chấm công QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 3. Phân luồng giao diện Admin / Lễ tân
  const renderAdminFlow = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.contentArea}>
          {currentTab === 'home' ? (
            <AdminHome onLogout={handleLogout} />
          ) : (
            <AdminScanner />
          )}
        </View>
        
        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'home' && styles.tabActive]}
            onPress={() => setCurrentTab('home')}
          >
            <Home size={22} color={currentTab === 'home' ? '#ff6b35' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'home' && styles.labelActive]}>Nhật ký</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, currentTab === 'qr' && styles.tabActive]}
            onPress={() => setCurrentTab('qr')}
          >
            <ScanLine size={22} color={currentTab === 'qr' ? '#ff6b35' : '#94a3b8'} />
            <Text style={[styles.tabLabel, currentTab === 'qr' && styles.labelActive]}>Quét QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFlow = () => {
    if (role === 'hoc_vien') return renderStudentFlow();
    if (role === 'giao_vien') return renderTeacherFlow();
    if (role === 'admin' || role === 'le_tan') return renderAdminFlow();
    return (
      <View style={styles.errorFlowContainer}>
        <Text style={styles.errorText}>Vai trò tài khoản không hợp lệ: {role}</Text>
        <TouchableOpacity style={styles.btn} onPress={handleLogout}>
          <Text style={styles.btnText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderFlow()}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf7f4',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f4',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    height: 64,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  tabActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: 'bold',
  },
  labelActive: {
    color: '#ff6b35',
  },
  labelActiveTeacher: {
    color: '#0066cc',
  },
  errorFlowContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
